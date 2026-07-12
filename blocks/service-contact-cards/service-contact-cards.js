/* Li Auto Service contact cards block. */
import {
  addBlockAnchor,
  createHeading,
  createRichText,
  directRows,
  hasModel,
  instrument,
  instrumentProp,
  isPropertyRow,
  plainCellTexts,
  propAnchor,
  propSource,
  propText,
  revealElements,
  semanticSource,
  semanticSourceAfter,
  semanticText,
} from '../../scripts/service-block-utils.js';

function rowKind(row) {
  if (row.dataset.serviceKind) return row.dataset.serviceKind;
  if (hasModel(row, 'support-contact-card')) return 'contact-card';
  if (hasModel(row, 'support-contact-field')) return 'contact-field';
  if (isPropertyRow(row)) return '';
  return plainCellTexts(row).length <= 2 ? 'contact-card' : 'contact-field';
}

function parseCard(row, index) {
  const texts = plainCellTexts(row);
  return {
    key: row.dataset.cardKey || texts[0] || `contact-${index + 1}`,
    title: texts[1] || row.querySelector('h2, h3, h4')?.textContent.trim() || texts[0] || '',
    row,
    fields: [],
  };
}

function parseField(row) {
  const texts = plainCellTexts(row);
  return {
    key: row.dataset.cardKey || texts[0] || '',
    label: texts[1] || '',
    value: texts[2] || '',
    href: row.querySelector('a')?.getAttribute('href') || '',
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
  wrapper.className = 'support-contact-field';
  const term = document.createElement('dt');
  term.textContent = field.label;
  const detail = document.createElement('dd');
  const href = automaticHref(field);
  if (href) {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = field.value;
    detail.append(link);
  } else {
    detail.textContent = field.value;
  }
  wrapper.append(term, detail);
  instrument(field.row, wrapper);
  return wrapper;
}

function createCard(card) {
  const article = document.createElement('article');
  article.className = 'support-contact-card';
  const title = createHeading(card.title, 3);
  const fields = document.createElement('dl');
  fields.className = 'support-contact-fields';
  fields.append(...card.fields.map(createField));
  article.append(title, fields);
  instrument(card.row, article);
  return article;
}

export default function decorate(block) {
  const rows = directRows(block);
  const contentStartsAt = rows.findIndex((row) => row.dataset.serviceKind
    || hasModel(row, 'support-contact-card')
    || hasModel(row, 'support-contact-field'));
  const headerRows = contentStartsAt >= 0 ? rows.slice(0, contentStartsAt) : rows;
  const contentRows = contentStartsAt >= 0 ? rows.slice(contentStartsAt) : rows;
  const cards = contentRows.filter((row) => rowKind(row) === 'contact-card').map(parseCard);
  contentRows.filter((row) => rowKind(row) === 'contact-field').map(parseField).forEach((field) => {
    const card = cards.find((entry) => entry.key === field.key);
    if (card) card.fields.push(field);
  });

  const shell = document.createElement('div');
  shell.className = 'support-contact-shell';
  const header = document.createElement('div');
  header.className = 'support-contact-header';
  const titleSource = propSource(rows, 'title') || semanticSource(headerRows, 'h1, h2');
  const title = propText(rows, 'title') || semanticText(headerRows, 'h1, h2');
  if (title) {
    const heading = createHeading(title, 2);
    instrumentProp(rows, 'title', heading);
    header.append(heading);
  }
  const descriptionSource = propSource(rows, 'description')
    || semanticSourceAfter(headerRows, 'p', titleSource);
  if (descriptionSource?.textContent.trim()) {
    const description = createRichText(descriptionSource, 'support-contact-description');
    instrumentProp(rows, 'description', description);
    header.append(description);
  }
  const sourceLink = propAnchor(rows, 'link') || headerRows.map((row) => row.querySelector('a')).find(Boolean);
  const linkText = propText(rows, 'linkText') || sourceLink?.textContent.trim();
  if (sourceLink?.href && linkText) {
    const link = document.createElement('a');
    link.className = `support-contact-overview support-contact-overview-${propText(rows, 'linkType') || 'text'}`;
    link.href = sourceLink.getAttribute('href');
    link.textContent = linkText;
    instrumentProp(rows, 'link', link);
    header.append(link);
  }

  const list = document.createElement('div');
  list.className = 'support-contact-list';
  list.append(...cards.map(createCard));
  shell.append(header, list);
  block.replaceChildren(shell);
  addBlockAnchor(block, rows);
  revealElements(block, '.support-contact-header, .support-contact-card');
}
