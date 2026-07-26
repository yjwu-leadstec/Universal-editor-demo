import {
  initAboutBlock,
  propText,
  propPicture,
  propSource,
  instrumentProp,
  modelItems,
  moveItemInstrumentation,
  createRichText,
  animateAboutBlock,
} from '../../scripts/about-block-utils.js';
import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  initAboutBlock(block);
  const title = propText(block, 'title');
  const subtitle = propText(block, 'subtitle');

  const inner = document.createElement('div');
  inner.className = 'lixiang-about-create-together-inner';

  const header = document.createElement('div');
  header.className = 'lixiang-about-create-together-header';
  if (title) {
    const heading = document.createElement('h2');
    heading.textContent = title;
    instrumentProp(block, 'title', heading);
    header.append(heading);
  }
  if (subtitle) {
    const desc = createRichText(
      propSource(block, 'subtitle'),
      'lixiang-about-create-together-subtitle',
    );
    instrumentProp(block, 'subtitle', desc);
    header.append(desc);
  }

  const items = modelItems(block, 'lixiang-about-create-together-card');
  const grid = document.createElement('div');
  grid.className = 'lixiang-about-create-together-grid';
  items.forEach((item) => {
    const picture = propPicture(item, 'image');
    const imageAlt = propText(item, 'imageAlt');
    const cardTitle = propText(item, 'title');
    const descSource = propSource(item, 'description');
    const footnote = propText(item, 'footnote');

    const card = document.createElement('div');
    card.className = 'lixiang-about-create-together-card';

    const content = document.createElement('div');
    content.className = 'lixiang-about-create-together-card-content';
    if (cardTitle) {
      const heading = document.createElement('h3');
      heading.textContent = cardTitle;
      instrumentProp(item, 'title', heading);
      content.append(heading);
    }
    if (descSource) {
      const desc = createRichText(descSource, 'lixiang-about-create-together-card-description');
      instrumentProp(item, 'description', desc);
      content.append(desc);
    }

    const media = document.createElement('div');
    media.className = 'lixiang-about-create-together-card-media';
    if (picture) {
      const img = picture.querySelector('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, imageAlt || '', false, [{ width: '768' }]);
        media.append(optimized);
      }
    }

    const footnoteEl = document.createElement('p');
    footnoteEl.className = 'lixiang-about-create-together-card-footnote';
    if (footnote) {
      footnoteEl.textContent = footnote;
      instrumentProp(item, 'footnote', footnoteEl);
    }

    media.append(footnoteEl);
    card.append(content, media);
    moveItemInstrumentation(item, card);
    grid.append(card);
  });

  inner.append(header, grid);
  block.textContent = '';
  block.append(inner);
  animateAboutBlock(block, { containers: [header, ...grid.children] });
}
