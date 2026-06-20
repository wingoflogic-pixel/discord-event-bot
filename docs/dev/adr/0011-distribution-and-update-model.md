# 配布・更新モデル（BOOTH入口＋公開GitHub基盤＋deployスクリプトでのマイグレーション自動適用）

> **更新（2026-06-20）**: 初回セットアップ手段を「Deploy to Cloudflare ボタン」から「利用者が **Fork → Cloudflare Workers Builds に接続**」へ変更した（案B）。以下の本文は当初の決定の記録で、**末尾の「追補」が現行**。更新を「Sync fork」で回す方針・二層構成（BOOTH＋公開GitHub）は不変。

非エンジニア向けの自己ホスト配布・更新を、利用者が CLI に触れずに完結できるようにする。配布の入口は BOOTH、デプロイの動力源は公開 GitHub リポジトリ、初回・更新の両方で `package.json` の `deploy` スクリプトがマイグレーション適用とデプロイを自動実行する。配布チャネル（BOOTH）・デプロイ基盤（公開 GitHub）・マイグレーション適用方式（deploy スクリプト）を独立した3つの軸として扱う。

## 文脈

`discord-event-bot` は非エンジニアの自己ホスト運用を前提に配布する必要がある。利用者は CLI（`wrangler` 等）を扱えないため、デプロイ経路は「ノン CLI で完結すること」が必須要件になる。

Cloudflare のクラウド常駐型 Worker をノン CLI でデプロイできる経路は、実質「Deploy to Cloudflare ボタン」しかなく、このボタンは**公開 git リポジトリを参照する**仕様である。したがってデプロイ基盤としての公開 GitHub リポジトリは廃止できない。

一方、配布の入口としては VRChat 層になじみ深い BOOTH が親和性が高い。ただし BOOTH は git ホスティングではなく、ボタンの動力源にはなれない。配布物（`setup.html` 等の小さな一式）の入口と、デプロイの動力源は別レイヤーとして扱う必要がある。

また Bot Token を利用者に預けてもらう性質上、ソースが公開 GitHub で閲覧可能な方が利用者は安心して使える、という信頼性の観点もある。

## 決定

- **配布は「BOOTH 入口＋公開 GitHub 基盤」の二層構成**。
  - BOOTH＝入口。VRChat 層になじみ深く、配布物（`setup.html` 等の小さな一式）を受け取る場所。配布 zip には `.env` / `.dev.vars` / `node_modules` / 実トークンを**絶対に含めない**（zip 衛生）。
  - 公開 GitHub リポジトリ＝「Deploy to Cloudflare」ボタンの動力源。ボタンは公開 git リポジトリを参照するため**廃止できない**。利用者は GitHub UI を直接触らず、`setup.html` 経由でデプロイする。
- **デプロイは「Deploy ボタン＋`package.json` の `deploy` スクリプトでマイグレーション自動適用」**。
  - `"deploy": "npm run db:migrate:remote && wrangler deploy"`。デプロイ前に必ずマイグレーションを適用してから `wrangler deploy` する。
  - `"db:migrate:remote": "wrangler d1 migrations apply DB --remote"`。マイグレーションは「データベース名」ではなく**バインディング名 `DB`** で指定する。Deploy ボタンで配布すると各利用者の D1 が**別名で自動生成される**ため、バインディング名で指定すれば配布先の D1 別名に依存せず同じスクリプトで動く（Cloudflare 公式推奨。関連 issue #13632 は PR #14275 で解決済み）。
  - Deploy ボタンは `.dev.vars.example` のシークレット名（4 つ: `DISCORD_PUBLIC_KEY` / `DISCORD_APPLICATION_ID` / `DISCORD_BOT_TOKEN` / `ADMIN_TOKEN`）＋ `package.json` の `cloudflare.bindings` 説明文をもとに、デプロイ時にシークレット入力欄を出す。
