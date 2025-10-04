# 画像評価機能ドキュメント

## 概要

Best Body Leaderboardの画像評価機能は、ベースライン画像と比較対象画像をAIが分析し、5つの部位について相対評価を行います。

## コンポーネント構成

### 1. ImageUploader (`components/ImageUploader.tsx`)

再利用可能な画像アップロードコンポーネント。

**主な機能:**
- ✅ ドラッグ&ドロップ対応（react-dropzone）
- ✅ クリックでファイル選択
- ✅ 画像プレビュー表示
- ✅ ファイルバリデーション
  - 形式: JPG, PNG のみ
  - サイズ: 最大10MB（カスタマイズ可能）
- ✅ エラーメッセージ表示

**Props:**
```typescript
interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  previewUrl?: string;
  label?: string;
  maxSize?: number; // MB
  allowedTypes?: string[];
}
```

**使用例:**
```tsx
<ImageUploader
  onFileSelect={(file) => setFile(file)}
  previewUrl={previewUrl}
  label="画像をアップロード"
  maxSize={10}
/>
```

### 2. ScoreBar (`components/ScoreBar.tsx`)

部位別スコアを視覚的に表示するコンポーネント。

**主な機能:**
- ✅ スコアを色分けして表示
  - 緑: 大きく優れる (+6〜+10)
  - 青: 優れる (+1〜+5)
  - グレー: 同等 (0)
  - オレンジ: 劣る (-1〜-5)
  - 赤: 大きく劣る (-6〜-10)
- ✅ プログレスバー形式
- ✅ 中央に0点ラインを表示

**Props:**
```typescript
interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;  // デフォルト: 10
  minScore?: number;  // デフォルト: -10
}
```

### 3. EvaluationResult (`components/EvaluationResult.tsx`)

評価結果を総合的に表示するコンポーネント。

**主な機能:**
- ✅ 総合スコアの大きな表示
- ✅ ベースライン画像と比較画像を並べて表示
- ✅ 部位別スコアとコメント表示
- ✅ 評価の見方ガイド

**Props:**
```typescript
interface EvaluationResultProps {
  baselineImageUrl: string;
  comparisonImageUrl: string;
  scores: {
    shoulder: number;
    chest: number;
    arm: number;
    back: number;
    abs: number;
    total: number;
  };
  comments?: {
    shoulder?: string;
    chest?: string;
    arm?: string;
    back?: string;
    abs?: string;
  };
}
```

## 評価ページ (`pages/evaluate.tsx`)

### ワークフロー

1. **ベースライン画像の選択**
   - アクティブなベースライン画像を一覧表示
   - カード形式で選択（クリック）
   - 選択中の画像にチェックマーク表示

2. **比較対象画像のアップロード**
   - ドラッグ&ドロップまたはクリックで選択
   - 画像プレビュー表示
   - ファイルバリデーション

3. **カスタムプロンプト入力（オプション）**
   - テキストエリアで独自の評価基準を指定
   - 空欄の場合はデフォルトプロンプトを使用

4. **評価実行**
   - FormDataでAPIにリクエスト
   - ローディング状態表示（スピナー + メッセージ）
   - 評価完了後、結果までスクロール

5. **結果表示**
   - 総合スコア
   - 画像比較（2枚並べて表示）
   - 部位別スコアとコメント
   - 評価の見方ガイド
   - アクションボタン（新しい評価 / 履歴を見る）

### 状態管理

```typescript
const [baselineImages, setBaselineImages] = useState<any[]>([]);
const [selectedBaselineId, setSelectedBaselineId] = useState<string>('');
const [comparisonFile, setComparisonFile] = useState<File | null>(null);
const [comparisonPreview, setComparisonPreview] = useState<string>('');
const [customPrompt, setCustomPrompt] = useState<string>('');
const [isLoading, setIsLoading] = useState(false);
const [evaluationResult, setEvaluationResult] = useState<any>(null);
```

### API統合

