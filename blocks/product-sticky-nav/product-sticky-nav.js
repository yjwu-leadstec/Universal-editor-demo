import {
  addBlockAnchor,
  createProductLink,
  initProductBlock,
  instrumentProp,
  modelItems,
  moveItemInstrumentation,
  prefersReducedMotion,
  propText,
} from '../../scripts/product-block-utils.js';

function observeTargets(links) {
  if (!('IntersectionObserver' in window)) return;
  const entries = links.map((link) => {
    const href = link.getAttribute('href') || '';
    return href.startsWith('#') ? [link, document.getElementById(href.slice(1))] : [link, null];
  }).filter(([, target]) => target);
  const observer = new IntersectionObserver((observed) => {
    const visible = observed
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    entries.forEach(([link, target]) => {
      if (target === visible.target) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-25% 0px -60%', threshold: [0, 0.15, 0.5] });
  entries.forEach(([, target]) => observer.observe(target));
}

export default function decorate(block) {
  initProductBlock(block);
  const shell = document.createElement('nav');
  shell.className = 'product-sticky-shell';
  shell.setAttribute('aria-label', 'Li L6 sections');
  const carName = document.createElement('a');
  carName.className = 'product-sticky-name';
  carName.href = '#l6-top';
  carName.textContent = propText(block, 'carName') || 'Li L6';
  instrumentProp(block, 'carName', carName);
  const list = document.createElement('div');
  list.className = 'product-sticky-links';
  const links = [];
  modelItems(block, 'product-sticky-nav-item').forEach((item) => {
    const link = createProductLink(item, '', 'product-nav-link');
    if (!link) return;
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href') || '';
      if (!href.startsWith('#')) return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    });
    moveItemInstrumentation(item, link);
    links.push(link);
    list.append(link);
  });
  shell.append(carName, list);
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  window.requestAnimationFrame(() => observeTargets(links));
}
