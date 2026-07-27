import { getMetadata } from '../../scripts/aem.js';

const SCROLL_THRESHOLD = 100;
const DESKTOP_MEDIA_QUERY = '(min-width: 720px)';

function createIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 26 26');
  svg.setAttribute('aria-hidden', 'true');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M5.5 16.5 13 9l7.5 7.5');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2.2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.append(path);

  return svg;
}

export default function decorate(block) {
  const button = document.createElement('button');
  const desktop = window.matchMedia(DESKTOP_MEDIA_QUERY);
  const footer = document.querySelector('footer');
  let animationFrame = 0;

  button.className = 'lixiang-back-to-top-button';
  button.type = 'button';
  button.setAttribute('aria-label', getMetadata('back-to-top-label') || 'Back to top');
  button.append(createIcon());

  function update() {
    animationFrame = 0;
    const baseBottom = desktop.matches ? 40 : 28;
    const footerTop = footer?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
    const bottom = Math.max(baseBottom, window.innerHeight - footerTop + baseBottom);
    const visible = window.scrollY >= SCROLL_THRESHOLD;

    button.style.bottom = `${bottom}px`;
    button.classList.toggle('is-visible', visible);
    button.tabIndex = visible ? 0 : -1;
    button.setAttribute('aria-hidden', String(!visible));
  }

  function scheduleUpdate() {
    if (!animationFrame) animationFrame = window.requestAnimationFrame(update);
  }

  button.addEventListener('click', () => window.scrollTo(0, 0));
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);

  if (footer && 'ResizeObserver' in window) {
    const footerObserver = new ResizeObserver(scheduleUpdate);
    footerObserver.observe(footer);
  }

  block.replaceChildren(button);
  update();
}
