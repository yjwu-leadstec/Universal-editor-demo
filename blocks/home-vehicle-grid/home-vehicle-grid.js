/**
 * Home Vehicle Grid Block
 *
 * 首页车型网格 + 可选充电促销区。像素对齐 liauto.com 首屏：
 * - 4 列 × 2 行网格，large 卡片跨 2 列（首张大卡），其余小卡。
 * - hover：图片放大 10% + 黑色遮罩渐显 + 副标题上移 + Learn More/Order Now 显现。
 * - 移动端：竖向堆叠，文案左下对齐。
 *
 * 稳健取值（product-showcase 式按类型查询，兼容可选字段缺省 + EDS 字段折叠）：
 *   pictures[0]=背景图（alt 在 img 上）, pictures[1]=logo；text cells 依模型顺序 = 车名/副标题/尺寸/kind；anchor=link。
 * CTA 文案（Learn More / Order Now）为品牌固定文案，随参考站硬编码。
 */
import {
  html, render, nothing, createRef, ref,
} from '../../scripts/lit.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function textCells(row) {
  return [...row.children]
    .filter((cell) => !cell.querySelector('picture, img, a'))
    .map((cell) => cell.textContent.trim());
}

function pictureAlt(picture) {
  const img = picture ? picture.querySelector('img') : null;
  return img ? (img.getAttribute('alt') || '') : '';
}

function extractTile(row, index) {
  const pics = [...row.querySelectorAll('picture')];
  const anchor = row.querySelector('a');
  const [vehicleName = '', subtitle = '', sizeRaw = '', kindRaw = ''] = textCells(row);
  const bgPicture = pics[0] || null;

  return {
    index,
    row,
    size: sizeRaw.toLowerCase() === 'large' ? 'large' : 'small',
    kind: kindRaw.toLowerCase() === 'charging' ? 'charging' : 'vehicle',
    bgPicture,
    logoPicture: pics[1] || null,
    alt: pictureAlt(bgPicture),
    name: vehicleName,
    subtitle,
    link: anchor ? anchor.getAttribute('href') : '',
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
