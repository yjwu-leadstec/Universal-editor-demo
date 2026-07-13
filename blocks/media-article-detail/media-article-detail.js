import {
  createArticleDetail, createReveal, directRows, hasModel, imageAlt,
  imageLinkCellIndex, instrumentProp, propPicture, propText, rowPicture, rowTexts,
} from '../../scripts/media-center-utils.js';

export default function decorate(block) {
  const rows = directRows(block);
  const picture = propPicture(rows, 'image') || rowPicture(rows[2] || block);
  const contents = [];
  const copyRows = rows.filter((row) => hasModel(row, 'media-article-copy'));
  (copyRows.length ? copyRows : rows.filter((row, index) => (
    index >= 4 && row.children.length === 2 && !row.querySelector('a, picture, img')
  ))).forEach((row) => {
    contents.push({ kind: 'copy', source: row.children[1] || row, row });
  });
  const imageRows = rows.filter((row) => hasModel(row, 'media-article-image'));
  (imageRows.length ? imageRows : rows.filter((row, index) => (
    index >= 4 && row.children.length === 4 && imageLinkCellIndex(row) === 1
  ))).forEach((row) => {
    const [, alt, caption] = rowTexts(row);
    contents.push({
      kind: 'image', picture: rowPicture(row), alt, caption, row,
    });
  });
  const detail = createArticleDetail({
    title: propText(rows, 'title') || rowTexts(rows[0] || block)[0] || '',
    date: propText(rows, 'date') || rowTexts(rows[1] || block)[0] || '',
    picture,
    alt: propText(rows, 'imageAlt') || rowTexts(rows[3] || block)[0] || imageAlt(picture),
    contents,
  });
  block.replaceChildren(detail);
  instrumentProp(rows, 'title', detail.querySelector('h2'));
  instrumentProp(rows, 'date', detail.querySelector('.media-detail-header p'));
  instrumentProp(rows, 'image', detail.querySelector('.media-detail-hero'));
  createReveal(block, '.media-detail-header, .media-detail-hero, .media-detail-body > *');
}
