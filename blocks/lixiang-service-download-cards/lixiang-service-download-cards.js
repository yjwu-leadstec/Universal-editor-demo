/* Li Auto Service download cards block. */
import {
  addBlockAnchor,
  appendPicture,
  createHeading,
  directRows,
  hasModel,
  instrument,
  instrumentProp,
  isPropertyRow,
  linkedPictures,
  plainCellTexts,
  propSource,
  propText,
  revealElements,
  semanticSourceAfter,
  semanticText,
  slug,
} from '../../scripts/lixiang-service-block-utils.js';

function rowKind(row) {
  if (row.dataset.serviceKind) return row.dataset.serviceKind;
  if (hasModel(row, 'lixiang-service-download-card')) return 'download-card';
  if (hasModel(row, 'lixiang-service-download-file')) return 'download-file';
  if (!isPropertyRow(row) && row.querySelector('picture, img')) return 'download-card';
  if (!isPropertyRow(row) && row.querySelector('a')) return 'download-file';
  return '';
}

function parseCard(row, index) {
  const texts = plainCellTexts(row);
  const pictures = [...row.querySelectorAll('picture')];
  const linkPictures = linkedPictures(row);
  const key = row.dataset.cardKey || texts[0] || `vehicle-${index + 1}`;
  return {
    key,
    name: texts[1] || key,
    row,
    image: pictures[0] || linkPictures[0] || null,
    logo: pictures[1] || linkPictures[1] || null,
    files: [],
  };
}

function parseFile(row) {
  const texts = plainCellTexts(row);
  const anchor = row.querySelector('a');
  return {
    key: row.dataset.cardKey || texts[0] || '',
    name: texts[1] || anchor?.textContent.trim() || 'Download',
    size: texts[2] || '',
    href: anchor?.getAttribute('href') || '',
    row,
  };
}

function createDownloadIcon() {
  const icon = document.createElement('span');
  icon.className = 'lixiang-service-download-icon';
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

function closeDialog(dialog) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    dialog.close();
    return;
  }
  dialog.classList.add('is-closing');
  window.setTimeout(() => {
    dialog.classList.remove('is-closing');
    dialog.close();
  }, 180);
}

function setupDialog(dialog, opener) {
  const closeButton = dialog.querySelector('.lixiang-service-download-modal-close');
  opener.addEventListener('click', () => {
    dialog.showModal();
    closeButton.focus();
  });
  closeButton.addEventListener('click', () => closeDialog(dialog));
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog(dialog);
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDialog(dialog);
  });
  dialog.addEventListener('close', () => {
    window.setTimeout(() => opener.focus(), 0);
  });
}

function createDialog(card) {
  const dialog = document.createElement('dialog');
  dialog.className = 'lixiang-service-download-modal';
  const titleId = `lixiang-service-download-${slug(card.key)}-title`;
  dialog.setAttribute('aria-labelledby', titleId);

  const sheet = document.createElement('div');
  sheet.className = 'lixiang-service-download-modal-sheet';
  const header = document.createElement('div');
  header.className = 'lixiang-service-download-modal-header';
  const title = createHeading(`${card.name} Owners Manual download`, 2);
  title.id = titleId;
  const close = document.createElement('button');
  close.className = 'lixiang-service-download-modal-close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Close download dialog');
  header.append(title, close);

  const list = document.createElement('div');
  list.className = 'lixiang-service-download-modal-list';
  card.files.forEach((file) => {
    const link = document.createElement('a');
    link.className = 'lixiang-service-download-modal-file';
    link.href = file.href || '#';
    link.setAttribute('download', '');
    const label = document.createElement('span');
    label.className = 'lixiang-service-download-modal-file-name';
    label.textContent = file.name;
    const size = document.createElement('span');
    size.className = 'lixiang-service-download-modal-file-size';
    size.textContent = file.size;
    link.append(label, size, createDownloadIcon());
    instrument(file.row, link);
    list.append(link);
  });
  sheet.append(header, list);
  dialog.append(sheet);
  return dialog;
}

