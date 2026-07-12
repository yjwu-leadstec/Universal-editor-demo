import { moveInstrumentation } from './scripts.js';

export function directRows(block) {
  return [...block.children];
}

export function propSource(rows, name) {
  const selector = `[data-aue-prop="${name}"]`;
  return rows.find((row) => row.matches(selector))
    || rows.map((row) => row.querySelector(selector)).find(Boolean)
    || null;
}

export function propText(rows, name) {
  return propSource(rows, name)?.textContent.trim() || '';
}

export function semanticSource(rows, selector, index = 0) {
  return rows.flatMap((row) => [...row.querySelectorAll(selector)])[index] || null;
}

export function semanticText(rows, selector, index = 0) {
  return semanticSource(rows, selector, index)?.textContent.trim() || '';
}

export function semanticSourceAfter(rows, selector, reference) {
  if (!reference) return semanticSource(rows, selector);
  return rows
    .flatMap((row) => [...row.querySelectorAll(selector)])
    .find((node) => reference.compareDocumentPosition(node) === Node.DOCUMENT_POSITION_FOLLOWING)
    || null;
}

export function semanticSourceBefore(rows, selector, reference) {
  if (!reference) return null;
  return rows
    .flatMap((row) => [...row.querySelectorAll(selector)])
    .filter((node) => node.compareDocumentPosition(reference) === Node.DOCUMENT_POSITION_FOLLOWING)
    .at(-1)
    || null;
}

export function pictures(rows) {
  return rows.flatMap((row) => [...row.querySelectorAll('picture')]);
}

export function imageAlt(picture) {
  return picture?.querySelector('img')?.getAttribute('alt') || '';
}

export function propPicture(rows, name) {
  return propSource(rows, name)?.querySelector('picture') || null;
}

export function propAnchor(rows, name) {
  return propSource(rows, name)?.querySelector('a') || null;
}

export function isPropertyRow(row) {
  return row.hasAttribute('data-aue-prop') || Boolean(row.querySelector('[data-aue-prop]'));
}

export function hasModel(row, model) {
  return row.getAttribute('data-aue-model') === model
    || Boolean(row.querySelector(`[data-aue-model="${model}"]`));
}

export function directCells(row) {
  return [...row.children];
}

export function plainCellTexts(row) {
  return directCells(row)
    .filter((cell) => !cell.querySelector('picture, img, a'))
    .map((cell) => cell.textContent.trim());
}

export function instrument(source, target) {
  if (source && target) moveInstrumentation(source, target);
}

export function instrumentProp(rows, name, target) {
  instrument(propSource(rows, name), target);
}

export function createHeading(text, level = 2) {
  const heading = document.createElement(`h${level}`);
  heading.textContent = text;
  return heading;
}

export function createRichText(source, className) {
  const wrapper = document.createElement('div');
  wrapper.className = className;
  const semantic = source
    ? [...source.querySelectorAll('p, ul, ol, blockquote')].map((node) => node.cloneNode(true))
    : [];
  if (semantic.length) wrapper.append(...semantic);
  else if (source?.textContent.trim()) {
    const paragraph = document.createElement('p');
    paragraph.textContent = source.textContent.trim();
    wrapper.append(paragraph);
  }
  return wrapper;
}

export function appendPicture(wrapper, picture, {
  alt = '', loading = 'lazy', className = '', fallbackLabel = 'LI AUTO',
} = {}) {
  if (!picture) {
    wrapper.classList.add('is-media-fallback');
    wrapper.dataset.fallbackLabel = fallbackLabel;
    return null;
  }
  if (className) picture.classList.add(className);
  const img = picture.querySelector('img');
  if (img) {
    img.alt = alt || img.alt || '';
    img.loading = loading;
    img.decoding = 'async';
    img.addEventListener('error', () => {
      picture.remove();
      wrapper.classList.add('is-media-fallback');
      wrapper.dataset.fallbackLabel = fallbackLabel;
    }, { once: true });
  }
  wrapper.append(picture);
  return img;
}

export function addBlockAnchor(block, rows) {
  const id = propText(rows, 'id');
  const anchor = document.createElement('span');
  anchor.className = 'service-aue-anchor';
  anchor.setAttribute('aria-hidden', 'true');
  if (id) block.id = id;
  instrumentProp(rows, 'id', anchor);
  block.append(anchor);
}

export function revealElements(block, selector) {
  const elements = [...block.querySelectorAll(selector)];
  if (!elements.length) return;
  elements.forEach((element) => element.classList.add('service-reveal'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
  elements.forEach((element) => observer.observe(element));
}

export function slug(value, fallback = 'item') {
  const normalized = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return normalized || fallback;
}
