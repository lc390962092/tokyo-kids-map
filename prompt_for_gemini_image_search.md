# Gemini 用画像検索プロンプト

## タスク

東京親子散策マップ（東京 23 区の子連れ向け施設・公園 131 地点）の各場所について、**実際の現地写真の画像 URL** を収集してください。

---

## 工程情報（コンテキスト）

| 項目 | 内容 |
|------|------|
| **GitHub リポジトリ** | `https://github.com/lc390962092/tokyo-kids-map.git` |
| **Vercel 本番 URL** | `https://tokyo-kids-map.vercel.app` |
| **フレームワーク** | Next.js 15 + React 19 + TypeScript + Tailwind CSS v4 |
| **データベース** | Supabase (PostgreSQL) — `places` テーブル（131 行） |
| **静的データ** | `src/data/seed.json`（ビルド時に SSG で使用） |
| **管理後台** | `/admin`（地點 CRUD、画像 URL 編集） |

### 依存事項（画像反映時に必要）

1. **Supabase への反映が必須**：`places.image_url` は **Supabase** で動的読み込みされる
2. **seed.json への反映も必須**：静的詳情ページ（`/place/[id]`）はビルド時に `seed.json` から読む
3. **両方更新後に再デプロイ**：`git push` → Vercel が自動ビルド・デプロイ

```bash
# 開発環境の前提条件
# .env.local に以下が必要：
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ビルド・デプロイ
npm run build    # ESLint + TypeScript チェック必須
npm run dev      # ローカル開発
# git push origin main → Vercel 自動デプロイ
```

---

## 検索方法

1. 下記の「検索キーワード一覧」を使い、各場所を **Google 画像検索** または **Google Maps** で検索
2. 公式サイト、観光サイト、ブログ、Google Maps ユーザ投稿写真などから **直接アクセス可能な画像 URL** を取得
3. 画像 URL は `https://` で始まる直リンクであること（リダイレクトや短縮 URL は避ける）

---

## 検索キーワードのフォーマット

```
{日文名} {区名} 東京 {施設タイプ} 写真
```

例：
- `荒川自然公園 荒川区 東京 公園 写真`
- `上野動物園 台東区 東京 動物園 写真`
- `すみだ水族館 墨田区 東京 水族館 写真`

---

## 画像選定基準

| 項目 | 基準 |
|------|------|
| **内容** | 施設の外観、園内の遊具、代表スポットなどが分かる写真 |
| **品質** | 明るく、施設全体または特徴的な部分が写っているもの（横長 16:9 推奨） |
| **出典** | 公式サイト、観光協会、Wikipedia、Google Maps 投稿写真、ブログ等 |
| **除外** | 地図・イラスト・ロゴのみ・人物が主役の写真・著作権不明な画像 |

---

## 出力フォーマット

以下の JSON 配列形式で出力してください：

```json
[
  {
    "id": "30000000-0000-4000-8000-000000000005",
    "name_ja": "荒川自然公園",
    "name_zh": "荒川自然公园",
    "image_url": "https://example.com/photo1.jpg"
  },
  {
    "id": "10000000-0000-4000-8000-000000000035",
    "name_ja": "上野動物園",
    "name_zh": "上野动物园",
    "image_url": "https://example.com/photo2.jpg"
  }
]
```

### 注意事項
- `id` は必ず入力データの UUID をそのまま使用（`seed.json` / Supabase と紐付く）
- `image_url` が見つからない場合は空文字 `""` にする
- 1 回ですべて終わらない場合、処理済みの件数と続きの開始位置を教えてください
- URL は画像ファイル（.jpg / .jpeg / .png / .webp）の直リンクにしてください

---

## 検索キーワード一覧

詳細は同梱の `image_search_keywords.md` を参照してください。

主要キーワード例（上位 20 件）：

