import {
  initAboutBlock,
  propText,
  propPicture,
  propSource,
  instrumentProp,
  modelItems,
  moveItemInstrumentation,
  createRichText,
} from '../../scripts/about-block-utils.js';
import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  initAboutBlock(block);
  const title = propText(block, 'title');
  const subtitle = propText(block, 'subtitle');
  const largePicture = propPicture(block, 'largeImage');
  const largeAlt = propText(block, 'largeImageAlt');

  const inner = document.createElement('div');
  inner.className = 'about-design-inner';

  const header = document.createElement('div');
  header.className = 'about-design-header';
  if (title) {
    const heading = document.createElement('h2');
    heading.textContent = title;
    instrumentProp(block, 'title', heading);
    header.append(heading);
  }
  if (subtitle) {
    const desc = createRichText(propSource(block, 'subtitle'), 'about-design-subtitle');
    instrumentProp(block, 'subtitle', desc);
    header.append(desc);
  }

  const heroMedia = document.createElement('div');
  heroMedia.className = 'about-design-hero-media';
  if (largePicture) {
    const img = largePicture.querySelector('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, largeAlt || '', false, [
        { width: '1920' }, { width: '1200' }, { width: '768' },
      ]);
      heroMedia.append(optimized);
    }
  }

  const items = modelItems(block, 'lixiang-about-design-card');
  const grid = document.createElement('div');
  grid.className = 'about-design-grid';
  items.forEach((item) => {
    const picture = propPicture(item, 'image');
    const imageAlt = propText(item, 'imageAlt');
    const cardTitle = propText(item, 'title');
    const descSource = propSource(item, 'description');

    const card = document.createElement('div');
    card.className = 'lixiang-about-design-card';

    const media = document.createElement('div');
    media.className = 'lixiang-about-design-card-media';
    if (picture) {
      const img = picture.querySelector('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, imageAlt || '', false, [{ width: '768' }]);
        media.append(optimized);
      }
    }

    const overlay = document.createElement('div');
    overlay.className = 'lixiang-about-design-card-overlay';

    const content = document.createElement('div');
    content.className = 'lixiang-about-design-card-content';
    if (cardTitle) {
      const heading = document.createElement('h3');
      heading.textContent = cardTitle;
      content.append(heading);
    }
    if (descSource) {
      const desc = createRichText(descSource);
      content.append(desc);
    }

    card.append(media, overlay, content);
    moveItemInstrumentation(item, card);
    grid.append(card);
  });

  inner.append(header, heroMedia, grid);
  block.textContent = '';
  block.append(inner);
}
