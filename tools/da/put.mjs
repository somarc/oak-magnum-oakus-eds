#!/usr/bin/env node
// PUT a single file into DA, then trigger Helix preview.
//
// Auto-preview only fires reliably on first-create (HTTP 201). Subsequent
// updates (HTTP 200) leave the preview content-bus stale unless we POST
// to admin.hlx.page/preview explicitly. This script always chains the
// preview trigger so callers don't have to think about it.

import fs from 'fs';
import path from 'path';

const ORG = 'somarc';
const REPO = 'oak-magnum-oakus-eds';
const TOKEN = JSON.parse(fs.readFileSync(`${process.env.HOME}/.aem/da-token.json`, 'utf8')).access_token;

const [, , localPath, daPath] = process.argv;
if (!localPath || !daPath) {
  console.error('Usage: tools/da/put.mjs <local-file> <da-path-with-extension>');
  process.exit(1);
}

const ext = path.extname(daPath).slice(1).toLowerCase();
const mimeByExt = {
  html: 'text/html',
  json: 'application/json',
  svg: 'image/svg+xml',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};
const mime = mimeByExt[ext] || 'application/octet-stream';
const isHtml = ext === 'html';
const fileBuf = fs.readFileSync(localPath);

const sourceUrl = `https://admin.da.live/source/${ORG}/${REPO}/${daPath}`;
const fd = new FormData();
fd.append('data', new Blob([fileBuf], { type: mime }), daPath.split('/').pop());

const putRes = await fetch(sourceUrl, {
  method: 'PUT',
  headers: { Authorization: `Bearer ${TOKEN}` },
  body: fd,
});
console.log(`PUT  ${daPath} -> ${putRes.status}`);
if (!putRes.ok) {
  console.log(await putRes.text());
  process.exit(1);
}

// Helix preview trigger: only meaningful for routable HTML pages.
// Strip the .html extension; use the same web path the page is served at.
if (isHtml) {
  const webPath = daPath.replace(/\.html$/, '').replace(/^index$/, '');
  const previewUrl = `https://admin.hlx.page/preview/${ORG}/${REPO}/main/${webPath}`;
  const prevRes = await fetch(previewUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  console.log(`PREV /${webPath} -> ${prevRes.status}`);
  if (!prevRes.ok) {
    console.log(await prevRes.text());
  }
}
