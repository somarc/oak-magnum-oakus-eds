/**
 * Model Card block.
 *
 * Renders a bordered, gradient-tinted card for describing one of Oak Chain's
 * deployment models. Authoring contract: heading, paragraphs, lists.
 *
 * Special handling: a paragraph that leads with "Integration Path:"
 * (typically rendered as `<strong>Integration Path</strong>: <code>…</code>`)
 * is wrapped in a styled `.integration-path` callout. The nested-block form
 * is unreliable because EDS strips inner block classes during the markdown
 * round-trip, so model-card detects the pattern itself.
 */
export default function decorate(block) {
  const inner = block.querySelector(':scope > div > div');
  if (inner) {
    while (inner.firstChild) block.appendChild(inner.firstChild);
    inner.parentElement?.remove();
  }

  block.querySelectorAll(':scope > p').forEach((p) => {
    const lead = p.querySelector(':scope > strong:first-child');
    if (lead && /^integration path/i.test(lead.textContent.trim())) {
      const wrapper = document.createElement('div');
      wrapper.className = 'integration-path';
      p.replaceWith(wrapper);
      wrapper.appendChild(p);
    }
  });
}
