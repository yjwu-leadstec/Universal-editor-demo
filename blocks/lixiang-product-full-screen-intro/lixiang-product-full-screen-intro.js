import {
  addBlockAnchor,
  createMedia,
  createRichText,
  initProductBlock,
  instrumentProp,
  openVideoDialog,
  propBoolean,
  propSource,
  propText,
  propUrl,
  revealElements,
} from '../../scripts/product-block-utils.js';

export default function decorate(block) {
  initProductBlock(block);
  const shell = document.createElement('div');
  shell.className = 'lixiang-product-full-screen-intro-shell';
  const { element: media } = createMedia(block, {
    eager: false,
    loop: propBoolean(block, 'loop', true),
    showControls: propBoolean(block, 'showVideoControl', true),
    showProgress: propBoolean(block, 'showProgress', true),
    fallbackLabel: propText(block, 'title') || propText(block, 'mobileTitle') || propText(block, 'eyebrow') || 'Vehicle',
  });
  const copy = document.createElement('div');
  copy.className = 'lixiang-product-full-screen-intro-copy';
  const eyebrow = propText(block, 'eyebrow');
  const title = propText(block, 'title');
  if (eyebrow) {
    const element = document.createElement('p');
    element.className = 'lixiang-product-full-screen-intro-eyebrow';
    element.textContent = eyebrow;
    instrumentProp(block, 'eyebrow', element);
    copy.append(element);
  }
  const mobileTitle = propText(block, 'mobileTitle');
  if (title) {
    const heading = document.createElement('h2');
    heading.className = 'lixiang-product-full-screen-intro-title lixiang-product-full-screen-intro-title-desktop';
    heading.textContent = title;
    instrumentProp(block, 'title', heading);
    copy.append(heading);
  }
  if (mobileTitle) {
    const heading = document.createElement('h2');
    heading.className = 'lixiang-product-full-screen-intro-title lixiang-product-full-screen-intro-title-mobile';
    heading.textContent = mobileTitle;
    instrumentProp(block, 'mobileTitle', heading);
    copy.append(heading);
  }
  const descriptionSource = propSource(block, 'description');
  if (descriptionSource?.textContent.trim()) {
    const description = createRichText(descriptionSource, 'lixiang-product-full-screen-intro-description');
    instrumentProp(block, 'description', description);
    copy.append(description);
  }
  const fullVideo = propUrl(block, 'fullVideo');
  const playLabel = propText(block, 'playLabel');
  if (fullVideo && playLabel) {
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'lixiang-product-full-screen-intro-play';
    play.textContent = playLabel;
    play.addEventListener('click', () => openVideoDialog(
      fullVideo,
      play,
      `${title || mobileTitle || eyebrow || 'Vehicle'} video`,
    ));
    instrumentProp(block, 'fullVideo', play);
    copy.append(play);
  }
  const note = propText(block, 'note');
  if (note) {
    const element = document.createElement('p');
    element.className = 'lixiang-product-full-screen-intro-note';
    element.textContent = note;
    instrumentProp(block, 'note', element);
    copy.append(element);
  }
  shell.append(media, copy);
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  revealElements(block, '.lixiang-product-full-screen-intro-copy');
}
