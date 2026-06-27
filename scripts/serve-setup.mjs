// setup.html（配布ガイド・自己完結HTML）をプレビューするための最小静的サーバ。
// すべてのパスで生成物 setup.html を返す（画像は base64 インラインのため他ファイル不要）。
// 配信専用の開発補助で、配布物・本番には一切関与しない。
// 実行: node scripts/serve-setup.mjs （/.claude/launch.json の "setup-preview" から起動）
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'setup.html');
const PORT = 5582;

http
  .createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(readFileSync(file));
  })
  .listen(PORT, () => console.log(`setup.html preview on http://localhost:${PORT}`));
