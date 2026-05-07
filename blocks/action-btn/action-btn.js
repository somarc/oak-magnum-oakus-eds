/**
 * Action Button block.
 *
 * Wraps a single link as a centered, gradient call-to-action button.
 * Optional `secondary` variant via block-table second cell.
 *
 *   <div class="action-btn">
 *     <div><div><a href="/path">← Back to How It Works</a></div></div>
 *   </div>
 */
export default function decorate(block) {
  const link = block.querySelector('a[href]');
  block.textContent = '';
  if (!link) return;
  link.classList.add('action-btn-link');
  block.appendChild(link);
}
