#!/usr/bin/env node
// Recursively wipe all DA content under somarc/oak-magnum-oakus-eds.
// Note: DA list returns items with `path` already including the extension for files.

import fs from 'fs';

const TOKEN = JSON.parse(fs.readFileSync(process.env.HOME + '/.aem/da-token.json', 'utf8')).access_token;
const ORG = 'somarc';
const REPO = 'oak-magnum-oakus-eds';
const BASE = 'https://admin.da.live';

const auth = { 'Authorization': `Bearer ${TOKEN}` };

async function list(path) {
  const r = await fetch(`${BASE}/list/${ORG}/${REPO}${path}`, { headers: auth });
  if (!r.ok) throw new Error(`list ${path} -> ${r.status}`);
  return r.json();
}

async function del(path) {
  const r = await fetch(`${BASE}/source/${ORG}/${REPO}${path}`, { method: 'DELETE', headers: auth });
  return r.status;
}

async function wipe(folderPath) {
  const items = await list(folderPath);
  for (const it of items) {
    const rel = it.path.replace(`/${ORG}/${REPO}`, '');
    if (it.ext) {
      const code = await del(rel);
      console.log(`DELETE file   ${rel} -> ${code}`);
    } else {
      await wipe(rel);
      const code = await del(rel);
      console.log(`DELETE folder ${rel} -> ${code}`);
    }
  }
}

await wipe('');
console.log('--- POST-WIPE LIST ---');
console.log(JSON.stringify(await list(''), null, 2));
