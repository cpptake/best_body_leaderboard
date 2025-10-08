import os
import json
import logging
from openai import OpenAI

# ロガーの設定
logger = logging.getLogger(__name__)

# OpenAIクライアントの初期化（タイムアウトを120秒に設定）
client = OpenAI(
    api_key=os.getenv('OPENAI_API_KEY'),
    timeout=120.0,  # 画像解析は時間がかかるため、120秒に設定
    max_retries=2   # リトライ回数
)


def evaluate_bodybuilder_images(baseline_image_base64, comparison_image_base64):
    """
    2枚のボディビルダー画像を比較評価する

    Args:
        baseline_image_base64: ベースライン画像（Base64エンコード済み）
        comparison_image_base64: 比較対象画像（Base64エンコード済み）

    Returns:
        dict: 評価結果（スコアとコメント）
    """

    # プロンプトの作成
    prompt = """
あなたはボディビルディングの専門家です。2枚の画像を比較し、以下の5つの部位について評価してください。

【評価対象部位】
1. 肩（shoulder）- 三角筋の発達
2. 胸（chest）- 大胸筋の発達
3. 腕（arm）- 上腕二頭筋・三頭筋の発達
4. 背中（back）- 広背筋の発達
5. 腹（abs）- 腹筋の発達

【評価基準】
- 1枚目の画像（ベースライン）を基準として、2枚目の画像（比較対象）を相対評価してください
- 各部位を-10〜+10点で評価してください
  - +10: 比較対象が圧倒的に優れている
  - +5: 比較対象が明らかに優れている
  - 0: ほぼ同等
  - -5: ベースラインが明らかに優れている
  - -10: ベースラインが圧倒的に優れている
- 各部位について、評価理由を簡潔に説明してください（1〜2文）

【出力形式】
以下のJSON形式で回答してください：
```json
{
  "shoulder_score": 5,
  "chest_score": 3,
  "arm_score": -2,
  "back_score": 7,
  "abs_score": 4,
  "total_score": 17,
  "comments": {
    "shoulder": "三角筋の張り出しが顕著に優れています",
    "chest": "大胸筋の厚みが若干上回っています",
    "arm": "上腕の太さがやや劣ります",
    "back": "広背筋の広がりが明らかに優位です",
    "abs": "腹筋のカットがより鮮明です"
  }
}
```

注意: 必ずJSONのみを返してください。余計な説明は不要です。
"""

    try:
        logger.info("OpenAI Vision APIを呼び出し中...")
        logger.debug(f"モデル: gpt-4o, max_tokens: 1000, temperature: 0")

        # OpenAI Vision APIを呼び出し
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
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
                                "url": baseline_image_base64
                            }
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": comparison_image_base64
                            }
                        }
                    ]
                }
            ],
            max_tokens=1000,
            temperature=0
        )

        logger.info("OpenAI APIからレスポンスを受信")

        # レスポンスからJSONを抽出
        content = response.choices[0].message.content
        logger.debug(f"OpenAI Response Content: {content[:200]}...")  # 最初の200文字のみログ出力

        # contentが空の場合のチェック
        if not content or content.strip() == "":
            logger.error("OpenAI APIのレスポンスが空です")
            raise ValueError("OpenAI APIのレスポンスが空です")

        # JSONブロックを抽出（```json ... ``` の形式を処理）
        if "```json" in content:
            logger.debug("JSONブロックを抽出中（```json形式）")
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            logger.debug("JSONブロックを抽出中（```形式）")
            content = content.split("```")[1].split("```")[0].strip()

        # JSONをパース
        logger.info("レスポンスをJSONとしてパース中...")
        result = json.loads(content)

        # 必須フィールドの検証
        logger.debug("必須フィールドを検証中...")
        required_fields = ['shoulder_score', 'chest_score', 'arm_score', 'back_score', 'abs_score', 'total_score', 'comments']
        for field in required_fields:
            if field not in result:
                logger.error(f"必須フィールド '{field}' が見つかりません")
                raise ValueError(f"必須フィールド '{field}' が見つかりません")

        # スコアの範囲チェック
        logger.debug("スコアの範囲をチェック中...")
        scores = [
            result['shoulder_score'],
            result['chest_score'],
            result['arm_score'],
            result['back_score'],
            result['abs_score']
        ]

        for score in scores:
            if not isinstance(score, (int, float)) or score < -10 or score > 10:
                logger.error(f"スコアが範囲外です: {score}")
                raise ValueError(f"スコアが範囲外です: {score}")

        logger.info(f"評価完了 - 合計スコア: {result['total_score']}")
        return result

    except json.JSONDecodeError as e:
        logger.error(f"JSON解析エラー: {str(e)}")
        logger.error(f"パース対象のコンテンツ: {content if 'content' in locals() else 'N/A'}")
        raise ValueError(f"OpenAI APIのレスポンスをJSONとして解析できませんでした: {str(e)}")
    except ValueError as e:
        # ValueErrorは既にログ出力済みなのでそのまま再スロー
        raise
    except Exception as e:
        logger.error(f"OpenAI API呼び出しエラー: {str(e)}", exc_info=True)
        raise Exception(f"OpenAI APIの呼び出しに失敗しました: {str(e)}")
