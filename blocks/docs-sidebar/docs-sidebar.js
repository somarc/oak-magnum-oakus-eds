/**
 * Docs Sidebar block.
 *
 * Site-wide left-rail navigation for every doc page. Mirrors the
 * VitePress sidebar IA. Auto-injected by scripts.js on every page
 * except the homepage. Highlights the current page with a brand-bar
 * border and brand-soft background.
 */

// Crisis-first IA — sourced verbatim from VitePress config.mts.
// Emergency Response is the primary entry. Architecture is the primer.
// Recovery is the largest section. Datastore + Reference are deeper-dive.
const SECTIONS = [
  {
    title: '🚨 Emergency Response',
    items: [
      { href: '/crisis/', label: 'Crisis Checklist' },
      { href: '/crisis/quick-reference', label: 'Quick Reference' },
      { href: '/crisis/decision-tree', label: 'Decision Tree' },
      { href: '/crisis/identify-repo', label: 'Identify Repo Type' },
    ],
  },
  {
    title: '🏗️ Architecture',
    items: [
      { href: '/architecture/', label: 'Overview' },
      { href: '/architecture/segments', label: 'Segments' },
      { href: '/architecture/tar-files', label: 'TAR Files' },
      { href: '/architecture/journal', label: 'Journal' },
      { href: '/architecture/gc', label: 'Generational GC' },
    ],
  },
  {
    title: '🛠️ Recovery Operations',
    items: [
      { href: '/recovery/', label: 'Recovery Options' },
      { href: '/recovery/snfe-playbook', label: '🚨 SNFE Playbook' },
      { href: '/recovery/check', label: 'oak-run check' },
      { href: '/recovery/journal', label: 'Journal Recovery' },
      { href: '/recovery/surgical', label: 'Surgical Removal' },
      { href: '/recovery/compaction', label: 'Compaction' },
      { href: '/recovery/sidegrade', label: 'Sidegrade' },
      { href: '/recovery/pre-text-extraction', label: 'Pre-Text Extraction' },
    ],
  },
  {
    title: '📋 Checkpoints',
    items: [
      { href: '/checkpoints/', label: 'Understanding Checkpoints' },
      { href: '/checkpoints/disk-bloat', label: 'Disk Bloat' },
      { href: '/checkpoints/async-indexing', label: 'Async Indexing' },
      { href: '/checkpoints/death-loop', label: 'Death Loop' },
      { href: '/checkpoints/checkpoint-advancement', label: 'Checkpoint Advancement' },
    ],
  },
  {
    title: '💾 DataStore',
    items: [
      { href: '/datastore/', label: 'DataStore Tools' },
      { href: '/datastore/consistency', label: 'Consistency Check' },
      { href: '/datastore/gc', label: 'Garbage Collection' },
    ],
  },
  {
    title: '📚 Reference',
    items: [
      { href: '/reference/', label: 'Command Reference' },
      { href: '/reference/count-nodes', label: 'count-nodes' },
      { href: '/reference/console', label: 'Console Commands' },
      { href: '/reference/troubleshooting', label: 'Troubleshooting' },
    ],
  },
];

/**
 * Lift a fixed-positioned rail above the footer when the footer scrolls
 * into view, so the rail never overlaps it. Reusable for any fixed-rail
 * block (docs-sidebar, page-toc).
 */
export function liftAboveFooter(rail) {
  const footer = document.querySelector('body > footer');
  if (!footer || typeof IntersectionObserver === 'undefined') return;
  let raf = 0;
  const update = () => {
    const rect = footer.getBoundingClientRect();
    const overlap = Math.max(0, window.innerHeight - rect.top);
    rail.style.bottom = overlap > 0 ? `${overlap}px` : '0';
  };
  const obs = new IntersectionObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(update);
  }, { threshold: [0, 0.01, 0.5, 1] });
  obs.observe(footer);
  window.addEventListener('scroll', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
}

export default function decorate(block) {
  block.textContent = '';

  const heading = document.createElement('a');
  heading.href = '/';
  heading.className = 'docs-sidebar-heading';
  heading.textContent = 'The Magnum OAKus';
  block.appendChild(heading);

  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';

  SECTIONS.forEach((section) => {
    const group = document.createElement('div');
    group.className = 'docs-sidebar-group';

    const label = document.createElement('div');
    label.className = 'docs-sidebar-label';
    label.textContent = section.title;
    group.appendChild(label);

    const list = document.createElement('ul');
    section.items.forEach((item) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;
      const itemPath = item.href.replace(/\/$/, '') || '/';
      if (itemPath === currentPath) {
        li.classList.add('current');
        a.setAttribute('aria-current', 'page');
      }
      li.appendChild(a);
      list.appendChild(li);
    });
    group.appendChild(list);
    block.appendChild(group);
  });

  // Defer until the footer fragment has loaded. If `load` already fired
  // (the sidebar is decorated lazily, often after window.load), call
  // immediately — otherwise wait.
  const lift = () => liftAboveFooter(block);
  if (document.readyState === 'complete') lift();
  else window.addEventListener('load', lift);
}
