import { moveInstrumentation } from './scripts.js';

const ABOUT_MODEL_FIELDS = {
  'about-hero': [['title', 'text'], ['subtitle', 'text'], ['image', 'reference'], ['imageAlt', 'text'], ['mobileImage', 'reference'], ['mobileImageAlt', 'text']],
  'about-vehicle-showcase': [['title', 'text'], ['subtitle', 'text'], ['image', 'reference'], ['imageAlt', 'text'], ['mobileImage', 'reference'], ['mobileImageAlt', 'text']],
  'about-vehicle-model': [['name', 'text'], ['description', 'text']],
  'about-video': [['title', 'text'], ['ctaText', 'text'], ['image', 'reference'], ['imageAlt', 'text'], ['video', 'aem-content']],
  'about-dual-panel': [['title', 'text'], ['subtitle', 'text']],
  'about-dual-panel-item': [['image', 'reference'], ['imageAlt', 'text'], ['title', 'text'], ['description', 'richtext'], ['footnote', 'text']],
  'about-design-language': [['title', 'text'], ['subtitle', 'text'], ['largeImage', 'reference'], ['largeImageAlt', 'text']],
  'about-design-card': [['image', 'reference'], ['imageAlt', 'text'], ['title', 'text'], ['description', 'richtext']],
  'about-creativity': [['title', 'text'], ['subtitle', 'text'], ['valuesTitle', 'text'], ['valuesDescription', 'richtext']],
  'about-creativity-card': [['image', 'reference'], ['imageAlt', 'text'], ['title', 'text'], ['description', 'richtext']],
  'about-create-together': [['title', 'text'], ['subtitle', 'text']],
  'about-create-together-card': [['image', 'reference'], ['imageAlt', 'text'], ['title', 'text'], ['description', 'richtext'], ['footnote', 'text']],
};

const ABOUT_COLLECTION_MODELS = {
  'about-vehicle-showcase': 'about-vehicle-model',
  'about-dual-panel': 'about-dual-panel-item',
  'about-design-language': 'about-design-card',
  'about-creativity': 'about-creativity-card',
  'about-create-together': 'about-create-together-card',
};

function matchesPublishedField(source, component) {
  if (!['reference', 'aem-content'].includes(component)) return true;
  if (source.querySelector('picture, img')) return true;
  const href = source.querySelector('a')?.getAttribute('href') || '';
  if (component === 'aem-content') return Boolean(href) || !source.textContent.trim();
  if (href && !/^#[\da-f]{3,8}$/i.test(href)) return true;
  return !source.textContent.trim();
}

function restoreAltField(root, name, fieldSources) {
  if (!name.endsWith('Alt')) return false;
  const mediaSource = fieldSources.get(name.slice(0, -3));
  const source = document.createElement('span');
  source.dataset.aueProp = name;
  source.textContent = mediaSource?.querySelector('img')?.alt || '';
  root.append(source);
  fieldSources.set(name, source);
  return true;
}

function restorePublishedModel(root, model) {
  const fields = ABOUT_MODEL_FIELDS[model];
  if (!fields) return;
  const sources = [...root.children];
  const fieldSources = new Map();
  let sourceIndex = 0;

  fields.forEach(([name, component]) => {
    if (restoreAltField(root, name, fieldSources)) return;
    const source = sources[sourceIndex];
    if (!source) return;
    if (ABOUT_COLLECTION_MODELS[model] && source.children.length > 1) return;
    if (!matchesPublishedField(source, component)) return;
    source.dataset.aueProp = name;
    fieldSources.set(name, source);
    sourceIndex += 1;
  });

  const collectionModel = ABOUT_COLLECTION_MODELS[model];
  sources.slice(sourceIndex).forEach((source) => {
    if (!collectionModel) return;
    source.dataset.aueModel = collectionModel;
    restorePublishedModel(source, collectionModel);
  });
}

function restoreBlockFields(block, model) {
  const fields = ABOUT_MODEL_FIELDS[model];
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
  fields.forEach(([name, component]) => {
    if (restoreAltField(block, name, fieldSources)) return;
    const source = bare[sourceIndex];
    if (!source) return;
    if (!matchesPublishedField(source, component)) return;
    source.dataset.aueProp = name;
    fieldSources.set(name, source);
    sourceIndex += 1;
  });
}

export function initAboutBlock(block) {
  const model = block.dataset.blockName || block.classList[0];
  if (block.querySelector('[data-aue-prop], [data-aue-model]')) {
    restoreBlockFields(block, model);
  } else {
    restorePublishedModel(block, model);
  }
}

export function propSource(root, name) {
  if (root.matches?.(`[data-aue-prop="${name}"]`)) return root;
  const match = root.querySelector?.(`[data-aue-prop="${name}"]`);
  if (!match) return null;
  const owner = match.parentElement?.closest('[data-aue-model]');
  if (owner && owner !== root && root.contains(owner)) return null;
  return match;
}

export function textWithBreaks(source) {
  if (!source) return '';
  const copy = source.cloneNode(true);
  copy.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  return copy.textContent.trim();
}

export function propText(root, name) {
  return textWithBreaks(propSource(root, name));
}

export function propBoolean(root, name, fallback = false) {
  const value = propText(root, name).toLowerCase();
  if (!value) return fallback;
  return ['true', '1', 'yes', 'on'].includes(value);
}

export function propPicture(root, name) {
  const source = propSource(root, name);
  if (!source) return null;
  const picture = source.matches('picture') ? source : source.querySelector('picture');
  return picture || null;
}

export function propUrl(root, name) {
  const source = propSource(root, name);
  const link = source?.matches('a') ? source : source?.querySelector('a');
  return link?.getAttribute('href') || source?.textContent.trim() || '';
}

export function modelItems(root, model) {
  const explicit = [...root.querySelectorAll(`[data-aue-model="${model}"]`)];
  if (explicit.length) return explicit;
  if (root.querySelector('[data-aue-model]')) return [];
  return [...root.children].filter((row) => !row.hasAttribute('data-aue-prop'));
}

export function instrumentProp(root, name, target) {
  const source = propSource(root, name);
  if (source && target) moveInstrumentation(source, target);
}

export function moveItemInstrumentation(source, target) {
  if (source && target) moveInstrumentation(source, target);
}

export function createRichText(source, className = '') {
  const wrapper = document.createElement('div');
  if (className) wrapper.className = className;
  if (!source) return wrapper;
  const selectors = 'p, ul, ol, blockquote';
  const semantic = source.matches?.(selectors)
    ? [source]
    : [...source.querySelectorAll(selectors)];
  if (semantic.length) wrapper.append(...semantic.map((node) => node.cloneNode(true)));
  else if (source.textContent.trim()) {
    const paragraph = document.createElement('p');
    paragraph.textContent = source.textContent.trim();
    wrapper.append(paragraph);
  }
  return wrapper;
}

export function appendPicture(container, picture, { alt = '', loading = 'lazy' } = {}) {
  if (!picture) return;
  const cloned = picture.cloneNode(true);
  const img = cloned.querySelector('img');
  if (img) {
    if (alt) img.setAttribute('alt', alt);
    img.setAttribute('loading', loading);
    img.setAttribute('decoding', 'async');
  }
  container.append(cloned);
}
