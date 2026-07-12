import {
  addBlockAnchor,
  appendPicture,
  createHeading,
  directRows,
  hasModel,
  instrument,
  instrumentProp,
  isPropertyRow,
  plainCellTexts,
  propSource,
  propText,
  revealElements,
  semanticSource,
  semanticSourceAfter,
  semanticText,
  slug,
} from '../../scripts/service-block-utils.js';

function rowKind(row) {
  if (row.dataset.serviceKind) return row.dataset.serviceKind;
  if (hasModel(row, 'support-download-card')) return 'download-card';
  if (hasModel(row, 'support-download-file')) return 'download-file';
  if (!isPropertyRow(row) && row.querySelector('picture, img')) return 'download-card';
  if (!isPropertyRow(row) && row.querySelector('a')) return 'download-file';
  return '';
}

function parseCard(row, index) {
  const texts = plainCellTexts(row);
  const pictures = [...row.querySelectorAll('picture')];
  const key = row.dataset.cardKey || texts[0] || `vehicle-${index + 1}`;
  return {
    key,
    name: texts[1] || key,
    row,
    image: pictures[0] || null,
    logo: pictures[1] || null,
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
  icon.className = 'support-download-icon';
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
  const closeButton = dialog.querySelector('.support-download-modal-close');
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
  dialog.addEventListener('close', () => opener.focus());
}

function createDialog(card) {
  const dialog = document.createElement('dialog');
  dialog.className = 'support-download-modal';
  const titleId = `support-download-${slug(card.key)}-title`;
  dialog.setAttribute('aria-labelledby', titleId);

  const sheet = document.createElement('div');
  sheet.className = 'support-download-modal-sheet';
  const header = document.createElement('div');
  header.className = 'support-download-modal-header';
  const title = createHeading(`${card.name} Owners Manual download`, 2);
  title.id = titleId;
  const close = document.createElement('button');
  close.className = 'support-download-modal-close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Close download dialog');
  header.append(title, close);

  const list = document.createElement('div');
  list.className = 'support-download-modal-list';
  card.files.forEach((file) => {
    const link = document.createElement('a');
    link.className = 'support-download-modal-file';
    link.href = file.href || '#';
    link.setAttribute('download', '');
    const label = document.createElement('span');
    label.className = 'support-download-modal-file-name';
    label.textContent = file.name;
    const size = document.createElement('span');
    size.className = 'support-download-modal-file-size';
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
  article.className = 'support-download-card';
  const visual = document.createElement('div');
  visual.className = 'support-download-card-visual';

  const identity = document.createElement('div');
  identity.className = 'support-download-card-identity';
  if (card.logo) {
    appendPicture(identity, card.logo, { alt: card.name, fallbackLabel: card.name });
  } else {
    const name = createHeading(card.name, 3);
    identity.append(name);
  }
  const media = document.createElement('div');
  media.className = 'support-download-card-media';
  appendPicture(media, card.image, { alt: card.name, fallbackLabel: card.name });
  visual.append(identity, media);

  const footer = document.createElement('div');
  footer.className = 'support-download-card-footer';
  let dialog = null;
  if (card.files.length === 1) {
    const file = card.files[0];
    const link = document.createElement('a');
    link.className = 'support-download-card-action';
    link.href = file.href || '#';
    link.setAttribute('download', '');
    const label = document.createElement('span');
    label.textContent = file.name;
    const size = document.createElement('small');
    size.textContent = file.size;
    link.append(label, size, createDownloadIcon());
    instrument(file.row, link);
    footer.append(link);
  } else {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'support-download-card-action';
    const label = document.createElement('span');
    label.textContent = `${card.name} Documents`;
    const count = document.createElement('small');
    count.textContent = `${card.files.length} files`;
    button.append(label, count, createDownloadIcon());
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
  shell.className = 'support-download-shell';
  const header = document.createElement('div');
  header.className = 'support-download-header';
  const titleSource = propSource(rows, 'title') || semanticSource(rows, 'h1, h2');
  const title = propText(rows, 'title') || semanticText(rows, 'h1, h2');
  if (title) {
    const heading = createHeading(title, 2);
    instrumentProp(rows, 'title', heading);
    header.append(heading);
  }
  const subtitleSource = propSource(rows, 'subtitle')
    || semanticSourceAfter(rows.filter((row) => !rowKind(row)), 'p', titleSource);
  if (subtitleSource?.textContent.trim()) {
    const subtitle = document.createElement('p');
    subtitle.textContent = subtitleSource.textContent.trim();
    instrumentProp(rows, 'subtitle', subtitle);
    header.append(subtitle);
  }

  const grid = document.createElement('div');
  grid.className = 'support-download-grid';
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
  revealElements(block, '.support-download-header, .support-download-card');
}
