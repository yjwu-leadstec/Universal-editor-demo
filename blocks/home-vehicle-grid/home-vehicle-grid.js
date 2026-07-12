/**
 * Home Vehicle Grid Block
 *
 * 首页车型网格 + 可选充电促销区。像素对齐 liauto.com 首屏：
 * - 4 列 × 2 行网格，large 卡片跨 2 列（首张大卡），其余小卡。
 * - hover：图片放大 10% + 黑色遮罩渐显 + 副标题上移 + Learn More/Order Now 显现。
 * - 移动端：竖向堆叠，文案左下对齐。
 *
 * EDS 折叠 cell 布局（image+imageAlt 折叠为 1 个 cell，alt 落在 img 属性上）：
 *   [image(+alt), mobileImage, logo, name, subtitle, size, kind, link]
 * CTA 文案（Learn More / Order Now）为品牌固定文案，随参考站硬编码。
 */
import {
  html, render, nothing, createRef, ref,
} from '../../scripts/lit.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function cellText(cell) {
  return cell ? cell.textContent.trim() : '';
}

function cellPicture(cell) {
  return cell ? cell.querySelector('picture') : null;
}

function pictureAlt(picture) {
  const img = picture ? picture.querySelector('img') : null;
  return img ? (img.getAttribute('alt') || '') : '';
}

function cellLink(cell) {
  const a = cell ? cell.querySelector('a') : null;
  return a ? a.getAttribute('href') : '';
}

function extractTile(row, index) {
  const [
    imageCell, mobileImageCell, logoCell, nameCell, subtitleCell, sizeCell, kindCell, linkCell,
  ] = [...row.children];

  const size = cellText(sizeCell).toLowerCase() === 'large' ? 'large' : 'small';
  const kind = cellText(kindCell).toLowerCase() === 'charging' ? 'charging' : 'vehicle';
  const bgPicture = cellPicture(imageCell);

  return {
    index,
    row,
    size,
    kind,
    bgPicture,
    mobilePicture: cellPicture(mobileImageCell),
    logoPicture: cellPicture(logoCell),
    alt: pictureAlt(bgPicture),
    name: cellText(nameCell),
    subtitle: cellText(subtitleCell),
    link: cellLink(linkCell),
    tileRef: createRef(),
    mediaRef: createRef(),
    logoRef: createRef(),
  };
}

function tileMarkup(tile) {
  const mark = tile.logoPicture
    ? html`<span class="vehicle-logo" ${ref(tile.logoRef)}></span>`
    : html`<strong>${tile.name}</strong>`;

  return html`
    <span class="vehicle-media" ${ref(tile.mediaRef)} aria-hidden="true"></span>
    <span class="tile-shade" aria-hidden="true"></span>
    <span class="vehicle-copy">
      ${mark}
      ${tile.subtitle ? html`<small class="vehicle-subtitle">${tile.subtitle}</small>` : nothing}
      ${tile.kind === 'charging'
    ? html`<span class="vehicle-actions"><span class="button-link ghost">Learn More</span></span>`
    : html`<span class="vehicle-actions">
            <span class="button-link ghost">Learn More</span>
            <span class="button-link inverse">Order Now</span>
          </span>`}
    </span>
  `;
}

export default function decorate(block) {
  const rows = [...block.children].filter(
    (row) => row.textContent.trim() || row.querySelector('picture, img'),
  );
  if (!rows.length) return;

  const tiles = rows.map((row, index) => extractTile(row, index));

  const template = html`
    <div class="vehicle-grid">
      ${tiles.map((tile) => {
    const classes = `vehicle-tile ${tile.size === 'large' ? 'large' : ''} ${tile.kind === 'charging' ? 'charging' : ''}`.trim();
    return tile.link
      ? html`<a class="${classes}" href="${tile.link}" aria-label="${tile.name}" ${ref(tile.tileRef)}>${tileMarkup(tile)}</a>`
      : html`<div class="${classes}" ${ref(tile.tileRef)}>${tileMarkup(tile)}</div>`;
  })}
    </div>
  `;

  block.textContent = '';
  render(template, block);

  tiles.forEach((tile) => {
    if (tile.tileRef.value && tile.row) moveInstrumentation(tile.row, tile.tileRef.value);

    if (tile.mediaRef.value && tile.bgPicture) {
      const picture = tile.bgPicture.cloneNode(true);
      if (tile.mobilePicture) {
        const mobileImg = tile.mobilePicture.querySelector('img');
        if (mobileImg) {
          const source = document.createElement('source');
          source.setAttribute('media', '(max-width: 820px)');
          source.setAttribute('srcset', mobileImg.getAttribute('src'));
          picture.prepend(source);
        }
      }
      const img = picture.querySelector('img');
      if (img) {
        if (tile.alt) img.setAttribute('alt', tile.alt);
        img.setAttribute('loading', tile.index === 0 ? 'eager' : 'lazy');
        img.setAttribute('decoding', 'async');
      }
      tile.mediaRef.value.append(picture);
    }

    if (tile.logoRef.value && tile.logoPicture) {
      const logo = tile.logoPicture.cloneNode(true);
      const img = logo.querySelector('img');
      if (img && tile.name) img.setAttribute('alt', tile.name);
      tile.logoRef.value.append(logo);
    }
  });
}
