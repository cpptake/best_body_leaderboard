"""
既存のevaluationsテーブルからtotal_scoreカラムを削除するマイグレーションスクリプト

使用方法:
    python migrate_remove_total_score.py

注意:
    - 実行前にデータベースのバックアップを取得してください
    - .envファイルでDATABASE_URLが正しく設定されていることを確認してください
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text

# 環境変数の読み込み
load_dotenv()

def migrate(skip_confirmation=False):
    """total_scoreカラムを削除するマイグレーション"""

    # データベースURLの取得
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URLが設定されていません")
        sys.exit(1)

    print(f"データベースに接続中: {database_url.split('@')[1] if '@' in database_url else database_url}")

    try:
        # データベースエンジンの作成
        engine = create_engine(database_url)

        # テーブルの存在確認
        inspector = inspect(engine)
        if 'evaluations' not in inspector.get_table_names():
            print("INFO: evaluationsテーブルが存在しません。マイグレーション不要です。")
            return

        # total_scoreカラムの存在確認
        columns = [col['name'] for col in inspector.get_columns('evaluations')]

        if 'total_score' not in columns:
            print("INFO: total_scoreカラムは既に削除されています。マイグレーション不要です。")
            return

        print("WARNING: total_scoreカラムを削除します。")

        if not skip_confirmation:
            print("この操作は元に戻せません。続行しますか? (yes/no): ", end='')
            response = input().strip().lower()
            if response not in ['yes', 'y']:
                print("マイグレーションをキャンセルしました。")
                return

        # total_scoreカラムを削除
        with engine.connect() as conn:
            print("total_scoreカラムを削除中...")
            conn.execute(text("ALTER TABLE evaluations DROP COLUMN IF EXISTS total_score;"))
            conn.commit()
            print("✓ total_scoreカラムを削除しました")

        # 変更後のカラム一覧を表示
        inspector = inspect(engine)
        columns_after = [col['name'] for col in inspector.get_columns('evaluations')]
        print(f"\n現在のカラム: {', '.join(columns_after)}")

        print("\n✓ マイグレーションが完了しました")

    except Exception as e:
        print(f"ERROR: マイグレーション中にエラーが発生しました: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    print("=" * 60)
    print("total_scoreカラム削除マイグレーション")
    print("=" * 60)

    # --yesフラグがある場合は確認をスキップ
    skip_confirmation = '--yes' in sys.argv or '-y' in sys.argv
    migrate(skip_confirmation)
