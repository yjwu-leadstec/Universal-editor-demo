/**
 * Home Carousel Block（品牌故事 / 技术横向轮播）
 *
 * 像素对齐 liauto.com 首页横滑 coverflow：
 * - 居中卡片全宽，左右相邻卡片 60% 透明度并向两侧偏移。
 * - 箭头 + 底部指示器（≥3 张才显示）切换；循环环绕。
 * - variant：story（默认，卡片含视频 + action，白字压图）| tech（图片卡 + eyebrow）。
 * - story 视频卡：仅居中卡片自动播放，poster 兜底，结束显示 Replay。
 * - 进入视口时区块淡入上移；prefers-reduced-motion 降级。
 *
 * 块级字段行（无图行）：eyebrow, heading, mobileHeading
 * 稳健取值（按类型查询）：pictures[0]=海报图；video=含 .mp4 的 anchor，link=另一个 anchor；
 *   text cells 依模型顺序 = title / actionLabel；标题行（无图行）text cells = eyebrow / heading / mobileHeading。
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

function isVideoHref(href) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(href || '');
}

function multiline(value) {
  const parts = String(value || '').split('\n');
  return parts.flatMap((line, i) => (i ? [html`<br>`, line] : [line]));
}

function extractCard(row, index) {
  const pics = [...row.querySelectorAll('picture')];
  const anchors = [...row.querySelectorAll('a')];
  const videoAnchor = anchors.find((a) => isVideoHref(a.getAttribute('href')));
  const linkAnchor = anchors.find((a) => a !== videoAnchor);
  const [title = '', action = ''] = textCells(row);
  const posterPicture = pics[0] || null;

  return {
    index,
    row,
    posterPicture,
    alt: pictureAlt(posterPicture),
    videoSrc: videoAnchor ? videoAnchor.getAttribute('href') : '',
    title,
    action,
    link: linkAnchor ? linkAnchor.getAttribute('href') : '',
    cardRef: createRef(),
    mediaRef: createRef(),
  };
}

function cardMarkup(card) {
  const hasVideo = !!card.videoSrc;
  return html`
    <article class="home-horizontal-card ${card.index === 0 ? 'is-active' : ''}" data-horizontal-card ${ref(card.cardRef)}>
      <div class="home-horizontal-media ${hasVideo ? '' : ''}" ?data-replay-video=${hasVideo} ${ref(card.mediaRef)}>
        ${hasVideo ? html`
          <video src="${card.videoSrc}" preload="auto" muted playsinline></video>
          <button class="home-horizontal-replay" type="button" data-replay-button aria-label="Replay video">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/></svg>
            <span>Replay</span>
          </button>` : nothing}
      </div>
      <div class="home-horizontal-copy">
        <h3>${multiline(card.title)}</h3>
        ${card.action ? html`<span>${card.action}</span>` : nothing}
      </div>
    </article>
  `;
}

const ARROW_PREV = html`<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M15 5l-7 7 7 7"/></svg>`;
const ARROW_NEXT = html`<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>`;

/**
 * coverflow 切换：is-active / is-prev / is-next / is-hidden，带瞬移防拖影
 */
function setupCoverflow(slider) {
  const cards = Array.from(slider.querySelectorAll('[data-horizontal-card]'));
  const dots = Array.from(slider.querySelectorAll('[data-horizontal-dot]'));
  if (!cards.length) return () => {};
  let active = 0;
  let previous = 0;

  const normalize = (i) => (i + cards.length) % cards.length;
  const offsetFrom = (i, from) => {
    const raw = i - from;
    const half = cards.length / 2;
    if (raw > half) return raw - cards.length;
    if (raw < -half) return raw + cards.length;
    return raw;
  };

  const render2 = () => {
    let teleported = false;
    cards.forEach((card, i) => {
      const offset = offsetFrom(i, active);
      if (Math.abs(offset - offsetFrom(i, previous)) > 1) {
        card.style.transition = 'none';
        teleported = true;
      }
      card.classList.toggle('is-active', offset === 0);
      card.classList.toggle('is-prev', offset === -1);
      card.classList.toggle('is-next', offset === 1);
      card.classList.toggle('is-hidden', Math.abs(offset) > 1);
      card.setAttribute('aria-hidden', String(offset !== 0));
    });
    if (teleported) {
      slider.getBoundingClientRect();
      window.requestAnimationFrame(() => {
        cards.forEach((card) => { card.style.transition = ''; });
      });
    }
    dots.forEach((dot, i) => {
      const current = i === active;
      dot.classList.toggle('current', current);
      dot.setAttribute('aria-current', String(current));
    });
  };

  const setActive = (i) => {
    previous = active;
    active = normalize(i);
    render2();
  };

  slider.querySelector('[data-horizontal-prev]')?.addEventListener('click', () => setActive(active - 1));
  slider.querySelector('[data-horizontal-next]')?.addEventListener('click', () => setActive(active + 1));
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => setActive(i));
    dot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setActive(i);
      }
    });
  });
  render2();
  return render2;
}

