import { moveInstrumentation } from '../../scripts/scripts.js';

const ITEM_META = {
  top: {
    label: 'Main Navigation Link',
    emptyLabel: 'Untitled main navigation link',
    hint: 'Starts a new menu. The following headings and cards belong to it.',
  },
  group: {
    label: 'Dropdown Section Heading',
    emptyLabel: 'Untitled dropdown section',
    hint: 'Adds a heading inside the most recent main navigation menu.',
  },
  card: {
    label: 'Dropdown Link Card',
    emptyLabel: 'Untitled dropdown card',
    hint: 'Adds a linked card inside the most recent main navigation menu.',
  },
};

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

function itemKind(row) {
  const model = row?.getAttribute('data-aue-model') || '';
  if (model === 'header-navigation-top') return 'top';
  if (model === 'header-navigation-group') return 'group';
  if (model === 'header-navigation-card') return 'card';
  return '';
}

function extractItem(row) {
  const values = textCells(row);
  const pictures = [...row.querySelectorAll('picture')];
  const destination = directField(row, 'destination')?.querySelector('a[href]')
    || row.querySelector('a[href]');
  let kind = itemKind(row);
  if (!kind) {
    kind = 'group';
    if (destination) kind = 'top';
    if (pictures.length || row.children.length > 2) kind = 'card';
  }
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
    mediaCount: pictures.length,
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
  return element;
}

function buildGroup(item) {
  const element = document.createElement('li');
  element.dataset.navKind = 'group';
  const label = document.createElement('em');
  label.textContent = item.label;
  element.append(label);
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
  return element;
}

function buildSemanticList(items, actionLabel) {
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
  return list;
}

function appendEditorDetail(list, label, value, emptyValue) {
  const row = document.createElement('div');
  const term = document.createElement('dt');
  const detail = document.createElement('dd');
  term.textContent = label;
  detail.textContent = value || emptyValue;
  detail.classList.toggle('is-empty', !value);
  row.append(term, detail);
  list.append(row);
}

function buildEditorItem(item, index, hasTop) {
  const meta = ITEM_META[item.kind];
  if (!meta) return null;

  const element = document.createElement('article');
  element.className = `header-navigation-editor-item is-${item.kind}`;
  element.dataset.navKind = item.kind;
  element.classList.toggle('is-empty', !item.label);
  element.classList.toggle('is-orphan', item.kind !== 'top' && !hasTop);

  const heading = document.createElement('header');
  const order = document.createElement('span');
  order.className = 'header-navigation-editor-order';
  order.textContent = String(index + 1).padStart(2, '0');
  const type = document.createElement('span');
  type.className = 'header-navigation-editor-type';
  type.textContent = meta.label;
  const title = document.createElement('strong');
  title.textContent = item.label || meta.emptyLabel;
  heading.append(order, type, title);

  const details = document.createElement('dl');
  if (item.kind !== 'group') {
    appendEditorDetail(details, 'Target page or URL', item.href, 'No target selected');
  }
  if (item.kind === 'card') {
    appendEditorDetail(details, 'Description', item.description, 'No description');
    appendEditorDetail(
      details,
      'Images',
      item.mediaCount ? `${item.mediaCount} selected` : '',
      'No images selected',
    );
  }

  const hint = document.createElement('p');
  hint.className = 'header-navigation-editor-hint';
  hint.textContent = item.kind !== 'top' && !hasTop
    ? 'Move this item below a Main Navigation Link before publishing.'
    : meta.hint;

  element.append(heading, details, hint);
  moveInstrumentation(item.row, element);
  return element;
}

function buildEditor(items, actionLabel) {
  const editor = document.createElement('section');
  editor.className = 'header-navigation-editor';

  const intro = document.createElement('div');
  intro.className = 'header-navigation-editor-intro';
  const title = document.createElement('h2');
  title.textContent = 'Header navigation items';
  const instructions = document.createElement('p');
  instructions.textContent = 'Select one card, then open Properties. Use the folder button in “Target Page or URL” to choose an AEM Sites page.';
  intro.append(title, instructions);

  if (actionLabel) {
    const action = document.createElement('p');
    action.className = 'header-navigation-editor-action';
    action.textContent = `Shared card action: ${actionLabel}`;
    intro.append(action);
  }

  const list = document.createElement('div');
  list.className = 'header-navigation-editor-list';
  list.setAttribute('role', 'list');
  let hasTop = false;
  items.forEach((item, index) => {
    const editorItem = buildEditorItem(item, index, hasTop);
    if (editorItem) {
      editorItem.setAttribute('role', 'listitem');
      list.append(editorItem);
    }
    if (item.kind === 'top') hasTop = true;
  });

  if (!list.children.length) {
    const empty = document.createElement('p');
    empty.className = 'header-navigation-editor-empty';
    empty.textContent = 'Add a Main Navigation Link to start the menu.';
    list.append(empty);
  }

  editor.append(intro, list);
  return editor;
}

function isAuthoring(block, itemRows) {
  return block.hasAttribute('data-aue-resource')
    || itemRows.some((row) => row.hasAttribute('data-aue-resource'));
}

/**
 * Keep Universal Editor items as flat, independently selectable cards while
 * projecting the ordered items into a semantic list for delivery/header parsing.
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
  const list = buildSemanticList(items, actionLabel);
  const authoring = isAuthoring(block, itemRows);

  block.dataset.headerNavigation = 'true';
  block.dataset.headerNavigationView = authoring ? 'author' : 'delivery';
  if (authoring) {
    list.classList.add('header-navigation-delivery-projection');
    list.hidden = true;
    block.replaceChildren(buildEditor(items, actionLabel), list);
  } else {
    block.replaceChildren(list);
  }
}
