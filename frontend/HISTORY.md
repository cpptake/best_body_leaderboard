# 評価履歴機能ドキュメント

## 概要

評価履歴機能では、ユーザーが過去に実行した評価結果を一覧表示・詳細確認・削除できます。

## コンポーネント構成

### 1. EvaluationCard (`components/EvaluationCard.tsx`)

評価を表示するカードコンポーネント。履歴一覧とリーダーボードで再利用可能。

**主な機能:**
- ✅ サムネイル画像表示（比較対象画像）
- ✅ 総合スコア表示（色分け）
- ✅ 評価レベル表示（優秀、良好、標準など）
- ✅ 評価日時表示
- ✅ ベースライン情報表示
- ✅ 「詳細を見る」ボタン

**Props:**
```typescript
interface EvaluationCardProps {
  evaluation: {
    id: string;
    scores: { total: number };
    evaluated_at: string;
    comparison_image?: { image_url: string };
    baseline_image?: { description?: string };
  };
  showDetail?: boolean;  // デフォルト: true
}
```

**スコアの色分け:**
- 緑 (+20以上): 優秀
- 青 (+1〜+19): 良好〜標準以上
- グレー (0): 標準
- オレンジ (-1〜-19): 標準以下
- 赤 (-20以下): 要改善

### 2. Pagination (`components/Pagination.tsx`)

ページネーションコンポーネント。

**主な機能:**
- ✅ ページ番号表示（最大5ページ）
- ✅ 省略記号（...）表示
- ✅ 前へ・次へボタン
- ✅ 現在ページのハイライト
- ✅ 無効化状態（最初/最後のページ）

