/**
 * Home Vehicle Grid Block
 *
 * 首页车型网格 + 可选充电促销区。像素对齐 liauto.com 首屏：
 * - 4 列 × 2 行网格，large 卡片跨 2 列（首张大卡），其余小卡。
 * - hover：图片放大 10% + 黑色遮罩渐显 + 副标题上移 + Learn More/Order Now 显现。
 * - 移动端：竖向堆叠，large 卡片隐藏（首屏改由 banner 承接），文案左下对齐。
 *
 * 每个 tile row 的 cell 顺序（与 _home-vehicle-grid.json 的 vehicle-tile 模型一致）：
 *   image, imageAlt, mobileImage, logo, name, subtitle, size, kind, link,
 *   ctaPrimaryText, ctaSecondaryText
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

function cellLink(cell) {
  const a = cell ? cell.querySelector('a') : null;
  return a ? a.getAttribute('href') : '';
}

/**
 * 从一行内容中按字段顺序提取车型卡数据
 * @param {HTMLElement} row
 * @param {number} index
 */
function extractTile(row, index) {
  const cells = [...row.children];
  const [
    imageCell, altCell, mobileImageCell, logoCell, nameCell, subtitleCell,
    sizeCell, kindCell, linkCell, ctaPrimaryCell, ctaSecondaryCell,
  ] = cells;

  const size = cellText(sizeCell).toLowerCase() === 'large' ? 'large' : 'small';
  const kind = cellText(kindCell).toLowerCase() === 'charging' ? 'charging' : 'vehicle';

  return {
    index,
    row,
    size,
    kind,
    bgPicture: cellPicture(imageCell),
    mobilePicture: cellPicture(mobileImageCell),
    logoPicture: cellPicture(logoCell),
    alt: cellText(altCell),
    name: cellText(nameCell),
    subtitle: cellText(subtitleCell),
    link: cellLink(linkCell),
    ctaPrimary: cellText(ctaPrimaryCell) || 'Learn More',
    ctaSecondary: cellText(ctaSecondaryCell) || 'Order Now',
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
    ? html`<span class="vehicle-actions"><span class="button-link ghost">${tile.ctaPrimary}</span></span>`
    : html`<span class="vehicle-actions">
            <span class="button-link ghost">${tile.ctaPrimary}</span>
            <span class="button-link inverse">${tile.ctaSecondary}</span>
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

  // 迁移图片与 UE instrumentation
  tiles.forEach((tile) => {
    if (tile.tileRef.value && tile.row) moveInstrumentation(tile.row, tile.tileRef.value);

    if (tile.mediaRef.value) {
      // 桌面主图 + 移动响应式图（若提供）
      const picture = tile.bgPicture ? tile.bgPicture.cloneNode(true) : null;
      if (picture) {
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
        if (img && tile.alt) img.setAttribute('alt', tile.alt);
        if (img) {
          img.setAttribute('loading', tile.index === 0 ? 'eager' : 'lazy');
          img.setAttribute('decoding', 'async');
        }
        tile.mediaRef.value.append(picture);
      }
    }

    if (tile.logoRef && tile.logoRef.value && tile.logoPicture) {
      const logo = tile.logoPicture.cloneNode(true);
      const img = logo.querySelector('img');
      if (img && tile.name) img.setAttribute('alt', tile.name);
      tile.logoRef.value.append(logo);
    }
  });
}
