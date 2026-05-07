/**
 * Picture block.
 *
 * Renders an <img> client-side from an authored src + optional alt + href +
 * caption, bypassing Helix's image-transform pipeline. Helix's pipeline
 * tries to fetch images from the content-bus and falls back to
 * `src="about:error"` for repo-static paths and DA-uploaded media that
 * aren't dropped via the DA editor.
 *
 * Authoring contract (positional cells):
 *   <div class="picture">
 *     <div><div>/diagrams/oak-chain-write-flow-plate.png</div></div>  src
 *     <div><div>Optional alt text</div></div>                         alt
 *     <div><div><a href="…">…</a></div></div>                         href (optional)
 *     <div><div><em>Optional caption</em></div></div>                 caption (optional)
 *   </div>
 *
 * Empty cells are skipped; positional intent is preserved.
 */
export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const text = (i) => cells[i]?.textContent.trim() || '';
  const linkOf = (i) => cells[i]?.querySelector('a')?.getAttribute('href') || '';
  const captionOf = (i) => cells[i]?.querySelector('em, i')?.innerHTML
    || cells[i]?.innerHTML?.trim()
    || '';

  const src = text(0);
  const alt = text(1);
  const href = linkOf(2);
  const caption = captionOf(3);

  block.textContent = '';
  if (!src) return;

  const figure = document.createElement('figure');

  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.loading = 'lazy';

  if (href) {
    const a = document.createElement('a');
    a.href = href;
    a.appendChild(img);
    figure.appendChild(a);
  } else {
    figure.appendChild(img);
  }

  if (caption) {
    const cap = document.createElement('figcaption');
    cap.innerHTML = caption;
    figure.appendChild(cap);
  }

  block.appendChild(figure);
}
