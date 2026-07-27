import {
  addBlockAnchor,
  appendPicture,
  createHeading,
  createMedia,
  createProductLink,
  initProductBlock,
  instrumentProp,
  modelItems,
  moveItemInstrumentation,
  prefersReducedMotion,
  propBoolean,
  propPicture,
  propText,
  revealElements,
} from '../../scripts/product-block-utils.js';

function nextProductContent(block) {
  let candidate = block.parentElement?.nextElementSibling;
  while (candidate?.classList.contains('lixiang-product-sticky-nav-wrapper')) {
    candidate = candidate.nextElementSibling;
  }
  return candidate || block.closest('.section')?.nextElementSibling;
}

export default function decorate(block) {
  initProductBlock(block);
  const title = propText(block, 'title');
  const mobileTitle = propText(block, 'mobileTitle');
  const subtitle = propText(block, 'subtitle');
  const shell = document.createElement('div');
  shell.className = 'lixiang-product-hero-shell';
  const { element: media } = createMedia(block, {
    eager: true,
    showControls: propBoolean(block, 'showVideoControl', true),
    showProgress: propBoolean(block, 'showProgress', true),
    fallbackLabel: title || mobileTitle || propText(block, 'logoAlt') || 'Vehicle',
  });

  const copy = document.createElement('div');
  copy.className = 'lixiang-product-hero-copy';
  const logoPicture = propPicture(block, 'logo');
  if (logoPicture) {
    copy.classList.add('has-logo');
    const logo = document.createElement('div');
    logo.className = 'lixiang-product-hero-logo';
    appendPicture(logo, logoPicture, {
      alt: propText(block, 'logoAlt'),
      loading: 'eager',
      fallbackLabel: title || mobileTitle || propText(block, 'logoAlt') || 'Vehicle',
    });
    instrumentProp(block, 'logo', logo);
    copy.append(logo);
  }
  if (title) {
    const heading = createHeading(title, 1, 'lixiang-product-hero-title lixiang-product-hero-title-desktop');
    instrumentProp(block, 'title', heading);
    copy.append(heading);
  }
  if (mobileTitle) {
    const heading = createHeading(mobileTitle, 1, 'lixiang-product-hero-title lixiang-product-hero-title-mobile');
    instrumentProp(block, 'mobileTitle', heading);
    copy.append(heading);
  }
  if (subtitle) {
    const element = document.createElement('p');
    element.className = 'lixiang-product-hero-subtitle';
    element.textContent = subtitle;
    instrumentProp(block, 'subtitle', element);
    copy.append(element);
  }

  const links = document.createElement('div');
  links.className = 'lixiang-product-hero-links';
  modelItems(block, 'lixiang-product-hero-cta').forEach((item) => {
    const link = createProductLink(item);
    if (!link) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'lixiang-product-hero-link';
    wrapper.append(link);
    moveItemInstrumentation(item, wrapper);
    links.append(wrapper);
  });
  if (links.childElementCount) copy.append(links);

  shell.append(media, copy);
  if (propBoolean(block, 'showArrow', true)) {
    const cue = document.createElement('button');
    cue.type = 'button';
    cue.className = 'lixiang-product-hero-scroll';
    cue.setAttribute('aria-label', 'Scroll to product highlights');
    cue.addEventListener('click', () => nextProductContent(block)?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    }));
    instrumentProp(block, 'showArrow', cue);
    shell.append(cue);
  }
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  revealElements(block, '.lixiang-product-hero-copy');
}