function createCard(card) {
  const article = document.createElement('article');
  article.className = 'lixiang-service-download-card';
  const visual = document.createElement('div');
  visual.className = 'lixiang-service-download-card-visual';
  // Each model has its own backdrop gradient in the design; expose the key so
  // CSS can pick it. Unknown keys fall back to the neutral default gradient.
  const vehicle = (card.key || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (vehicle) visual.dataset.vehicle = vehicle;

  const identity = document.createElement('div');
  identity.className = 'lixiang-service-download-card-identity';
  if (card.logo) {
    appendPicture(identity, card.logo, { alt: card.name, fallbackLabel: card.name });
  } else {
    const name = createHeading(card.name, 3);
    identity.append(name);
  }
  const media = document.createElement('div');
  media.className = 'lixiang-service-download-card-media';
  appendPicture(media, card.image, { alt: card.name, fallbackLabel: card.name });
  visual.append(identity, media);

  const footer = document.createElement('div');
  footer.className = 'lixiang-service-download-card-footer';
  let dialog = null;
  if (card.files.length === 1) {
    const file = card.files[0];
    const link = document.createElement('a');
    link.className = 'lixiang-service-download-card-action';
    link.href = file.href || '#';
    link.setAttribute('download', '');
    const label = document.createElement('span');
    label.textContent = card.name;
    link.append(label, createDownloadIcon());
    instrument(file.row, link);
    footer.append(link);
  } else {
    // Production shows just the manual title on the card face; the file count
    // lives in the dialog, so no secondary line here.
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lixiang-service-download-card-action';
    const label = document.createElement('span');
    label.textContent = card.name;
    button.append(label, createDownloadIcon());
    footer.append(button);
    dialog = createDialog(card);
    setupDialog(dialog, button);
  }

  article.append(visual, footer);
  instrument(card.row, article);
  return { article, dialog };
}

export default function decorate(block) {
  const rows = directRows(block);
  const cards = rows.filter((row) => rowKind(row) === 'download-card').map(parseCard);
  rows.filter((row) => rowKind(row) === 'download-file').map(parseFile).forEach((file) => {
    const card = cards.find((entry) => entry.key === file.key);
    if (card) card.files.push(file);
  });

  const shell = document.createElement('div');
  shell.className = 'lixiang-service-download-shell';
  const header = document.createElement('div');
  header.className = 'lixiang-service-download-header';
  // Published markup has no data-aue markers; title/subtitle/id arrive as leading plain-text
  // rows and items as picture/anchor rows. Derive header text from non-item rows, skipping the
  // slug-like id so it can't leak into the visible header.
  const isSlug = (text) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text);
  const headerTexts = rows
    .filter((row) => !rowKind(row) && !isPropertyRow(row))
    .map((row) => plainCellTexts(row).join(' ').trim())
    .filter((text) => text && !isSlug(text));
  const title = propText(rows, 'title') || semanticText(rows, 'h1, h2') || headerTexts[0] || '';
  if (title) {
    const heading = createHeading(title, 2);
    instrumentProp(rows, 'title', heading);
    header.append(heading);
  }
  // The subtitle is optional. Both fallbacks can echo the title when no subtitle was
  // authored (published markup keeps title and subtitle in the same cell), so drop any
  // candidate that just repeats it.
  const subtitleCandidate = propText(rows, 'subtitle')
    || semanticSourceAfter(rows.filter((row) => !rowKind(row)), 'p', propSource(rows, 'title'))?.textContent.trim()
    || headerTexts[1]
    || '';
  const subtitleText = subtitleCandidate === title ? '' : subtitleCandidate;
  if (subtitleText) {
    const subtitle = document.createElement('p');
    subtitle.textContent = subtitleText;
    instrumentProp(rows, 'subtitle', subtitle);
    header.append(subtitle);
  }

  const grid = document.createElement('div');
  grid.className = 'lixiang-service-download-grid';
  grid.dataset.count = String(cards.length);
  const dialogs = [];
  cards.forEach((card) => {
    const rendered = createCard(card);
    grid.append(rendered.article);
    if (rendered.dialog) dialogs.push(rendered.dialog);
  });
  shell.append(header, grid, ...dialogs);
  block.replaceChildren(shell);
  addBlockAnchor(block, rows);
  revealElements(block, '.lixiang-service-download-header, .lixiang-service-download-card');
}
