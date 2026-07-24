import {
  addBlockAnchor,
  createMedia,
  createRichText,
  createSectionHeader,
  initProductBlock,
  instrumentProp,
  modelItems,
  moveItemInstrumentation,
  propSource,
  propText,
  revealElements,
} from '../../scripts/product-block-utils.js';

function createCard(item) {
  const card = document.createElement('article');
  card.className = 'product-feature-picture-group-card';
  const { element: media } = createMedia(item, { fallbackLabel: '图片' });
  card.append(media);

  const copy = document.createElement('div');
  copy.className = 'product-feature-picture-group-copy';
  const title = propText(item, 'title');
  if (title) {
    const heading = document.createElement('h3');
    heading.textContent = title;
    instrumentProp(item, 'title', heading);
    copy.append(heading);
  }
  const descriptionSource = propSource(item, 'description');
  if (descriptionSource?.textContent.trim()) {
    const description = createRichText(descriptionSource, 'product-feature-picture-group-description');
    instrumentProp(item, 'description', description);
    copy.append(description);
  }
  if (copy.childElementCount) card.append(copy);
  moveItemInstrumentation(item, card);
  return card;
}

function createGroup(group, items) {
  const section = document.createElement('section');
  section.className = 'product-feature-picture-group-group';
  const title = group ? propText(group, 'title') : '';
  if (title) {
    const heading = document.createElement('h3');
    heading.className = 'product-feature-picture-group-group-title';
    heading.textContent = title;
    instrumentProp(group, 'title', heading);
    section.append(heading);
  }
  const grid = document.createElement('div');
  grid.className = 'product-feature-picture-group-list';
  items.forEach((item) => grid.append(createCard(item)));
  section.append(grid);
  if (group) moveItemInstrumentation(group, section);
  return section;
}

export default function decorate(block) {
  initProductBlock(block);
  const shell = document.createElement('div');
  shell.className = 'product-feature-picture-group-shell';
  const header = createSectionHeader(block);
  if (header.childElementCount) shell.append(header);

  const groups = modelItems(block, 'product-feature-picture-group-group');
  if (groups.length) {
    groups.forEach((group) => {
      const items = modelItems(group, 'product-feature-picture-group-card');
      if (items.length) shell.append(createGroup(group, items));
    });
  } else {
    const items = modelItems(block, 'product-feature-picture-group-card');
    if (items.length) shell.append(createGroup(null, items));
  }

  const note = propText(block, 'note');
  if (note) {
    const element = document.createElement('p');
    element.className = 'product-feature-picture-group-note';
    element.textContent = note;
    instrumentProp(block, 'note', element);
    shell.append(element);
  }

  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  revealElements(
    block,
    '.product-section-header, .product-feature-picture-group-group-title, .product-feature-picture-group-card, .product-feature-picture-group-note',
  );
}
