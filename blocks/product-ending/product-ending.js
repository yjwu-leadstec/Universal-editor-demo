import {
  addBlockAnchor,
  createMedia,
  createProductLink,
  initProductBlock,
  instrumentProp,
  propBoolean,
  propText,
  revealElements,
} from '../../scripts/product-block-utils.js';

export default function decorate(block) {
  initProductBlock(block);
  const shell = document.createElement('div');
  shell.className = 'product-ending-shell';
  const { element: media } = createMedia(block, {
    eager: false,
    autoplay: true,
    showControls: propBoolean(block, 'showVideoControl', true),
    showProgress: true,
  });
  const copy = document.createElement('div');
  copy.className = 'product-ending-copy';
  const title = propText(block, 'title');
  if (title) {
    const heading = document.createElement('h2');
    heading.textContent = title;
    instrumentProp(block, 'title', heading);
    copy.append(heading);
  }
  const actions = document.createElement('div');
  actions.className = 'product-ending-actions';
  const primary = createProductLink(block);
  const secondary = createProductLink(block, 'secondary');
  if (primary) actions.append(primary);
  if (secondary) actions.append(secondary);
  if (actions.childElementCount) copy.append(actions);
  shell.append(media, copy);
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  revealElements(block, '.product-ending-copy');
}
