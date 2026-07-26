import {
  initAboutBlock,
  propText,
  propPicture,
  instrumentProp,
  modelItems,
  moveItemInstrumentation,
} from '../../scripts/about-block-utils.js';
import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  initAboutBlock(block);
  const title = propText(block, 'title');
  const subtitle = propText(block, 'subtitle');
  const desktopPicture = propPicture(block, 'image');
  const mobilePicture = propPicture(block, 'mobileImage');
  const desktopAlt = propText(block, 'imageAlt');
  const mobileAlt = propText(block, 'mobileImageAlt');

  const media = document.createElement('div');
  media.className = 'lixiang-about-vehicle-showcase-media';
  if (desktopPicture) {
    const img = desktopPicture.querySelector('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, desktopAlt || '', true, [
        { width: '1920' }, { width: '1200' }, { width: '768' },
      ]);
      optimized.classList.add('lixiang-about-vehicle-showcase-bg-desktop');
      media.append(optimized);
    }
  }
  if (mobilePicture) {
    const img = mobilePicture.querySelector('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, mobileAlt || '', false, [{ width: '750' }]);
      optimized.classList.add('lixiang-about-vehicle-showcase-bg-mobile');
      media.append(optimized);
    }
  }

  const copy = document.createElement('div');
  copy.className = 'lixiang-about-vehicle-showcase-copy';
  if (title) {
    const heading = document.createElement('h2');
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

  const models = modelItems(block, 'lixiang-about-vehicle-model');
  if (models.length) {
    const list = document.createElement('div');
    list.className = 'lixiang-about-vehicle-models';
    models.forEach((item) => {
      const name = propText(item, 'modelName');
      const description = propText(item, 'description');
      if (!name && !description) return;
      const card = document.createElement('div');
      card.className = 'lixiang-about-vehicle-model';
      if (name) {
        const nameEl = document.createElement('p');
        nameEl.className = 'lixiang-about-vehicle-model-name';
        nameEl.textContent = name;
        instrumentProp(item, 'modelName', nameEl);
        card.append(nameEl);
      }
      if (description) {
        const descEl = document.createElement('p');
        descEl.className = 'lixiang-about-vehicle-model-desc';
        descEl.textContent = description;
        instrumentProp(item, 'description', descEl);
        card.append(descEl);
      }
      moveItemInstrumentation(item, card);
      list.append(card);
    });
    copy.append(list);
  }

  block.textContent = '';
  block.append(media, copy);
}
