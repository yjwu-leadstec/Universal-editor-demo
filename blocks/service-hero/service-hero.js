/* Li Auto Service hero block. */
import {
  addBlockAnchor,
  appendPicture,
  createHeading,
  createRichText,
  directRows,
  imageAlt,
  instrumentProp,
  pictures,
  propPicture,
  propSource,
  propText,
  revealElements,
  semanticSource,
  semanticSourceAfter,
  semanticSourceBefore,
} from '../../scripts/service-block-utils.js';

export default function decorate(block) {
  const rows = directRows(block);
  const availablePictures = pictures(rows);
  const titleSource = propSource(rows, 'copy_title') || semanticSource(rows, 'h1, h2');
  const descriptionSource = propSource(rows, 'copy_description')
    || semanticSourceAfter(rows, 'p', titleSource);
  const image = propPicture(rows, 'media_image') || availablePictures[0] || null;
  const mobileImage = propPicture(rows, 'media_mobileImage') || availablePictures[1] || null;
  const eyebrow = propText(rows, 'copy_eyebrow')
    || semanticSourceBefore(rows, 'p', titleSource)?.textContent.trim()
    || '';
  const title = propText(rows, 'copy_title') || titleSource?.textContent.trim() || '';
  const imageAltText = propText(rows, 'media_imageAlt') || imageAlt(image);
  const mobileImageAltText = propText(rows, 'media_mobileImageAlt') || imageAlt(mobileImage) || imageAltText;

  const shell = document.createElement('div');
  shell.className = 'support-hero-shell';

  const copy = document.createElement('div');
  copy.className = 'support-hero-copy';

  if (eyebrow) {
    const eyebrowElement = document.createElement('p');
    eyebrowElement.className = 'support-hero-eyebrow';
    eyebrowElement.textContent = eyebrow;
    instrumentProp(rows, 'copy_eyebrow', eyebrowElement);
    copy.append(eyebrowElement);
  }

  if (title) {
    const heading = createHeading(title, 1);
    instrumentProp(rows, 'copy_title', heading);
    copy.append(heading);
  }

  if (descriptionSource?.textContent.trim()) {
    const description = createRichText(descriptionSource, 'support-hero-description');
    instrumentProp(rows, 'copy_description', description);
    copy.append(description);
  }

  const media = document.createElement('div');
  media.className = 'support-hero-media';
  const desktopSlot = document.createElement('div');
  desktopSlot.className = 'support-hero-picture support-hero-picture-desktop';
  const desktopImage = appendPicture(desktopSlot, image, {
    alt: imageAltText, loading: 'eager', fallbackLabel: 'LI AUTO SERVICE',
  });
  instrumentProp(rows, 'media_image', desktopSlot);
  instrumentProp(rows, 'media_imageAlt', desktopImage);
  media.append(desktopSlot);

  if (mobileImage) {
    media.classList.add('has-mobile-media');
    const mobileSlot = document.createElement('div');
    mobileSlot.className = 'support-hero-picture support-hero-picture-mobile';
    const mobileImg = appendPicture(mobileSlot, mobileImage, {
      alt: mobileImageAltText,
      loading: 'eager',
      fallbackLabel: 'LI AUTO SERVICE',
    });
    instrumentProp(rows, 'media_mobileImage', mobileSlot);
    instrumentProp(rows, 'media_mobileImageAlt', mobileImg);
    media.append(mobileSlot);
  }

  shell.append(copy, media);
  block.replaceChildren(shell);
  addBlockAnchor(block, rows);
  revealElements(block, '.support-hero-copy, .support-hero-media');
}