/**
 * story 视频卡：仅居中卡片播放，poster 兜底，Replay 重播
 */
function setupVideos(block) {
  const medias = Array.from(block.querySelectorAll('[data-replay-video]'));
  if (!medias.length) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  medias.forEach((media) => {
    const video = media.querySelector('video');
    const replay = media.querySelector('[data-replay-button]');
    const card = media.closest('.home-horizontal-card');
    if (!video || !replay) return;
    let inView = false;
    const isActive = () => !card || card.classList.contains('is-active');

    const playFromStart = () => {
      media.classList.remove('is-ended');
      try { video.currentTime = 0; } catch (e) { /* metadata not ready */ }
      video.play().catch(() => {});
    };

    video.addEventListener('playing', () => media.classList.add('is-playing'));
    video.addEventListener('ended', () => {
      if (!isActive()) return;
      media.classList.add('is-ended');
      media.classList.remove('is-playing');
    });
    replay.addEventListener('click', () => { if (isActive()) playFromStart(); });

    const sync = () => {
      if (reduceMotion) {
        if (!video.paused) video.pause();
        if (isActive()) media.classList.add('is-ended');
        return;
      }
      if (inView && isActive()) {
        if (video.paused && !media.classList.contains('is-ended')) playFromStart();
        return;
      }
      if (!video.paused) video.pause();
      if (!isActive()) media.classList.remove('is-ended', 'is-playing');
    };

    if (card && 'MutationObserver' in window) {
      new MutationObserver(sync).observe(card, { attributes: true, attributeFilter: ['class'] });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => { inView = entry.isIntersecting; sync(); });
      }, { threshold: 0.4 }).observe(card || media);
    } else {
      inView = true;
      sync();
    }
  });
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
  const isTech = block.classList.contains('tech');
  const rows = [...block.children].filter(
    (row) => row.textContent.trim() || row.querySelector('picture, img'),
  );
  if (!rows.length) return;

  // 无图行 = 块级标题配置；有图行 = 卡片
  const headingRow = rows.find((row) => !row.querySelector('picture, img'));
  const cardRows = rows.filter((row) => row !== headingRow);
  const cards = cardRows.map((row, index) => extractCard(row, index));

  let eyebrow = '';
  let heading = '';
  let mobileHeading = '';
  if (headingRow) {
    [eyebrow = '', heading = '', mobileHeading = ''] = textCells(headingRow);
  }

  const headingMarkup = mobileHeading
    ? html`<span class="title-desktop">${heading}</span><span class="title-mobile">${multiline(mobileHeading)}</span>`
    : html`${heading}`;

  const template = html`
    <div class="section-heading">
      ${isTech && eyebrow ? html`<p class="section-eyebrow">${eyebrow}</p>` : nothing}
      ${heading ? html`<h2>${headingMarkup}</h2>` : nothing}
    </div>
    <div class="home-horizontal" data-home-horizontal>
      ${cards.map((card) => cardMarkup(card))}
      ${cards.length > 1 ? html`
        <button class="home-horizontal-arrow home-horizontal-arrow-prev" type="button" data-horizontal-prev aria-label="Previous">${ARROW_PREV}</button>
        <button class="home-horizontal-arrow home-horizontal-arrow-next" type="button" data-horizontal-next aria-label="Next">${ARROW_NEXT}</button>
      ` : nothing}
      ${cards.length >= 3 ? html`
        <div class="horizontal-dots">
          ${cards.map((_, i) => html`<span data-horizontal-dot role="button" tabindex="0" aria-label="Go to item ${i + 1}"></span>`)}
        </div>
      ` : nothing}
    </div>
  `;

  block.textContent = '';
  render(template, block);

  // 迁移海报图 + instrumentation
  cards.forEach((card) => {
    if (card.cardRef.value && card.row) moveInstrumentation(card.row, card.cardRef.value);
    if (card.mediaRef.value && card.posterPicture) {
      const picture = card.posterPicture.cloneNode(true);
      picture.classList.add('home-horizontal-poster');
      const img = picture.querySelector('img');
      if (img) {
        if (card.alt) img.setAttribute('alt', card.alt);
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
      }
      // poster 需在 video 之前（video 在模板里已是首元素时，poster 应插到最前）
      card.mediaRef.value.prepend(picture);
      const video = card.mediaRef.value.querySelector('video');
      if (video && img) video.setAttribute('poster', img.getAttribute('src'));
    }
  });

  setupCoverflow(block.querySelector('[data-home-horizontal]'));
  setupVideos(block);
  setupReveal(block);
}
