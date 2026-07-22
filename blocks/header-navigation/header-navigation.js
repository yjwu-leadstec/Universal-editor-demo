import { moveInstrumentation } from '../../scripts/scripts.js';

function directField(row, property) {
  return row?.querySelector(`:scope > [data-aue-prop="${property}"]`) || null;
}

function textCells(row) {
  return [...row.children]
    .filter((cell) => !cell.querySelector('a, picture, img'))
    .map((cell) => cell.textContent.trim());
}

function fieldText(row, property, fallback = '') {
  return directField(row, property)?.textContent.trim() || fallback;
}

function fieldPicture(row, property, fallback) {
  return directField(row, property)?.querySelector('picture, img')?.closest('picture')
    || fallback
    || null;
}

function extractItem(row) {
  const values = textCells(row);
  const pictures = [...row.querySelectorAll('picture')];
  const destination = directField(row, 'destination')?.querySelector('a[href]')
    || row.querySelector('a[href]');
  let kind = 'group';
  if (destination) kind = 'top';
  if (pictures.length || row.children.length > 2) kind = 'card';
  const label = fieldText(row, 'label', values[0] || '');
  const description = fieldText(
    row,
    'description',
    values.length > 1 ? values[values.length - 1] : '',
  );

  return {
    row,
    kind,
    label,
    href: destination?.getAttribute('href') || '',
    background: fieldPicture(row, 'media', pictures[0]),
    foreground: pictures[1] || null,
    description,
  };
}

function appendMedia(source, target, className, alt) {
  if (!source) return;
  const media = source.cloneNode(true);
  media.classList.add(className);
  const image = media.querySelector('img');
  if (image) image.alt = alt;
  target.append(media);
}

function buildTop(item) {
  const element = document.createElement('li');
  element.dataset.navKind = 'top';
  const label = document.createElement(item.href ? 'a' : 'span');
  if (item.href) label.href = item.href;
  label.textContent = item.label;
  element.append(label);
  moveInstrumentation(item.row, element);
  return element;
}

function buildGroup(item) {
  const element = document.createElement('li');
  element.dataset.navKind = 'group';
  const label = document.createElement('em');
  label.textContent = item.label;
  element.append(label);
  moveInstrumentation(item.row, element);
  return element;
}

function buildCard(item, actionLabel) {
  const element = document.createElement('li');
  element.dataset.navKind = 'card';
  const card = document.createElement(item.href ? 'a' : 'div');
  card.className = 'header-navigation-card';
  if (item.href) card.href = item.href;
  appendMedia(item.background, card, 'header-navigation-card-background', '');
  appendMedia(item.foreground, card, 'header-navigation-card-foreground', item.label);

  const title = document.createElement('strong');
  title.textContent = item.label;
  card.append(title);
  if (item.description) {
    const description = document.createElement('span');
    description.textContent = item.description;
    card.append(description);
  }
  if (actionLabel) {
    const action = document.createElement('em');
    action.textContent = actionLabel;
    card.append(action);
  }
  element.append(card);
  moveInstrumentation(item.row, element);
  return element;
}

/**
 * Build a semantic navigation list from flat, sortable Universal Editor items.
 * A top item starts a menu; following group/card items belong to it until the next top item.
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const [settingsRow, ...itemRows] = [...block.children];
  const actionLabel = fieldText(
    settingsRow,
    'cardActionLabel',
    settingsRow?.textContent.trim() || '',
  );
  const items = itemRows.map(extractItem);
  const list = document.createElement('ul');
  list.className = 'header-navigation-list';
  let currentTop = null;
  let currentSubList = null;

  items.forEach((item) => {
    if (!item.kind || !item.label) return;
    if (item.kind === 'top') {
      currentTop = buildTop(item);
      currentSubList = document.createElement('ul');
      currentTop.append(currentSubList);
      list.append(currentTop);
      return;
    }
    if (!currentTop || !currentSubList) return;
    currentSubList.append(
      item.kind === 'group' ? buildGroup(item) : buildCard(item, actionLabel),
    );
  });

  list.querySelectorAll(':scope > li > ul:empty').forEach((empty) => empty.remove());
  block.dataset.headerNavigation = 'true';
  block.replaceChildren(list);
}
