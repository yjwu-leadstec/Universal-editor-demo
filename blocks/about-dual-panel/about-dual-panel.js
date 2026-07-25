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
  inner.className = 'about-dual-panel-inner';

  const header = document.createElement('div');
  header.className = 'about-dual-panel-header';
  if (title) {
    const heading = document.createElement('h2');
    heading.textContent = title;
    instrumentProp(block, 'title', heading);
    header.append(heading);
  }
  if (subtitle) {
    const desc = createRichText(propSource(block, 'subtitle'), 'about-dual-panel-subtitle');
    instrumentProp(block, 'subtitle', desc);
    header.append(desc);
  }

  const items = modelItems(block, 'about-dual-panel-item');
  const grid = document.createElement('div');
  grid.className = 'about-dual-panel-grid';
  items.forEach((item) => {
    const picture = propPicture(item, 'image');
    const imageAlt = propText(item, 'imageAlt');
    const itemTitle = propText(item, 'title');
    const descSource = propSource(item, 'description');
    const footnote = propText(item, 'footnote');

    const card = document.createElement('div');
    card.className = 'about-dual-panel-card';

    const media = document.createElement('div');
    media.className = 'about-dual-panel-card-media';
    if (picture) {
      const img = picture.querySelector('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, imageAlt || '', false, [
          { width: '1200' }, { width: '768' },
        ]);
        media.append(optimized);
      }
    }

    const overlay = document.createElement('div');
    overlay.className = 'about-dual-panel-card-overlay';

    const content = document.createElement('div');
    content.className = 'about-dual-panel-card-content';
    if (itemTitle) {
      const heading = document.createElement('h3');
      heading.textContent = itemTitle;
      content.append(heading);
    }
    if (descSource) {
      const desc = createRichText(descSource);
      content.append(desc);
    }
    if (footnote) {
      const note = document.createElement('p');
      note.className = 'about-dual-panel-card-footnote';
      note.textContent = footnote;
      content.append(note);
    }

    card.append(media, overlay, content);
    moveItemInstrumentation(item, card);
    grid.append(card);
  });

  inner.append(header, grid);
  block.textContent = '';
  block.append(inner);
}
