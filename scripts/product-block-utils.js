import { moveInstrumentation } from './scripts.js';
import { MOBILE_MEDIA_QUERY, resolveResponsiveDefault } from './product-media-defaults.mjs';

const PRODUCT_STYLES = '/styles/product-blocks.css';

const PRODUCT_MEDIA_FALLBACKS = {
  '014b26dc-f3d1-493f-9f54-5d9684388b2a.jpg': '349837577446335',
  '0690f2ab-594a-429b-90e4-1f4a0d4fdd27.jpg': '27557296358328',
  '0b147029-c4d2-441d-bcb0-421c3b26b4af.jpg': '340225316549842',
  '1027d193-23d5-4693-a0c0-a4a59aac71e1.jpg': '337085221869804',
  '13d2e858-8d2e-4a97-b7f5-dee27abe68c5.jpg': '370628346735808',
  '2c188aba-f9d9-4f9f-93e5-5510b57382ab.jpg': '414469797261778',
  '31ee0183-7ba2-48fc-b32b-df2fc3be915d.png': '56057713722576',
  '34e2753a-b7d8-40e9-8441-68620603972a.jpg': '174209117982777',
  '42fb7d24-ec13-4cd9-8042-6f306a04df57.jpg': '175363213625470',
  '4db195e7-4d2e-499b-afbd-69f8c944fe80.jpg': '211867994102224',
  '633873c3-6ef7-468d-8dbe-5d71dc0502cf.jpg': '56011149537353',
  '82847046-bac9-444c-a727-53a2f6b3d0a1.jpg': '339334402720466',
  '87b2b562-68a2-4ef8-98ba-2f3d5c66d27d.jpg': '349758519893895',
  '992af39c-4294-4bd0-b73b-80490b37a4b3.jpg': '54655835654723',
  'b3fc1d83-3370-49aa-8e7e-479c4fc2ccc7.jpg': '317718577278355',
  'b9bca2bd-5e52-465b-b851-b12bc338172c.jpg': '337068206887603',
  'becbc0be-eb0c-4206-9b47-8e9688f9bec9.jpg': '176393203283642',
  'c8ce1ca7-85a9-4d45-9337-4b8cd62cacbf.jpg': '174418124685401',
  'ce7e583a-d18f-45e5-8ae5-f292603e83c0.jpg': '560123200242081',
  'd9f9cf93-667b-484c-af0a-4bb64007651e.jpg': '560138576536018',
  'e153a05a-c02c-4af7-b9ef-3cd99f6e4b4f.jpg': '233826047426507',
  'e4860d6c-d146-4734-a521-4f1814471c88.jpg': '254524691664282',
  'fb4adca7-b8dc-42fc-888a-bd7ba4ec462d.jpg': '560149743526734',
  'fcc7662c-a80f-4409-ad74-d203d5e9f0b6.jpg': '643248190614667',
};