- **更新は「利用者の Sync fork 起点で Workers Builds が自動再デプロイ」**。
  - maintainer は修正を `main` にマージし、`version`（semver）更新＋日本語リリースノート（「DB 変更あり/なし」を明記）でリリースする。
  - 利用者は自分の GitHub fork で「Sync fork」を押すだけ → Cloudflare Workers Builds が自動で再ビルド → `deploy` スクリプトが「マイグレーション適用 → デプロイ」を自動実行 → 完了。CLI 不要。
  - Workers Builds は本番ブランチへの push ごとに `deploy` コマンドを実行する（公式仕様）。初回デプロイと更新デプロイが**同じ `deploy` スクリプト**で統一される。

## 根拠

- 公開 GitHub リポジトリは Deploy ボタンの動力源であり、ノン CLI デプロイ経路を成立させる唯一の基盤なので**廃止不可**。BOOTH を入口にしても、ボタンの参照先としての公開 git は別途必須になる。二層に分けることで「VRChat 層への親和（BOOTH）」と「ノン CLI デプロイ（公開 git）」を両立できる。
- `deploy` スクリプト方式は Cloudflare 公式推奨で、**初回デプロイ（Deploy ボタン）と更新デプロイ（Workers Builds）の両方を同一スクリプトでカバー**できる。アプリ側に独自のマイグレーション機構を持たずに済む。
- マイグレーションを**バインディング名 `DB`** で指定することで、Deploy ボタン配布で各利用者の D1 が別名生成されても同じスクリプトが動く。配布先ごとの D1 別名を設定で吸収する必要がなくなる。
- 更新が「Sync fork を押すだけ」で完結するため、CLI を扱えない非エンジニア利用者でも maintainer のリリースに追従できる。ソースが公開 GitHub で閲覧可能なことは、Bot Token を預ける利用者の安心材料にもなる。

## トレードオフ

- **公開 GitHub リポジトリが必須**になる。ボタンの動力源として閉じることはできず、配布物の管理レイヤー（BOOTH）とデプロイ基盤レイヤー（公開 git）の二系統を維持し続ける必要がある。
- **更新は利用者の手動 Sync fork に依存**する。maintainer がリリースしても、利用者が fork で「Sync fork」を押すまで反映されない（push 即時の一斉更新ではない）。重要修正の周知は別途必要。
- **Deploy ボタン経由のマイグレーション自動適用の最終的な実挙動は、リポジトリを公開して初回の実デプロイで確認する**必要がある。設定は公式どおりで、ローカルではバインディング `DB` 解決を確認済みだが、ボタン配布時の D1 別名生成＋マイグレーション適用の通し動作は実デプロイで検証する。
- `npm run deploy` は**本番 D1 へマイグレーションを適用してから**デプロイするため、maintainer が本番 Choiemu に対して実行する場合は本番操作にあたる。CLAUDE.md のルールに従い、実行前に必ずユーザー許可を得る。

## 却下した代替案

- **BOOTH 単独 zip 配布（公開 GitHub なし）**: BOOTH は git ホスティングではなく Deploy ボタンの参照先になれないため、ノン CLI デプロイ経路が成立しない。また更新も zip 再配布＋手動差し替えとなり、マイグレーションの自動適用も追従も困難。非エンジニア向けの初回・更新の両要件を満たせない。
- **CLI 専用配布（`wrangler` で利用者が直接デプロイ）**: マイグレーション適用もデプロイも公式どおり可能だが、非エンジニア利用者が CLI を扱えないため要件（ノン CLI 完結）を満たせない。
- **アプリ内マイグレーションランナー（Worker 起動時にスキーマを適用）**: `deploy` スクリプトでの自動適用（初回・更新の両方をカバー）で十分であり、アプリ本体にマイグレーション実行ロジックを抱える必要がない。Cloudflare 公式推奨の `wrangler d1 migrations apply DB --remote` 方式と二重化するだけで、複雑さに見合う利点がないため不要と判断。

## 追補（2026-06-20）: 初回セットアップを「Deploy ボタン」から「Fork → Workers Builds 接続」へ変更（案B）

