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
  let valuesTitle = propText(block, 'values_title');
  let valuesDescSource = propSource(block, 'values_description');
  let valuesPicture = propPicture(block, 'values_image');
  let valuesMobilePicture = propPicture(block, 'values_mobileImage');
  if (!valuesTitle && !valuesDescSource && !valuesPicture) {
    const valuesGroup = propSource(block, 'values');
    if (valuesGroup) {
      const cell = valuesGroup.querySelector('div') || valuesGroup;
      const texts = [...cell.children].filter(
        (el) => !el.querySelector('picture') && el.textContent.trim(),
      );
      const pics = [...cell.querySelectorAll('picture')];
      const [first, second] = texts;
      const [desktopPic, mobilePic] = pics;
      if (first) valuesTitle = first.textContent.trim();
      if (second) valuesDescSource = second;
      if (desktopPic) valuesPicture = desktopPic;
      if (mobilePic) valuesMobilePicture = mobilePic;
    }
  }

  const inner = document.createElement('div');
  inner.className = 'lixiang-about-creativity-inner';

  const header = document.createElement('div');
  header.className = 'lixiang-about-creativity-header';
  if (title) {
    const heading = document.createElement('h2');
    heading.textContent = title;
    instrumentProp(block, 'title', heading);
    header.append(heading);
  }
  if (subtitle) {
    const desc = createRichText(propSource(block, 'subtitle'), 'lixiang-about-creativity-subtitle');
    instrumentProp(block, 'subtitle', desc);
    header.append(desc);
  }

  const items = modelItems(block, 'lixiang-about-creativity-card');
  const grid = document.createElement('div');
  grid.className = 'lixiang-about-creativity-grid';
  items.forEach((item) => {
    const picture = propPicture(item, 'image');
    const imageAlt = propText(item, 'imageAlt');
    const mobilePicture = propPicture(item, 'mobileImage');
    const mobileAlt = propText(item, 'mobileImageAlt');
    const cardTitle = propText(item, 'title');
    const descSource = propSource(item, 'description');

    const card = document.createElement('div');
    card.className = 'lixiang-about-creativity-card';

    const media = document.createElement('div');
    media.className = 'lixiang-about-creativity-card-media';
    if (picture) {
      const img = picture.querySelector('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, imageAlt || '', false, [{ width: '1200' }]);
        optimized.classList.add('tier-desktop');
        media.append(optimized);
      }
    }
    if (mobilePicture) {
      const img = mobilePicture.querySelector('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, mobileAlt || imageAlt || '', false, [{ width: '750' }]);
        optimized.classList.add('tier-mobile');
        media.append(optimized);
      }
    }

    const content = document.createElement('div');
    content.className = 'lixiang-about-creativity-card-content';
    if (cardTitle) {
      const heading = document.createElement('h3');
      heading.textContent = cardTitle;
      instrumentProp(item, 'title', heading);
      content.append(heading);
    }
    if (descSource) {
      const desc = createRichText(descSource, 'lixiang-about-creativity-card-description');
      instrumentProp(item, 'description', desc);
      content.append(desc);
    }

    card.append(content, media);
    moveItemInstrumentation(item, card);
    grid.append(card);
  });

  const valuesAlt = propText(block, 'values_imageAlt');
  const values = document.createElement('div');
  values.className = 'lixiang-about-creativity-values';
  const valuesBand = document.createElement('div');
  valuesBand.className = 'lixiang-about-creativity-values-band';
  if (valuesTitle) {
    const heading = document.createElement('h3');
    heading.textContent = valuesTitle;
    instrumentProp(block, 'values_title', heading);
    valuesBand.append(heading);
  }
  if (valuesDescSource?.textContent.trim()) {
    const desc = createRichText(valuesDescSource, 'lixiang-about-creativity-values-description');
    instrumentProp(block, 'values_description', desc);
    valuesBand.append(desc);
  }
  values.append(valuesBand);
  if (valuesPicture || valuesMobilePicture) {
    const valuesMedia = document.createElement('div');
    valuesMedia.className = 'lixiang-about-creativity-values-media';
    if (valuesPicture) {
      const img = valuesPicture.querySelector('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, valuesAlt || '', false, [
          { width: '1920' }, { width: '1200' }, { width: '768' },
        ]);
        optimized.classList.add('tier-desktop');
        valuesMedia.append(optimized);
      }
    }
    if (valuesMobilePicture) {
      const img = valuesMobilePicture.querySelector('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, valuesAlt || '', false, [{ width: '750' }]);
        optimized.classList.add('tier-mobile');
        valuesMedia.append(optimized);
      }
    }
    values.append(valuesMedia);
  }

  inner.append(header, grid, values);
  block.textContent = '';
  block.append(inner);
  animateAboutBlock(block, { containers: [header, ...grid.children, values] });
}
