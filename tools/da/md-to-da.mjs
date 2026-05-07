#!/usr/bin/env node
// Convert a VitePress markdown source page to AEM Edge Delivery DA HTML.
//
// Pre-processes oak-chain-docs-specific syntax before running marked:
//   <FlowGraph flow="X" :height="N" />     → flow-graph block table
//   ```mermaid                              → mermaid block table
//   <div class="X">…markdown…</div>         → EDS block table with inner
//                                            markdown rendered to HTML
//
// Section breaks: each top-level `## ` heading starts a new EDS section.
// Front-matter is stripped.

import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

const KNOWN_BLOCK_CLASSES = new Set([
  'model-card', 'shared-architecture', 'diagram-explanation',
  'layer-section', 'key-insight', 'integration-path',
  'figure',
]);

// --- helpers --------------------------------------------------------------

function stripFrontmatter(md) {
  if (!md.startsWith('---')) return md;
  const end = md.indexOf('\n---', 3);
  if (end === -1) return md;
  return md.slice(end + 4).replace(/^\n+/, '');
}

function flowGraphBlock(flow) {
  return `<div class="flow-graph">\n<div>\n<div>${flow}</div>\n</div>\n</div>`;
}

function mermaidBlock(source) {
  // Mermaid node labels in source MD use <br/> for line breaks. The Helix
  // pipeline double-encodes entities inconsistently between passes, leaving
  // mangled tokens like `&#x3C;br/>` in the rendered code block. Convert
  // <br/> → \n (mermaid's native line break in quoted labels) before any
  // HTML escaping so we never need to round-trip < and > as entities.
  const normalized = source.replace(/<br\s*\/?>/gi, '\n');
  const escaped = normalized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<div class="mermaid">\n<div>\n<div>\n<pre><code>${escaped}</code></pre>\n</div>\n</div>\n</div>`;
}

// Marked aggressively reparses multiline content inside HTML blocks when
// the content contains indented lines or blank-ish breaks — which mermaid
// source frequently has. Stash mermaid blocks (and any other multiline
// custom blocks) as placeholders before marked runs, then substitute the
// real HTML back in. The placeholder is opaque to marked.
function withPlaceholders(content, kind, replacer) {
  const stash = [];
  const re = kind === 'mermaid'
    ? /```mermaid\n([\s\S]*?)\n```/g
    : null;
  if (!re) return { content, stash };
  const replaced = content.replace(re, (_, src) => {
    const html = replacer(src.trim());
    stash.push(html);
    return `\n\nPLACEHOLDER_${kind.toUpperCase()}_${stash.length - 1}\n\n`;
  });
  return { content: replaced, stash };
}

function restorePlaceholders(html, kind, stash) {
  const re = new RegExp(`<p>\\s*PLACEHOLDER_${kind.toUpperCase()}_(\\d+)\\s*</p>|PLACEHOLDER_${kind.toUpperCase()}_(\\d+)`, 'g');
  return html.replace(re, (_, a, b) => {
    const idx = Number(a ?? b);
    return stash[idx] ?? '';
  });
}

function customDivBlock(cls, innerHtml) {
  return `<div class="${cls}">\n<div>\n<div>\n${innerHtml}\n</div>\n</div>\n</div>`;
}

// Replace <FlowGraph flow="X" .../> with our flow-graph block markup.
function replaceFlowGraph(md) {
  return md.replace(/<FlowGraph\s+flow="([\w-]+)"[^/]*\/>/g, (_, flow) => flowGraphBlock(flow));
}

// (Mermaid is now handled via the placeholder roundtrip in convert(); this
// function is retained as a no-op for any remaining imperative callers.)
function replaceMermaid(md) {
  return md;
}

// Replace <div class="X">…markdown…</div> with our block markup.
// Inner markdown is rendered to HTML recursively. Only known classes match.
function replaceCustomDivs(md) {
  const classPattern = [...KNOWN_BLOCK_CLASSES].join('|');
  const re = new RegExp(`<div class="(${classPattern})">\\n([\\s\\S]*?)\\n</div>`, 'g');
  return md.replace(re, (_, cls, inner) => {
    const innerHtml = marked.parse(inner.trim()).trim();
    return customDivBlock(cls, innerHtml);
  });
}

// Drop VitePress-only inline HTML wrappers we don't want to keep.
// Specifically: `<div style="…">…<img …/>…</div>` patterns used for
// the rickrubin figure on thesis.md — let the caller hand-author those
// or convert to a figure block manually.
function dropStyleWrapperDivs(md) {
  return md.replace(/<div style="[^"]*">\s*([\s\S]*?)\s*<\/div>/g, (_, inner) => inner);
}

// Strip inline <style> blocks — Helix normalizes them out anyway, and the
// rules they contain have been ported to either styles.css or block CSS.
function stripStyleBlocks(md) {
  return md.replace(/<style>[\s\S]*?<\/style>\s*/g, '');
}

// `<div class="visual-cta-grid">…</div>` containing N `<a class="visual-cta-card">`
// children → EDS block table with each card as its own row. The card's
// `<strong>` becomes the headline; remaining text becomes the description.
function replaceVisualCtaGrid(md) {
  return md.replace(/<div class="visual-cta-grid">([\s\S]*?)<\/div>/g, (_, inner) => {
    const cardRe = /<a class="visual-cta-card" href="([^"]+)">([\s\S]*?)<\/a>/g;
    const rows = [];
    let m;
    while ((m = cardRe.exec(inner)) !== null) {
      rows.push({ href: m[1], body: m[2].trim() });
    }
    if (!rows.length) return '';
    const cells = rows.map((r) => {
      // Body looks like: `<strong>Title</strong>\n<span>Desc</span>` — preserve.
      return `<div>\n<div>\n<a href="${r.href}">${r.body}</a>\n</div>\n</div>`;
    }).join('\n');
    return `<div class="visual-cta-grid">\n${cells}\n</div>`;
  });
}

// Helix's image-transform pipeline rewrites every `<img>` in authored
// content to attempt server-side optimization, and falls back to
// `src="about:error"` whenever it can't resolve the source via the
// content-bus (which it can't for repo-static and most DA-uploaded
// media). Wrap every <img> in a picture block so Helix sees no <img>
// in source HTML and the block decorator builds the img client-side.
function wrapImagesAsPictures(html) {
  // Pattern A: <a href="X"><img src="Y" alt="Z"></a> — preserve link
  html = html.replace(/<a([^>]*?)href="([^"]+)"([^>]*?)><img([^>]*?)src="([^"]+)"([^>]*?)alt="([^"]*)"([^>]*?)\s*\/?>\s*<\/a>/g,
    (_, a, href, b, c, src, d, alt) => buildPictureBlock(src, alt, href));
  html = html.replace(/<a([^>]*?)href="([^"]+)"([^>]*?)><img([^>]*?)alt="([^"]*)"([^>]*?)src="([^"]+)"([^>]*?)\s*\/?>\s*<\/a>/g,
    (_, a, href, b, c, alt, d, src) => buildPictureBlock(src, alt, href));
  // Pattern B: standalone <img src="X" alt="Y">
  html = html.replace(/<img([^>]*?)src="([^"]+)"([^>]*?)alt="([^"]*)"([^>]*?)\s*\/?>/g,
    (_, a, src, b, alt) => buildPictureBlock(src, alt));
  html = html.replace(/<img([^>]*?)alt="([^"]*)"([^>]*?)src="([^"]+)"([^>]*?)\s*\/?>/g,
    (_, a, alt, b, src) => buildPictureBlock(src, alt));
  return html;
}

function buildPictureBlock(src, alt, href) {
  const altCell = `<div><div>${alt}</div></div>`;
  const hrefCell = href ? `<div><div><a href="${href}">${href}</a></div></div>` : '';
  return `<div class="picture"><div><div>${src}</div></div>${altCell}${hrefCell}</div>`;
}

// Marked's `<table>` output gets normalized by Helix into a div-block where
// the first cell becomes the block class — so each table on the site
// turns into a different one-off block (.class, .property, .tier, …) with
// no styling. Wrap every table in a div block whose first cell literally
// reads "Data Table" so Helix labels them all `data-table`, and rebuild
// the row/cell structure as nested divs. The data-table block decorator
// then renders a styled <table>.
function wrapTablesAsDataTables(html) {
  return html.replace(/<table>([\s\S]*?)<\/table>/g, (_, inner) => {
    // Extract <thead>'s row(s) and <tbody>'s row(s).
    const headRows = [];
    const bodyRows = [];
    const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
    let m;
    const head = inner.match(/<thead[^>]*>([\s\S]*?)<\/thead>/);
    const body = inner.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/);
    if (head) {
      while ((m = trRe.exec(head[1])) !== null) headRows.push(m[1]);
      trRe.lastIndex = 0;
    }
    if (body) {
      while ((m = trRe.exec(body[1])) !== null) bodyRows.push(m[1]);
    } else if (!head) {
      while ((m = trRe.exec(inner)) !== null) bodyRows.push(m[1]);
    }

    const cellsToDivs = (rowHtml) => {
      // Convert <th> and <td> to <div>; preserve inner HTML.
      const out = [];
      const cellRe = /<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/g;
      let cm;
      while ((cm = cellRe.exec(rowHtml)) !== null) {
        out.push(`<div>${cm[1].trim()}</div>`);
      }
      return out.join('');
    };

    const allRowDivs = [
      // Title row that anchors the block class to "data-table".
      '<div><div>Data Table</div></div>',
      ...headRows.map((r) => `<div>${cellsToDivs(r)}</div>`),
      ...bodyRows.map((r) => `<div>${cellsToDivs(r)}</div>`),
    ];

    return `<div class="data-table">${allRowDivs.join('')}</div>`;
  });
}

// `<a class="action-btn">…</a>` (sometimes wrapped in a `<div style="…">`)
// → action-btn block table.
function replaceActionBtn(md) {
  return md.replace(/<a([^>]*?)class="action-btn(?:\s+secondary)?"([^>]*?)>([\s\S]*?)<\/a>/g,
    (full, before, after, text) => {
      const isSecondary = full.includes('secondary');
      const cls = isSecondary ? 'action-btn secondary' : 'action-btn';
      const hrefMatch = full.match(/href="([^"]+)"/);
      const href = hrefMatch ? hrefMatch[1] : '#';
      return `<div class="${cls}">\n<div>\n<div>\n<a href="${href}">${text.trim()}</a>\n</div>\n</div>\n</div>`;
    });
}

// VitePress publishes under base path /oak-magnum-oakus/. Strip the prefix
// from absolute hrefs so the same content works on the EDS site, which
// publishes at the root.
function rewriteVitePressBasePath(md) {
  return md
    .replace(/href="\/oak-magnum-oakus\//g, 'href="/')
    .replace(/src="\/oak-magnum-oakus\//g, 'src="/')
    .replace(/\(\/oak-magnum-oakus\//g, '(/');
}

// VitePress container blocks (::: tip / warning / info / danger / details)
// become block quotes with the kind preserved as a leading bold word.
function replaceVitePressContainers(md) {
  return md.replace(/^:::\s*(tip|warning|info|danger|details)(?:\s+([^\n]+))?\n([\s\S]*?)\n:::\s*$/gm, (_, kind, title, body) => {
    const heading = title ? `**${title}**` : `**${kind.charAt(0).toUpperCase() + kind.slice(1)}**`;
    const quoted = body.split('\n').map((l) => `> ${l}`).join('\n');
    return `> ${heading}\n>\n${quoted}`;
  });
}

// Split processed content into sections at every top-level `## `.
// Section 1 keeps the H1 and any leading paragraphs.
function splitSections(md) {
  const lines = md.split('\n');
  const sections = [[]];
  for (const line of lines) {
    if (/^## /.test(line)) {
      sections.push([line]);
    } else {
      sections[sections.length - 1].push(line);
    }
  }
  return sections.map((s) => s.join('\n').trim()).filter(Boolean);
}

// --- main -----------------------------------------------------------------

function convert(md) {
  let content = stripFrontmatter(md);
  content = stripStyleBlocks(content);
  content = rewriteVitePressBasePath(content);
  content = replaceVitePressContainers(content);
  content = replaceVisualCtaGrid(content);
  content = replaceActionBtn(content);
  content = dropStyleWrapperDivs(content);
  content = replaceFlowGraph(content);
  content = replaceCustomDivs(content);

  // Stash mermaid blocks before marked runs so the multiline source can't
  // be reparsed as nested markdown.
  const { content: contentWithPlaceholders, stash } = withPlaceholders(
    content, 'mermaid', mermaidBlock,
  );
  content = contentWithPlaceholders;

  // Drop horizontal rules that were used as section dividers in source —
  // we already split into sections at H2 headings.
  content = content.replace(/^\s*---\s*$/gm, '');

  const sectionMd = splitSections(content);
  const sectionHtml = sectionMd.map((s) => {
    const rendered = marked.parse(s).trim();
    const restored = restorePlaceholders(rendered, 'mermaid', stash);
    const tabled = wrapTablesAsDataTables(restored);
    const pictured = wrapImagesAsPictures(tabled);
    return `    <div>\n${pictured.replace(/^/gm, '      ')}\n    </div>`;
  });

  return `<body>\n  <header></header>\n  <main>\n${sectionHtml.join('\n')}\n  </main>\n  <footer></footer>\n</body>\n`;
}

const [, , inPath, outPath] = process.argv;
if (!inPath) {
  console.error('Usage: tools/da/md-to-da.mjs <input.md> [output.html]');
  process.exit(1);
}
const md = fs.readFileSync(inPath, 'utf8');
const html = convert(md);
if (outPath) {
  fs.writeFileSync(outPath, html);
  console.log(`wrote ${outPath} (${html.length} bytes)`);
} else {
  process.stdout.write(html);
}
