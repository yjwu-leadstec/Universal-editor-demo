import { moveInstrumentation } from './scripts.js';

// Universal Editor keeps field metadata on author, while published semantic HTML only
// contains positional rows/cells. Keep the runtime independent of author-only data-aue
// attributes by restoring those field/model markers before decoration (mirrors the
// approach in product-block-utils.js).
const LIXIANG_SERVICE_MODEL_FIELDS = {
  'lixiang-official-center-contact-cards': [['title', 'text', 'Title'], ['description', 'richtext', 'Description'], ['link', 'aem-content', 'Overview Link'], ['linkText', 'text', 'Overview Link Text'], ['linkType', 'select', 'Overview Link Type'], ['id', 'text', 'ID']],
  'lixiang-official-center-contact-card': [['cardKey', 'text', 'Card Key'], ['title', 'text', 'Card Title']],
  'lixiang-official-center-contact-field': [['cardKey', 'text', 'Card Key'], ['label', 'text', 'Field Label'], ['value', 'richtext', 'Field Value'], ['link', 'aem-content', 'Field Link (optional)']],
};

const LIXIANG_SERVICE_COLLECTION_MODELS = {
  'lixiang-official-center-contact-cards': (row) => (row.children.length <= 2 ? 'lixiang-official-center-contact-card' : 'lixiang-official-center-contact-field'),
};

function collectionModelFor(model, row) {
  const resolver = LIXIANG_SERVICE_COLLECTION_MODELS[model];
  return typeof resolver === 'function' ? resolver(row) : resolver;
}

// The content tree labels each field from data-aue-label and picks its editor
// from data-aue-type. Writing only data-aue-prop leaves the tree with nothing
// to show, so it falls back to the raw field name.
function markField(source, name, component, label) {
  source.dataset.aueProp = name;
  if (component) source.dataset.aueType = component;
  if (label) source.dataset.aueLabel = label;
}

function restoreLinkField(root, name, fieldSources) {
  let suffix = '';
  if (name.endsWith('LinkText') || name === 'linkText') suffix = 'Text';
  if (name.endsWith('LinkType') || name === 'linkType') suffix = 'Type';
  if (!suffix) return false;
  const linkSource = fieldSources.get(name.slice(0, -suffix.length));
  const source = document.createElement('span');
  source.dataset.aueProp = name;
  if (suffix === 'Text') source.textContent = linkSource?.querySelector('a')?.textContent.trim() || '';
  root.append(source);
  fieldSources.set(name, source);
  return true;
}

function matchesPublishedField(source, component) {
  if (!['reference', 'aem-content'].includes(component)) return true;
  if (source.querySelector('picture, img')) return true;
  const href = source.querySelector('a')?.getAttribute('href') || '';
  if (component === 'aem-content') return Boolean(href) || !source.textContent.trim();
  if (href && !/^#[\da-f]{3,8}$/i.test(href)) return true;
  return !source.textContent.trim();
}

function restorePublishedModel(root, model) {
  const fields = LIXIANG_SERVICE_MODEL_FIELDS[model];
  if (!fields) return;
  const sources = [...root.children];
  const fieldSources = new Map();
  let sourceIndex = 0;

  fields.forEach(([name, component, label]) => {
    if (restoreLinkField(root, name, fieldSources)) return;
    const source = sources[sourceIndex];
    if (!source) return;
    if (LIXIANG_SERVICE_COLLECTION_MODELS[model] && source.children.length > 1) return;
    if (!matchesPublishedField(source, component)) return;
    markField(source, name, component, label);
    fieldSources.set(name, source);
    sourceIndex += 1;
  });

  sources.slice(sourceIndex).forEach((source) => {
    const childModel = collectionModelFor(model, source);
    if (!childModel) return;
    source.dataset.aueModel = childModel;
    restorePublishedModel(source, childModel);
  });
}

// The Universal Editor sometimes instruments only the collection items and
// leaves the block's own fields as bare cells. The guard below used to bail on
// any data-aue-model, so in that case neither path claimed those cells and
// every block-level field read as empty. Claim the leading bare cells using the
// same positional walk restorePublishedModel uses, including its type check --
// delivery omits cells for empty values, so a blind index-to-field mapping
// would slide later fields onto the wrong cells. Stop at the first child the
// editor already marked so instrumented items are never touched.
function restoreBlockFields(block, model) {
  const fields = LIXIANG_SERVICE_MODEL_FIELDS[model];
  if (!fields) return;
  const bare = [];
  [...block.children].every((child) => {
    if (child.dataset.aueProp || child.dataset.aueModel) return false;
    bare.push(child);
    return true;
  });
  if (!bare.length) return;
  const fieldSources = new Map();
  let sourceIndex = 0;
  fields.forEach(([name, component, label]) => {
    if (restoreLinkField(block, name, fieldSources)) return;
    const source = bare[sourceIndex];
    if (!source) return;
    if (!matchesPublishedField(source, component)) return;
    markField(source, name, component, label);
    fieldSources.set(name, source);
    sourceIndex += 1;
  });
}

// Rebuild author-only data-aue markers on published markup so downstream detection
// (hasModel / propSource / isPropertyRow) works identically in author and delivery.
export function initLixiangServiceBlock(block) {
  const model = block.dataset.blockName || block.classList[0];
  if (block.querySelector('[data-aue-prop], [data-aue-model]')) {
    restoreBlockFields(block, model);
    return;
  }
  restorePublishedModel(block, model);
}

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

export function linkedPictures(source) {
  if (!source) return [];
  const anchors = [
    ...(source.matches('a') ? [source] : []),
    ...source.querySelectorAll('a'),
  ];
  return anchors
    .filter((anchor) => /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#]|$)/i.test(anchor.getAttribute('href') || ''))
    .map((anchor) => {
      const picture = document.createElement('picture');
      const image = document.createElement('img');
      image.src = anchor.href;
      image.alt = anchor.textContent.trim();
      picture.append(image);
      return picture;
    });
}

export function imageAlt(picture) {
  return picture?.querySelector('img')?.getAttribute('alt') || '';
}

export function propPicture(rows, name, linkProp = '') {
  const picture = propSource(rows, name)?.querySelector('picture');
  if (picture) return picture;
  return linkProp ? linkedPictures(propSource(rows, linkProp))[0] || null : null;
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
  anchor.className = 'lixiang-service-aue-anchor';
  anchor.setAttribute('aria-hidden', 'true');
  if (id) block.id = id;
  instrumentProp(rows, 'id', anchor);
  block.append(anchor);
}

export function revealElements(block, selector) {
  const elements = [...block.querySelectorAll(selector)];
  if (!elements.length) return;
  elements.forEach((element) => element.classList.add('lixiang-service-reveal'));
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
