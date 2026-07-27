/* Li Auto Official Center page block. */
import { moveInstrumentation } from '../../scripts/scripts.js';

const MODEL_FIELDS = {
  'official-center': [
    ['title', 'text'],
    ['description', 'richtext'],
    ['link', 'aem-content'],
    ['linkText', 'text'],
    ['id', 'text'],
  ],
  'official-center-card': [['cardKey', 'text'], ['title', 'text']],
  'official-center-field': [
    ['cardKey', 'text'],
    ['label', 'text'],
    ['value', 'richtext'],
    ['link', 'aem-content'],
  ],
  // Keep existing authored content renderable until it is migrated to the new model.
  'lixiang-official-center-contact-cards': [
    ['title', 'text'],
    ['description', 'richtext'],
    ['link', 'aem-content'],
    ['linkText', 'text'],
    ['linkType', 'select'],
    ['id', 'text'],
  ],
  'lixiang-official-center-contact-card': [['cardKey', 'text'], ['title', 'text']],
  'lixiang-official-center-contact-field': [
    ['cardKey', 'text'],
    ['label', 'text'],
    ['value', 'richtext'],
    ['link', 'aem-content'],
  ],
};

const CARD_MODELS = ['official-center-card', 'lixiang-official-center-contact-card'];
const FIELD_MODELS = ['official-center-field', 'lixiang-official-center-contact-field'];

function directCells(row) {
  return [...row.children];
}

function plainCellTexts(row) {
  return directCells(row)
    .filter((cell) => !cell.querySelector('picture, img, a'))
    .map((cell) => cell.textContent.trim());
}

function hasModel(row, models) {
  return models.some((model) => row.getAttribute('data-aue-model') === model
    || Boolean(row.querySelector(`[data-aue-model="${model}"]`)));
}

function isPropertyRow(row) {
  return row.hasAttribute('data-aue-prop') || Boolean(row.querySelector('[data-aue-prop]'));
}

function restoreLinkField(root, name, fieldSources) {
  const suffix = name.endsWith('LinkText') || name === 'linkText' ? 'Text' : '';
  if (!suffix) return false;
  const linkSource = fieldSources.get(name.slice(0, -suffix.length));
  const source = document.createElement('span');
  source.dataset.aueProp = name;
  source.textContent = linkSource?.querySelector('a')?.textContent.trim() || '';
  root.append(source);
  fieldSources.set(name, source);
  return true;
}

function matchesPublishedField(source, component) {
  if (component !== 'aem-content') return true;
  return Boolean(source.querySelector('a')) || !source.textContent.trim();
}

function collectionModelFor(model, row) {
  if (model === 'official-center') {
    return row.children.length <= 2 ? 'official-center-card' : 'official-center-field';
  }
  if (model === 'lixiang-official-center-contact-cards') {
    return row.children.length <= 2 ? 'lixiang-official-center-contact-card' : 'lixiang-official-center-contact-field';
  }
  return '';
}

