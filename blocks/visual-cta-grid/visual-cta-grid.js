/**
 * Visual CTA Grid block.
 *
 * Authoring contract: each row is one CTA card with a strong-tagged link
 * (the headline) followed by descriptive text.
 *
 *   <div class="visual-cta-grid">
 *     <div><div>
 *       <a href="…"><strong>Open the full explainer</strong></a>
 *       View the complete interactive page…
 *     </div></div>
 *     <div><div> … another card … </div></div>
 *   </div>
 */
export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  block.textContent = '';
  rows.forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    const card = document.createElement('a');
    card.className = 'visual-cta-card';
    const link = cell.querySelector('a[href]');
    if (link) {
      card.href = link.getAttribute('href');
      const headline = link.querySelector('strong') || link;
      const headlineEl = document.createElement('strong');
      headlineEl.textContent = headline.textContent.trim();
      card.appendChild(headlineEl);
    }
    // Take the remaining text — strip the link's own text from the cell text.
    const cellClone = cell.cloneNode(true);
    cellClone.querySelectorAll('a').forEach((a) => a.remove());
    const desc = cellClone.textContent.trim();
    if (desc) {
      const span = document.createElement('span');
      span.textContent = desc;
      card.appendChild(span);
    }
    block.appendChild(card);
  });
}
