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

  const inner = document.createElement('div');
  inner.className = 'about-together-inner';

  const header = document.createElement('div');
  header.className = 'about-together-header';
  if (title) {
    const heading = document.createElement('h2');
    heading.textContent = title;
    instrumentProp(block, 'title', heading);
    header.append(heading);
  }
  if (subtitle) {
    const desc = createRichText(propSource(block, 'subtitle'), 'about-together-subtitle');
    instrumentProp(block, 'subtitle', desc);
    header.append(desc);
  }

  const items = modelItems(block, 'lixiang-lixiang-about-create-together-card');
  const grid = document.createElement('div');
  grid.className = 'about-together-grid';
  items.forEach((item) => {
    const picture = propPicture(item, 'image');
    const imageAlt = propText(item, 'imageAlt');
    const cardTitle = propText(item, 'title');
    const descSource = propSource(item, 'description');
    const footnote = propText(item, 'footnote');

    const card = document.createElement('div');
    card.className = 'about-together-card';

    const media = document.createElement('div');
    media.className = 'about-together-card-media';
    if (picture) {
      const img = picture.querySelector('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, imageAlt || '', false, [{ width: '768' }]);
        media.append(optimized);
      }
    }

    const overlay = document.createElement('div');
    overlay.className = 'about-together-card-overlay';

    const content = document.createElement('div');
    content.className = 'about-together-card-content';
    if (cardTitle) {
      const heading = document.createElement('h3');
      heading.textContent = cardTitle;
      content.append(heading);
    }
    if (descSource) {
      const desc = createRichText(descSource);
      content.append(desc);
    }

    const footnoteEl = document.createElement('p');
    footnoteEl.className = 'about-together-card-footnote';
    if (footnote) {
      footnoteEl.textContent = footnote;
    }

    card.append(media, overlay, content, footnoteEl);
    moveItemInstrumentation(item, card);
    grid.append(card);
  });

  inner.append(header, grid);
  block.textContent = '';
  block.append(inner);
}
