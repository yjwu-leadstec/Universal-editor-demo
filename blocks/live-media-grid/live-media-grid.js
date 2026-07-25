/* Live-site aligned Media Center card collection. */
import { moveInstrumentation } from '../../scripts/scripts.js';

const MEDIA_TYPES = ['newsroom', 'photos', 'videos'];

function hasModel(row, model) {
  return row.getAttribute('data-aue-model') === model
    || Boolean(row.querySelector(`[data-aue-model="${model}"]`));
}

function propertySource(row, name, fallbackIndex) {
  const selector = `[data-aue-prop="${name}"]`;
  return row.matches(selector)
    ? row
    : row.querySelector(selector) || row.children[fallbackIndex] || null;
}

function sourceText(source) {
  return source?.textContent.trim() || '';
}

function sourceHref(source) {
  const link = source?.matches('a') ? source : source?.querySelector('a');
  return link?.getAttribute('href') || '';
}

function pictureFrom(source, alt) {
  const picture = source?.querySelector('picture');
  if (picture) return picture.cloneNode(true);
  const imageHref = sourceHref(source);
  if (!imageHref) return null;
  const image = document.createElement('img');
  image.src = imageHref;
  image.alt = alt;
  return image;
}

function parseCards(rows) {
  const cardRows = rows.filter((row) => hasModel(row, 'live-media-card'));
  const candidates = cardRows.length
    ? cardRows
    : rows.filter((row) => row.children.length === 4 && row.querySelector('picture, img, a'));
  const cards = candidates.map((row, index) => {
    const titleSource = propertySource(row, 'title', 0);
    const dateSource = propertySource(row, 'date', 1);
    const imageSource = propertySource(row, 'image', 2);
    const linkSource = propertySource(row, 'link', 3);
    return {
      key: sourceText(titleSource) || `media-card-${index + 1}`,
      title: sourceText(titleSource),
      date: sourceText(dateSource),
      imageSource,
      linkSource,
      href: sourceHref(linkSource),
      titleSource,
      dateSource,
      row,
      quantity: '',
      duration: '',
      alt: '',
    };
  });
  const byTitle = new Map(cards.map((card) => [card.key, card]));
  rows.filter((row) => hasModel(row, 'live-media-card-meta')).forEach((row) => {
    const key = sourceText(propertySource(row, 'title', 0));
    const card = byTitle.get(key);
    if (!card) return;
    card.quantity = sourceText(propertySource(row, 'quantity', 1));
    card.duration = sourceText(propertySource(row, 'duration', 2));
    card.alt = sourceText(propertySource(row, 'imageAlt', 3));
  });
  return cards;
}

function createCard(card, type) {
  const link = document.createElement('a');
  link.className = 'live-media-card';
  link.href = card.href || '#';
  link.setAttribute('aria-label', card.title);
  const media = document.createElement('span');
  media.className = 'live-media-card-media';
  const picture = pictureFrom(card.imageSource, card.alt || card.title);
  if (picture) media.append(picture);
  const copy = document.createElement('span');
  copy.className = 'live-media-card-copy';
  const title = document.createElement('span');
  title.className = 'live-media-card-title';
  title.textContent = card.title;
  const meta = document.createElement('span');
  meta.className = 'live-media-card-meta';
  let detail = '';
  if (type === 'photos') detail = card.quantity;
  if (type === 'videos') detail = card.duration;
  meta.textContent = [detail, card.date].filter(Boolean).join(' | ');
  if (type === 'photos' && card.quantity) meta.classList.add('has-quantity');
  copy.append(title, meta);
  link.append(media, copy);
  moveInstrumentation(card.row, link);
  moveInstrumentation(card.titleSource, title);
  moveInstrumentation(card.dateSource, meta);
  moveInstrumentation(card.imageSource, media);
  moveInstrumentation(card.linkSource, link);
  return link;
}

export default function decorate(block) {
  const rows = [...block.children];
  const typeSource = rows.find((row) => row.matches('[data-aue-prop="type"]')
    || row.querySelector('[data-aue-prop="type"]')) || rows[0];
  const typeValue = sourceText(typeSource);
  const type = MEDIA_TYPES.includes(typeValue) ? typeValue : 'newsroom';
  const cards = parseCards(rows);
  const grid = document.createElement('div');
  grid.className = `live-media-grid-list live-media-grid-${type}`;
  grid.append(...cards.map((card) => createCard(card, type)));
  block.parentElement?.classList.add('live-media-grid-wrapper');
  block.classList.add('live-media-grid');
  block.replaceChildren(grid);
  moveInstrumentation(typeSource, grid);
}
