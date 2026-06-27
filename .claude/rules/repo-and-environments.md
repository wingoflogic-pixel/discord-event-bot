---
paths:
  - "wrangler.jsonc"
  - "wrangler.local.jsonc"
  - "package.json"
  - "migrations/**"
  - "src/**"
  - "ui/**"
  - ".github/**"
---

# リポジトリ・環境・デプロイ構造（必読 / push=デプロイ）

> 構造の把握と「どの push が何を自動デプロイするか」を取り違えないための恒久メモ。
> コマンド/手順の詳細は [dev-and-release.md](./dev-and-release.md)、根拠は ADR [0011](../../docs/dev/adr/0011-distribution-and-update-model.md)（配布モデル）・[0012](../../docs/dev/adr/0012-three-tier-parity.md)（3層 parity・unified 化追補）。

## リポジトリ（リモート2本）
- **origin** = `taki98029/event-master-bot`（**非公開**・保守者の開発リポジトリ。全ブランチ。②③の Workers Builds 接続元）。
- **public** = `taki98029/discord-event-bot`（**公開**・配布。利用者が **Fork** する元＋「Sync fork」の upstream。`setup.html` 配布基盤・廃止不可）。
- 紛らわしい点: **本番 Worker 名も `discord-event-bot`**（＝公開 repo 名と同じ）。非公開 repo は `event-master-bot`。

## 環境3層（ADR0012）
| 層 | Worker / D1 / Discord | デプロイ元 |
|---|---|---|
| ① ローカル | `npm test`/`typecheck`/sealed `wrangler dev` | リモート無し |
| ② 検証 staging | `discord-event-bot-staging` / `choiemu-event-bot-db-staging`(`43d98794-…`) / テスト用Discord | **origin/`staging`** → Workers Builds |
| ③ 本番 prod | `discord-event-bot` / `choiemu-event-bot-db`(`f6ff753c-…`) / 本番Choiemu | **origin/`main`** → Workers Builds |

## ★最重要: push = 自動デプロイ
- **`git push origin staging` → ②staging が自動デプロイ**（Workers Builds が **`npm run deploy:staging`** 実行＝`wrangler deploy --env staging`）。本番には無影響。
- **`git push origin main` → ③本番(Choiemu)が自動デプロイ**（Workers Builds が **`npm run deploy`** 実行）。**＝本番操作。push 前に必ずユーザー許可**（CLAUDE.md）。
  - 実機確認済(2026-06-27): origin/main push が本番 Version を自動生成（例 `c6e701ba`）。「git push は git だけ」ではない。
- 配布版 wrangler.jsonc は `database_id` 省略だが、本番 Worker への deploy では **同名既存 D1(`choiemu-event-bot-db`)を再利用**＝本番データは切断されない（ADR0011 追補2 実機検証）。
- 移行措置の直接デプロイ: ローカル `npm run deploy`/`npm run deploy:staging`/`npm run deploy:cli`。どれも本番到達しうる＝要許可。Workers Builds 安定後に `deploy:cli`/`wrangler.local.jsonc` は撤去予定。
- 利用者: `public/main` を Fork → 各自の Workers Builds → 各自の Worker。更新は GitHub「Sync fork」のみ（CLI 不要）。

## ブランチ役割（origin）
| ブランチ | 役割 | wrangler.jsonc | Workers Builds Deploy command |
|---|---|---|---|
| `main` | ③本番（push で本番自動デプロイ） | **unified（base=配布）**（`discord-event-bot` / `choiemu-event-bot-db`・**database_id 省略**・cron 毎分）＋`env.staging` ブロック同梱 | `npm run deploy` |
| `staging` | ②検証（push で staging 自動デプロイ）・開発統合先 | **unified（main と同一）** | `npm run deploy:staging` ←★必須 |
| `public-release` | `public/main` 追跡（公開配布の内容） | unified | （利用者が各自設定。setup.html は `npm run deploy` を指示） |
| feature 群 | `feat/*`・`ui/*`・`integrate/*`・`design-sync/*`＝staging へ統合する作業枝 | unified | — |

## wrangler.jsonc は全ブランチ共通（unified・2026-06-27 移行）
- **設計**: base = 配布／本番設定。`env.staging` 上書きで staging 用 name/d1 を分離。
  - 本番デプロイ: `wrangler deploy`（env 無し）→ Worker `discord-event-bot` / D1 `choiemu-event-bot-db`
  - staging デプロイ: `wrangler deploy --env staging` → Worker `discord-event-bot-staging`（base + `-staging` 自動サフィックス）/ D1 `choiemu-event-bot-db-staging`（id 明記）
- **継承**: `triggers`(crons) / `assets` / `compatibility_*` / `main` / `name` は env block へ自動継承。`d1_databases` のみ非継承＝env block で全項目再記述必須（Wrangler 公式）。
- **★Workers Builds の Deploy command が唯一の事故ガード**: staging プロジェクトで `npm run deploy`（素）を指定すると base = 本番 Worker を狙うため、staging push が **本番にデプロイされる**。staging プロジェクトは必ず `npm run deploy:staging`。本番プロジェクトは `npm run deploy`。
- **`wrangler.local.jsonc`**: gitignore・実 `database_id`・`deploy:cli`（緊急用 CLI 直叩き）専用。`--config` は設定を**置換**するので wrangler.jsonc 変更時は追従必須（cron 等のドリフトに注意）。Workers Builds 安定後に撤去予定。

## main 反映の作法（unified 化後＝通常マージ可）
unified 化により main↔staging の wrangler.jsonc 差分が解消されたため、**staging を main へ正式マージできる**（旧「staging を main へマージしない」ルールは廃止）。
- 推奨手順: `git checkout main && git merge --ff-only origin/staging` または PR 経由（要レビュー時）。マージ後 `git push origin main` ＝本番自動デプロイ（要事前許可）。
- 旧手法（別 worktree で `git checkout staging -- .` → `git checkout HEAD -- wrangler.jsonc`）は不要・非推奨（差分が肥大化する）。
