import json
import time
from openai import OpenAI, OpenAIError, RateLimitError, APIConnectionError, APITimeoutError
from flask import current_app

class OpenAIService:
    """OpenAI Vision API連携サービス"""

    def __init__(self):
        self.client = None

    def _get_client(self):
        """OpenAIクライアントを取得（遅延初期化）"""
        if not self.client:
            api_key = current_app.config.get('OPENAI_API_KEY')
            if not api_key:
                raise ValueError('OPENAI_API_KEY is not configured')
            self.client = OpenAI(api_key=api_key)
        return self.client

    def evaluate_physique(self, baseline_image_url, comparison_image_url, prompt, max_retries=3):
        """
        2枚の画像を比較してボディビルダーの肉体を評価

        Args:
            baseline_image_url: ベースライン画像のURL（基準画像）
            comparison_image_url: 比較対象画像のURL
            prompt: 評価用のプロンプト文字列
            max_retries: リトライ回数（デフォルト: 3）

        Returns:
            dict: 評価結果
            {
                'shoulder_score': int,
                'chest_score': int,
                'arm_score': int,
                'back_score': int,
                'abs_score': int,
                'total_score': int,
                'comments': {
                    'shoulder': str,
                    'chest': str,
                    'arm': str,
                    'back': str,
                    'abs': str
                }
            }

        Raises:
            Exception: API呼び出しに失敗した場合
        """
        client = self._get_client()

        # メッセージを構築
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": baseline_image_url
                        }
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": comparison_image_url
                        }
                    }
                ]
            }
        ]

        # リトライロジック
        for attempt in range(max_retries):
            try:
                response = client.chat.completions.create(
                    model="gpt-4o",  # または "gpt-4-vision-preview"
                    messages=messages,
                    max_tokens=1000,
                    temperature=0.3,  # 一貫性のある評価のため低めに設定
                )

                # レスポンスを取得
                content = response.choices[0].message.content

                # JSONとしてパース
                result = self._parse_evaluation_response(content)

                return result

            except RateLimitError as e:
                # レート制限エラー: リトライ
                wait_time = 2 ** attempt  # 指数バックオフ
                current_app.logger.warning(f'Rate limit hit. Retrying in {wait_time} seconds... (attempt {attempt + 1}/{max_retries})')
                if attempt < max_retries - 1:
                    time.sleep(wait_time)
                else:
                    raise Exception(f'Rate limit exceeded after {max_retries} retries')

            except APIConnectionError as e:
                # 接続エラー: リトライ
                wait_time = 2 ** attempt
                current_app.logger.warning(f'API connection error. Retrying in {wait_time} seconds... (attempt {attempt + 1}/{max_retries})')
                if attempt < max_retries - 1:
                    time.sleep(wait_time)
                else:
                    raise Exception(f'API connection failed after {max_retries} retries: {str(e)}')

            except APITimeoutError as e:
                # タイムアウトエラー: リトライ
                wait_time = 2 ** attempt
                current_app.logger.warning(f'API timeout. Retrying in {wait_time} seconds... (attempt {attempt + 1}/{max_retries})')
                if attempt < max_retries - 1:
                    time.sleep(wait_time)
                else:
                    raise Exception(f'API timeout after {max_retries} retries: {str(e)}')

            except OpenAIError as e:
                # その他のOpenAIエラー
                raise Exception(f'OpenAI API error: {str(e)}')

            except Exception as e:
                # 予期しないエラー
                raise Exception(f'Unexpected error during evaluation: {str(e)}')

    def _parse_evaluation_response(self, content):
        """
        OpenAI APIのレスポンスをパース

        Args:
            content: APIレスポンスのテキスト

        Returns:
            dict: パースされた評価結果

        Raises:
            ValueError: パースに失敗した場合
        """
        try:
            # JSON部分を抽出（マークダウンのコードブロック内にある場合）
            if '```json' in content:
                json_start = content.find('```json') + 7
                json_end = content.find('```', json_start)
                json_str = content[json_start:json_end].strip()
            elif '```' in content:
                json_start = content.find('```') + 3
                json_end = content.find('```', json_start)
                json_str = content[json_start:json_end].strip()
            else:
                json_str = content.strip()

            # JSONをパース
            data = json.loads(json_str)

            # 必須フィールドの検証
            required_fields = ['shoulder_score', 'chest_score', 'arm_score', 'back_score', 'abs_score']
            for field in required_fields:
                if field not in data:
                    raise ValueError(f'Missing required field: {field}')

            # スコアの範囲チェック（-10〜10）
            for field in required_fields:
                score = data[field]
                if not isinstance(score, int) or score < -10 or score > 10:
                    raise ValueError(f'Invalid score for {field}: {score}. Must be integer between -10 and 10')

            # 合計スコアを計算
            total_score = sum([data[field] for field in required_fields])
            data['total_score'] = total_score

            # コメントの検証（オプション）
            if 'comments' not in data:
                data['comments'] = {
                    'shoulder': '',
                    'chest': '',
                    'arm': '',
                    'back': '',
                    'abs': ''
                }

            return data

        except json.JSONDecodeError as e:
            raise ValueError(f'Failed to parse JSON response: {str(e)}')
        except Exception as e:
            raise ValueError(f'Failed to parse evaluation response: {str(e)}')

    def create_evaluation_prompt(self):
        """
        デフォルトの評価プロンプトを生成

        Returns:
            str: 評価用プロンプト
        """
        prompt = """あなたはボディビルダーの肉体評価の専門家です。
2枚の画像を比較し、以下の5つの部位について評価してください：

1. 肩（三角筋の発達度）
2. 胸（大胸筋の発達度）
3. 腕（上腕二頭筋・三頭筋の発達度）
4. 背中（広背筋・僧帽筋の発達度）
5. 腹（腹直筋の明瞭さ）

1枚目の画像をベースライン（基準：0点）とし、2枚目の画像の各部位を相対的に評価してください。
各部位を-10点（大きく劣る）から+10点（大きく優れる）のスケールで採点し、必ず以下のJSON形式で返してください：

{
  "shoulder_score": 数値（-10〜10の整数）,
  "chest_score": 数値（-10〜10の整数）,
  "arm_score": 数値（-10〜10の整数）,
  "back_score": 数値（-10〜10の整数）,
  "abs_score": 数値（-10〜10の整数）,
  "comments": {
    "shoulder": "肩についての評価コメント",
    "chest": "胸についての評価コメント",
    "arm": "腕についての評価コメント",
    "back": "背中についての評価コメント",
    "abs": "腹についての評価コメント"
  }
}

JSON形式のみを返し、他の説明文は含めないでください。"""

        return prompt


# シングルトンインスタンス
openai_service = OpenAIService()