// Universal Editor keeps field metadata on author, while published semantic HTML
// only contains positional rows/cells. Keep the runtime independent of author-only
// data-aue attributes by restoring those field/model markers before decoration.
const PRODUCT_MODEL_FIELDS = {
  'product-hero': [['id', 'text'], ['title', 'text'], ['mobileTitle', 'text'], ['subtitle', 'text'], ['image', 'reference'], ['imageAlt', 'text'], ['mobileImage', 'reference'], ['mobileImageAlt', 'text'], ['video', 'reference'], ['mobileVideo', 'reference'], ['logo', 'reference'], ['logoAlt', 'text'], ['showArrow', 'boolean'], ['showVideoControl', 'boolean'], ['showProgress', 'boolean']],
  'product-hero-cta': [['link', 'aem-content'], ['linkText', 'text'], ['linkType', 'select']],
  'product-hero-responsive-media': [['mediumImage', 'reference'], ['tabletImage', 'reference']],
  'product-sticky-nav': [['id', 'text'], ['carName', 'text']],
  'product-sticky-nav-item': [['link', 'aem-content'], ['linkText', 'text']],
  'lixiang-product-intro-slider': [['id', 'text'], ['title', 'textarea'], ['mobileTitle', 'textarea'], ['description', 'richtext'], ['accentColor', 'text'], ['autoPlay', 'boolean'], ['interval', 'number'], ['showProgress', 'boolean'], ['showVideoControl', 'boolean'], ['headingColor', 'select']],
  'highlight-slide': [['image', 'reference'], ['imageAlt', 'text'], ['mobileImage', 'reference'], ['mobileImageAlt', 'text'], ['video', 'aem-content'], ['mobileVideo', 'aem-content'], ['eyebrow', 'text'], ['title', 'textarea'], ['description', 'richtext'], ['note', 'textarea'], ['metrics', 'textarea'], ['link', 'aem-content'], ['linkText', 'text'], ['linkType', 'select'], ['copyColor', 'select'], ['showNote', 'boolean'], ['indicatorLabel', 'textarea']],
  'highlight-stat': [['value', 'text'], ['unit', 'text'], ['label', 'text'], ['description', 'richtext']],
  'chapter-intro': [['id', 'text'], ['eyebrow', 'text'], ['title', 'text'], ['mobileTitle', 'text'], ['description', 'richtext'], ['note', 'text'], ['image', 'reference'], ['imageAlt', 'text'], ['mobileImage', 'reference'], ['mobileImageAlt', 'text'], ['video', 'reference'], ['mobileVideo', 'reference'], ['fullVideo', 'reference'], ['playLabel', 'text'], ['loop', 'boolean'], ['showVideoControl', 'boolean'], ['showProgress', 'boolean']],
  'lixiang-product-intro-carousel': [['id', 'text'], ['eyebrow', 'text'], ['title', 'text'], ['mobileTitle', 'text'], ['description', 'richtext'], ['videoLink', 'aem-content'], ['videoLinkText', 'text'], ['variant', 'select'], ['autoPlay', 'boolean'], ['interval', 'number'], ['showVideoControl', 'boolean'], ['showProgress', 'boolean'], ['enableMotion', 'boolean'], ['showHighlightTags', 'boolean'], ['openLabel', 'text'], ['closeLabel', 'text'], ['accentColor', 'text'], ['highlightTagColor', 'text'], ['highlightUnitColor', 'text']],
  'lixiang-product-intro-slide': [['image', 'reference'], ['imageAlt', 'text'], ['mobileImage', 'reference'], ['mobileImageAlt', 'text'], ['video', 'reference'], ['mobileVideo', 'reference'], ['eyebrow', 'text'], ['title', 'text'], ['description', 'richtext'], ['note', 'text'], ['primaryValue', 'text'], ['primaryUnit', 'text'], ['primaryLabel', 'text'], ['link', 'aem-content'], ['linkText', 'text'], ['linkType', 'select']],
  'lixiang-product-intro-highlight-group': [['groupKey', 'text']],
  'lixiang-product-intro-highlight': [['value', 'text'], ['unit', 'text'], ['tag', 'text'], ['description', 'richtext']],
  'lixiang-product-intro-metric': [['unit', 'text'], ['title', 'text'], ['value', 'text']],
  'image-switcher': [['id', 'text'], ['eyebrow', 'text'], ['title', 'text'], ['mobileTitle', 'text'], ['description', 'richtext'], ['accentColor', 'text'], ['autoPlay', 'boolean'], ['interval', 'number'], ['showVideoControl', 'boolean'], ['showProgress', 'boolean']],
  'image-switcher-item': [['image', 'reference'], ['imageAlt', 'text'], ['mobileImage', 'reference'], ['mobileImageAlt', 'text'], ['video', 'reference'], ['mobileVideo', 'reference'], ['label', 'text'], ['title', 'text'], ['description', 'richtext'], ['value', 'text'], ['unit', 'text'], ['note', 'text']],
  'big-small-gallery': [['id', 'text'], ['eyebrow', 'text'], ['title', 'text'], ['mobileTitle', 'text'], ['description', 'richtext'], ['videoLink', 'aem-content'], ['videoLinkText', 'text'], ['showVideoControl', 'boolean'], ['showProgress', 'boolean'], ['enableMotion', 'boolean']],
  'big-small-stat': [['eyebrow', 'text'], ['value', 'text'], ['unit', 'text'], ['description', 'richtext']],
  'big-small-item': [['image', 'reference'], ['imageAlt', 'text'], ['mobileImage', 'reference'], ['mobileImageAlt', 'text'], ['video', 'reference'], ['mobileVideo', 'reference'], ['title', 'text'], ['description', 'richtext'], ['link', 'aem-content'], ['linkText', 'text'], ['linkType', 'select']],
  'color-switcher': [['id', 'text'], ['title', 'text'], ['mobileTitle', 'text'], ['description', 'richtext']],
  'color-switcher-item': [['name', 'text'], ['swatch', 'reference'], ['swatchAlt', 'text'], ['colorValue', 'text'], ['image', 'reference'], ['imageAlt', 'text'], ['mobileImage', 'reference'], ['mobileImageAlt', 'text']],
  'spec-table': [['id', 'text'], ['title', 'text'], ['mobileTitle', 'text'], ['description', 'richtext'], ['variant', 'select']],
  'spec-group': [['groupKey', 'text'], ['title', 'text'], ['description', 'richtext'], ['image', 'reference'], ['imageAlt', 'text'], ['mobileImage', 'reference'], ['mobileImageAlt', 'text'], ['note', 'text']],
  'spec-row': [['label', 'text'], ['value', 'text'], ['description', 'richtext'], ['icon', 'reference'], ['iconAlt', 'text']],
  'product-notes': [['id', 'text'], ['title', 'text']],
  'product-note-item': [['text', 'richtext']],
  'text-columns': [['id', 'text'], ['title', 'text'], ['mobileTitle', 'text'], ['description', 'richtext']],
  'text-column-item': [['title', 'text'], ['text', 'richtext']],
  'lixiang-product-detail-picture-group': [['id', 'text'], ['title', 'textarea'], ['description', 'richtext'], ['showVideoControl', 'boolean'], ['showProgress', 'boolean'], ['enableMotion', 'boolean']],
  'lixiang-product-detail-picture-group-item': [['groupKey', 'text'], ['title', 'text'], ['description', 'richtext']],
  'lixiang-product-detail-picture-item': [['image', 'reference'], ['imageAlt', 'text'], ['mobileImage', 'reference'], ['mobileImageAlt', 'text'], ['video', 'aem-content'], ['mobileVideo', 'aem-content'], ['title', 'text'], ['description', 'richtext']],
  'icon-overlay-showcase': [['id', 'text'], ['title', 'text'], ['mobileTitle', 'text'], ['description', 'richtext']],
  'overlay-panel': [['panelKey', 'text'], ['title', 'text'], ['description', 'richtext'], ['image', 'reference'], ['imageAlt', 'text'], ['mobileImage', 'reference'], ['mobileImageAlt', 'text'], ['mask', 'reference'], ['mobileMask', 'reference'], ['maskAlt', 'text']],
  'overlay-hotspot': [['label', 'text'], ['description', 'richtext'], ['icon', 'reference'], ['iconAlt', 'text'], ['x', 'number'], ['y', 'number'], ['mobileX', 'number'], ['mobileY', 'number']],
  'feature-grid': [['id', 'text'], ['eyebrow', 'text'], ['title', 'text'], ['mobileTitle', 'text'], ['description', 'richtext'], ['note', 'text']],
  'feature-grid-group': [['groupKey', 'text'], ['title', 'text']],
  'feature-grid-item': [['image', 'reference'], ['imageAlt', 'text'], ['mobileImage', 'reference'], ['mobileImageAlt', 'text'], ['video', 'reference'], ['title', 'text'], ['description', 'richtext'], ['link', 'aem-content'], ['linkText', 'text'], ['linkType', 'select']],
  'product-param-cta': [['id', 'text'], ['title', 'text'], ['mobileTitle', 'text'], ['description', 'richtext'], ['image', 'reference'], ['imageAlt', 'text'], ['mobileImage', 'reference'], ['mobileImageAlt', 'text'], ['link', 'aem-content'], ['linkText', 'text'], ['linkType', 'select'], ['secondaryLink', 'aem-content'], ['secondaryLinkText', 'text'], ['secondaryLinkType', 'select']],
  'product-ending': [['id', 'text'], ['title', 'text'], ['image', 'reference'], ['imageAlt', 'text'], ['mobileImage', 'reference'], ['mobileImageAlt', 'text'], ['video', 'reference'], ['showVideoControl', 'boolean'], ['link', 'aem-content'], ['linkText', 'text'], ['linkType', 'select'], ['secondaryLink', 'aem-content'], ['secondaryLinkText', 'text'], ['secondaryLinkType', 'select']],
  'product-guide': [['id', 'text'], ['title', 'text']],
  'product-guide-item': [['image', 'reference'], ['imageAlt', 'text'], ['mobileImage', 'reference'], ['mobileImageAlt', 'text'], ['title', 'text'], ['description', 'richtext'], ['link', 'aem-content'], ['linkText', 'text'], ['linkType', 'select']],
  'product-download': [['id', 'text'], ['title', 'text'], ['description', 'richtext'], ['image', 'reference'], ['imageAlt', 'text'], ['mobileImage', 'reference'], ['mobileImageAlt', 'text'], ['iosLink', 'aem-content'], ['iosLinkText', 'text'], ['iosLinkType', 'select'], ['androidLink', 'aem-content'], ['androidLinkText', 'text'], ['androidLinkType', 'select']],
};

