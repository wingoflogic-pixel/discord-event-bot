// =============================================================
// design-system → ui/index.html CSS 同期
// 「design-system が唯一の真実、ui/index.html はそのミラー」を機械的に保証する。
// tokens.css + components.css + app-ui.css を連結し、ui/index.html の
// <style>…</style> を丸ごと置換する（手書き転記による drift を防ぐ）。
// 実行: node design-system/sync-ui.mjs
// =============================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const stylesDir = join(here, 'styles');
const uiPath = join(here, '..', 'ui', 'index.html');

const FILES = ['tokens.css', 'components.css', 'app-ui.css'];
const css = FILES
  .map((f) => `/* ===== design-system/styles/${f} ===== */\n${readFileSync(join(stylesDir, f), 'utf8').trim()}`)
  .join('\n\n');

// <style> 内の既存字下げ（6スペース）に合わせて整形。空行は字下げしない。
const indent = '      ';
const body = css.split('\n').map((l) => (l ? indent + l : '')).join('\n');
const block = `<style>\n${body}\n    </style>`;

let html = readFileSync(uiPath, 'utf8');
const styleRe = /<style>[\s\S]*?<\/style>/;
if (!styleRe.test(html)) {
  console.error('FAILED: ui/index.html に <style> ブロックが見つかりません');
  process.exit(1);
}
// 置換文字列の $ 特殊解釈を避けるため関数形を使う（CSS に $ は無いが安全側）。
html = html.replace(styleRe, () => block);
writeFileSync(uiPath, html);

console.log(`synced ${FILES.join(' + ')} -> ui/index.html  (<style> ${css.split('\n').length} 行)`);
