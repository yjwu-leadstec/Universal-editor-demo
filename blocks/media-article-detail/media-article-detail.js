import {
  createArticleDetail, createReveal, directRows, hasModel, imageAlt,
  instrumentProp, propPicture, propText, rowPicture, rowTexts,
} from '../../scripts/media-center-utils.js';

export default function decorate(block) {
  const rows = directRows(block);
  const picture = propPicture(rows, 'image') || block.querySelector('picture');
  const contents = [];
  rows.filter((row) => hasModel(row, 'media-article-copy')).forEach((row) => {
    contents.push({ kind: 'copy', source: row.children[1] || row, row });
  });
  rows.filter((row) => hasModel(row, 'media-article-image')).forEach((row) => {
    const [, alt, caption] = rowTexts(row);
    contents.push({
      kind: 'image', picture: rowPicture(row), alt, caption, row,
    });
  });
  const detail = createArticleDetail({
    title: propText(rows, 'title'),
    date: propText(rows, 'date'),
    picture,
    alt: propText(rows, 'imageAlt') || imageAlt(picture),
    contents,
  });
  block.replaceChildren(detail);
  instrumentProp(rows, 'title', detail.querySelector('h2'));
  instrumentProp(rows, 'date', detail.querySelector('.media-detail-header p'));
  instrumentProp(rows, 'image', detail.querySelector('.media-detail-hero'));
  createReveal(block, '.media-detail-header, .media-detail-hero, .media-detail-body > *');
}
