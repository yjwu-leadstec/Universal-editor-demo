import {
  addBlockAnchor,
  createMedia,
  createProductLink,
  createRichText,
  initProductBlock,
  instrumentProp,
  modelItems,
  moveItemInstrumentation,
  propSource,
  propText,
  revealElements,
} from '../../scripts/product-block-utils.js';

function createGuideCard(item) {
  const card = document.createElement('article');
  card.className = 'product-guide-card';
  const { element: media } = createMedia(item, {
    autoplay: false,
    showControls: false,
    showProgress: false,
  });
  const copy = document.createElement('div');
  copy.className = 'product-guide-copy';
  const title = propText(item, 'title');
  if (title) {
    const heading = document.createElement('h3');
    heading.textContent = title;
    instrumentProp(item, 'title', heading);
    copy.append(heading);
  }
  const descriptionSource = propSource(item, 'description');
  if (descriptionSource?.textContent.trim()) {
    const description = createRichText(descriptionSource, 'product-guide-description');
    instrumentProp(item, 'description', description);
    copy.append(description);
  }
  const link = createProductLink(item);
  if (link) copy.append(link);
  card.append(media, copy);
  moveItemInstrumentation(item, card);
  return card;
}

export default function decorate(block) {
  initProductBlock(block);
  const shell = document.createElement('div');
  shell.className = 'product-guide-shell';
  const title = propText(block, 'title');
  if (title) {
    const heading = document.createElement('h2');
    heading.textContent = title;
    instrumentProp(block, 'title', heading);
    shell.append(heading);
  }
  const list = document.createElement('div');
  list.className = 'product-guide-list';
  modelItems(block, 'product-guide-item').forEach((item) => list.append(createGuideCard(item)));
  if (list.childElementCount) shell.append(list);
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  revealElements(block, '.product-guide-card');
}
