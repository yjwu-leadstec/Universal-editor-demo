import {
  initAboutBlock,
  propText,
  propPicture,
  propUrl,
  instrumentProp,
} from '../../scripts/about-block-utils.js';
import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  initAboutBlock(block);
  const title = propText(block, 'title');
  const ctaText = propText(block, 'ctaText');
  const picture = propPicture(block, 'image');
  const imageAlt = propText(block, 'imageAlt');
  const videoUrl = propUrl(block, 'video');

  const inner = document.createElement('div');
  inner.className = 'lixiang-about-video-inner';

  if (title) {
    const heading = document.createElement('h2');
    heading.textContent = title;
    instrumentProp(block, 'title', heading);
    inner.append(heading);
  }

  const media = document.createElement('div');
  media.className = 'lixiang-about-video-media';
  if (picture) {
    const img = picture.querySelector('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, imageAlt || '', false, [
        { width: '1920' }, { width: '1200' }, { width: '768' },
      ]);
      media.append(optimized);
    }
  }
  if (ctaText && videoUrl) {
    const cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'lixiang-about-video-cta';
    const label = document.createElement('span');
    label.textContent = ctaText;
    cta.append(label);
    const icon = document.createElement('span');
    icon.className = 'lixiang-about-video-cta-icon';
    icon.setAttribute('aria-hidden', 'true');
    cta.append(icon);
    cta.addEventListener('click', () => {
      const dialog = document.createElement('dialog');
      dialog.className = 'lixiang-about-video-dialog';
      const video = document.createElement('video');
      video.src = videoUrl;
      video.controls = true;
      video.autoplay = true;
      dialog.append(video);
      document.body.append(dialog);
      dialog.showModal();
      dialog.addEventListener('close', () => dialog.remove());
    });
    instrumentProp(block, 'ctaText', cta);
    media.append(cta);
  }

  inner.append(media);
  block.textContent = '';
  block.append(inner);
}
