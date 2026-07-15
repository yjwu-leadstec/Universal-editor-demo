/**
 * Home Vehicle Grid Block
 *
 * 首页车型网格 + 可选充电促销区。像素对齐 liauto.com 首屏：
 * - 4 列 × 2 行网格，large 卡片跨 2 列（首张大卡），其余小卡。
 * - hover：图片放大 10% + 黑色遮罩渐显 + 副标题上移 + Learn More/Order Now 显现。
 * - 移动端：竖向堆叠，文案左下对齐。
 *
 * 稳健取值（product-showcase 式按类型查询，兼容可选字段缺省 + EDS 字段折叠）：
 *   pictures[0]=桌面背景图；可选 mobileImage 优先通过 instrumentation 识别，三图行回退为 pictures[1]；
 *   logo 优先通过 instrumentation 识别，三图行回退为 pictures[2]，旧两图内容回退为 pictures[1]。
 *   text cells 依模型顺序 = 车名/副标题/尺寸/kind；anchor=link。
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

function instrumentedPicture(row, property) {
  return row.querySelector(`[data-aue-prop="${property}"] picture`);
}

function extractTile(row, index) {
  const pics = [...row.querySelectorAll('picture')];
  const anchor = row.querySelector('a');
  const [vehicleName = '', subtitle = '', sizeRaw = '', kindRaw = ''] = textCells(row);
  const bgPicture = instrumentedPicture(row, 'image') || pics[0] || null;
  const mobilePicture = instrumentedPicture(row, 'mobileImage')
    || (pics.length >= 3 ? pics[1] : null);
  const logoPicture = instrumentedPicture(row, 'logo')
    || (pics.length >= 3 ? pics[2] : pics[1])
    || null;

  return {
    index,
    row,
    size: sizeRaw.toLowerCase() === 'large' ? 'large' : 'small',
    kind: kindRaw.toLowerCase() === 'charging' ? 'charging' : 'vehicle',
    bgPicture,
    mobilePicture,
    logoPicture,
    alt: pictureAlt(bgPicture),
    mobileAlt: pictureAlt(mobilePicture) || pictureAlt(bgPicture),
    name: vehicleName,
    subtitle,
    link: anchor ? anchor.getAttribute('href') : '',
    tileRef: createRef(),
    mediaRef: createRef(),
    mobileMediaRef: createRef(),
    logoRef: createRef(),
  };
}

function tileMarkup(tile) {
  const mark = tile.logoPicture
    ? html`<span class="vehicle-logo" ${ref(tile.logoRef)}></span>`
    : html`<strong>${tile.name}</strong>`;

  return html`
    <span class="vehicle-media" ${ref(tile.mediaRef)} aria-hidden="true"></span>
    ${tile.mobilePicture
    ? html`<span class="vehicle-media vehicle-media-mobile" ${ref(tile.mobileMediaRef)} aria-hidden="true"></span>`
    : nothing}
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
  // 有图行才是车型卡（排除块级 id 等字段行）
  const rows = [...block.children].filter((row) => row.querySelector('picture, img'));
  if (!rows.length) return;

  const tiles = rows.map((row, index) => extractTile(row, index));

  const template = html`
    <div class="vehicle-grid">
      ${tiles.map((tile) => {
    const classes = `vehicle-tile ${tile.size === 'large' ? 'large' : ''} ${tile.kind === 'charging' ? 'charging' : ''} ${tile.mobilePicture ? 'has-mobile-media' : ''}`.trim();
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

    if (tile.mobileMediaRef.value && tile.mobilePicture) {
      const picture = tile.mobilePicture.cloneNode(true);
      const img = picture.querySelector('img');
      if (img) {
        if (tile.mobileAlt) img.setAttribute('alt', tile.mobileAlt);
        img.setAttribute('loading', tile.index === 0 ? 'eager' : 'lazy');
        img.setAttribute('decoding', 'async');
      }
      tile.mobileMediaRef.value.append(picture);
    }

    if (tile.logoRef.value && tile.logoPicture) {
      const logo = tile.logoPicture.cloneNode(true);
      const img = logo.querySelector('img');
      if (img && tile.name) img.setAttribute('alt', tile.name);
      tile.logoRef.value.append(logo);
    }
  });
}
