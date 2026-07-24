import decorateProductIntroCarousel from '../lixiang-product-intro-carousel/lixiang-product-intro-carousel.js';

export default function decorate(block) {
  if (!block.querySelector('[data-aue-prop], [data-aue-model]')) {
    block.dataset.blockName = 'feature-media-section';
  }
  block.classList.replace('feature-media-section', 'lixiang-product-intro-carousel');
  decorateProductIntroCarousel(block);
}
