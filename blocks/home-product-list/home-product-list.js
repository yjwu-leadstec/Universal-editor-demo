/**
 * Home Product List Block
 *
 * 首页产品展示入口，像素对齐 liauto.com：
 * - PC 两个（或多个）方形面板横向排列，内容区约 1480 宽，间距 16px。
 * - 移动端上下堆叠，满宽。
 * - 面板 hover 图片放大；进入视口淡入上移。
 *
 * 每个 panel row 的 cell 顺序（与 _home-product-list.json 的 product-panel 一致）：
 *   image, imageAlt, title, link, ctaText
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

function extractPanel(row, index) {
  const [imageCell, titleCell, linkCell] = [...row.children];
  const bgPicture = cellPicture(imageCell);
  const anchor = linkCell ? linkCell.querySelector('a') : null;
  return {
    index,
    row,
    bgPicture,
    alt: pictureAlt(bgPicture),
    title: cellText(titleCell),
    link: anchor ? anchor.getAttribute('href') : '',
    ctaText: (anchor && anchor.textContent.trim()) || 'Learn More',
    panelRef: createRef(),
    mediaRef: createRef(),
  };
}

function setupReveal(block) {
  if (!('IntersectionObserver' in window)) {
    block.classList.add('in-view');
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  observer.observe(block);
}

export default function decorate(block) {
  const rows = [...block.children].filter(
    (row) => row.textContent.trim() || row.querySelector('picture, img'),
  );
  if (!rows.length) return;

  const panels = rows.map((row, index) => extractPanel(row, index));

  const template = html`
    ${panels.map((panel) => {
    const inner = html`
        <span class="showcase-media" ${ref(panel.mediaRef)} aria-hidden="true"></span>
        <span class="tile-shade" aria-hidden="true"></span>
        <span class="showcase-copy">
          ${panel.title ? html`<strong>${panel.title}</strong>` : nothing}
          ${panel.ctaText ? html`<span class="button-link ghost">${panel.ctaText}</span>` : nothing}
        </span>
      `;
    return panel.link
      ? html`<a class="showcase-panel" href="${panel.link}" aria-label="${panel.title}" ${ref(panel.panelRef)}>${inner}</a>`
      : html`<div class="showcase-panel" ${ref(panel.panelRef)}>${inner}</div>`;
  })}
  `;

  block.textContent = '';
  block.classList.add('showcase-block');
  render(template, block);

  panels.forEach((panel) => {
    if (panel.panelRef.value && panel.row) moveInstrumentation(panel.row, panel.panelRef.value);
    if (panel.mediaRef.value && panel.bgPicture) {
      const picture = panel.bgPicture.cloneNode(true);
      const img = picture.querySelector('img');
      if (img) {
        if (panel.alt) img.setAttribute('alt', panel.alt);
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
      }
      panel.mediaRef.value.append(picture);
    }
  });

  setupReveal(block);
}
