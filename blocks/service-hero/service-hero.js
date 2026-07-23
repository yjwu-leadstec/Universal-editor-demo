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
} from '../../scripts/service-block-utils.js';

function combineNodes(nodes) {
  if (!nodes || nodes.length === 0) return null;
  const wrapper = document.createElement('div');
  nodes.forEach((node) => wrapper.append(node.cloneNode(true)));
  return wrapper;
}

export default function decorate(block) {
  const rows = directRows(block);
  const availablePictures = pictures(rows);

  // Collect plain text paragraphs from the block (crosswalk delivers them as <p>s without data-aue-prop).
  const textParagraphs = rows
    .flatMap((row) => [...row.querySelectorAll('p')])
    .filter((p) => p.textContent.trim());

  // Prefer explicit property rows (UE inline editing), fallback to semantic order.
  const eyebrowSource = propSource(rows, 'copy_eyebrow') || textParagraphs[0] || null;
  const titleSource = propSource(rows, 'copy_title') || textParagraphs[1] || null;
  const descriptionSource = propSource(rows, 'copy_description')
    || combineNodes(textParagraphs.slice(2))
    || null;

  const image = propPicture(rows, 'media_image', 'media_imageAlt') || availablePictures[0] || null;
  const mobileImage = propPicture(rows, 'media_mobileImage', 'media_mobileImageAlt')
    || availablePictures[1]
    || null;

  const eyebrow = propText(rows, 'copy_eyebrow') || eyebrowSource?.textContent.trim() || '';
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