本 ADR は当初「初回＝**Deploy to Cloudflare ボタン**」「更新＝**Sync fork**」を前提にしていたが、検証の結果この2つは両立しないことが判明したため、**初回セットアップ方法を変更**する（更新を Sync fork で回す方針は維持）。

### 問題

- 「Deploy to Cloudflare」ボタンが利用者のアカウントに作るのは、**GitHub の fork ではなく clone（独立コピー・upstream の親を持たない）**である（Cloudflare 公式 "clones your source repository into the user's account"）。
- GitHub の **「Sync fork」は fork（親を持つリポジトリ）にしか現れない**。clone には出ない。
- したがって Deploy ボタン経路では、本 ADR が想定した「更新＝Sync fork ボタン1つ」が成立しない。clone の更新は upstream を手動で取り込む（CLI）か独自の同期 Action が要り、**非エンジニア・CLI 不要という本 ADR の必須要件と矛盾**する。

### 変更後の決定

- **初回セットアップ**: 利用者は公開リポジトリを **GitHub の「Fork」で複製** → Cloudflare ダッシュボードの **Workers & Pages → Create → Import a repository** で自分の fork を接続 → ビルド設定の **Deploy command を `npm run deploy`** に設定 → デプロイ。D1 は自動プロビジョニングで生成され、`deploy` スクリプトがマイグレーションを適用する。4 シークレットは Worker の **Variables and Secrets** で設定。
- **更新**: 利用者は自分の fork で **GitHub 純正の「Sync fork」**（fork なので利用可能）→ Workers Builds が push を検知して自動再デプロイ。**独自部品ゼロ**。
- これにより「fork が本物になる」ため、本 ADR の更新モデル（Sync fork）が**実際に成立**する。

### データ保全（再デプロイで D1 は維持される）

- 配布用 `wrangler.jsonc` の `database_id` は空（自動プロビジョニング用・[ADR 0012](0012-three-tier-parity.md)）。Cloudflare は **「一度プロビジョニングしたリソースは以降のデプロイでも紐付けが維持される（設定に ID を書かなくても）」**（2025-10-24 自動プロビジョニング）ため、**同じ Worker に再デプロイする限り同じ D1 が使われ、データは保持**される。
- GitHub/ダッシュボード経由デプロイでは生成 ID が repo に書き戻されないため、**fork と upstream の設定が常に同一（ともに空）** に保たれ、**「Sync fork」がスキーマ ID の衝突を起こさない**。「書き戻されない」性質が更新をクリーンに保つ方向に働く。

### トレードオフ・却下案

- 初回の手数が「ボタン1つ」から数クリック増える（fork → Worker 作成して接続 → deploy コマンド設定 → シークレット）。ただし**すべて Web 操作で CLI 不要**であり、`setup.html` の手順で吸収する。
- **却下: Deploy ボタン＋独自アップデート Action**（clone のまま、同梱ワークフローを「Run workflow」で実行して更新）。データ保全はできるが、**保守者が独自の同期ワークフローという可動部品を恒久的に抱える**。純正「Sync fork」で完結する fork 接続の方が安定なため却下。
- **却下: 更新＝Deploy ボタン再実行**。再実行は新しい repo・Worker・D1 を作り、**既存データから切り離される**（公式 "creates a new repo... new database IDs"）ため不可。

> 補足: 公開 GitHub リポジトリが「廃止不可の基盤」である点は不変（fork 元であり、Workers Builds の接続先）。BOOTH＝入口（`setup.html` 配布）の二層構成も不変。検証の詳細・出典は [distribution-and-environments.html](../distribution-and-environments.html) 末尾、3 層 parity は [ADR 0012](0012-three-tier-parity.md) を参照。
>
> `package.json` の `cloudflare` メタについて: `cloudflare.bindings`（4 シークレットの説明文）は **dev-and-release-flow.md / .claude/rules から参照される説明文の出所として残置**する。`cloudflare.label` / `cloudflare.products` は元々「Deploy to Cloudflare ボタン」用のメタで、ボタン不採用後は実用途を失っているが、**機能上は無害なので残置**（fork 接続のデプロイには影響しない）。
