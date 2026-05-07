/**
 * Integration Path block.
 *
 * Single-cell callout for displaying a code-styled path or flow string,
 * e.g. `Application → Oak Chain SDK → Validators → Ethereum`.
 */
export default function decorate(block) {
  const inner = block.querySelector(':scope > div > div');
  if (inner) {
    while (inner.firstChild) block.appendChild(inner.firstChild);
    inner.parentElement?.remove();
  }
}