| No | 日文名 | 区 | 検索キーワード |
|----|--------|----|---------------|
| 1 | 荒川自然公園 | 荒川区 | 荒川自然公園 荒川区 東京 公園 写真 |
| 2 | 汐入公園 | 荒川区 | 汐入公園 荒川区 東京 公園 写真 |
| 3 | 日暮里南公園 | 荒川区 | 日暮里南公園 荒川区 東京 公園 写真 |
| 4 | 天王公園 | 荒川区 | 天王公園 荒川区 東京 公園 写真 |
| 5 | 尾久の原公園 | 荒川区 | 尾久の原公園 荒川区 東京 公園 写真 |
| 6 | ゆいの森あらかわ | 荒川区 | ゆいの森あらかわ 荒川区 東京 図書館 写真 |
| 7 | あらかわ遊園 | 荒川区 | あらかわ遊園 荒川区 東京 室内遊び場 写真 |
| 8 | 飛鳥山公園 | 北区 | 飛鳥山公園 北区 東京 公園 写真 |
| 9 | 上野動物園 | 台東区 | 上野動物園 台東区 東京 動物園 写真 |
| 10 | 上野恩賜公園 | 台東区 | 上野恩賜公園 台東区 東京 公園 写真 |
| 11 | 国立科学博物館 | 台東区 | 国立科学博物館 台東区 東京 施設 写真 |
| 12 | 東京国立博物館 | 台東区 | 東京国立博物館 台東区 東京 博物館 写真 |
| 13 | すみだ水族館 | 墨田区 | すみだ水族館 墨田区 東京 水族館 写真 |
| 14 | 東京スカイツリー | 墨田区 | 東京スカイツリー 墨田区 東京 施設 写真 |
| 15 | 隅田公園 | 墨田区 | 隅田公園 墨田区 東京 公園 写真 |
| 16 | 東白鬚公園 | 墨田区 | 東白鬚公園 墨田区 東京 公園 写真 |
| 17 | 足立区生物園 | 足立区 | 足立区生物園 足立区 東京 動物園 写真 |
| 18 | 舎人公園 | 足立区 | 舎人公園 足立区 東京 公園 写真 |
| 19 | 東武博物館 | 墨田区 | 東武博物館 墨田区 東京 博物館 写真 |
| 20 | 錦糸公園 | 墨田区 | 錦糸公園 墨田区 東京 公園 写真 |

---

## ヒント：効率的な検索方法

1. **Google Maps → 写真タブ**：多くの公園・施設には Google Maps ユーザ投稿写真がある
2. **Wikipedia**：知名度の高い施設（上野動物園、スカイツリー等）は Wikipedia に CC ライセンスの写真がある
3. **各区公式サイト**：区のホームページに公園紹介ページと写真がある場合が多い
4. **観光協会サイト**：「東京都観光汽船」「墨田区観光協会」等
5. **ブログ検索**：「{場所名} 子連れ ブログ」で親子向け訪問記事を探す

---

## データ注入方法（画像 URL を反映する手順）

Gemini が JSON を出力したら、**以下 2 箇所に同時反映**する必要があります：

### 方法 A：管理後台で手動更新（推奨：10 件未満）

1. 本番サイト `https://tokyo-kids-map.vercel.app/admin` にアクセス
2. 各地点の「画像URL」フィールドに貼り付け
3. `src/data/seed.json` も同様に手動更新

### 方法 B：一括 SQL 更新（推奨：10 件以上）

1. Gemini に以下の形式で **一括 UPDATE SQL** を生成させる：

```sql
UPDATE places SET image_url = CASE id
  WHEN '30000000-0000-4000-8000-000000000005' THEN 'https://xxx.jpg'
  WHEN '10000000-0000-4000-8000-000000000035' THEN 'https://yyy.jpg'
  -- ...
END
WHERE id IN ('30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000035');
```

2. **Supabase SQL Editor** で実行
3. `seed.json` も同じ URL で更新（VSCode で検索・置換）

### 方法 C：スクリプト一括更新（推奨：開発者向け）

```bash
# image_updates.json を工程ルートに配置後
node -e "
const fs = require('fs');
const seed = require('./src/data/seed.json');
const updates = require('./image_updates.json');

const map = new Map(updates.map(u => [u.id, u.image_url]));
const updated = seed.map(p => ({
  ...p,
  image_url: map.get(p.id) || p.image_url
}));

fs.writeFileSync('./src/data/seed.json', JSON.stringify(updated, null, 2));
console.log('seed.json updated');
"
```

### 最終ステップ（必須）

```bash
# 1. seed.json を Git にコミット
git add src/data/seed.json
git commit -m "data: update place images"
git push origin main

# 2. Vercel が自動ビルド・デプロイ（約 1-2 分）
# 3. 本番サイトで確認
```

### 注意事項
- **Supabase のみ更新 → 地図・管理後台は反映されるが、SSG 詳情ページは古いまま**
- **seed.json のみ更新 → 詳情ページは更新されるが、地図・管理後台は古いまま**
- **必ず両方更新してから `git push` すること**
