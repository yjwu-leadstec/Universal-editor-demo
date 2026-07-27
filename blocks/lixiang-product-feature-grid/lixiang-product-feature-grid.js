import {
  addBlockAnchor,
  createMedia,
  createProductLink,
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
  card.className = 'lixiang-product-feature-grid-card';
  const { element: media } = createMedia(item, {
    autoplay: true,
    showControls: true,
    showProgress: true,
  });
  card.append(media);

  const copy = document.createElement('div');
  copy.className = 'lixiang-product-feature-grid-copy';
  const title = propText(item, 'title');
  if (title) {
    const heading = document.createElement('h3');
    heading.textContent = title;
    instrumentProp(item, 'title', heading);
    copy.append(heading);
  }
  const descriptionSource = propSource(item, 'description');
  if (descriptionSource?.textContent.trim()) {
    const description = createRichText(descriptionSource, 'lixiang-product-feature-grid-description');
    instrumentProp(item, 'description', description);
    copy.append(description);
  }
  const link = createProductLink(item);
  if (link) copy.append(link);
  if (copy.childElementCount) card.append(copy);
  moveItemInstrumentation(item, card);
  return card;
}

function createGroup(group, items) {
  const section = document.createElement('section');
  section.className = 'lixiang-product-feature-grid-group';
  const title = group ? propText(group, 'title') : '';
  if (title) {
    const heading = document.createElement('h3');
    heading.className = 'lixiang-product-feature-grid-group-title';
    heading.textContent = title;
    instrumentProp(group, 'title', heading);
    section.append(heading);
  }
  const grid = document.createElement('div');
  grid.className = 'lixiang-product-feature-grid-list';
  items.forEach((item) => grid.append(createCard(item)));
  section.append(grid);
  if (group) moveItemInstrumentation(group, section);
  return section;
}

export default function decorate(block) {
  initProductBlock(block);
  const shell = document.createElement('div');
  shell.className = 'lixiang-product-feature-grid-shell';
  const header = createSectionHeader(block);
  if (header.childElementCount) shell.append(header);

  const groups = modelItems(block, 'lixiang-product-feature-grid-group');
  if (groups.length) {
    groups.forEach((group) => {
      const items = modelItems(group, 'lixiang-product-feature-grid-item');
      if (items.length) shell.append(createGroup(group, items));
    });
  } else {
    const items = modelItems(block, 'lixiang-product-feature-grid-item');
    if (items.length) shell.append(createGroup(null, items));
  }

  const note = propText(block, 'note');
  if (note) {
    const element = document.createElement('p');
    element.className = 'lixiang-product-feature-grid-note';
    element.textContent = note;
    instrumentProp(block, 'note', element);
    shell.append(element);
  }
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  revealElements(block, '.product-section-header, .lixiang-product-feature-grid-group-title, .lixiang-product-feature-grid-card, .lixiang-product-feature-grid-note');
}
