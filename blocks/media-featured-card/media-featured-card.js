import {
  appendPicture, appendPropAnchors, createReveal, directRows, hasModel,
  instrumentProp, propPicture, propText, registerMediaPanel, rowTexts,
  setupMediaDialog,
} from '../../scripts/media-center-utils.js';

export default function decorate(block) {
  const rows = directRows(block);
  const picture = propPicture(rows, 'image') || block.querySelector('picture');
  const contentRow = rows.find((row) => hasModel(row, 'media-featured-content'));
  const [itemKey = '', contentAlt = '', summary = ''] = contentRow ? rowTexts(contentRow) : [];
  const body = contentRow?.children[3] || contentRow;
  const titleText = propText(rows, 'title');
  const dateText = propText(rows, 'date');
  const alt = contentAlt || picture?.querySelector('img')?.alt || titleText;
  const article = document.createElement('article');
  article.className = 'media-featured';
  const opener = document.createElement('button');
  opener.type = 'button';
  opener.className = 'media-featured-opener';
  opener.setAttribute('aria-label', `Read ${titleText}`);
  const media = document.createElement('span');
  media.className = 'media-featured-media';
  appendPicture(media, picture, alt, true);
  instrumentProp(rows, 'image', media);
  opener.append(media);
  const copy = document.createElement('div');
  copy.className = 'media-featured-copy';
  const top = document.createElement('div');
  const badge = document.createElement('span');
  badge.className = 'media-featured-badge';
  badge.textContent = 'NEW';
  const title = document.createElement('h2');
  title.textContent = titleText;
  instrumentProp(rows, 'title', title);
  const date = document.createElement('p');
  date.textContent = dateText;
  instrumentProp(rows, 'date', date);
  top.append(badge, title);
  copy.append(top, date);
  article.append(opener, copy);
  block.replaceChildren(article);
  appendPropAnchors(block, rows, ['id']);
  const id = propText(rows, 'id');
  if (id) block.id = id;
  setupMediaDialog(opener, {
    type: 'newsroom',
    key: itemKey || id || 'featured',
    title: titleText,
    date: dateText,
    picture: media.querySelector('picture')?.cloneNode(true),
    alt,
    contents: [{ kind: 'copy', source: body, row: contentRow }],
    summary,
  });
  registerMediaPanel(block, 'newsroom');
  createReveal(block, '.media-featured');
}