const PRODUCT_COLLECTION_MODELS = {
  'product-hero': (row) => (row.querySelector('picture, img')
    ? 'product-hero-responsive-media'
    : 'product-hero-cta'),
  'product-sticky-nav': 'product-sticky-nav-item',
  'lixiang-product-intro-slider': 'highlight-slide',
  'highlight-slide': 'highlight-stat',
  'lixiang-product-intro-carousel': (row) => {
    const hasNestedItems = [...row.children].some((child) => child.children.length > 1);
    if (hasNestedItems) return 'lixiang-product-intro-highlight-group';
    if (row.querySelector('picture, img, video') || row.children.length > 8) {
      return 'lixiang-product-intro-slide';
    }
    return 'lixiang-product-intro-metric';
  },
  'lixiang-product-intro-highlight-group': 'lixiang-product-intro-highlight',
  'image-switcher': 'image-switcher-item',
  'big-small-gallery': (row) => (row.children.length <= 4 ? 'big-small-stat' : 'big-small-item'),
  'color-switcher': 'color-switcher-item',
  'spec-table': 'spec-group',
  'spec-group': 'spec-row',
  'product-notes': 'product-note-item',
  'text-columns': 'text-column-item',
  'lixiang-product-detail-picture-group': (row) => (
    row.querySelector('picture, img, video') || row.children.length > 3
      ? 'lixiang-product-detail-picture-item'
      : 'lixiang-product-detail-picture-group-item'
  ),
  'lixiang-product-detail-picture-group-item': 'lixiang-product-detail-picture-item',
  'icon-overlay-showcase': 'overlay-panel',
  'overlay-panel': 'overlay-hotspot',
  'feature-grid': (row) => (row.children.length <= 2 ? 'feature-grid-group' : 'feature-grid-item'),
  'feature-grid-group': 'feature-grid-item',
  'product-guide': 'product-guide-item',
};

