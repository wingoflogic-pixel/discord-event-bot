---
paths:
  - "package.json"
  - "wrangler.jsonc"
  - "wrangler.local.jsonc"
  - "migrations/**"
  - "src/**"
  - "scripts/**"
---

# 開発・配信・更新フローの必須ルール

## 前提
- 利用者が必要とするアカウントは **Discord・Cloudflare・GitHub の 3 つ**（いずれも無料枠）。利用者は公開リポジトリを **Fork** して Cloudflare Workers Builds に接続し（案B・[ADR 0011 追補](../../docs/dev/adr/0011-distribution-and-update-model.md)）、更新は fork の **「Sync fork」** で受け取る。公開リポジトリは fork 元かつ Sync fork の upstream のため廃止不可。「Deploy to Cloudflare」ボタンは**不採用**（clone を作り Sync fork が使えないため）。

## 開発
- main へ直コミット禁止。必ずブランチを切る。
- スキーマ変更は `migrations/` に新しい連番ファイルを追加。既存マイグレーションは絶対に編集しない（配布済み環境と不整合になる）。現状の最新は 0009。
- ローカル検証は `.dev.vars`（テスト用Discordアプリ＋ダミーサーバーの値のみ）。本番値の混入は厳禁。`npm test` / `npm run typecheck` を回す。
- 仕上げ検証はデプロイ済みテストWorker（テスト用Discordに接続）で行う（ADR 0008）。

## 設定ファイル（wrangler.jsonc）
- 配布用 `wrangler.jsonc` の `d1_databases[]` には `database_id` を**記載しない（省略する）**。省略すると利用者の fork を接続した Workers Builds が D1 を自動生成する。実IDをベタ書きすると利用者のデプロイが失敗する。`.toml` ではなく `jsonc` を使うのは自動生成IDの書き戻し問題（issue #13632）回避のため。
- `wrangler` 下限は **`^4.102.0`**（id 省略＋バインディング名 `DB` でのマイグレーション解決＝PR #14275 が初収録された版）。`package.json` 変更時は `@emnapi` ピン留めを崩さないよう lockfile は npm10 で扱う。
- 保守者ローカル専用の `wrangler.local.jsonc`（実 `database_id`・**gitignore 済み・配布しない**）は、移行期に CLI から本番へデプロイするためだけに使う。

## デプロイ
- **素の `npm run deploy`（`wrangler deploy && db:migrate:remote`）は Workers Builds 用**（利用者の fork 接続・開発者の staging/prod）。配布用 `wrangler.jsonc` は `database_id` 省略のため、まず `wrangler deploy` で D1 を自動作成し id を `wrangler.jsonc` に書き戻してから `db:migrate:remote` がその id を解決してマイグレーションを適用する（未作成のDBには先にマイグレーションを当てられないためこの順）。ローカルから素で実行すると別D1を自動生成してしまう（ローカル本番デプロイには使わない）。
- 保守者がローカルCLIから本番Choiemuへデプロイするときは **`npm run deploy:cli`**（`wrangler.local.jsonc` を `--config` 指定）。`deploy:cli` は実IDで本番D1が既存のため、従来どおり本番D1へマイグレーションを適用してからデプロイする（`npm run deploy` とは順番が逆）。
- これは本番Choiemu操作にあたる。CLAUDE.md のルールに従い、実行前に必ずユーザー許可を得る。
- マイグレーションはバインディング名 `DB` で指定する（`wrangler d1 migrations apply DB --remote`）。利用者の fork 接続デプロイ時に各利用者のD1が別名で生成されるため、バインディング名で統一する。
- **方針（ADR 0012）**: 本番・検証とも最終的に GitHub→Cloudflare（Workers Builds）経路へ寄せ、`deploy:cli`（ローカルCLIリモートデプロイ）は Workers Builds 本番の立ち上げ後に撤去する移行措置。

## 配信・更新
- 配布チャネル: **BOOTH＝入口**。公開GitHubリポジトリ＝利用者が **Fork して Workers Builds に接続する元**かつ **Sync fork の upstream** で廃止不可。利用者の初回は「Fork → ダッシュボードで **Create application → Continue with GitHub** → 一覧から fork を選択 → **Deploy command を `npm run deploy` に変更** → **Deploy**（D1自動生成＋migrate）→ **Settings → Variables and secrets** でシークレット4つ設定」。「Deploy to Cloudflare」ボタンは不採用（clone＝Sync fork不可）。※ Cloudflare の作成画面UIは変わりやすいので、`setup.html` 改訂時は実画面で文言を再確認する（旧称「Import a repository / Get started / Save and Deploy」は現行「Continue with GitHub / Deploy」に置き換わっている）。
- **BOOTH配布物の定義（唯一の正）**: `setup.html` **単体のみ**（自己完結HTML・外部依存なしのため zip 不要）。配布物を増やす場合は必ずこの行を更新する。**`setup.html` は手順説明の実画面スクリーンショットを base64 でインライン埋め込みする**（外部画像ファイルは持たない＝配布物は単体ファイルのまま）。編集ソースは `setup.src.html`（`@@name@@` プレースホルダを手編集）で、`node scripts/build-setup-html.mjs` が `.captures/<name>.png` を base64 注入して `setup.html` を生成する（生成物の `setup.html` をコミット）。元スクショ置き場 `.captures/` は**生の機微情報（トークン・アプリID・公開キー・worker URL・非公開リポ名・アカウント等）を含むため非コミット**（配布画像では目隠しを画像へ焼き込み済み・CSS被せだけにしない）。`.env` / `.dev.vars` / `node_modules` / 実トークン / `src/` 等のソースは**絶対に同梱しない**（利用者は公開リポジトリを fork して取得する）。
- 更新: 利用者は自分の GitHub fork で「Sync fork」を押すだけ → Cloudflare Workers Builds が push ごとに deploy を実行 → マイグレーション適用＋デプロイが自動。利用者は **CLI 不要・GitHub アカウントのみ必須**。
- リリース時は package.json の version を semver で更新し、日本語リリースノートで「DB変更あり/なし」を明示する。
- zip衛生: 配布zipに `.env` / `.dev.vars` / `node_modules` / 実トークンを絶対に含めない。

詳細は docs/dev/dev-and-release-flow.md、決定の根拠は docs/dev/adr/0011-distribution-and-update-model.md を参照。
