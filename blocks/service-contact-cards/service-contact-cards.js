/* Li Auto Service contact cards block. */
import {
  addBlockAnchor,
  createHeading,
  createRichText,
  directCells,
  directRows,
  hasModel,
  instrument,
  instrumentProp,
  isPropertyRow,
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
  return directCells(row).length <= 2 ? 'contact-card' : 'contact-field';
}

function cellText(row, index) {
  return directCells(row)[index]?.textContent.trim() || '';
}

function parseCard(row, index) {
  return {
    key: row.dataset.cardKey || cellText(row, 0) || `contact-${index + 1}`,
    title: cellText(row, 1)
      || row.querySelector('h2, h3, h4')?.textContent.trim()
      || cellText(row, 0),
    row,
    fields: [],
  };
}

function parseField(row) {
  const cells = directCells(row);
  return {
    key: row.dataset.cardKey || cellText(row, 0),
    label: cellText(row, 1),
    value: cellText(row, 2),
    href: cells[3]?.querySelector('a')?.getAttribute('href')
      || cells[2]?.querySelector('a')?.getAttribute('href')
      || '',
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
  instrumentProp([field.row], 'label', term);
  const detail = document.createElement('dd');
  const href = automaticHref(field);
  if (href) {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = field.value;
    instrumentProp([field.row], 'link', link);
    detail.append(link);
  } else {
    detail.textContent = field.value;
  }
  instrumentProp([field.row], 'value', detail);
  const keyAnchor = document.createElement('span');
  keyAnchor.className = 'service-aue-anchor';
  keyAnchor.setAttribute('aria-hidden', 'true');
  instrumentProp([field.row], 'cardKey', keyAnchor);
  wrapper.append(term, detail, keyAnchor);
  instrument(field.row, wrapper);
  return wrapper;
}

function createCard(card) {
  const article = document.createElement('article');
  article.className = 'support-contact-card';
  const title = createHeading(card.title, 2);
  instrumentProp([card.row], 'title', title);
  const fields = document.createElement('dl');
  fields.className = 'support-contact-fields';
  fields.append(...card.fields.map(createField));
  const keyAnchor = document.createElement('span');
  keyAnchor.className = 'service-aue-anchor';
  keyAnchor.setAttribute('aria-hidden', 'true');
  instrumentProp([card.row], 'cardKey', keyAnchor);
  article.append(title, fields, keyAnchor);
  instrument(card.row, article);
  return article;
}

function syncViewportWidth(block) {
  const update = () => {
    block.style.setProperty('--service-viewport-width', `${document.documentElement.clientWidth}px`);
    block.style.setProperty('--service-window-width', `${window.innerWidth}px`);
  };
  update();
  window.requestAnimationFrame(update);
  window.addEventListener('resize', update, { passive: true });
}

export default function decorate(block) {
  const rows = directRows(block);
  const modelContentStartsAt = rows.findIndex((row) => row.dataset.serviceKind
    || hasModel(row, 'support-contact-card')
    || hasModel(row, 'support-contact-field'));
  const plainContentStartsAt = rows.findIndex((row) => !isPropertyRow(row)
    && directCells(row).length >= 2);
  const contentStartsAt = modelContentStartsAt >= 0 ? modelContentStartsAt : plainContentStartsAt;
  const headerRows = contentStartsAt >= 0 ? rows.slice(0, contentStartsAt) : rows;
  const contentRows = contentStartsAt >= 0 ? rows.slice(contentStartsAt) : rows;
  const cards = [];
  let currentCard = null;
  contentRows.forEach((row) => {
    if (rowKind(row) === 'contact-card') {
      currentCard = parseCard(row, cards.length);
      cards.push(currentCard);
      return;
    }
    if (rowKind(row) !== 'contact-field') return;
    const field = parseField(row);
    const card = (field.key && cards.find((entry) => entry.key === field.key)) || currentCard;
    if (card) card.fields.push(field);
  });

  const shell = document.createElement('div');
  shell.className = 'support-contact-shell';
  const header = document.createElement('div');
  header.className = 'support-contact-header';
  const titleSource = propSource(rows, 'title')
    || semanticSource(headerRows, 'h1, h2')
    || directCells(headerRows[0] || block)[0];
  const title = propText(rows, 'title')
    || semanticText(headerRows, 'h1, h2')
    || titleSource?.textContent.trim();
  if (title) {
    const heading = createHeading(title, 1);
    instrumentProp(rows, 'title', heading);
    header.append(heading);
  }
  const descriptionSource = propSource(rows, 'description')
    || semanticSourceAfter(headerRows, 'p', titleSource)
    || directCells(headerRows[1] || block)[0];
  if (descriptionSource?.textContent.trim()) {
    const description = createRichText(descriptionSource, 'support-contact-description');
    instrumentProp(rows, 'description', description);
    header.append(description);
  }
  const sourceLink = propAnchor(rows, 'link') || headerRows.map((row) => row.querySelector('a')).find(Boolean);
  const linkText = propText(rows, 'linkText') || cellText(headerRows[3] || block, 0)
    || sourceLink?.textContent.trim();
  if (sourceLink?.href && linkText) {
    const link = document.createElement('a');
    const linkType = propText(rows, 'linkType') || cellText(headerRows[4] || block, 0) || 'text';
    link.className = `support-contact-overview support-contact-overview-${linkType}`;
    link.href = sourceLink.getAttribute('href');
    const label = document.createElement('span');
    label.textContent = linkText;
    instrumentProp(rows, 'linkText', label);
    link.append(label);
    instrumentProp(rows, 'link', link);
    header.append(link);
  }

  const list = document.createElement('div');
  list.className = 'support-contact-list';
  const cardElements = cards.map(createCard);
  cardElements.forEach((card, index) => {
    card.style.setProperty('--service-reveal-delay', `${Math.min(index * 70, 420)}ms`);
  });
  list.append(...cardElements);
  shell.append(header, list);
  block.replaceChildren(shell);
  addBlockAnchor(block, rows);
  const fallbackId = cellText(headerRows[5] || block, 0);
  if (!block.id && fallbackId) block.id = fallbackId;
  syncViewportWidth(block);
  revealElements(block, '.support-contact-header, .support-contact-card');
}
