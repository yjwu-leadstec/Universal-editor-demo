import {
  appendPicture, appendPropAnchors, createReveal, directRows, hasModel, imageAlt,
  imageLinkCellIndex, instrument, propText, registerMediaPanel, rowLinks,
  rowPicture, rowTexts, setupMediaDialog,
} from '../../scripts/media-center-utils.js';

function parseCards(rows) {
  const modelCardRows = rows.filter((row) => hasModel(row, 'media-card'));
  const cardRows = modelCardRows.length
    ? modelCardRows
    : rows.filter((row) => row.children.length === 4 && imageLinkCellIndex(row) === 3);
  const cards = cardRows.map((row, index) => {
    const texts = rowTexts(row);
    const picture = rowPicture(row);
    return {
      key: texts[0] || `media-${index + 1}`,
      title: texts[1] || '',
      date: texts[2] || '',
      picture,
      alt: imageAlt(picture),
      row,
      quantity: '',
      duration: '',
      video: '',
      download: '',
      metaRow: null,
      actionRow: null,
      contents: [],
      images: [],
    };
  });
  const byKey = Object.fromEntries(cards.map((card) => [card.key, card]));
  const metaRows = rows.filter((row) => hasModel(row, 'media-card-meta'));
  (metaRows.length ? metaRows : rows.filter((row, index) => (
    index >= 2 && row.children.length === 4 && imageLinkCellIndex(row) < 0
  ))).forEach((row) => {
    const [key, alt, quantity, duration] = rowTexts(row);
    if (byKey[key]) {
      Object.assign(byKey[key], {
        alt: alt || byKey[key].alt, quantity, duration, metaRow: row,
      });
    }
  });
  const actionRows = rows.filter((row) => hasModel(row, 'media-card-action'));
  (actionRows.length ? actionRows : rows.filter((row, index) => (
    index >= 2 && row.children.length === 3 && row.querySelector('a') && imageLinkCellIndex(row) < 0
  ))).forEach((row) => {
    const [key] = rowTexts(row);
    const links = rowLinks(row).map((link) => link.href);
    if (!byKey[key]) return;
    byKey[key].video = links.find((href) => /\.(mp4|webm|mov)(?:[?#]|$)/i.test(href)) || '';
    byKey[key].download = links.find((href) => href !== byKey[key].video) || '';
    byKey[key].actionRow = row;
  });
  const copyRows = rows.filter((row) => hasModel(row, 'media-article-copy'));
  (copyRows.length ? copyRows : rows.filter((row, index) => (
    index >= 2 && row.children.length === 2 && !row.querySelector('a, picture, img')
  ))).forEach((row) => {
    const [key] = rowTexts(row);
    const source = row.children[1] || row;
    if (byKey[key]) byKey[key].contents.push({ kind: 'copy', source, row });
  });
  const articleImageRows = rows.filter((row) => hasModel(row, 'media-article-image'));
  (articleImageRows.length ? articleImageRows : rows.filter((row) => (
    row.children.length === 4 && imageLinkCellIndex(row) === 1
  ))).forEach((row) => {
    const [key, alt, caption] = rowTexts(row);
    if (byKey[key]) {
      byKey[key].contents.push({
        kind: 'image', picture: rowPicture(row), alt, caption, row,
      });
    }
  });
  const galleryRows = rows.filter((row) => hasModel(row, 'media-gallery-image'));
  (galleryRows.length ? galleryRows : rows.filter((row) => (
    row.children.length === 3 && imageLinkCellIndex(row) === 1
  ))).forEach((row) => {
    const [key, alt] = rowTexts(row);
    const picture = rowPicture(row);
    if (byKey[key] && picture) {
      byKey[key].images.push({ picture, alt: alt || imageAlt(picture), row });
    }
  });
  return cards;
}

function createMarker(type, card) {
  if (type === 'newsroom') return null;
  const marker = document.createElement('span');
  marker.className = `media-card-marker media-card-marker-${type}`;
  marker.setAttribute('aria-hidden', 'true');
  if (type === 'photos') marker.textContent = card.quantity || String(card.images.length);
  return marker;
}

function createCard(card, type) {
  const article = document.createElement('article');
  article.className = `media-card media-card-${type}`;
  const opener = document.createElement('button');
  opener.type = 'button';
  opener.className = 'media-card-opener';
  opener.setAttribute('aria-label', `Open ${card.title}`);
  const media = document.createElement('span');
  media.className = 'media-card-media';
  appendPicture(media, card.picture, card.alt || card.title);
  const marker = createMarker(type, card);
  if (marker) media.append(marker);
  opener.append(media);
  const copy = document.createElement('div');
  copy.className = 'media-card-copy';
  const title = document.createElement('h2');
  title.textContent = card.title;
  const meta = document.createElement('p');
  meta.textContent = [card.duration || card.quantity, card.date].filter(Boolean).join(' | ');
  instrument(card.metaRow, meta);
  copy.append(title, meta);
  article.append(opener, copy);
  instrument(card.row, article);
  instrument(card.actionRow, marker || opener);
  setupMediaDialog(opener, {
    ...card,
    type,
    picture: media.querySelector('picture')?.cloneNode(true),
    images: card.images.map((item) => ({ ...item, picture: item.picture.cloneNode(true) })),
    contents: card.contents.map((item) => ({
      ...item,
      picture: item.picture?.cloneNode(true),
    })),
  });
  return article;
}

export default function decorate(block) {
  const rows = directRows(block);
  const type = ['photos', 'videos'].find((value) => block.classList.contains(value))
    || propText(rows, 'classes') || 'newsroom';
  const panelId = propText(rows, 'panelId') || rowTexts(rows[0] || block)[0] || type;
  const cards = parseCards(rows);
  const grid = document.createElement('div');
  grid.className = 'media-card-grid-inner';
  cards.forEach((card) => grid.append(createCard(card, type)));
  block.replaceChildren(grid);
  appendPropAnchors(block, rows, ['panelId', 'classes', 'id']);
  const id = propText(rows, 'id') || rowTexts(rows[1] || block)[0];
  if (id) block.id = id;
  registerMediaPanel(block, panelId);
  createReveal(block, '.media-card');
}
