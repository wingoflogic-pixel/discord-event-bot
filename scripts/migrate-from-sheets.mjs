/**
 * ⚠️ 【現行モデル未対応・要書き直し】
 *   このスクリプトは旧スキーマ（config / members / event_log の単一定例モデル）向けに
 *   seed SQL を生成する。汎用リデザイン後の現行スキーマ
 *   （events / segments / members / segment_members / notifications / occurrences / responses / assignments）
 *   とは構造が異なるため、生成される seed.sql は**そのままでは適用できない**。
 *   Sheets 読み取り部分は流用できるが、現行モデルへ投入するには書き直しが必要。
 *   （本番移行はずっと先の予定。それまで本スクリプトは参照用に凍結。）
 *
 * 一度きりの移行スクリプト: Google Sheets → D1 seed SQL を生成する。
 *
 * 使い方:
 *   1) .env に GOOGLE_SERVICE_ACCOUNT_JSON / GOOGLE_SPREADSHEET_ID を設定（既存のものを流用）
 *   2) node scripts/migrate-from-sheets.mjs
 *   3) 生成された scripts/seed.sql を D1 に適用:
 *        ローカル: wrangler d1 execute choiemu-event-bot-db --local  --file=scripts/seed.sql
 *        本番    : wrangler d1 execute choiemu-event-bot-db --remote --file=scripts/seed.sql
 *
 * D1 へ直接書き込まず SQL ファイルを出力するだけなので安全（内容を確認してから適用できる）。
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const SA_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

if (!SPREADSHEET_ID || !SA_JSON) {
  console.error('❌ GOOGLE_SPREADSHEET_ID と GOOGLE_SERVICE_ACCOUNT_JSON を .env に設定してください');
  process.exit(1);
}

/** 文字列リテラル「外」にある整形用の \n \t \r エスケープ（2文字の \+n 等）を除去 */
function stripStructuralEscapes(s) {
  let out = '';
  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (esc) {
      out += ch;
      esc = false;
      continue;
    }
    if (ch === '\\') {
      if (inStr) {
        out += ch;
        esc = true;
        continue;
      }
      const next = s[i + 1];
      if (next === 'n' || next === 't' || next === 'r') {
        i++; // 整形用エスケープを破棄
        continue;
      }
      out += ch;
      continue;
    }
    if (ch === '"') inStr = !inStr;
    out += ch;
  }
  return out;
}

/** 文字列リテラル「内」の実制御文字を JSON エスケープへ変換 */
function escapeControlInStrings(s) {
  let out = '';
  let inStr = false;
  let esc = false;
  for (const ch of s) {
    if (esc) {
      out += ch;
      esc = false;
      continue;
    }
    if (ch === '\\') {
      out += ch;
      esc = true;
      continue;
    }
    if (ch === '"') {
      inStr = !inStr;
      out += ch;
      continue;
    }
    if (inStr && (ch === '\n' || ch === '\r' || ch === '\t')) {
      out += ch === '\n' ? '\\n' : ch === '\r' ? '\\r' : '\\t';
      continue;
    }
    out += ch;
  }
  return out;
}

/**
 * サービスアカウント JSON をパース。.env の格納形式の差異（整形JSONの改行が \n として
 * エスケープ済み / 実改行で展開済み 等）を吸収する。失敗しても秘密鍵は出力しない。
 */
function parseServiceAccount(raw) {
  for (const fn of [(x) => x, stripStructuralEscapes, escapeControlInStrings]) {
    try {
      return JSON.parse(fn(raw));
    } catch {
      /* 次の戦略へ */
    }
  }
  throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON のパースに失敗しました（.env の形式を確認してください）');
}

const auth = new google.auth.GoogleAuth({
  credentials: parseServiceAccount(SA_JSON),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });

async function read(range) {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range });
  return res.data.values || [];
}

/** SQL 文字列リテラル化（null/空 → NULL も選択可） */
function q(v) {
  return `'${String(v).replace(/'/g, "''")}'`;
}
function qOrNull(v) {
  if (v === undefined || v === null || String(v).trim() === '') return 'NULL';
  return q(v);
}

function fmtDate(v) {
  // 'YYYY/MM/DD' を維持（ゼロ埋め整形）
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

async function main() {
  const lines = [];
  lines.push('-- ChoiemuEventBot 移行データ（Google Sheets → D1）');
  lines.push('-- 生成: scripts/migrate-from-sheets.mjs');
  lines.push('');

  // --- config ---
  const config = await read('Config!A:B');
  lines.push('-- config');
  for (let i = 1; i < config.length; i++) {
    const [key, value] = config[i];
    if (!key) continue;
    lines.push(
      `INSERT INTO config (key, value) VALUES (${q(key)}, ${q(value ?? '')}) ` +
        `ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
    );
  }
  lines.push('');

  // --- members（A:user_name B:user_id C:status D:display_name）---
  const members = await read('Member_DB!A:D');
  lines.push('-- members');
  let memberCount = 0;
  for (let i = 1; i < members.length; i++) {
    const [userName, userId, status, displayName] = members[i];
    if (!userId) continue;
    memberCount++;
    lines.push(
      `INSERT INTO members (user_id, user_name, status, display_name) VALUES (` +
        `${q(String(userId))}, ${qOrNull(userName)}, ${q(status ?? '')}, ${qOrNull(displayName)}) ` +
        `ON CONFLICT(user_id) DO UPDATE SET user_name=excluded.user_name, status=excluded.status, display_name=excluded.display_name;`,
    );
  }
  lines.push('');

  // --- event_log（A:date B:user_id C:user_name D:status E:timestamp）---
  const logs = await read('Event_Log!A:E');
  lines.push('-- event_log');
  let logCount = 0;
  for (let i = 1; i < logs.length; i++) {
    const [date, userId, userName, status, ts] = logs[i];
    if (!date || !userId || !status) continue;
    logCount++;
    const updatedAt = ts && String(ts).trim() ? String(ts) : new Date().toISOString();
    lines.push(
      `INSERT INTO event_log (event_date, user_id, user_name, status, updated_at) VALUES (` +
        `${q(fmtDate(date))}, ${q(String(userId))}, ${qOrNull(userName)}, ${q(status)}, ${q(updatedAt)}) ` +
        `ON CONFLICT(event_date, user_id) DO UPDATE SET status=excluded.status, user_name=excluded.user_name, updated_at=excluded.updated_at;`,
    );
  }

  const out = 'scripts/seed.sql';
  writeFileSync(out, lines.join('\n') + '\n', 'utf8');
  console.log(`✅ 生成しました: ${out}`);
  console.log(`   config: ${config.length - 1} 行 / members: ${memberCount} 名 / event_log: ${logCount} 件`);
  console.log('');
  console.log('次のコマンドで D1 に適用してください:');
  console.log('  wrangler d1 execute choiemu-event-bot-db --local  --file=scripts/seed.sql   # ローカル検証');
  console.log('  wrangler d1 execute choiemu-event-bot-db --remote --file=scripts/seed.sql   # 本番');
}

main().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
