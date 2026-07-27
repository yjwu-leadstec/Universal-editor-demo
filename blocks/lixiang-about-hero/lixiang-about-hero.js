import {
  initAboutBlock,
  propText,
  propPicture,
  propSource,
  instrumentProp,
  animateAboutBlock,
} from '../../scripts/about-block-utils.js';
import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  initAboutBlock(block);
  const title = propText(block, 'title');
  const subtitle = propText(block, 'subtitle');
  const desktopPicture = propPicture(block, 'image');
  const imageCell = propSource(block, 'image');
  const imageCellPics = imageCell ? [...imageCell.querySelectorAll('picture')] : [];
  const padPicture = imageCellPics[1] || propPicture(block, 'image_pad');
  const mobilePicture = propPicture(block, 'mobileImage');
  const desktopAlt = propText(block, 'imageAlt');
  const padAlt = propText(block, 'image_padAlt');
  const mobileAlt = propText(block, 'mobileImageAlt');

  const media = document.createElement('div');
  media.className = 'lixiang-about-hero-media';
  if (desktopPicture) {
    const img = desktopPicture.querySelector('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, desktopAlt || '', true, [
        { width: '1920' },
        { width: '1200' },
        { width: '768' },
      ]);
      optimized.classList.add('lixiang-about-hero-bg-desktop');
      media.append(optimized);
    }
  }
  if (padPicture) {
    const img = padPicture.querySelector('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, padAlt || '', true, [
        { width: '1200' },
        { width: '768' },
      ]);
      optimized.classList.add('lixiang-about-hero-bg-pad');
      media.append(optimized);
    }
  }
  if (mobilePicture) {
    const img = mobilePicture.querySelector('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, mobileAlt || '', false, [
        { width: '750' },
      ]);
      optimized.classList.add('lixiang-about-hero-bg-mobile');
      media.append(optimized);
    }
  }

  const copy = document.createElement('div');
  copy.className = 'lixiang-about-hero-copy';
  if (title) {
    const heading = document.createElement('h1');
    heading.textContent = title;
    instrumentProp(block, 'title', heading);
    copy.append(heading);
  }
  if (subtitle) {
    const paragraph = document.createElement('p');
    paragraph.textContent = subtitle;
    instrumentProp(block, 'subtitle', paragraph);
    copy.append(paragraph);
  }

  block.textContent = '';
  block.append(media, copy);
  animateAboutBlock(block, { items: [...copy.children] });
}
