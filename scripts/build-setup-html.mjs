#!/usr/bin/env node
// setup.src.html の画像プレースホルダ @@name@@ を、.captures/name.png の
// base64 data URI に置換して setup.html（自己完結・単体配布物）を生成する。
//
// 使い方: node scripts/build-setup-html.mjs
//   - 入力: setup.src.html（手で編集するソース）
//   - 画像: .captures/<name>.png（ローカル中間生成物・非コミット）
//   - 出力: setup.html（base64 を埋め込んだ配布用の単体 HTML）
//
// @@name@@ は <img src="@@name@@"> のように書く。name は .captures/name.png に対応。
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcPath = join(root, "setup.src.html");
const outPath = join(root, "setup.html");
const capDir = join(root, ".captures");

let html = readFileSync(srcPath, "utf8");
// 校正用ビルド時刻マーカー（@@BUILDID@@ を実時刻に置換。画像置換より前に処理）
const buildStamp = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour12: false });
html = html.replace(/@@BUILDID@@/g, buildStamp);
const missing = new Set();
const used = new Set();

html = html.replace(/@@([\w.-]+)@@/g, (_, name) => {
  used.add(name);
  const p = join(capDir, name + ".png");
  if (!existsSync(p)) {
    missing.add(name);
    return `@@${name}@@`; // 残す（後でエラー表示）
  }
  const b64 = readFileSync(p).toString("base64");
  return `data:image/png;base64,${b64}`;
});

if (missing.size) {
  console.error("ERROR: 画像が見つかりません: " + [...missing].join(", "));
  console.error("（.captures/<name>.png を用意してください）");
  process.exit(1);
}

writeFileSync(outPath, html);
const bytes = Buffer.byteLength(html);
console.log(`OK setup.html を生成: ${used.size} 画像を埋め込み, ${(bytes / 1024).toFixed(0)} KB`);
