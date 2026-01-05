# SAA Portal

スタートアップアクセラレータアカデミー（SAA）現役生ポータル

## 機能

- 動画視聴（起業の科学・起業大全・起業参謀）
- 視聴履歴・進捗管理
- 出席管理
- 課題管理
- エンゲージメントスコア

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成：

```
NEXT_PUBLIC_SUPABASE_URL=https://bfjstgfcvbxlvvodqoxd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. 開発サーバー起動

```bash
npm run dev
```

## Supabaseプロジェクト

- プロジェクト名: saa-current-portal
- リージョン: Tokyo
- Project ID: bfjstgfcvbxlvvodqoxd

## ユーザーロール

| ロール | 権限 |
|--------|------|
| student | 動画視聴、出席、課題提出 |
| ta | 受講生の進捗確認、フィードバック |
| admin | 全機能アクセス、ユーザー管理 |

## 技術スタック

- Next.js 16
- TypeScript
- Tailwind CSS
- Supabase (Auth, Database, Storage)
