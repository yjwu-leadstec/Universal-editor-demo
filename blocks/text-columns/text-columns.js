import {
  addBlockAnchor,
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

export default function decorate(block) {
  initProductBlock(block);
  const shell = document.createElement('div');
  shell.className = 'text-columns-shell';
  const header = createSectionHeader(block);
  if (header.childElementCount) shell.append(header);
  const list = document.createElement('div');
  list.className = 'text-columns-list';
  modelItems(block, 'text-column-item').forEach((item) => {
    const article = document.createElement('article');
    article.className = 'text-column';
    const title = propText(item, 'title');
    if (title) {
      const heading = document.createElement('h3');
      heading.textContent = title;
      instrumentProp(item, 'title', heading);
      article.append(heading);
    }
    const source = propSource(item, 'text');
    if (source?.textContent.trim()) {
      const text = createRichText(source, 'text-column-copy');
      instrumentProp(item, 'text', text);
      article.append(text);
    }
    moveItemInstrumentation(item, article);
    list.append(article);
  });
  if (list.childElementCount) shell.append(list);
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  revealElements(block, '.product-section-header, .text-column');
}