```typescript
// ベースライン画像取得
const response = await baselineImageAPI.getAll(true);

// 評価実行
const formData = new FormData();
formData.append('comparison_image', comparisonFile);
formData.append('baseline_image_id', selectedBaselineId);
formData.append('custom_prompt', customPrompt);

const result = await evaluationAPI.create(formData);
```

## UI/UXの特徴

### レスポンシブデザイン

```tsx
// ベースライン画像グリッド
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">

// 画像比較
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
```

### インタラクティブな要素

1. **ベースライン画像選択**
   - ホバー時に境界線の色が変化
   - 選択中はプライマリーカラーの境界線 + リング

2. **画像アップロード**
   - ドラッグ中は背景色が変化
   - プレビュー表示後も変更可能

3. **評価実行ボタン**
   - ローディング中はスピナー表示
   - バリデーションエラー時は無効化

### ローディング状態

```tsx
{isLoading ? (
  <span className="flex items-center justify-center">
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white">
      {/* スピナーSVG */}
    </svg>
    評価中... (30秒ほどかかります)
  </span>
) : (
  '評価を実行'
)}
```

### エラーハンドリング

```typescript
try {
  const response = await evaluationAPI.create(formData);
  toast.success('評価が完了しました！');
} catch (error: any) {
  const errorMessage = error.response?.data?.error || '評価に失敗しました';
  toast.error(errorMessage);
}
```

## 評価スコアの説明

### スコア範囲

- **各部位**: -10 〜 +10
- **総合スコア**: -50 〜 +50（5部位の合計）

### 評価基準

| スコア | 意味 | 色 |
|--------|------|-----|
| +6 〜 +10 | 大きく優れる | 緑 |
| +1 〜 +5 | 優れる | 青 |
| 0 | 同等 | グレー |
| -1 〜 -5 | 劣る | オレンジ |
| -6 〜 -10 | 大きく劣る | 赤 |

### 評価対象部位

1. **肩（三角筋）** - `shoulder_score`
2. **胸（大胸筋）** - `chest_score`
3. **腕（上腕筋）** - `arm_score`
4. **背中（広背筋）** - `back_score`
5. **腹（腹直筋）** - `abs_score`

## アクセシビリティ

- ✅ キーボードナビゲーション対応
- ✅ aria-label属性（メニューボタン等）
- ✅ セマンティックHTML
- ✅ カラーコントラスト適合
- ✅ エラーメッセージの明確な表示

## パフォーマンス最適化

1. **画像プレビュー**
   - FileReader APIでローカルにプレビュー生成
   - サーバーアップロード前に確認可能

2. **遅延読み込み**
   - Next.js Image コンポーネント使用
   - 自動的な画像最適化

3. **スクロール制御**
   - 結果表示後、自動的に結果までスクロール
   - スムーズアニメーション

## 使用例

### 基本的な使い方

1. ベースライン画像を選択（クリック）
2. 自分の画像をアップロード（ドラッグ&ドロップまたはクリック）
3. 「評価を実行」ボタンをクリック
4. 30秒ほど待つ
5. 結果が表示される

### カスタムプロンプトの例

```
特に肩と背中を重点的に評価してください

腕の太さよりも、全体的なバランスを重視してください

コンテストに向けた評価をお願いします
```

## トラブルシューティング

### ベースライン画像が表示されない

- 管理者がベースライン画像を登録していない可能性
- APIエラーを確認（ネットワークタブ）

### 画像アップロードに失敗

- ファイルサイズが10MBを超えていないか確認
- ファイル形式がJPG/PNGか確認

### 評価が完了しない

- OpenAI APIのエラー（レート制限等）
- バックエンドのログを確認
- 30秒以上待っても完了しない場合はリロード

## 今後の拡張予定

- [ ] 評価履歴から再評価
- [ ] 評価結果のPDF出力
- [ ] 複数画像の一括評価
- [ ] 評価結果の共有機能
- [ ] 過去の評価との比較グラフ
