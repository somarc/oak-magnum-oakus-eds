/**
 * Page TOC block.
 *
 * Right-rail "On this page" navigation auto-generated from H2/H3 headings
 * within main content. Builds after first paint so all sections have
 * settled, then sets up scrollspy via IntersectionObserver.
 *
 * Skips itself + the docs-sidebar headings, only picks up content
 * headings.
 */
import { liftAboveFooter } from '../docs-sidebar/docs-sidebar.js';

function build(block) {
  const main = document.querySelector('body > main');
  if (!main) return;

  const headings = [...main.querySelectorAll('h2[id], h3[id]')]
    .filter((h) => !h.closest('.docs-sidebar, .page-toc, .layer-section'));

  block.textContent = '';
  if (!headings.length) return;

  const heading = document.createElement('div');
  heading.className = 'page-toc-heading';
  heading.textContent = 'On this page';
  block.appendChild(heading);

  const list = document.createElement('ul');
  headings.forEach((h) => {
    const li = document.createElement('li');
    li.classList.add(`page-toc-${h.tagName.toLowerCase()}`);
    const a = document.createElement('a');
    a.href = `#${h.id}`;
    a.textContent = h.textContent.trim();
    a.dataset.target = h.id;
    li.appendChild(a);
    list.appendChild(li);
  });
  block.appendChild(list);

  // Scrollspy
  const links = new Map();
  list.querySelectorAll('a').forEach((a) => links.set(a.dataset.target, a));
  if (typeof IntersectionObserver !== 'undefined') {
    const seen = new Set();
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) seen.add(e.target.id);
        else seen.delete(e.target.id);
      });
      // Highlight the topmost visible heading.
      let activeId = null;
      headings.forEach((h) => { if (seen.has(h.id) && !activeId) activeId = h.id; });
      links.forEach((a, id) => a.parentElement.classList.toggle('current', id === activeId));
    }, { rootMargin: '-72px 0px -70% 0px', threshold: 0 });
    headings.forEach((h) => obs.observe(h));
  }
}

export default function decorate(block) {
  // Run after first paint so sibling blocks have decorated.
  const run = () => requestAnimationFrame(() => {
    build(block);
    liftAboveFooter(block);
  });
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run);
}