function restorePublishedModel(root, model) {
  const fields = MODEL_FIELDS[model];
  if (!fields) return;

  const sources = directCells(root);
  const fieldSources = new Map();
  let sourceIndex = 0;

  fields.forEach(([name, component]) => {
    if (restoreLinkField(root, name, fieldSources)) return;
    const source = sources[sourceIndex];
    if (!source || (collectionModelFor(model, source) && source.children.length > 1)) return;
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

function initPublishedMarkup(block) {
  if (block.querySelector('[data-aue-prop], [data-aue-model]')) return;
  const model = block.dataset.blockName || block.classList[0];
  restorePublishedModel(block, model);
}

function propSource(rows, name) {
  const selector = `[data-aue-prop="${name}"]`;
  return rows.find((row) => row.matches(selector))
    || rows.map((row) => row.querySelector(selector)).find(Boolean)
    || null;
}

function propText(rows, name) {
  return propSource(rows, name)?.textContent.trim() || '';
}

function createHeading(text, level) {
  const heading = document.createElement(`h${level}`);
  heading.textContent = text;
  return heading;
}

function appendValue(target, source, fallback) {
  const paragraph = source?.querySelector('p');
  const nodes = paragraph ? [...paragraph.childNodes] : [...(source?.childNodes || [])];
  if (nodes.length) target.append(...nodes.map((node) => node.cloneNode(true)));
  else target.textContent = fallback;
}

function rowKind(row) {
  if (hasModel(row, CARD_MODELS)) return 'card';
  if (hasModel(row, FIELD_MODELS)) return 'field';
  if (isPropertyRow(row)) return '';
  return plainCellTexts(row).length <= 2 ? 'card' : 'field';
}

function parseCard(row, index) {
  const texts = plainCellTexts(row);
  const cells = directCells(row);
  return {
    key: row.dataset.cardKey || texts[0] || `official-center-${index + 1}`,
    title: texts[1] || row.querySelector('h2, h3, h4')?.textContent.trim() || texts[0] || '',
    titleSource: cells[1],
    row,
    fields: [],
  };
}

function parseField(row) {
  const texts = plainCellTexts(row);
  const cells = directCells(row);
  return {
    key: row.dataset.cardKey || texts[0] || '',
    label: texts[1] || '',
    labelSource: cells[1],
    value: texts[2] || '',
    valueSource: cells[2],
    href: row.querySelector('a')?.getAttribute('href') || '',
    linkSource: cells[3],
    row,
  };
}

function automaticHref(field) {
  if (field.href) return field.href;
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(field.value)) return `mailto:${field.value}`;
  if (/telephone|phone|hotline/i.test(field.label)) {
    const number = field.value.replace(/[^+\d]/g, '');
    if (number) return `tel:${number}`;
  }
  return '';
}

function createField(field) {
  const wrapper = document.createElement('div');
  wrapper.className = 'official-center-field';
  const term = document.createElement('dt');
  term.textContent = field.label;
  const detail = document.createElement('dd');
  const href = automaticHref(field);
  if (href) {
    const link = document.createElement('a');
    link.href = href;
    appendValue(link, field.valueSource, field.value);
    detail.append(link);
    moveInstrumentation(field.linkSource, link);
  } else {
    appendValue(detail, field.valueSource, field.value);
  }
  wrapper.append(term, detail);
  moveInstrumentation(field.row, wrapper);
  moveInstrumentation(field.labelSource, term);
  moveInstrumentation(field.valueSource, detail);
  return wrapper;
}

function createCard(card) {
  const article = document.createElement('article');
  article.className = 'official-center-card';
  const title = createHeading(card.title, 3);
  const fields = document.createElement('dl');
  fields.className = 'official-center-fields';
  fields.append(...card.fields.map(createField));
  article.append(title, fields);
  moveInstrumentation(card.row, article);
  moveInstrumentation(card.titleSource, title);
  return article;
}

function createDescription(source) {
  const description = document.createElement('div');
  description.className = 'official-center-description';
  const paragraphs = [...(source?.querySelectorAll('p') || [])];
  if (paragraphs.length) {
    description.append(...paragraphs.map((paragraph) => paragraph.cloneNode(true)));
  } else description.textContent = source?.textContent.trim() || '';
  return description;
}

export default function decorate(block) {
  initPublishedMarkup(block);
  const rows = [...block.children];
  const contentStartsAt = rows.findIndex((row) => rowKind(row));
  const headerRows = contentStartsAt >= 0 ? rows.slice(0, contentStartsAt) : rows;
  const contentRows = contentStartsAt >= 0 ? rows.slice(contentStartsAt) : [];
  const cards = contentRows.filter((row) => rowKind(row) === 'card').map(parseCard);
  contentRows.filter((row) => rowKind(row) === 'field').map(parseField).forEach((field) => {
    const card = cards.find((entry) => entry.key === field.key);
    if (card) card.fields.push(field);
  });

  const shell = document.createElement('div');
  shell.className = 'official-center-shell';
  const header = document.createElement('div');
  header.className = 'official-center-header';
  const titleSource = propSource(rows, 'title')
    || headerRows.flatMap((row) => [...row.querySelectorAll('h1, h2')])[0];
  const title = propText(rows, 'title') || titleSource?.textContent.trim() || '';
  if (title) {
    const heading = createHeading(title, 2);
    header.append(heading);
    moveInstrumentation(titleSource, heading);
  }
  const descriptionSource = propSource(rows, 'description')
    || headerRows.flatMap((row) => [...row.querySelectorAll('p')])[0];
  if (descriptionSource?.textContent.trim()) {
    const description = createDescription(descriptionSource);
    header.append(description);
    moveInstrumentation(descriptionSource, description);
  }
  const linkSource = propSource(rows, 'link')
    || headerRows.map((row) => row.querySelector('a')).find(Boolean);
  const sourceAnchor = linkSource?.matches('a') ? linkSource : linkSource?.querySelector('a');
  const linkText = propText(rows, 'linkText') || sourceAnchor?.textContent.trim();
  if (sourceAnchor?.href && linkText) {
    const link = document.createElement('a');
    link.className = 'official-center-overview';
    link.href = sourceAnchor.getAttribute('href');
    link.textContent = linkText;
    header.append(link);
    moveInstrumentation(linkSource, link);
  }

  const list = document.createElement('div');
  list.className = 'official-center-list';
  list.append(...cards.map(createCard));
  shell.append(header, list);
  block.parentElement?.classList.add('official-center-wrapper');
  block.classList.add('official-center');
  block.replaceChildren(shell);

  const idSource = propSource(rows, 'id');
  const id = idSource?.textContent.trim();
  if (id) block.id = id;
  if (idSource) {
    const anchor = document.createElement('span');
    anchor.className = 'official-center-aue-anchor';
    anchor.setAttribute('aria-hidden', 'true');
    moveInstrumentation(idSource, anchor);
    block.append(anchor);
  }
}
