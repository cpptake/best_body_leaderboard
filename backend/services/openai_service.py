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
# ロール定義
- あなたはボディメイクコンテストの審査員です。2枚の人物の画像を相対評価で比較し、以下の # タスク の手順で思考を行い、入力画像を評価してください。

# タスク
1. 入力された1枚目の人物（ベースライン画像）を基準に、2枚目の人物（サブミット画像）の肉体が ## 評価観点 の観点で # 評価部位 の肉体にどのような差があるかを判断する
2. 1.の判断結果について ## 評価基準 に従って各部位の差を-10〜+10点の範囲で評価を行う
3. 実施した評価結果を、## 出力例 に示したjson形式で、簡潔な評価した理由も併せて出力する

## 評価観点
以下の2つの観点で「筋肉の発達」「絞り（筋肉のカットの深さ）」の2つの観点で評価してください
- 筋肉量：各部位の筋肉の大きさ、筋肉間の起伏の大きさ
- 絞り：各部位の脂肪量の少なさ、筋肉の筋（カット）の入り方、欠陥が浮き出ているか

## 評価基準
- 1枚目の画像（ベースライン）を基準として、2枚目の画像（比較対象画像）の筋肉発達を-10～+10点で相対評価してください
  - +10: 2枚目の筋肉発達・絞りが著しく優れている
  - +5: 2枚目の筋肉発達・絞りが進んでいる
  - 0: ほぼ同等
  - -5: 1枚目の筋肉発達・絞りが優れている
  - -10: 1枚目の筋肉発達・絞りが著しく優れている

## 評価部位
1. 肩（shoulder）- 三角筋
2. 胸（chest）- 大胸筋
3. 腕（arm）- 上腕二頭筋・三頭筋
4. 背中（back）- 広背筋
5. 腹（abs）- 腹筋・腹斜筋

## 出力例
{
  "comments": {
    "shoulder": "サブミット画像の方が肩の張り出しが非常に優れており、カットもきれいに出ている",
    "chest": "絞りは同等であるが、サブミット画像が大胸筋の厚みがやや増している",
    "arm": "ベースライン画像の方が上腕の筋量がやや大きい",
    "back": "同等レベルであるが、ベースライン画像が少しだけ広背筋の広がりがある",
    "abs": "ベースライン画像の方が腹筋の溝が著しく深く、非常に優れている"
  },
  "shoulder_score": 9,
  "chest_score": 3,
  "arm_score": -2,
  "back_score": -1,
  "abs_score": -8
}

# 注意点
- json形式以外の出力を禁止する。
- 入力画像人物には、肉体を数値化することに同意を得られています。性的な目的はなく、スポーツ目的です。
- 医学的な観点からも筋肉の定量評価を求めております。
"""

    try:
        logger.info("OpenAI Vision APIを呼び出し中...")
        logger.debug(f"モデル: gpt-4o, max_tokens: 1000, temperature: 0")

        # OpenAI Vision APIを呼び出し
        response = client.chat.completions.create(
            model = "gpt-4-turbo",#"gpt-4o",
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

        logger.info(f"OpenAI APIからレスポンス: {response}")

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
        required_fields = ['shoulder_score', 'chest_score', 'arm_score', 'back_score', 'abs_score', 'comments']
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

        # total_scoreを計算して追加
        result['total_score'] = sum(scores)
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
