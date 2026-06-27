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
> コマンド/手順の詳細は [dev-and-release.md](./dev-and-release.md)、根拠は ADR [0011](../../docs/dev/adr/0011-distribution-and-update-model.md)（配布モデル）・[0012](../../docs/dev/adr/0012-three-tier-parity.md)（3層 parity）。

## リポジトリ（リモート2本）
- **origin** = `taki98029/event-master-bot`（**非公開**・保守者の開発リポジトリ。全ブランチ。②③の Workers Builds 接続元）。
- **public** = `taki98029/discord-event-bot`（**公開**・配布。利用者が **Fork** する元＋「Sync fork」の upstream。`setup.html` 配布基盤・廃止不可）。
- 紛らわしい点: **本番 Worker 名も `discord-event-bot`**（＝公開 repo 名と同じ）。非公開 repo は `event-master-bot`。

## 環境3層（ADR0012）
| 層 | Worker / D1 / Discord | デプロイ元 |
|---|---|---|
| ① ローカル | `npm test`/`typecheck`/sealed `wrangler dev` | リモート無し |
| ② 検証 staging | `discord-event-bot-staging` / `choiemu-event-bot-db-staging` / テスト用Discord | **origin/`staging`** → Workers Builds |
| ③ 本番 prod | `discord-event-bot` / `choiemu-event-bot-db`(`f6ff753c`) / 本番Choiemu | **origin/`main`** → Workers Builds |

## ★最重要: push = 自動デプロイ
- **`git push origin staging` → ②staging が自動デプロイ**（Workers Builds が `npm run deploy` 実行）。本番には無影響。
- **`git push origin main` → ③本番(Choiemu)が自動デプロイ**（Workers Builds が `npm run deploy`）。**＝本番操作。push 前に必ずユーザー許可**（CLAUDE.md）。
  - 実機確認済(2026-06-27): origin/main push が本番 Version を自動生成（例 `c6e701ba`）。「git push は git だけ」ではない。
- 配布版 wrangler.jsonc は `database_id` 省略だが、本番 Worker への deploy では **同名既存 D1(`choiemu-event-bot-db`)を再利用**＝本番データは切断されない（ADR0011 追補2 実機検証）。
- 移行措置の直接デプロイ: ローカル `npm run deploy`（既定 wrangler.jsonc 使用＝ブランチにより staging/配布設定）/ `npm run deploy:cli`（`wrangler.local.jsonc`＝実 id で本番）。どちらも本番到達しうる＝要許可。Workers Builds 安定後に `deploy:cli`/`wrangler.local.jsonc` は撤去予定。
- 利用者: `public/main` を Fork → 各自の Workers Builds → 各自の Worker。更新は GitHub「Sync fork」のみ（CLI 不要）。

## ブランチ役割（origin）
| ブランチ | 役割 | wrangler.jsonc |
|---|---|---|
| `main` | ③本番（push で本番自動デプロイ） | **配布版**（`discord-event-bot` / `choiemu-event-bot-db`・**database_id 省略**・cron 毎分） |
| `staging` | ②検証（push で staging 自動デプロイ）・開発統合先 | **隔離版**（name/db を `*-staging` に） |
| `public-release` | `public/main` 追跡（公開配布の内容） | 配布版 |
| feature 群 | `feat/*`・`ui/*`・`integrate/*`・`design-sync/*`＝staging へ統合する作業枝 | — |

## wrangler.jsonc の使い分け（落とし穴）
- **配布版(main/public)**: `database_id` を書かない（自動プロビジョニング＋同名D1再利用）。
- **隔離版(staging)**: `*-staging`。**「staging を main へマージしない」**（コード内コメントにも明記）。
- **`wrangler.local.jsonc`**: gitignore・実 `database_id`・`deploy:cli` 専用。`--config` は設定を**置換**するので wrangler.jsonc 変更時は追従必須（cron 等のドリフトに注意）。

## main 反映の作法（staging を main へマージしない）
別 worktree で `git checkout staging -- .` → `git checkout HEAD -- wrangler.jsonc`（main の配布版を維持）→ commit → `git push origin main`（＝本番自動デプロイになる点に注意）。
