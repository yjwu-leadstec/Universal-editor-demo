import {
  addBlockAnchor,
  appendPicture,
  createHeading,
  createRichText,
  directRows,
  imageAlt,
  instrumentProp,
  pictures,
  propAnchor,
  propPicture,
  propSource,
  propText,
  revealElements,
  semanticSource,
  semanticSourceAfter,
  semanticText,
} from '../../scripts/service-block-utils.js';

export default function decorate(block) {
  const rows = directRows(block);
  const shell = document.createElement('div');
  shell.className = 'support-bottom-shell';
  const media = document.createElement('div');
  media.className = 'support-bottom-media';
  const availablePictures = pictures(rows);
  const desktopPicture = propPicture(rows, 'media_image') || availablePictures[0] || null;
  const mobilePicture = propPicture(rows, 'media_mobileImage') || availablePictures[1] || null;
  const imageAltText = propText(rows, 'media_imageAlt') || imageAlt(desktopPicture);
  const mobileImageAltText = propText(rows, 'media_mobileImageAlt')
    || imageAlt(mobilePicture)
    || imageAltText;

  const desktopSlot = document.createElement('div');
  desktopSlot.className = 'support-bottom-picture support-bottom-picture-desktop';
  const desktopImage = appendPicture(desktopSlot, desktopPicture, {
    alt: imageAltText, fallbackLabel: 'LI AUTO SERVICE',
  });
  instrumentProp(rows, 'media_image', desktopSlot);
  instrumentProp(rows, 'media_imageAlt', desktopImage);
  media.append(desktopSlot);

  if (mobilePicture) {
    media.classList.add('has-mobile-media');
    const mobileSlot = document.createElement('div');
    mobileSlot.className = 'support-bottom-picture support-bottom-picture-mobile';
    const mobileImage = appendPicture(mobileSlot, mobilePicture, {
      alt: mobileImageAltText,
      fallbackLabel: 'LI AUTO SERVICE',
    });
    instrumentProp(rows, 'media_mobileImage', mobileSlot);
    instrumentProp(rows, 'media_mobileImageAlt', mobileImage);
    media.append(mobileSlot);
  }

  const copy = document.createElement('div');
  copy.className = 'support-bottom-copy';
  const titleSource = propSource(rows, 'copy_title') || semanticSource(rows, 'h1, h2');
  const title = propText(rows, 'copy_title') || semanticText(rows, 'h1, h2');
  if (title) {
    const heading = createHeading(title, 2);
    instrumentProp(rows, 'copy_title', heading);
    copy.append(heading);
  }
  const descriptionSource = propSource(rows, 'copy_description')
    || semanticSourceAfter(rows, 'p', titleSource);
  if (descriptionSource?.textContent.trim()) {
    const description = createRichText(descriptionSource, 'support-bottom-description');
    instrumentProp(rows, 'copy_description', description);
    copy.append(description);
  }
  const sourceLink = propAnchor(rows, 'cta_link') || rows.map((row) => row.querySelector('a')).find(Boolean);
  const linkText = propText(rows, 'cta_linkText') || sourceLink?.textContent.trim();
  if (sourceLink?.href && linkText) {
    const link = document.createElement('a');
    link.className = `support-bottom-cta support-bottom-cta-${propText(rows, 'cta_linkType') || 'primary'}`;
    link.href = sourceLink.getAttribute('href');
    link.textContent = linkText;
    instrumentProp(rows, 'cta_link', link);
    copy.append(link);
  }

  shell.append(media, copy);
  block.replaceChildren(shell);
  addBlockAnchor(block, rows);
  revealElements(block, '.support-bottom-media, .support-bottom-copy');
}
