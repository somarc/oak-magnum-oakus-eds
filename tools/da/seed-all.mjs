#!/usr/bin/env node
// Bulk-seed the DA workspace with the converted VitePress pages.
//
// - Skips index.md (bespoke landing) and non-content files.
// - Converts each remaining .md from the VitePress source via md-to-da.mjs.
// - PUTs each page to DA via tools/da/put.mjs.
//
// Reuses the cached IMS token at ~/.aem/da-token.json.

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const VITEPRESS = path.resolve(ROOT, '../oak-magnum-oakus/docs');
const TMP = '/tmp/magnum-oakus-seed';
fs.mkdirSync(TMP, { recursive: true });

// Pages we already authored carefully or that aren't content pages; skip.
const SKIP = new Set([
  'index.md', // bespoke landing surface — defer until landing blocks ship
  'README.md',
]);

// Discover source pages: top-level + each section subdir.
const SECTION_DIRS = ['crisis', 'architecture', 'recovery', 'checkpoints', 'datastore', 'reference'];
function listSources() {
  const out = [];
  for (const f of fs.readdirSync(VITEPRESS)) {
    if (f.endsWith('.md') && !SKIP.has(f)) out.push(f);
  }
  for (const sub of SECTION_DIRS) {
    const dir = path.join(VITEPRESS, sub);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.md')) out.push(`${sub}/${f}`);
    }
  }
  return out;
}

// VitePress route for a source path — DA path mirrors it with .html.
//   foo.md            -> foo.html       (route /foo)
//   guide/index.md    -> guide/index.html (route /guide/)
//   guide/auth.md     -> guide/auth.html  (route /guide/auth)
function daPathFor(src) {
  return src.replace(/\.md$/, '.html');
}

function convert(src) {
  const inPath = path.join(VITEPRESS, src);
  const outPath = path.join(TMP, src.replace(/\//g, '__').replace(/\.md$/, '.html'));
  const r = spawnSync(process.execPath, [
    path.join(__dirname, 'md-to-da.mjs'), inPath, outPath,
  ], { encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(`convert failed for ${src}:\n${r.stderr}`);
    return null;
  }
  return outPath;
}

function put(localPath, daPath) {
  const r = spawnSync(process.execPath, [
    path.join(__dirname, 'put.mjs'), localPath, daPath,
  ], { encoding: 'utf8' });
  process.stdout.write(r.stdout);
  if (r.status !== 0) process.stderr.write(r.stderr);
  return r.status === 0;
}

const sources = listSources();
console.log(`Seeding ${sources.length} pages…\n`);
let ok = 0;
let fail = 0;
for (const src of sources) {
  const local = convert(src);
  if (!local) { fail += 1; continue; }
  const remote = daPathFor(src);
  if (put(local, remote)) ok += 1; else fail += 1;
}
console.log(`\nDone. ${ok} ok, ${fail} failed.`);
