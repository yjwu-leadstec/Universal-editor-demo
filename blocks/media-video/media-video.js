import {
  appendPropAnchors, createReveal, createVideoDetail, directRows, hasModel,
  imageAlt, instrument, instrumentProp, propPicture, propText, rowLinks,
  rowPicture, rowTexts, setupVideo,
} from '../../scripts/media-center-utils.js';

export default function decorate(block) {
  const rows = directRows(block);
  const poster = propPicture(rows, 'poster') || rowPicture(rows[3] || block);
  const sourceRow = rows.find((row) => hasModel(row, 'media-video-source'))
    || rows.find((row, index) => index >= 4 && row.children.length === 2 && row.querySelector('a'));
  const [sourceAlt = ''] = sourceRow ? rowTexts(sourceRow) : [];
  const video = rowLinks(sourceRow || block)[0]?.href || [...block.querySelectorAll('a')]
    .find((link) => /\.(mp4|webm|mov)(?:[?#]|$)/i.test(link.href))?.href || '';
  const detail = createVideoDetail({
    title: propText(rows, 'title') || rowTexts(rows[0] || block)[0] || '',
    date: propText(rows, 'date') || rowTexts(rows[1] || block)[0] || '',
    duration: propText(rows, 'duration') || rowTexts(rows[2] || block)[0] || '',
    poster: poster?.querySelector('img')?.currentSrc || poster?.querySelector('img')?.src || '',
    alt: sourceAlt || imageAlt(poster),
    video,
  });
  block.replaceChildren(detail);
  appendPropAnchors(block, rows, ['duration', 'id']);
  instrumentProp(rows, 'title', detail.querySelector('h2'));
  instrumentProp(rows, 'date', detail.querySelector('.media-detail-header p'));
  instrumentProp(rows, 'poster', detail.querySelector('.media-video-player'));
  instrument(sourceRow, detail.querySelector('video'));
  setupVideo(block);
  createReveal(block, '.media-detail-header, .media-video-player');
}
