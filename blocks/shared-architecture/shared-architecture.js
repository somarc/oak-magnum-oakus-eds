export default function decorate(block) {
  const inner = block.querySelector(':scope > div > div');
  if (inner) {
    while (inner.firstChild) block.appendChild(inner.firstChild);
    inner.parentElement?.remove();
  }
}
