# Ponytail リファクタリング進捗ログ

> 計画書: [ponytail-plan.md](./ponytail-plan.md)
> 開始: 2026-06-28

## Phase 1 ベースライン (commit: TBD)

| metric | value |
|---|---:|
| LOC src/ | 4,972 |
| LOC ui/ | 2,450 |
| LOC design-system/{src+styles} | 1,737 |
| LOC design-system/*.mjs | 187 |
| LOC scripts/ | 125 |
| LOC tests/ | 1,444 |
| LOC config (wrangler+package+tsconfig+vitest) | 185 |
| **LOC 合計** | **11,100** |
| deps root (dependencies + devDependencies) | 9 |
| deps design-system (dependencies + devDependencies) | 7 |
| `// ponytail:` コメント数 | 0 |
| tests passed | 103 (9 files) |

### `/ponytail-audit` ベースライン (full mode)

biggest cut first:

```
delete: design-system/src/components/*.tsx 34 files unused. SPA 化まで deferred 注釈で代替 (ADR 0019 で正式採用予定). [design-system/src/components/*.tsx]
native: discord-interactions verifyKey. crypto.subtle.verify('Ed25519'). [src/interactions/index.ts:1,80]
shrink: ui/index.html confirmDialog + confirmDiscardNotif dup. Unify. [ui/index.html:688,1502]
shrink: ui/index.html fmtDate/fmtTimeRange/addMinsToTime split. Collapse to one block. [ui/index.html]
yagni: validation 散在 (toNotificationInput/candidateSlotsOf/num/parseLimit). 集約は別計画 ADR 0020. [src/admin/index.ts:71-122]
yagni: design-system/serve.mjs + serve-ui.mjs 2 file copy. Merge to --ui flag. [design-system/serve.mjs, serve-ui.mjs]
delete: design-system/styles/components.css 未参照クラス. grep 確認後 prune. [design-system/styles/components.css]
native: dotenv import + devDep. wrangler v4 が .env 自動読込. [scripts/register-commands.js:17, package.json]
yagni: shuffle Fisher-Yates 2 copies. src/lib/shuffle.ts に 1 本化. [src/db/groupings.ts:13-20, src/db/assignments.ts:4-11]
shrink: build-ui-sortable.mjs 一時ファイル書出し. esbuild stdin. [design-system/build-ui-sortable.mjs:17-18]
stdlib: pad2 helper. String(n).padStart(2,'0'). [src/cron/dailyCheck.ts:119]
shrink: mention_mode IIFE 4 行. 三項 1 行. [src/admin/index.ts:183-186]
yagni: isAnnounceOnly 判定 inline 重複. src/db/types.ts に export. [src/cron/dailyCheck.ts:43, src/admin/index.ts:146]
delete: register-commands npm script + scripts/register-commands.js. 管理 UI 経由で代替. [package.json, scripts/register-commands.js]
yagni: db:migrate:remote:staging npm script. deploy:staging が apply 込み. [package.json]
delete: admin/index.ts 833 / groupings.ts 618 / dailyCheck.ts 482 大型責務混在. 別計画 ADR 0020 で分割. [src/admin/index.ts, src/db/groupings.ts, src/cron/dailyCheck.ts]
```

**net: -200〜-1700 lines, -2 deps possible.**
(本計画スコープは 34 components を deferred 注釈で保留するため **-200〜-300 行 + -2 deps** が現実ライン)

### `/ponytail-gain` ベースライン (公式ベンチ参考値)

Phase 9 で再実行して Before/After 比較する。本リポジトリ固有値ではなく、ponytail プラグインの公称ベンチを参考値として記録。

| 指標 | 公称値 |
|---|---|
| LOC 削減平均 | -54% (最大 -94%) |
| コスト削減 | -20% |
| 速度 | +27% |
| 安全ガード維持 | 100% |

## Phase 2 src/ 軽微簡略化 (commits 71545d2 / 0bec4d4 / cc7a0b7 / 453482a)

| metric | before | after | delta |
|---|---:|---:|---:|
| LOC src/ | 4,972 | 4,961 | **-11** |
| ponytail comments | 0 | 2 | +2 |
| tests passed | 103 | 103 | ±0 |

実施:
- Commit 1 `71545d2`: `src/lib/shuffle.ts` 新規。`assignments.ts` / `groupings.ts` の Fisher-Yates 重複定義を統合（-8 行 + 新規 8 行 = ±0 だが 1 本化）
- Commit 2 `0bec4d4`: `dailyCheck.ts` の `pad2` ヘルパー削除→`String(n).padStart(2,'0')` inline（-2 行）
- Commit 3 `cc7a0b7`: `admin/index.ts` の `mention_mode` IIFE 4 行→三項 1 行（-3 行）
- Commit 4 `453482a`: `isAnnounceOnly(Pick<Notification, 'type' | 'requires_response'>)` を `db/types.ts` に export。`dailyCheck.ts` のローカル定義 + `admin/index.ts` のインライン式（`type === 'recurring' && requiresResponse === 0`）を統合

スキップ: `tests/fixtures.ts` 新規（`makeEnv` は setup.test.ts のみ・1 ファイル限定、`makeNotification` は recurrence.test.ts / db.test.ts でシグネチャが同期/非同期で異なり共有不適）。Ponytail 流に実利薄として除外。当初計画 5 コミット→ **4 コミットに圧縮**。

## Phase 3 scripts + dotenv 撤去 + serve 統合 (commits 68a6d10 / 064e9c8 / e2dd00f)

| metric | before | after | delta |
|---|---:|---:|---:|
| LOC scripts/ | 125 | 125 | ±0 |
| LOC design-system/*.mjs | 187 | 160 | **-27** |
| deps root | 9 | 8 | **-1 (dotenv)** |
| ponytail comments | 2 | 5 | +3 |
| tests passed | 103 | 103 | ±0 |

実施:
- Commit 1 `68a6d10`: `scripts/register-commands.js` から `import 'dotenv/config'` 削除。`package.json` の `register-commands` を `node --env-file=.env scripts/register-commands.js` に。devDep `dotenv` 削除。`engines.node` を `>=20.6.0` に引き上げ（`--env-file` サポート）
- Commit 2 `064e9c8`: `design-system/serve.mjs` と `serve-ui.mjs` の 2 ファイル重複を `--ui` フラグ + `PORT` env で 1 本化。`serve-ui.mjs` 削除。`.claude/launch.json` の ui-preview / `design-system/README.md` / `docs/refactor/ponytail-ui-regression.md` を新コマンドに更新。両モード curl smoke (200) 合格
- Commit 3 `e2dd00f`: `build-ui-sortable.mjs` の一時 entry 書出し（`writeFileSync`）を esbuild `stdin` に置換。残骸 `design-system/src/_ui-sortable-entry.ts` も撤去

スキップ: 計画にあった `dev:ds`/`dev:ui`/`dev:setup`/`build:setup`/`build:ui`/`sync:ui` 等の追加 npm scripts は `.claude/launch.json` で既に代替済みのため Ponytail (YAGNI) で見送り。当初計画 4 コミット → **3 コミット**に圧縮。

## Phase 4 ui/index.html 重複統合 (commit 6a20e5f)

| metric | before | after | delta |
|---|---:|---:|---:|
| LOC ui/ | 2,450 | 2,435 | **-15** |
| ponytail comments | 5 | 6 | +1 |

実施:
- `confirmDialog` に `cancelLabel` オプション追加 (1 行)
- 機能ほぼ等価の `confirmDiscardNotif` (~20 行) を撤去、呼び出しを `confirmDialog('保存していない変更は失われます。', { title: '編集中の内容を破棄しますか？', okLabel: '破棄して閉じる', cancelLabel: '編集に戻る', danger: true })` に置換
- preview smoke (window.api スタブ不要) で title/body/labels/danger/resolved すべて等価確認・console エラーなし

スキップ（YAGNI）:
- 日付フォーマッタ統合: `fmtDate` / `fmtTimeRange` / `addMinsToTime` は ui/index.html 内に 1 箇所のみ定義（grep 確認・重複なし）。Plan v3 想定の「重複」が実体なしだったため作業不要。当初計画 -50〜-100 行は実態にそぐわず、実 -15 行で着地。

## Phase 5 design-system/styles (実体なしのためスキップ)

| metric | before | after | delta |
|---|---:|---:|---:|
| LOC design-system/{src+styles} | 1,737 | 1,737 | ±0 |

検査: `components.css` + `app-ui.css` の class セレクタ全 **127 件** を抽出し、`ui/index.html` / `design-system/src` / `design-system/styles` / `design-system/preview.html` から word-boundary 付き正規表現で参照を grep。

- 未参照クラス: **0 件**（127/127 すべて参照あり）
- 重複セレクタ: 各 class は基本 1 ブロック定義で、`.foo.active` / `.foo:hover` 等は状態違いの妥当な追加セレクタ

Ponytail (YAGNI): 削れる実体がないので Phase 5 はノーオペ。Plan v3 の想定 -50〜-100 行は実態にそぐわず。components.css は ui/index.html のインライン抽出版 (1:1) のため、もともと未使用余地が小さい設計と判明。**コミットなし**。

## Phase 6 discord-interactions → Web Crypto (commit 32cef31)

| metric | before | after | delta |
|---|---:|---:|---:|
| LOC src/ | 4,961 | 4,997 | +36 (verifyEd25519 helper +コメント) |
| deps root (dep+devDep) | 8 | 7 | **-1 (discord-interactions)** |
| tests passed | 103 | 108 | **+5 (interactions.test.ts)** |
| ponytail comments | 6 | 7 | +1 |

実施:
- `src/interactions/index.ts`: `import { verifyKey, InteractionType, InteractionResponseType } from 'discord-interactions'` 撤去
- 同ファイル先頭に `verifyEd25519(rawBody, sigHex, ts, pubKeyHex): Promise<boolean>` を追加。Cloudflare Workers (workerd) ネイティブの `crypto.subtle.importKey('raw', ..., { name: 'Ed25519' })` + `crypto.subtle.verify('Ed25519', ...)` を使用。例外は全て catch して false 返却
- `InteractionType` / `InteractionResponseType` は使用する 5 値のみ const オブジェクトで再現（PING / APPLICATION_COMMAND / MESSAGE_COMPONENT / PONG / CHANNEL_MESSAGE_WITH_SOURCE）
- `package.json` `dependencies.discord-interactions` 削除
- `tests/interactions.test.ts` 新規 5 ケース:
  1. 正しい鍵対 + 署名 → true
  2. body 改ざん → false
  3. 別鍵検証 → false
  4. 公開鍵フォーマット不正 (not-hex / odd-length / empty) → false (throw しない)
  5. 署名フォーマット不正 → false

検証:
- ローカル: `npm run typecheck` green / `npm test` 108 passed (+5)
- staging: main push (32cef31) → Workers Builds が `discord-event-bot-staging` に auto-deploy 進行中
- 本番: **未実施**（Phase 7-9 完了後にユーザー許可を仰いで `npm run deploy:cli` 実行予定）

## Phase 7 design-system deferred 注釈 (TBD)

| metric | before | after | delta |
|---|---:|---:|---:|
| LOC design-system/{src+styles} | TBD | TBD | TBD |
| ponytail comments (deferred) | TBD | TBD | TBD |

## Phase 8 ADR + plan 起票 (TBD)

ドキュメント追加のみ。LOC delta なし。

## Phase 9 Summary（最終ファイナライズ）

### 全 Phase 集計（LOC バケット別 Before/After）

| バケット | baseline | final | delta | 主因 |
|---|---:|---:|---:|---|
| `src/` | 4,972 | 4,997 | **+25** | Phase 2 -11 / Phase 6 +36 (verifyEd25519 helper) |
| `ui/` | 2,450 | 2,435 | **-15** | Phase 4 (confirmDialog 統合) |
| `design-system/{src+styles}` | 1,737 | 1,821 | **+84** | Phase 7 deferred 注釈 +87 (実装変更なし) |
| `design-system/*.mjs` | 187 | 160 | **-27** | Phase 3 (serve-ui.mjs 撤去 + sortable 一時 entry 撤去) |
| `scripts/` | 125 | 125 | ±0 | dotenv import 撤去とコメント追加で相殺 |
| `tests/` | 1,444 | 1,495 | **+51** | Phase 6 interactions.test.ts 新規 (5 ケース) |
| config | 185 | 183 | **-2** | package.json dotenv/discord-interactions 削除 |
| **合計** | **11,100** | **11,216** | **+116** | 注釈 +87 / テスト +51 / helper +36 / 本体ロジック純減 -58 |

### 依存数 Before/After

| | baseline | final | delta |
|---|---:|---:|---:|
| root (dep+devDep) | 9 | **7** | **-2** (`dotenv`, `discord-interactions`) |
| design-system (dep+devDep+peer) | 7 (peer 抜き計測) | 9 (peer 込み 9) | ±0 (追加なし) |

### `// ponytail:` コメント分布

| 種別 | 件数 | 内訳 |
|---|---:|---|
| deferred | 29 | 全 design-system/src/components/*.tsx (ADR 0019 への前方参照) |
| (b) 既存資産化 | 4 | shuffle 統合 / isAnnounceOnly 統合 / serve 統合 / confirmDialog 統合 |
| (c) one-liner / stdlib | 1 | esbuild stdin (build-ui-sortable.mjs) |
| (d) native 化 | 2 | dotenv→--env-file / discord-interactions→Web Crypto |
| **合計** | **36** | (baseline 0) |

### テスト

| | baseline | final | delta |
|---|---:|---:|---:|
| Test Files | 9 | 10 | +1 |
| Tests passed | 103 | **108** | **+5** (interactions.test.ts) |

### /ponytail-audit Before/After

Baseline audit (Phase 1) で挙げられた 16 件のうち、本計画 (II) のスコープ実施:

| 状態 | 内容 |
|---|---|
| ✅ 実施 | shuffle 統合 (groupings/assignments) |
| ✅ 実施 | pad2 → String.padStart inline |
| ✅ 実施 | mention_mode IIFE → 三項 |
| ✅ 実施 | isAnnounceOnly 共通化 |
| ✅ 実施 | dotenv → Node 20 --env-file |
| ✅ 実施 | serve.mjs + serve-ui.mjs → --ui flag |
| ✅ 実施 | build-ui-sortable.mjs → esbuild stdin |
| ✅ 実施 | confirmDialog + confirmDiscardNotif 統合 |
| ✅ 実施 | discord-interactions → Web Crypto Ed25519 (Phase 6) |
| 🟡 別計画 | 29 design-system/src/components/*.tsx → ADR 0019 (Phase 7 で deferred 注釈・III-SPA で実装) |
| 🟡 別計画 | admin/index.ts 833 / groupings.ts 618 / dailyCheck.ts 482 → ADR 0020 (III-A で分割) |
| 🟡 別計画 | validation 散在 (toNotificationInput 等) → ADR 0020 (III-A 内 B1) |
| 🟡 別計画 | register-commands script + scripts/register-commands.js → III-OPS Y-3 |
| 🟡 別計画 | db:migrate:remote:staging npm script → III-OPS Y-1 |
| ❌ 実体なし | design-system/styles/components.css 未参照クラス (Phase 5 grep で 127/127 全て参照と判明) |
| ❌ 実体なし | ui/index.html fmtDate/fmtTimeRange/addMinsToTime 重複 (Phase 4 で 1 箇所定義と判明) |

**(II) スコープ 9/9 完遂。(III) 4 件は ADR/plan 起票で deferred。実体なし判定 2 件**。

### /ponytail-gain 公称ベンチ（参考値・本リポジトリ固有計算ではない）

| 指標 | 公称値 |
|---|---|
| LOC 削減平均 | -54% (最大 -94%) |
| コスト削減 | -20% |
| 速度 | +27% |
| 安全ガード維持 | 100% |

本リポジトリでの実測:
- **依存削減 -22%** (9 → 7)
- **本体ロジック行数 -58 行**（注釈/テスト/helper を除いたコード純減）
- **安全ガード**: 信頼境界・データ整合・a11y・監査ログいずれも変更なし。tests 108/108 green
- **net LOC**: +116（注釈 87 + テスト 51 + helper 36 と本体減 -58 の相殺）→ Plan 想定の本計画スコープ -200〜-300 行 は (III) 別計画の積み残し分込みであり、本計画 (II) のみでは妥当な落とし所

### 本番デプロイ前チェックリスト

Phase 6 (Web Crypto Ed25519 置換) のみが本番影響あり。下記をユーザー手動で確認後、許可を得て `npm run deploy:cli` 実行:

- [ ] staging Worker (`discord-event-bot-staging`) の Workers Builds が main push `32cef31` を auto-deploy 完了
- [ ] テスト用 Discord で `/help` / `/notify` / `/manage` slash command が応答（署名検証 OK）
- [ ] テスト用 Discord で募集投稿への「参加 / 不参加 / 未定 / 状況確認」ボタンが応答
- [ ] テスト用 Discord で `/notify` ボタン選択 → 即募集投稿が動作
- [ ] staging Worker logs に Ed25519 関連エラーなし
- [ ] 上記 OK → ユーザーが Claude に許可 → `npm run deploy:cli`

### ロールバック手順 (Phase 6 が本番で異常時)

1. 即時 `git revert 32cef31` → main push
2. ユーザー許可を再取得
3. `npm run deploy:cli` で本番を旧バージョン (discord-interactions 経由) に戻す
4. 緊急時の保険: Discord Developer Portal で interaction endpoint URL を一時無効化

### 本計画の終了条件

- 本番デプロイは Phase 9 では実行しない（ユーザー許可後に独立タスクとして実施）
- 本ファイル (`ponytail-progress.md`) の Phase 9 セクションが埋まり、Phase 1〜8 が全 commit に紐づいた時点で完了とする
