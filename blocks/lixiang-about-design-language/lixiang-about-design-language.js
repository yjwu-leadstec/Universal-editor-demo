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
  const largePicture = propPicture(block, 'largeImage');
  const largeAlt = propText(block, 'largeImageAlt');
  const largeCell = propSource(block, 'largeImage');
  const largeCellPics = largeCell ? [...largeCell.querySelectorAll('picture')] : [];
  const largeMobilePicture = propPicture(block, 'largeImage_mobileImage') || largeCellPics[1];

  const inner = document.createElement('div');
  inner.className = 'lixiang-about-design-language-inner';

  const header = document.createElement('div');
  header.className = 'lixiang-about-design-language-header';
  if (title) {
    const heading = document.createElement('h2');
    heading.textContent = title;
    instrumentProp(block, 'title', heading);
    header.append(heading);
  }
  if (subtitle) {
    const desc = createRichText(
      propSource(block, 'subtitle'),
      'lixiang-about-design-language-subtitle',
    );
    instrumentProp(block, 'subtitle', desc);
    header.append(desc);
  }

  const heroMedia = document.createElement('div');
  heroMedia.className = 'lixiang-about-design-language-hero-media';
  if (largePicture) {
    const img = largePicture.querySelector('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, largeAlt || '', false, [
        { width: '1920' }, { width: '1200' }, { width: '768' },
      ]);
      optimized.classList.add('tier-desktop');
      heroMedia.append(optimized);
    }
  }
  if (largeMobilePicture) {
    const img = largeMobilePicture.querySelector('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, largeAlt || '', false, [{ width: '750' }]);
      optimized.classList.add('tier-mobile');
      heroMedia.append(optimized);
    }
  }

  let bigTitle = propText(block, 'big_title');
  let bigDescSource = propSource(block, 'big_description');
  if (!bigTitle && !bigDescSource) {
    const bigGroup = propSource(block, 'big');
    if (bigGroup) {
      const cell = bigGroup.querySelector('div') || bigGroup;
      const texts = [...cell.children].filter((el) => el.textContent.trim());
      const [first, ...rest] = texts;
      if (first) bigTitle = first.textContent.trim();
      if (rest.length) {
        bigDescSource = document.createElement('div');
        bigDescSource.append(...rest.map((el) => el.cloneNode(true)));
      }
    }
  }
  if (bigTitle || bigDescSource) {
    const overlay = document.createElement('div');
    overlay.className = 'lixiang-about-design-language-hero-overlay';
    if (bigTitle) {
      const heading = document.createElement('h3');
      heading.textContent = bigTitle;
      instrumentProp(block, 'big_title', heading);
      overlay.append(heading);
    }
    if (bigDescSource) {
      const desc = createRichText(
        bigDescSource,
        'lixiang-about-design-language-hero-description',
      );
      instrumentProp(block, 'big_description', desc);
      overlay.append(desc);
    }
    heroMedia.append(overlay);
  }

  const items = modelItems(block, 'lixiang-about-design-card');
  const grid = document.createElement('div');
  grid.className = 'lixiang-about-design-language-grid';
  items.forEach((item) => {
    const picture = propPicture(item, 'image');
    const imageAlt = propText(item, 'imageAlt');
    const mobilePicture = propPicture(item, 'mobileImage');
    const cardTitle = propText(item, 'title');
    const descSource = propSource(item, 'description');

    const card = document.createElement('div');
    card.className = 'lixiang-about-design-card';

    const content = document.createElement('div');
    content.className = 'lixiang-about-design-card-content';
    if (cardTitle) {
      const heading = document.createElement('h3');
      heading.textContent = cardTitle;
      instrumentProp(item, 'title', heading);
      content.append(heading);
    }
    if (descSource) {
      const desc = createRichText(descSource, 'lixiang-about-design-card-description');
      instrumentProp(item, 'description', desc);
      content.append(desc);
    }

    const media = document.createElement('div');
    media.className = 'lixiang-about-design-card-media';
    if (picture) {
      const img = picture.querySelector('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, imageAlt || '', false, [{ width: '768' }]);
        optimized.classList.add('tier-desktop');
        media.append(optimized);
      }
    }
    if (mobilePicture) {
      const img = mobilePicture.querySelector('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, imageAlt || '', false, [{ width: '750' }]);
        optimized.classList.add('tier-mobile');
        media.append(optimized);
      }
    }

    card.append(media, content);
    moveItemInstrumentation(item, card);
    grid.append(card);
  });

  inner.append(header, heroMedia, grid);
  block.textContent = '';
  block.append(inner);
  animateAboutBlock(block, { containers: [header, heroMedia, ...grid.children] });
}
