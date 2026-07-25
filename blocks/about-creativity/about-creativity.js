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
  const valuesTitle = propText(block, 'valuesTitle');
  const valuesDescSource = propSource(block, 'valuesDescription');

  const inner = document.createElement('div');
  inner.className = 'about-creativity-inner';

  const header = document.createElement('div');
  header.className = 'about-creativity-header';
  if (title) {
    const heading = document.createElement('h2');
    heading.textContent = title;
    instrumentProp(block, 'title', heading);
    header.append(heading);
  }
  if (subtitle) {
    const desc = createRichText(propSource(block, 'subtitle'), 'about-creativity-subtitle');
    instrumentProp(block, 'subtitle', desc);
    header.append(desc);
  }

  const items = modelItems(block, 'about-creativity-card');
  const grid = document.createElement('div');
  grid.className = 'about-creativity-grid';
  items.forEach((item) => {
    const picture = propPicture(item, 'image');
    const imageAlt = propText(item, 'imageAlt');
    const cardTitle = propText(item, 'title');
    const descSource = propSource(item, 'description');

    const card = document.createElement('div');
    card.className = 'about-creativity-card';

    const media = document.createElement('div');
    media.className = 'about-creativity-card-media';
    if (picture) {
      const img = picture.querySelector('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, imageAlt || '', false, [{ width: '1200' }]);
        media.append(optimized);
      }
    }

    const overlay = document.createElement('div');
    overlay.className = 'about-creativity-card-overlay';

    const content = document.createElement('div');
    content.className = 'about-creativity-card-content';
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

  const values = document.createElement('div');
  values.className = 'about-creativity-values';
  if (valuesTitle) {
    const heading = document.createElement('h3');
    heading.textContent = valuesTitle;
    instrumentProp(block, 'valuesTitle', heading);
    values.append(heading);
  }
  if (valuesDescSource?.textContent.trim()) {
    const desc = createRichText(valuesDescSource);
    instrumentProp(block, 'valuesDescription', desc);
    values.append(desc);
  }

  inner.append(header, grid, values);
  block.textContent = '';
  block.append(inner);
}
