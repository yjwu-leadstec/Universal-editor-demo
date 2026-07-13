import {
  appendPropAnchors, createGalleryDetail, createReveal, directRows, hasModel,
  imageAlt, imageLinkCellIndex, instrumentProp, propLink, propText, rowLinks,
  rowPicture, rowTexts, setupStandaloneGallery,
} from '../../scripts/media-center-utils.js';

export default function decorate(block) {
  const rows = directRows(block);
  const modelImageRows = rows.filter((row) => hasModel(row, 'media-gallery-image'));
  const imageRows = modelImageRows.length ? modelImageRows : rows.filter((row, index) => (
    index >= 4 && row.children.length === 3 && imageLinkCellIndex(row) === 1
  ));
  const images = imageRows.map((row) => {
    const [, alt] = rowTexts(row);
    const picture = rowPicture(row);
    return { picture, alt: alt || imageAlt(picture), row };
  }).filter((item) => item.picture);
  const detail = {
    title: propText(rows, 'title') || rowTexts(rows[0] || block)[0] || '',
    date: propText(rows, 'date') || rowTexts(rows[1] || block)[0] || '',
    download: propLink(rows, 'download')?.href || rowLinks(rows[2] || block)[0]?.href || '',
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
