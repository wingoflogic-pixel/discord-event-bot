# Ponytail Phase III-OPS: 配布運用クリーンアップ 実行計画

> 根拠: ADR 不要（小粒の集合）
> 状態: **未承認**（本ファイルは Phase 8 起票のみ。各項目は独立に着手判断）

配布・運用周りの「やっておくと整うが、緊急性は薄い」項目を 1 ヶ所に集める。各項目は独立しており、好きな順序・好きなタイミングで個別 PR を切れる。

## 項目カタログ

### Y-1: `db:migrate:remote:staging` npm script を削除（小・15 分）
- 現状: `package.json` に `"db:migrate:remote:staging": "wrangler d1 migrations apply DB --remote --env staging"` がある
- `deploy:staging` が `&& wrangler d1 migrations apply DB --remote --env staging` を内包しているため重複
- 単独で staging に migrate だけ走らせる需要はほぼない（model A では main push が deploy:staging を呼ぶ）
- **作業**: `package.json` から該当 script を 1 行削除
- **想定削減**: -1 行 / scripts -1
- **リスク**: 低。手動で migrate だけしたい場合は `wrangler d1 migrations apply DB --remote --env staging` を直接打てる

### Y-3: `register-commands` npm script + `scripts/register-commands.js` を削除（中・1〜2 時間）
- 現状: 管理 UI の「コマンドを登録」ボタンが `POST /setup/register-commands` を提供しており、CLI 経路は事実上未使用
- **作業**: `package.json` から `register-commands` script 削除、`scripts/register-commands.js` 削除
- **想定削減**: -64 行（スクリプト本体 61 行 + script 1 行 + 周辺記述）
- **リスク**: 中。CI 環境でコマンド登録を自動化したい将来需要があれば再追加可能（ADR は不要・1 コミットで戻せる）

### Z-1: `public-release` ブランチの存在・運用確認（小・30 分）
- 現状: model A 移行後、`public-release` の運用が形骸化している可能性
- **作業**: `git branch -a` で確認 → 存在すれば public/main との diff を確認 → 完全に同期できるなら削除、ズレているなら公開反映フローをドキュメント化
- **想定削減**: 0〜数百行（ブランチごとの管理コスト）
- **リスク**: 低（削除前に public/main と diff 0 を確認）

### Z-2: `staging` ブランチを削除（小・10 分）
- 現状: model A で main 一本に統合済みだが、`staging` ブランチが origin に残っている可能性
- **作業**: `git push origin --delete staging`（残っていれば）
- **想定削減**: ブランチ 1 本
- **リスク**: 低（履歴は main に統合済み）

### X-2: setup.html 生成の CI 化（中・3〜5 人日）
- 現状: `node scripts/build-setup-html.mjs` を手動で叩く必要があり、`.captures/` が機微情報のためコミット不可
- **作業**: GitHub Actions で `.captures/` を Secrets に push → build-setup-html.mjs を実行 → setup.html を artifact 化
- **判断保留**: ponytail の本筋（過剰なものを削る）と逆行する CI 追加。`.captures/` 運用コストが将来限界に達してから検討
- **想定削減**: 手動手順 -1（数値削減はなし）
- **リスク**: 中（CI に機微情報を持ち込む設計判断が必要）

### X-3: tag push → `deploy:cli` 自動化（中・1 人日）
- 現状: 本番デプロイは手動 `npm run deploy:cli`
- **作業**: GitHub Actions で `v*.*.*` tag push を契機に CF API 経由で deploy（要 Secrets: CF API token + account id）
- **判断保留**: 本番デプロイの「明示的・手動」というセマンティクスを意図的に守っている（[ADR 0011 追補](../dev/adr/0011-distribution-and-update-model.md) model A）。自動化は安全装置を弱める
- **想定削減**: 手動手順 -1（数値削減はなし）
- **リスク**: 高（誤 tag push が本番に直行する）→ 二段確認（draft release を merge する人間ゲート）を入れる設計なら検討可

### X-5: migrations スキーマ snapshot 戦略（要熟議・3〜5 人日）
- 現状: `migrations/0001-0012` を読まないと現スキーマが分からない
- **作業**: `migrations/_schema.sql`（最新 snapshot）と `migrations/000N-*.sql`（実適用）を二重管理にし、`_schema.sql` で全体像を提示
- **判断保留**: 二重管理の保守コストとメリットの綱引き。`docs/dev/CONTEXT.md` で十分という説もある
- **想定削減**: ドキュメント手段の改善（数値削減はなし）

## 着手順序の推奨

1. **Y-1 → Z-2 → Z-1**（即時・低リスク・合計 1 時間以内）
2. **Y-3**（管理 UI で完全代替できるか実機確認後）
3. **X-2 / X-3 / X-5** は需要が顕在化してから判断

## 中止条件

- 各項目はいずれも独立。中止判断も個別。本 plan は「カタログ」であり、まとめて承認する性格ではない
