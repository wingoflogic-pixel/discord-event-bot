# Assignment / Grouping を Notification の標準機能化（トグル撤廃）

ADR [0015](./0015-grouping-and-pair-constraints.md) は Grouping を `grouping_enabled` フラグで通知ごとに任意有効化する設計を定め、既存の Assignment も `assignment_enabled` フラグで同様に管理してきた。**両フラグの UI トグルを撤廃し、Assignment と Grouping を全 Notification で利用可能な標準機能として再定義する**。

## 文脈

- 実運用で OFF にする動機がほぼ無いことが判明した。番号割り当ては「実行しなければ何も起きない」、グループ分けは「保存しなければ何も起きない」運用なので、フラグは「ボタンを画面に出すか出さないか」しか制御していない。
- 通知作成画面のトグル 2 つは「これは何のスイッチか」をユーザーに考えさせる認知コストになっており、特に初回作成時に「とりあえず ON にしておけば良いのか？」と迷う原因になっていた。
- ADR 0015 L18 で「同一 Notification で両方を有効化できる」と独立フラグの設計理由は説明されているが、それは「両機能の独立性」の話であって「ON/OFF できる必要性」を導出してはいない。
- 通知一覧の「番号割り当て/グループ分け」ボタン（`ui/index.html:1204`）は既に **フラグ無視で常時表示** になっており、フラグの効果は開催回画面のボタン分岐（`ui/index.html:1670-1671`）と通知編集フォームのスイッチ表示のみに残っていた。一貫性も既に崩れている。

## 決定

### UI

- 通知編集フォームの `#nAssignmentRow` / `#nGroupingRow` を削除。
- 保存時のリクエストボディは `assignment_enabled: 1, grouping_enabled: 1` を常に送る（API 互換のため値は残す）。
- 開催回画面（[ui/index.html:1670-1671](../../ui/index.html#L1670-L1671)）のフラグガード `n.assignment_enabled && ...` / `n.grouping_enabled && ...` を撤去し、全通知で「番号割り当て」「グループ分け」ボタンを常時表示する。
- 通知一覧の同名ボタンは既に常時表示なので変更不要。

### DB

- `notifications.assignment_enabled` / `notifications.grouping_enabled` の列は **残す**（ALTER TABLE DROP しない）。
- 新規 migration `0013_assignment_grouping_always_on.sql` で既存全行を `1` に backfill。
  ```sql
  UPDATE notifications SET assignment_enabled = 1, grouping_enabled = 1
    WHERE assignment_enabled = 0 OR grouping_enabled = 0;
  ```
- 新規作成時の `assignment_enabled` / `grouping_enabled` のデフォルトはアプリ層で 1 を渡す（`DEFAULT 0` の DDL は変更しない）。

### 用語

- CONTEXT.md の Assignment / Grouping 定義から「Notification ごとに任意で有効化できる機能」「既定は無効」を削除し、「Notification の標準機能（全通知で利用可能）」に書き換える（同コミットで実施）。

## 根拠

- **UI の単純化**：トグルが消えることで通知作成フォームの可変パートが減り、最初の通知作成のつまずきが減る。
- **D1 マイグレーション不可逆性の尊重**（[.claude/rules/dev-and-release.md](../../../.claude/rules/dev-and-release.md), ADR 0015 L10）：列を `DROP COLUMN` する破壊的変更を避け、将来「特定通知だけ無効化したい」要望が再浮上したときに UI を戻すだけで対応できる退路を残す。
- **アプリ層で常に 1 を送る方針**：DDL の `DEFAULT 0` を `DEFAULT 1` に変える migration も検討したが、`DEFAULT` 変更は SQLite では ALTER TABLE で直接できず、新規列のテーブル再構築が必要になりコストに見合わない。アプリ層で 1 固定の方が安全。
- **API 互換維持**：`assignment_enabled` / `grouping_enabled` を引き続きリクエスト/レスポンスに含めるため、既存テスト・既存クライアントが破綻しない。

## トレードオフ

- **DEAD WEIGHT 化**：両列は常に 1 になり、機能的な意味を持たなくなる。スキーマ純度を犠牲にしてマイグレーション不可逆性に寄せた選択。
- **将来の「OFF にしたい」要望への退路の冗長性**：列を残すコストは数バイト/行で実害なし。退路の価値が上回る。
- **ADR 0015 のトレードオフ表との不整合**：0015 L18 の「同一 Notification で両方を有効化できる。設定フラグも別」は依然事実だが、「有効化」の含意が「常時 ON」に変わる。0015 を読む読者がここに辿り着けるよう、0015 の冒頭 or 該当箇所からの参照を入れることも検討した（今回は 0017 側からの逆参照のみ）。

## スキーマ影響（migration 0013）

```sql
-- migrations/0013_assignment_grouping_always_on.sql
UPDATE notifications SET assignment_enabled = 1, grouping_enabled = 1
  WHERE assignment_enabled = 0 OR grouping_enabled = 0;
```

新規テーブル・新規列・DROP は一切なし。冪等。
