import os
import json
import logging
from openai import OpenAI
from config import OpenAIConfig, LoggingConfig

# ロガーの設定
logger = logging.getLogger(__name__)

# OpenAIクライアントの初期化
client = OpenAI(
    api_key=os.getenv('OPENAI_API_KEY'),
    timeout=OpenAIConfig.TIMEOUT,
    max_retries=OpenAIConfig.MAX_RETRIES
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

    try:
        logger.info("OpenAI Vision APIを呼び出し中...")
        logger.debug(f"モデル: {OpenAIConfig.MODEL}, max_tokens: {OpenAIConfig.MAX_TOKENS}, temperature: {OpenAIConfig.TEMPERATURE}")

        # OpenAI Vision APIを呼び出し
        response = client.chat.completions.create(
            model=OpenAIConfig.MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": OpenAIConfig.EVALUATION_PROMPT
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
            max_tokens=OpenAIConfig.MAX_TOKENS,
            temperature=OpenAIConfig.TEMPERATURE
        )

        logger.info(f"OpenAI APIからレスポンス: {response}")

        # レスポンスからJSONを抽出
        content = response.choices[0].message.content
        logger.debug(f"OpenAI Response Content: {content[:LoggingConfig.DEBUG_CONTENT_MAX_LENGTH]}...")  # 最初の指定文字数のみログ出力

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
