/**
 * Mermaid block.
 *
 * Renders a Mermaid diagram from a fenced code block authored inside the
 * block's single cell:
 *
 *   <div class="mermaid">
 *     <div><div>
 *       <pre><code>stateDiagram-v2
 *         [*] --> Follower
 *         …
 *       </code></pre>
 *     </div></div>
 *   </div>
 *
 * Mermaid is loaded lazily from a CDN on first use to avoid the ~600KB cost
 * on pages that don't need it.
 */

const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
const THEME = {
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#627EEA',
    primaryTextColor: '#fff',
    primaryBorderColor: '#8C8DFC',
    lineColor: '#627EEA',
    secondaryColor: '#1a1a2e',
    tertiaryColor: '#16213e',
    background: '#0f0f23',
    mainBkg: '#1a1a2e',
    nodeBorder: '#627EEA',
  },
};

let mermaidPromise;
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import(/* @vite-ignore */ MERMAID_CDN).then((mod) => {
      const m = mod.default || mod;
      m.initialize(THEME);
      return m;
    });
  }
  return mermaidPromise;
}

let counter = 0;

export default async function decorate(block) {
  const code = block.querySelector('pre code, code');
  const source = (code?.textContent || block.textContent || '').trim();
  if (!source) return;

  block.textContent = '';
  const stage = document.createElement('div');
  stage.className = 'mermaid-stage';
  block.appendChild(stage);

  try {
    const mermaid = await loadMermaid();
    counter += 1;
    const id = `mermaid-svg-${counter}`;
    const { svg } = await mermaid.render(id, source);
    stage.innerHTML = svg;
  } catch (err) {
    stage.classList.add('mermaid-error');
    const pre = document.createElement('pre');
    pre.textContent = `Mermaid render failed: ${err.message}\n\n${source}`;
    stage.appendChild(pre);
  }
}
