import {
  addBlockAnchor,
  createMedia,
  createProductLink,
  createSectionHeader,
  initProductBlock,
  revealElements,
} from '../../scripts/product-block-utils.js';

export default function decorate(block) {
  initProductBlock(block);
  const shell = document.createElement('div');
  shell.className = 'product-param-cta-shell';
  const copy = document.createElement('div');
  copy.className = 'product-param-cta-copy';
  const header = createSectionHeader(block);
  if (header.childElementCount) copy.append(header);
  const actions = document.createElement('div');
  actions.className = 'product-param-cta-actions';
  const primary = createProductLink(block);
  const secondary = createProductLink(block, 'secondary');
  if (primary) actions.append(primary);
  if (secondary) actions.append(secondary);
  if (actions.childElementCount) copy.append(actions);

  const { element: media } = createMedia(block, {
    autoplay: false,
    showControls: false,
    showProgress: false,
  });
  shell.append(copy, media);
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  revealElements(block, '.product-param-cta-copy, .product-media');
}