function collectionModelFor(model, row) {
  const resolver = PRODUCT_COLLECTION_MODELS[model];
  return typeof resolver === 'function' ? resolver(row) : resolver;
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
  const fields = PRODUCT_MODEL_FIELDS[model];
  if (!fields) return;
  const sources = [...root.children];
  const fieldSources = new Map();
  let sourceIndex = 0;

  fields.forEach(([name, component]) => {
    const restoredCompanion = restoreAltField(root, name, fieldSources)
      || restoreLinkField(root, name, fieldSources);
    if (restoredCompanion) return;
    const source = sources[sourceIndex];
    if (!source) return;
    if (PRODUCT_COLLECTION_MODELS[model] && source.children.length > 1) return;
    if (!matchesPublishedField(source, component)) return;
    source.dataset.aueProp = name;
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

function restorePublishedMarkup(block) {
  if (block.querySelector('[data-aue-prop], [data-aue-model]')) return;
  const model = block.dataset.blockName || block.classList[0];
  restorePublishedModel(block, model);
}

export function initProductBlock(block) {
  restorePublishedMarkup(block);
  block.dataset.productBlock = block.classList[0] || 'product';
  if (!document.querySelector(`link[href="${PRODUCT_STYLES}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = PRODUCT_STYLES;
    document.head.append(link);
  }
}

export function directRows(root) {
  return [...root.children];
}

export function propSource(root, name) {
  if (root.matches?.(`[data-aue-prop="${name}"]`)) return root;
  return root.querySelector?.(`[data-aue-prop="${name}"]`) || null;
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

export function propNumber(root, name, fallback = 0) {
  const value = Number.parseFloat(propText(root, name));
  return Number.isFinite(value) ? value : fallback;
}

export function propLink(root, name) {
  const source = propSource(root, name);
  return source?.matches('a') ? source : source?.querySelector('a') || null;
}

export function propUrl(root, name) {
  const source = propSource(root, name);
  return propLink(root, name)?.getAttribute('href') || source?.textContent.trim() || '';
}

export function propPicture(root, name) {
  const source = propSource(root, name);
  if (!source) return null;
  const picture = source.matches('picture') ? source : source.querySelector('picture');
  if (picture) return picture;

  const url = propLink(root, name)?.getAttribute('href') || source.textContent.trim();
  if (!url) return null;
  const generatedPicture = document.createElement('picture');
  const image = document.createElement('img');
  image.src = url;
  generatedPicture.append(image);
  return generatedPicture;
}

export function modelItems(root, model) {
  const explicit = [...root.querySelectorAll(`[data-aue-model="${model}"]`)];
  if (explicit.length) return explicit;
  if (root.querySelector('[data-aue-model]')) return [];
  return directRows(root).filter((row) => !row.hasAttribute('data-aue-prop'));
}

export function moveItemInstrumentation(source, target) {
  if (source && target) moveInstrumentation(source, target);
}

export function instrumentProp(root, name, target) {
  const source = propSource(root, name);
  if (source && target) moveInstrumentation(source, target);
}

export function createHeading(text, level = 2, className = '') {
  const heading = document.createElement(`h${level}`);
  if (className) heading.className = className;
  heading.textContent = text;
  return heading;
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

export function createSectionHeader(root, {
  headingLevel = 2,
  className = 'product-section-header',
} = {}) {
  const header = document.createElement('header');
  header.className = className;
  const eyebrow = propText(root, 'eyebrow');
  const title = propText(root, 'title');
  const mobileTitle = propText(root, 'mobileTitle');
  const descriptionSource = propSource(root, 'description');

  if (eyebrow) {
    const element = document.createElement('p');
    element.className = 'product-eyebrow';
    element.textContent = eyebrow;
    instrumentProp(root, 'eyebrow', element);
    header.append(element);
  }
  if (title) {
    const element = createHeading(title, headingLevel, 'product-title product-title-desktop');
    instrumentProp(root, 'title', element);
    header.append(element);
  }
  if (mobileTitle) {
    const element = createHeading(mobileTitle, headingLevel, 'product-title product-title-mobile');
    instrumentProp(root, 'mobileTitle', element);
    header.append(element);
  }
  if (descriptionSource?.textContent.trim()) {
    const element = createRichText(descriptionSource, 'product-description');
    instrumentProp(root, 'description', element);
    header.append(element);
  }
  return header;
}

export function addBlockAnchor(block, root = block, parent = block) {
  const id = propText(root, 'id');
  if (id) block.id = id;
  const anchor = document.createElement('span');
  anchor.className = 'product-aue-anchor';
  anchor.setAttribute('aria-hidden', 'true');
  instrumentProp(root, 'id', anchor);
  parent.append(anchor);

  root.querySelectorAll('[data-aue-prop], [data-aue-model]').forEach((source) => {
    const marker = document.createElement('span');
    marker.className = 'product-aue-anchor';
    marker.setAttribute('aria-hidden', 'true');
    moveInstrumentation(source, marker);
    parent.append(marker);
  });
}

function fallbackLinkText(root, model, href, prefix = '') {
  if (model === 'product-hero-cta') {
    return href.includes('/test-drive') ? 'Schedule Test Drive' : 'Learn More';
  }
  if (model === 'product-sticky-nav-item' && href.startsWith('#')) {
    return href.slice(1).split('-').map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(' ');
  }
  if (model === 'product-ending') {
    return prefix ? 'Back to Top' : 'Schedule Test Drive';
  }
  if (model === 'product-guide-item') {
    const title = propText(root, 'title');
    if (href.includes('/test-drive')) return 'Start Configuration';
    if (title.includes('Support')) return 'Find Support';
    if (href.includes('/official-center')) return 'Official Center';
  }
  if (href.startsWith('#')) {
    return href.slice(1).split('-').map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(' ');
  }
  if (href.includes('/test-drive')) return 'Schedule Test Drive';
  return propText(root, 'title');
}

export function createProductLink(root, prefix = '', className = 'product-link') {
  const field = prefix ? `${prefix}Link` : 'link';
  const textField = prefix ? `${prefix}LinkText` : 'linkText';
  const typeField = prefix ? `${prefix}LinkType` : 'linkType';
  const source = propLink(root, field);
  const href = source?.getAttribute('href') || propUrl(root, field);
  const model = root.dataset.aueModel || root.dataset.blockName || root.classList[0];
  const authoredText = propText(root, textField) || source?.textContent.trim() || '';
  const text = authoredText && authoredText !== href
    ? authoredText
    : fallbackLinkText(root, model, href, prefix);
  if (!href || !text) return null;
  const defaultTypes = {
    'product-hero-cta': root.previousElementSibling?.dataset.aueModel === model ? 'secondary' : 'primary',
    'lixiang-product-intro-slide': 'text',
    'feature-grid-item': 'text',
    'product-guide-item': 'primary',
    'product-ending': prefix ? 'secondary' : 'primary',
    'product-param-cta': prefix ? 'text' : 'primary',
    'product-download': prefix === 'android' ? 'secondary' : 'primary',
  };
  const link = document.createElement('a');
  link.className = `${className} ${className}-${propText(root, typeField) || defaultTypes[model] || 'text'}`;
  link.href = href;
  link.textContent = text;
  instrumentProp(root, field, link);
  return link;
}

export function appendPicture(container, picture, {
  alt = '',
  loading = 'lazy',
  fallbackLabel = 'LI AUTO',
} = {}) {
  if (!picture) {
    container.classList.add('is-media-fallback');
    container.dataset.fallbackLabel = fallbackLabel;
    return null;
  }
  const image = picture.querySelector('img');
  if (image) {
    image.alt = alt || image.alt || '';
    image.loading = loading;
    image.decoding = 'async';
    const removeBrokenPicture = () => {
      picture.remove();
      container.classList.add('is-media-fallback');
      container.dataset.fallbackLabel = fallbackLabel;
    };
    const recoverImage = () => {
      const filename = (image.currentSrc || image.src).split('/').pop()?.split('?')[0];
      const fallbackPath = PRODUCT_MEDIA_FALLBACKS[filename];
      const fallbackUrl = fallbackPath
        ? `https://lilibrary-public.liauto.com/lilibrary/${fallbackPath}/${filename}`
        : '';
      if (!fallbackUrl || image.src === fallbackUrl) {
        removeBrokenPicture();
        return;
      }
      image.removeEventListener('error', recoverImage);
      picture.querySelectorAll('source').forEach((source) => source.remove());
      image.addEventListener('error', removeBrokenPicture, { once: true });
      image.src = fallbackUrl;
    };
    image.addEventListener('error', recoverImage, { once: true });
    container.append(picture);
    if (image.complete && !image.naturalWidth) recoverImage();
    window.setTimeout(() => {
      if (image.isConnected && image.complete && !image.naturalWidth) recoverImage();
    }, 1000);
    return image;
  }
  container.append(picture);
  return image;
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function safePlay(video) {
  const result = video.play();
  if (result?.catch) result.catch(() => {});
}

function setupVideoPlayback(media, video, button, autoplay, {
  hasActiveSource = () => true,
  sourceMedia = null,
} = {}) {
  let progressFrame = null;
  let isIntersecting = !('IntersectionObserver' in window);
  const tracksProgress = button?.classList.contains('has-progress');
  const canAutoplay = autoplay && !prefersReducedMotion();
  const stopProgress = () => {
    if (progressFrame === null) return;
    window.cancelAnimationFrame(progressFrame);
    progressFrame = null;
  };
  const updateProgress = () => {
    if (!tracksProgress || !Number.isFinite(video.duration) || video.duration <= 0) return;
    const progress = Math.min(1, Math.max(0, video.currentTime / video.duration));
    button.style.setProperty('--video-progress', `${progress * 360}deg`);
  };
  const animateProgress = () => {
    updateProgress();
    if (!video.paused && !video.ended) {
      progressFrame = window.requestAnimationFrame(animateProgress);
    } else {
      progressFrame = null;
    }
  };
  const updateControl = () => {
    if (!button) return;
    const playing = !video.paused && !video.ended;
    button.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
    button.classList.toggle('is-playing', playing);
    stopProgress();
    if (playing && tracksProgress) animateProgress();
    else updateProgress();
  };
  const activeSourceAvailable = () => (
    hasActiveSource() && !media.classList.contains('is-video-error')
  );
  const syncAvailability = () => {
    const available = hasActiveSource();
    media.classList.toggle('has-active-video', available);
    if (button) button.hidden = !available;
    if (!available) {
      video.pause();
      media.classList.remove('is-video-ready');
    }
    return available;
  };
  const tryAutoplay = () => {
    if (!canAutoplay || !isIntersecting || !activeSourceAvailable()) return;
    if (!video.dataset.userPaused) safePlay(video);
  };

  video.addEventListener('play', updateControl);
  video.addEventListener('pause', updateControl);
  video.addEventListener('ended', updateControl);
  video.addEventListener('loadedmetadata', updateProgress);
  video.addEventListener('durationchange', updateProgress);
  video.addEventListener('seeked', updateProgress);
  video.addEventListener('timeupdate', updateProgress);
  video.addEventListener('loadeddata', () => {
    media.classList.remove('is-video-error');
    media.classList.add('is-video-ready');
    syncAvailability();
    tryAutoplay();
  });
  video.addEventListener('error', () => {
    media.classList.remove('is-video-ready', 'has-active-video');
    media.classList.add('is-video-error');
    if (button) button.hidden = true;
    video.pause();
    updateControl();
  });
  button?.addEventListener('click', () => {
    if (!activeSourceAvailable()) return;
    if (video.paused) {
      delete video.dataset.userPaused;
      safePlay(video);
    } else {
      video.dataset.userPaused = 'true';
      video.pause();
    }
  });
  updateControl();
  syncAvailability();

  sourceMedia?.addEventListener('change', () => {
    video.pause();
    media.classList.remove('is-video-ready', 'is-video-error');
    video.load();
    syncAvailability();
    tryAutoplay();
  });

  if (!canAutoplay) return;
  if (!('IntersectionObserver' in window)) {
    tryAutoplay();
    return;
  }
  const observer = new IntersectionObserver(([entry]) => {
    isIntersecting = entry.isIntersecting;
    if (isIntersecting) tryAutoplay();
    else video.pause();
  }, { threshold: 0.25 });
  observer.observe(media);
}

function appendResponsiveSources(targetPicture, sourcePicture, mediaRange) {
  if (!targetPicture || !sourcePicture) return;
  const sources = [...sourcePicture.querySelectorAll('source')].map((source) => {
    const clone = source.cloneNode(true);
    const authoredMedia = source.getAttribute('media');
    clone.setAttribute('media', authoredMedia ? `${mediaRange} and ${authoredMedia}` : mediaRange);
    return clone;
  });
  if (!sources.length) {
    const sourceImage = sourcePicture.querySelector('img');
    const srcset = sourceImage?.getAttribute('src');
    if (srcset) {
      const source = document.createElement('source');
      source.media = mediaRange;
      source.srcset = srcset;
      sources.push(source);
    }
  }
  targetPicture.prepend(...sources);
}

function preserveResponsiveFieldInstrumentation(root, field, media) {
  if (!propSource(root, field)) return;
  const marker = document.createElement('span');
  marker.className = 'product-aue-anchor';
  marker.setAttribute('aria-hidden', 'true');
  instrumentProp(root, field, marker);
  media.append(marker);
}

export function createMedia(root, {
  eager = false,
  autoplay = true,
  loop = true,
  showControls = true,
  showProgress = true,
  fallbackLabel = 'LI AUTO',
} = {}) {
  const media = document.createElement('div');
  media.className = 'product-media';
  const image = propPicture(root, 'image') || root.querySelector('picture');
  const mediumImage = propPicture(root, 'mediumImage');
  const tabletImage = propPicture(root, 'tabletImage');
  const mobileImage = propPicture(root, 'mobileImage');
  const hasResponsivePictures = Boolean(mediumImage || tabletImage);
  const desktopSlot = document.createElement('div');
  desktopSlot.className = `product-picture ${hasResponsivePictures ? 'product-picture-responsive' : 'product-picture-desktop'}`;
  if (hasResponsivePictures && image) {
    appendResponsiveSources(image, mediumImage || image, '(min-width: 821px) and (max-width: 1024px)');
    appendResponsiveSources(image, tabletImage || mediumImage || image, '(min-width: 721px) and (max-width: 820px)');
    appendResponsiveSources(
      image,
      mobileImage || tabletImage || mediumImage || image,
      MOBILE_MEDIA_QUERY,
    );
  }
  const desktopImg = appendPicture(desktopSlot, image, {
    alt: propText(root, 'imageAlt'),
    loading: eager ? 'eager' : 'lazy',
    fallbackLabel,
  });
  instrumentProp(root, 'image', desktopSlot);
  media.append(desktopSlot);

  if (hasResponsivePictures) {
    media.classList.add('has-responsive-picture');
    preserveResponsiveFieldInstrumentation(root, 'mediumImage', media);
    preserveResponsiveFieldInstrumentation(root, 'tabletImage', media);
    preserveResponsiveFieldInstrumentation(root, 'mobileImage', media);
  } else if (mobileImage) {
    const mobileSlot = document.createElement('div');
    mobileSlot.className = 'product-picture product-picture-mobile';
    appendPicture(mobileSlot, mobileImage, {
      alt: resolveResponsiveDefault(
        desktopImg?.alt || '',
        propText(root, 'mobileImageAlt'),
        true,
      ),
      loading: eager ? 'eager' : 'lazy',
      fallbackLabel,
    });
    instrumentProp(root, 'mobileImage', mobileSlot);
    media.classList.add('has-mobile-picture');
    media.append(mobileSlot);
  }

  const videoUrl = propUrl(root, 'video');
  const mobileVideoUrl = propUrl(root, 'mobileVideo');
  const mobileMedia = window.matchMedia(MOBILE_MEDIA_QUERY);
  let video = null;
  if (videoUrl || mobileVideoUrl) {
    video = document.createElement('video');
    video.className = 'product-video';
    video.muted = true;
    video.playsInline = true;
    video.loop = loop;
    video.preload = 'metadata';
    if (desktopImg?.currentSrc || desktopImg?.src) {
      video.poster = desktopImg.currentSrc || desktopImg.src;
    }
    if (mobileVideoUrl) {
      const source = document.createElement('source');
      source.media = MOBILE_MEDIA_QUERY;
      source.src = mobileVideoUrl;
      video.append(source);
    }
    if (videoUrl) {
      const source = document.createElement('source');
      source.src = videoUrl;
      video.append(source);
    }
    instrumentProp(root, 'video', video);
    media.append(video);

    let button = null;
    if (showControls) {
      button = document.createElement('button');
      button.className = `product-video-control${showProgress ? ' has-progress' : ''}`;
      button.type = 'button';
      const icon = document.createElement('span');
      icon.className = 'product-video-icon';
      icon.setAttribute('aria-hidden', 'true');
      button.append(icon);
      media.append(button);
    }
    setupVideoPlayback(media, video, button, autoplay, {
      hasActiveSource: () => Boolean(resolveResponsiveDefault(
        videoUrl,
        mobileVideoUrl,
        mobileMedia.matches,
      )),
      sourceMedia: mobileVideoUrl ? mobileMedia : null,
    });
  }
  return { element: media, video };
}

export function revealElements(block, selector, enabled = true) {
  const elements = [...block.querySelectorAll(selector)];
  elements.forEach((element) => element.classList.add('product-reveal'));
  if (!enabled || prefersReducedMotion() || !('IntersectionObserver' in window)) {
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

export function setupTabs(block, tabs, panels, {
  autoPlay = false,
  interval = 4000,
  onChange = () => {},
} = {}) {
  if (!tabs.length || tabs.length !== panels.length) return () => {};
  let active = 0;
  let timer = null;
  const activate = (index, focus = false) => {
    active = (index + tabs.length) % tabs.length;
    tabs.forEach((tab, itemIndex) => {
      const selected = itemIndex === active;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[itemIndex].hidden = !selected;
    });
    if (focus) tabs[active].focus();
    onChange(active);
  };
  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };
  const start = () => {
    stop();
    if (!autoPlay || tabs.length < 2 || prefersReducedMotion()) return;
    timer = window.setInterval(() => activate(active + 1), Math.max(2000, interval));
  };
  tabs.forEach((tab, index) => {
    const panel = panels[index];
    const tabId = `${block.id || block.dataset.productBlock || 'product'}-tab-${index + 1}`;
    const panelId = `${block.id || block.dataset.productBlock || 'product'}-panel-${index + 1}`;
    tab.id = tabId;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panelId);
    panel.id = panelId;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabId);
    tab.addEventListener('click', () => {
      activate(index);
      start();
    });
    tab.addEventListener('keydown', (event) => {
      const keys = {
        ArrowRight: index + 1,
        ArrowDown: index + 1,
        ArrowLeft: index - 1,
        ArrowUp: index - 1,
        Home: 0,
        End: tabs.length - 1,
      };
      if (!(event.key in keys)) return;
      event.preventDefault();
      activate(keys[event.key], true);
      start();
    });
  });
  block.addEventListener('mouseenter', stop);
  block.addEventListener('mouseleave', start);
  block.addEventListener('focusin', stop);
  block.addEventListener('focusout', start);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
  activate(0);
  start();
  return activate;
}

export function openVideoDialog(url, trigger, title = 'Product video') {
  if (!url) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'product-video-dialog';
  dialog.setAttribute('aria-label', title);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'product-dialog-close';
  close.setAttribute('aria-label', 'Close video');
  close.textContent = '×';
  const video = document.createElement('video');
  video.src = url;
  video.controls = true;
  video.autoplay = !prefersReducedMotion();
  video.playsInline = true;
  dialog.append(close, video);
  document.body.append(dialog);
  document.body.classList.add('product-dialog-open');
  const closeDialog = () => dialog.close();
  close.addEventListener('click', closeDialog);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('product-dialog-open');
    dialog.remove();
    trigger?.focus();
  });
  dialog.showModal();
  close.focus();
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function slug(value, fallback = 'item') {
  const normalized = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return normalized || fallback;
}