**Props:**
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
```

**表示パターン:**
- 5ページ以下: 全て表示
- 現在ページが先頭付近: `1 2 3 4 ... 10`
- 現在ページが中央: `1 ... 4 5 6 ... 10`
- 現在ページが末尾付近: `1 ... 7 8 9 10`

## ページ構成

### 1. 評価履歴一覧 (`pages/history.tsx`)

**主な機能:**
- ✅ 評価履歴の一覧表示
- ✅ ページネーション（10件ずつ）
- ✅ ローディング状態
- ✅ 空の状態（評価がない場合）
- ✅ 件数表示
- ✅ 「新しい評価」ボタン

**状態管理:**
```typescript
const [evaluations, setEvaluations] = useState<any[]>([]);
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [total, setTotal] = useState(0);
const [isLoading, setIsLoading] = useState(true);
```

**API統合:**
```typescript
const response = await evaluationAPI.getAll(currentPage, perPage);
setEvaluations(response.evaluations || []);
setTotal(response.total || 0);
setTotalPages(response.pages || 1);
```

**ページ変更時の動作:**
```typescript
const handlePageChange = (page: number) => {
  setCurrentPage(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
```

### 2. 評価詳細ページ (`pages/history/[id].tsx`)

**主な機能:**
- ✅ 評価の詳細情報表示
- ✅ EvaluationResultコンポーネント使用
- ✅ 評価日時表示
- ✅ ベースライン情報表示
- ✅ 削除機能（確認ダイアログ付き）
- ✅ ナビゲーションボタン

**動的ルーティング:**
```typescript
const router = useRouter();
const { id } = router.query;

useEffect(() => {
  if (!id) return;
  const response = await evaluationAPI.getById(id as string);
  setEvaluation(response);
}, [id]);
```

**削除処理:**
```typescript
const handleDelete = async () => {
  if (!confirm('この評価を削除してもよろしいですか？')) {
    return;
  }
  await evaluationAPI.delete(evaluation.id);
  toast.success('評価を削除しました');
  router.push('/history');
};
```

## UI/UXの特徴

### レスポンシブデザイン

**EvaluationCard:**
```tsx
<div className="flex flex-col md:flex-row gap-4">
  // モバイル: 縦並び、デスクトップ: 横並び
```

**画像サイズ:**
```tsx
<div className="w-full md:w-48 h-48">
  // モバイル: 全幅、デスクトップ: 固定幅(192px)
```

### 空の状態

評価履歴がない場合:
```tsx
<div className="card text-center py-12">
  <svg>アイコン</svg>
  <h3>評価履歴がありません</h3>
  <p>まだ評価を実行していません。最初の評価を実行しましょう！</p>
  <Link href="/evaluate">評価を開始</Link>
</div>
```

### ローディング状態

```tsx
{isLoading && (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
)}
```

## ナビゲーション

### 履歴一覧からの移動

1. **評価詳細へ**
   - 「詳細を見る」ボタンをクリック
   - `/history/[id]` に遷移

2. **新しい評価へ**
   - 「新しい評価」ボタンをクリック
   - `/evaluate` に遷移

### 評価詳細からの移動

1. **履歴一覧に戻る**
   - 「履歴一覧に戻る」ボタン
   - 戻る矢印アイコン

2. **新しい評価**
   - 「新しい評価」ボタン
   - `/evaluate` に遷移

3. **削除**
   - 「この評価を削除」ボタン
   - 確認ダイアログ表示
   - 削除後、`/history` に遷移

## データフロー

### 履歴一覧の取得

```
1. ページ読み込み or ページ変更
   ↓
2. evaluationAPI.getAll(page, perPage)
   ↓
3. レスポンス取得
   {
     evaluations: [...],
     total: 50,
     page: 1,
     per_page: 10,
     pages: 5
   }
   ↓
4. 状態更新 & 表示
```

### 評価詳細の取得

```
1. URLパラメータからID取得
   ↓
2. evaluationAPI.getById(id)
   ↓
3. 評価データ取得
   {
     id: "...",
     scores: {...},
     baseline_image: {...},
     comparison_image: {...},
     evaluation_comment: "..."
   }
   ↓
4. EvaluationResultで表示
```

## エラーハンドリング

### 履歴取得失敗

```typescript
try {
  const response = await evaluationAPI.getAll(currentPage, perPage);
  setEvaluations(response.evaluations || []);
} catch (error: any) {
  toast.error('評価履歴の取得に失敗しました');
  setEvaluations([]);
}
```

### 詳細取得失敗

```typescript
try {
  const response = await evaluationAPI.getById(id as string);
  setEvaluation(response);
} catch (error: any) {
  toast.error('評価詳細の取得に失敗しました');
  router.push('/history');  // 履歴一覧に戻る
}
```

### 削除失敗

```typescript
try {
  await evaluationAPI.delete(evaluation.id);
  toast.success('評価を削除しました');
  router.push('/history');
} catch (error: any) {
  toast.error('評価の削除に失敗しました');
}
```

## アクセシビリティ

- ✅ キーボードナビゲーション対応
- ✅ セマンティックHTML
- ✅ aria-label属性（ボタン等）
- ✅ カラーコントラスト適合
- ✅ ローディング状態の明示

## パフォーマンス最適化

1. **ページネーション**
   - 一度に10件ずつ読み込み
   - 不要なデータを読み込まない

2. **画像最適化**
   - Next.js Imageコンポーネント使用
   - 自動的なサイズ最適化

3. **スムーズスクロール**
   - ページ変更時に自動的にトップへスクロール

## 使用例

### 基本的な使い方

1. **履歴一覧を見る**
   - `/history` にアクセス
   - 過去の評価が一覧表示される

2. **詳細を確認**
   - 「詳細を見る」ボタンをクリック
   - 評価結果の詳細が表示される

3. **評価を削除**
   - 詳細ページで「この評価を削除」をクリック
   - 確認ダイアログで「OK」
   - 履歴一覧に戻る

### ページネーション

1. **次のページへ**
   - 「次へ」ボタンまたはページ番号をクリック
   - 11〜20件目が表示される

2. **特定のページへ**
   - ページ番号をクリック
   - そのページの評価が表示される

## トラブルシューティング

### 履歴が表示されない

- 評価を実行していない可能性
- APIエラーを確認
- ネットワークタブでリクエストを確認

### 画像が表示されない

- S3のURLが正しいか確認
- 署名付きURLの有効期限を確認
- CORS設定を確認

### ページネーションが動作しない

- `onPageChange` が正しく呼ばれているか確認
- 状態更新が適切に行われているか確認

## 今後の拡張予定

- [ ] フィルタリング機能（スコア範囲、日付範囲）
- [ ] ソート機能（日付、スコア順）
- [ ] 検索機能
- [ ] エクスポート機能（PDF、CSV）
- [ ] 評価の比較機能
- [ ] グラフ表示（スコアの推移）
