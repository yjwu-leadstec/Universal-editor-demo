import {
  appendPropAnchors, createGalleryDetail, createReveal, directRows, hasModel,
  imageAlt, instrumentProp, propLink, propText, rowPicture, rowTexts,
  setupStandaloneGallery,
} from '../../scripts/media-center-utils.js';

export default function decorate(block) {
  const rows = directRows(block);
  const images = rows.filter((row) => hasModel(row, 'media-gallery-image')).map((row) => {
    const [, alt] = rowTexts(row);
    const picture = rowPicture(row);
    return { picture, alt: alt || imageAlt(picture), row };
  }).filter((item) => item.picture);
  const detail = {
    title: propText(rows, 'title'),
    date: propText(rows, 'date'),
    download: propLink(rows, 'download')?.href || '',
    images,
  };
  const view = createGalleryDetail(detail);
  block.replaceChildren(view);
  appendPropAnchors(block, rows, ['id']);
  instrumentProp(rows, 'title', view.querySelector('h2'));
  instrumentProp(rows, 'date', view.querySelector('.media-detail-header p'));
  instrumentProp(rows, 'download', view.querySelector('.media-download'));
  setupStandaloneGallery(block, detail);
  createReveal(block, '.media-detail-header, .media-gallery-tile');
}
