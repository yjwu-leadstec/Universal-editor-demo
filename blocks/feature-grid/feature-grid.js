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
  card.className = 'feature-grid-card';
  const { element: media } = createMedia(item, {
    autoplay: true,
    showControls: true,
    showProgress: true,
  });
  card.append(media);

  const copy = document.createElement('div');
  copy.className = 'feature-grid-copy';
  const title = propText(item, 'title');
  if (title) {
    const heading = document.createElement('h3');
    heading.textContent = title;
    instrumentProp(item, 'title', heading);
    copy.append(heading);
  }
  const descriptionSource = propSource(item, 'description');
  if (descriptionSource?.textContent.trim()) {
    const description = createRichText(descriptionSource, 'feature-grid-description');
    instrumentProp(item, 'description', description);
    copy.append(description);
  }
  const link = createProductLink(item);
  if (link) copy.append(link);
  if (copy.childElementCount) card.append(copy);
  moveItemInstrumentation(item, card);
  return card;
}

export default function decorate(block) {
  initProductBlock(block);
  const shell = document.createElement('div');
  shell.className = 'feature-grid-shell';
  const header = createSectionHeader(block);
  if (header.childElementCount) shell.append(header);

  const grid = document.createElement('div');
  grid.className = 'feature-grid-list';
  modelItems(block, 'feature-grid-item').forEach((item) => grid.append(createCard(item)));
  if (grid.childElementCount) shell.append(grid);

  const note = propText(block, 'note');
  if (note) {
    const element = document.createElement('p');
    element.className = 'feature-grid-note';
    element.textContent = note;
    instrumentProp(block, 'note', element);
    shell.append(element);
  }
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  revealElements(block, '.product-section-header, .feature-grid-card, .feature-grid-note');
}
