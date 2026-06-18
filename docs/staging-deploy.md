# ステージングデプロイ手順(P3-5 / Issue #20)

このリポジトリの初回ステージングデプロイ手順です。**Cloudflare アカウント操作(課金リソース作成)を伴う**ため、
アカウント所有者が実行してください。コードの実装は PR で完了済みで、ここはデプロイのみを扱います。

> 前提: `wrangler` v4 がインストール済み。リポジトリ直下で実行します。

## 0. ログイン

```bash
wrangler login
```

## 1. リソース作成

```bash
# KV(デモ用)
wrangler kv namespace create DEMO_KV

# R2(本番 incremental cache とデモを同一バケットで運用。デモは demo/ prefix)
wrangler r2 bucket create cf-stack-lab
# デモオブジェクトは 1 日で自動削除(コスト/汚れ対策)
wrangler r2 bucket lifecycle add cf-stack-lab --prefix demo/ --expire-days 1

# D1(アプリ用。OpenNext の tag-cache も同居)
wrangler d1 create cf-stack-lab
```

各コマンドが出力する **ID** を控えます(KV の `id`、D1 の `database_id`)。

## 2. 実 ID を wrangler.jsonc に反映

`apps/web/wrangler.jsonc` のプレースホルダを置き換えます。

| 項目                                          | 置換前(プレースホルダ)    | 置換後            |
| --------------------------------------------- | ------------------------- | ----------------- |
| `kv_namespaces[DEMO_KV].id`                   | `placeholder-demo-kv`     | KV の id          |
| `d1_databases[DB].database_id`                | `placeholder-d1-database` | D1 の database_id |
| `d1_databases[NEXT_TAG_CACHE_D1].database_id` | `placeholder-d1-database` | 同上(同一 DB)     |

R2 バケット名(`cf-stack-lab`)は作成済みのため変更不要。
反映後に型を再生成:

```bash
pnpm --filter web typegen
```

## 3. D1 マイグレーション(リモート)

```bash
pnpm --filter web db:migrate:remote
```

> `drizzle-kit push` は禁止(OpenNext の tag-cache テーブルと同居するため)。必ず migration を適用する。

## 4.(任意)R2 presign 用シークレット

`/api/demos/r2/presign` は S3 認証情報が無い場合 **501 + 解説 JSON** を返します(デモは止まりません)。
有効化する場合のみ、R2 → 「Manage R2 API Tokens」で発行したキーを設定します。

```bash
wrangler secret put R2_S3_ACCESS_KEY_ID --name cf-stack-lab
wrangler secret put R2_S3_SECRET_ACCESS_KEY --name cf-stack-lab
wrangler secret put R2_S3_ACCOUNT_ID --name cf-stack-lab   # アカウント ID
```

## 5. デプロイ(demos → web の順)

```bash
pnpm deploy
```

`pnpm deploy` は `workers/demos` を先にデプロイしてから `apps/web`(OpenNext build + deploy)を行います。
**demos worker のデプロイには Docker が必要**(DemoContainer のイメージビルド)です。

> デプロイログに出る web worker の **gzip サイズを記録**してください(基準 ~2.3MiB / 上限 Paid 10MiB)。

## 6. デプロイ後の設定

1. **demos の CORS**: `workers/demos/wrangler.jsonc` の `ALLOWED_ORIGINS` に本番 web の origin を追加して再デプロイ。
2. **WebSocket URL**: チャットデモ(`/do/chat/:room/ws`)は service binding 経由で upgrade できないため、
   UI からは demos worker の公開ホストへ直接接続します。フロントの WS URL 定数を実ホストに設定(後続 UI フェーズ)。

## 7. スモークテスト(ステージング URL)

```bash
BASE=https://<staging-web-host>
curl -s $BASE/api/health                 # {"ok":true}
curl -s $BASE/demos/isr -o /dev/null -w "%{http_code}\n"   # 200(ISR ページ)
curl -s "$BASE/api/demos/container/info?name=alpha"        # コンテナ /info(コールドスタート 1〜3秒)
```

- KV/R2/D1 デモ API は Cookie `cfsl_vid` が必要(ブラウザでサイトに一度アクセスすれば付与される)。
- `R2 GET`(本文取得)は `next dev` の OpenNext binding プロキシ制約で 500 になりますが、**workerd(`preview:full`)/本番では正常**です。
