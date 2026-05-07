#!/usr/bin/env node
// Bulk-promote every previewed page from *.aem.page to *.aem.live.
// Mirrors preview-all.mjs but hits the /live/ endpoint.

import fs from 'fs';

const ORG = 'somarc';
const REPO = 'oak-magnum-oakus-eds';
const TOKEN = JSON.parse(fs.readFileSync(`${process.env.HOME}/.aem/da-token.json`, 'utf8')).access_token;
const auth = { Authorization: `Bearer ${TOKEN}` };
const CONCURRENCY = 4;

async function listAll(folder = '') {
  const r = await fetch(`https://admin.da.live/list/${ORG}/${REPO}${folder}`, { headers: auth });
  if (!r.ok) throw new Error(`list ${folder} -> ${r.status}`);
  const items = await r.json();
  const out = [];
  for (const it of items) {
    const rel = it.path.replace(`/${ORG}/${REPO}`, '');
    if (it.ext === 'html') {
      out.push(rel);
    } else if (!it.ext) {
      // eslint-disable-next-line no-await-in-loop
      out.push(...await listAll(rel));
    }
  }
  return out;
}

async function publishOne(htmlPath) {
  const webPath = htmlPath.replace(/\.html$/, '').replace(/^\/index$/, '/');
  const url = `https://admin.hlx.page/live/${ORG}/${REPO}/main${webPath}`;
  const r = await fetch(url, { method: 'POST', headers: auth });
  return { webPath, status: r.status, body: r.ok ? null : await r.text() };
}

async function pool(items, n, fn) {
  const results = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) {
      const my = i;
      i += 1;
      // eslint-disable-next-line no-await-in-loop
      results[my] = await fn(items[my]);
    }
  }));
  return results;
}

const pages = await listAll('');
console.log(`Promoting ${pages.length} HTML pages to live…\n`);
const results = await pool(pages, CONCURRENCY, publishOne);
let ok = 0;
let fail = 0;
for (const r of results) {
  if (r.status === 200) {
    ok += 1;
    console.log(`OK   ${r.webPath}`);
  } else {
    fail += 1;
    console.log(`FAIL ${r.webPath} -> ${r.status} ${(r.body || '').slice(0, 120)}`);
  }
}
console.log(`\nDone. ${ok} ok, ${fail} failed.`);
