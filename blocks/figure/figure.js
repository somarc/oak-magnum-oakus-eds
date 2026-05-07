/**
 * Figure block.
 *
 * Centered image with italic caption. Authoring contract: a single block
 * cell with an image (or picture) and an emphasized caption paragraph.
 *
 *   <div class="figure">
 *     <div>
 *       <div>
 *         <p><picture>…</picture></p>
 *         <p><em>Caption text</em></p>
 *       </div>
 *     </div>
 *   </div>
 *
 * The decorator unwraps the cell, isolates the image and the caption,
 * and rebuilds them as a semantic `<figure>` + `<figcaption>` for
 * accessibility and clean styling.
 */
export default function decorate(block) {
  const inner = block.querySelector(':scope > div > div');
  if (!inner) return;

  const figure = document.createElement('figure');
  const picture = inner.querySelector('picture, img');
  if (picture) {
    const wrap = picture.tagName === 'PICTURE' ? picture : (() => {
      const p = document.createElement('picture');
      p.appendChild(picture);
      return p;
    })();
    figure.appendChild(wrap);
  }

  const captionSrc = inner.querySelector('em, i');
  if (captionSrc) {
    const cap = document.createElement('figcaption');
    cap.innerHTML = captionSrc.innerHTML;
    figure.appendChild(cap);
  }

  block.textContent = '';
  block.appendChild(figure);
}
