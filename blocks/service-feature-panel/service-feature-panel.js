/* Li Auto Service feature panel block. */
import {
  addBlockAnchor,
  appendPicture,
  createHeading,
  createRichText,
  directCells,
  directRows,
  hasModel,
  imageAlt,
  instrument,
  instrumentProp,
  isPropertyRow,
  pictures,
  propPicture,
  propSource,
  propText,
  revealElements,
  semanticSource,
  semanticSourceAfter,
} from '../../scripts/service-block-utils.js';

function featureRows(rows) {
  return rows.filter((row) => {
    if (row.dataset.serviceKind === 'feature' || hasModel(row, 'support-feature-item')) return true;
    if (isPropertyRow(row)) return false;
    return directCells(row).filter((cell) => cell.textContent.trim()).length >= 2;
  });
}

function createFeature(row) {
  const cells = directCells(row).filter((cell) => cell.textContent.trim());
  const titleCell = cells[0];
  const descriptionCell = cells[1] || (titleCell?.querySelector('p, ul, ol, blockquote') ? titleCell : null);
  const article = document.createElement('article');
  article.className = 'support-feature-item';
  const title = titleCell?.querySelector('h2, h3, h4')?.textContent.trim()
    || titleCell?.textContent.trim()
    || '';
  if (title) {
    const heading = createHeading(title, 3);
    instrument(titleCell, heading);
    article.append(heading);
  }
  if (descriptionCell?.textContent.trim()) {
    const description = createRichText(descriptionCell, 'support-feature-item-description');
    instrument(descriptionCell, description);
    article.append(description);
  }
  instrument(row, article);
  return article;
}

function getVariant(block) {
  if (block.classList.contains('app')) return 'app';
  if (block.classList.contains('diagnosis')) return 'diagnosis';
  return 'list';
}

export default function decorate(block) {
  const rows = directRows(block);
  const variant = getVariant(block);
  const availablePictures = pictures(rows);
  const featureRowSet = new Set(featureRows(rows));
  const contentRows = rows.filter((row) => !featureRowSet.has(row));
  const semanticHeadings = contentRows.flatMap((row) => [...row.querySelectorAll('h1, h2, h3, h4')]);
  const headingText = propText(rows, 'copy_heading')
    || (variant === 'list' ? '' : semanticHeadings[0]?.textContent.trim())
    || '';
  const introTitle = propText(rows, 'copy_leadHeading')
    || semanticHeadings[variant === 'list' ? 0 : 1]?.textContent.trim()
    || '';
  const introHeadingSource = semanticHeadings[variant === 'list' ? 0 : 1] || semanticHeadings.at(-1);
  const introSource = propSource(rows, 'copy_leadDescription')
    || semanticSourceAfter(contentRows, 'p', introHeadingSource)
    || semanticSource(contentRows, 'p');
  const picture = propPicture(rows, 'media_image', 'media_imageAlt') || availablePictures[0] || null;
  const mobilePicture = propPicture(rows, 'media_mobileImage', 'media_mobileImageAlt')
    || availablePictures[1]
    || null;
  const imageAltText = propText(rows, 'media_imageAlt') || imageAlt(picture);
  const mobileImageAltText = propText(rows, 'media_mobileImageAlt')
    || imageAlt(mobilePicture)
    || imageAltText;

  block.classList.add(`support-feature-panel-${variant}`);
  const shell = document.createElement('div');
  shell.className = 'support-feature-shell';

  if (headingText) {
    const sectionHeading = createHeading(headingText, 2);
    sectionHeading.className = 'support-feature-section-heading';
    instrumentProp(rows, 'copy_heading', sectionHeading);
    shell.append(sectionHeading);
  }

  const panel = document.createElement('div');
  panel.className = 'support-feature-panel-inner';
  const lead = document.createElement('div');
  lead.className = 'support-feature-lead';
  const intro = document.createElement('div');
  intro.className = 'support-feature-intro';

  if (introTitle) {
    const introHeading = createHeading(introTitle, variant === 'list' ? 2 : 3);
    instrumentProp(rows, 'copy_leadHeading', introHeading);
    intro.append(introHeading);
  }
  if (introSource?.textContent.trim()) {
    const description = createRichText(introSource, 'support-feature-intro-description');
    instrumentProp(rows, 'copy_leadDescription', description);
    intro.append(description);
  }
  lead.append(intro);

  if (picture || mobilePicture) {
    const media = document.createElement('div');
    media.className = 'support-feature-media';
    if (picture) {
      const desktopSlot = document.createElement('div');
      desktopSlot.className = 'support-feature-picture support-feature-picture-desktop';
      const image = appendPicture(desktopSlot, picture, {
        alt: imageAltText, fallbackLabel: 'LI AUTO SERVICE',
      });
      instrumentProp(rows, 'media_image', desktopSlot);
      instrumentProp(rows, 'media_imageAlt', image);
      media.append(desktopSlot);
    }
    if (mobilePicture) {
      media.classList.add('has-mobile-media');
      const mobileSlot = document.createElement('div');
      mobileSlot.className = 'support-feature-picture support-feature-picture-mobile';
      const mobileImage = appendPicture(mobileSlot, mobilePicture, {
        alt: mobileImageAltText,
        fallbackLabel: 'LI AUTO SERVICE',
      });
      instrumentProp(rows, 'media_mobileImage', mobileSlot);
      instrumentProp(rows, 'media_mobileImageAlt', mobileImage);
      media.append(mobileSlot);
    }
    lead.append(media);
  }

  const items = document.createElement('div');
  items.className = 'support-feature-items';
  items.append(...featureRows(rows).map(createFeature));
  panel.append(lead, items);
  shell.append(panel);

  block.replaceChildren(shell);
  addBlockAnchor(block, rows);
  revealElements(block, '.support-feature-section-heading, .support-feature-intro, .support-feature-media, .support-feature-item');
}
