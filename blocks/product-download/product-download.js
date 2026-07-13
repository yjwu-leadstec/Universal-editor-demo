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
  shell.className = 'product-download-shell';
  const { element: media } = createMedia(block, {
    autoplay: false,
    showControls: false,
    showProgress: false,
  });
  const copy = document.createElement('div');
  copy.className = 'product-download-copy';
  const header = createSectionHeader(block);
  if (header.childElementCount) copy.append(header);
  const actions = document.createElement('div');
  actions.className = 'product-download-actions';
  const ios = createProductLink(block, 'ios');
  const android = createProductLink(block, 'android');
  if (ios) actions.append(ios);
  if (android) actions.append(android);
  if (actions.childElementCount) copy.append(actions);
  shell.append(media, copy);
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  revealElements(block, '.product-download-copy');
}
