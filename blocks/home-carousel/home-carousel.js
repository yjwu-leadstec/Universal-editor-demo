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
  // UE 会为可选字段保留空单元格；忽略空值，避免 tech 的标题被误当成 action。
  const [title = '', action = ''] = textCells(row).filter(Boolean);
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

function cardMarkup(card, loopVideo) {
  const hasVideo = !!card.videoSrc;
  return html`
    <article class="home-horizontal-card" data-horizontal-card ${ref(card.cardRef)}>
      <div class="home-horizontal-media ${hasVideo ? '' : ''}" ?data-replay-video=${hasVideo} ${ref(card.mediaRef)}>
        ${hasVideo ? html`
          <video src="${card.videoSrc}" preload="auto" muted playsinline ?loop=${loopVideo}></video>
          ${loopVideo ? nothing : html`
            <button class="home-horizontal-replay" type="button" data-replay-button aria-label="Replay video">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/></svg>
              <span>Replay</span>
            </button>`}` : nothing}
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

// Cards either side of the active one peek in, so the strip must still have a
// card in the slot beyond the clone it lands on. CLONE_DEPTH >= visible
// neighbours + 1. See docs/lixiang-product-intro-slider-carousel-architecture.md.
const CLONE_DEPTH = 2;
// Bounded by the CSS transform duration (620ms) — the wrap settles after the
// step has visually landed on the clone.
const WRAP_SETTLE_MS = 640;

// Clones are decorative duplicates: strip the editor instrumentation so the
// Universal Editor does not see duplicate fields, drop the video so the browser
// never decodes the same clip twice, and clear ids to keep the DOM unique.
function cloneCard(card) {
  const clone = card.cloneNode(true);
  clone.classList.add('is-clone');
  clone.classList.remove('is-active', 'is-near');
  clone.setAttribute('aria-hidden', 'true');
  clone.setAttribute('inert', '');
  clone.querySelectorAll('video, [data-replay-button]').forEach((node) => node.remove());
  [clone, ...clone.querySelectorAll('*')].forEach((node) => {
    Object.keys(node.dataset)
      .filter((key) => key.startsWith('aue') || key.startsWith('richtext'))
      .forEach((key) => delete node.dataset[key]);
    node.removeAttribute('id');
  });
  return clone;
}

/**
 * coverflow 切换：整条轨道做一次位移（单轨道 + 边缘克隆），不是每张卡各自定位
 */
function setupCoverflow(slider) {
  const track = slider.querySelector('[data-horizontal-track]');
  const dots = Array.from(slider.querySelectorAll('[data-horizontal-dot]'));
  if (!track) return () => {};
  const cards = Array.from(track.querySelectorAll('[data-horizontal-card]:not(.is-clone)'));
  if (!cards.length) return () => {};

  const looped = cards.length > 1;
  const cloneDepth = looped ? Math.min(CLONE_DEPTH, cards.length) : 0;
  if (cloneDepth) {
    const headClones = cards.slice(cards.length - cloneDepth).map(cloneCard);
    const tailClones = cards.slice(0, cloneDepth).map(cloneCard);
    track.prepend(...headClones);
    track.append(...tailClones);
  }

  let active = 0;
  let rendered = false;
  let releaseFrame = null;
  let wrapTimer = null;

  const paint = () => {
    cards.forEach((card, i) => {
      const offset = i - active;
      card.classList.toggle('is-active', offset === 0);
      card.classList.toggle('is-near', Math.abs(offset) === 1);
      card.setAttribute('aria-hidden', String(offset !== 0));
    });
    dots.forEach((dot, i) => {
      const current = i === active;
      dot.classList.toggle('current', current);
      dot.setAttribute('aria-current', String(current));
    });
  };

  // After the track animates onto a clone, drop the transition and jump to the
  // matching real card. Clone and original show the same image, so the swap is
  // invisible. A timer is used rather than transitionend, which an interrupted
  // transform never fires.
  const settleWrap = (position) => {
    if (wrapTimer) window.clearTimeout(wrapTimer);
    wrapTimer = window.setTimeout(() => {
      wrapTimer = null;
      track.classList.add('is-instant');
      track.style.setProperty('--active-card', position);
      track.getBoundingClientRect();
      releaseFrame = window.requestAnimationFrame(() => {
        track.classList.remove('is-instant');
        releaseFrame = null;
      });
    }, WRAP_SETTLE_MS);
  };

  // The strip moves as one: a single transform on the track, driven by
  // --active-card, so every card travels the same distance in the same
  // direction. Positioning each card into its own prev/active/next slot made a
  // retiring card sweep the full width of the viewport at 60% opacity, which
  // read as a ghost overlapping the incoming card.
  const setActive = (next) => {
    const previous = active;
    active = (next + cards.length) % cards.length;
    const wrappedForward = looped && previous === cards.length - 1 && active === 0;
    const wrappedBack = looped && previous === 0 && active === cards.length - 1;
    let position = active + cloneDepth;
    if (wrappedForward) position = cards.length + cloneDepth;
    if (wrappedBack) position = cloneDepth - 1;

    if (releaseFrame !== null) window.cancelAnimationFrame(releaseFrame);
    releaseFrame = null;
    track.classList.toggle('is-instant', !rendered);
    track.style.setProperty('--active-card', position);
    paint();

    if (!rendered) {
      track.getBoundingClientRect();
      releaseFrame = window.requestAnimationFrame(() => {
        track.classList.remove('is-instant');
        releaseFrame = null;
      });
    } else if (wrappedForward || wrappedBack) {
      settleWrap(active + cloneDepth);
    }
    rendered = true;
  };

  slider.querySelector('[data-horizontal-prev]')?.addEventListener('click', () => setActive(active - 1));
  slider.querySelector('[data-horizontal-next]')?.addEventListener('click', () => setActive(active + 1));
  // The neighbouring cards peek in at the edges; clicking one steps to it.
  cards.forEach((card, i) => {
    card.addEventListener('click', () => {
      if (Math.abs(i - active) === 1 || card.classList.contains('is-near')) setActive(i);
    });
  });
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => setActive(i));
    dot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setActive(i);
      }
    });
  });
  setActive(0);
  return paint;
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
    // Absent when the block loops its videos — there is nothing to replay.
    const replay = media.querySelector('[data-replay-button]');
    const card = media.closest('.home-horizontal-card');
    if (!video) return;
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
    replay?.addEventListener('click', () => { if (isActive()) playFromStart(); });

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
  const allRows = [...block.children];

  // 有图行 = 卡片；无图行 = 块级字段（EDS 每个块级字段渲染成独立单元格行，
  // 依模型顺序：eyebrow / heading / mobileHeading / id，空值仍占位）。
  const cardRows = allRows.filter((row) => row.querySelector('picture, img'));
  const fieldRows = allRows.filter((row) => !row.querySelector('picture, img'));
  if (!cardRows.length) return;

  const cards = cardRows.map((row, index) => extractCard(row, index));
  // A boolean field delivers the literal string "true"/"false". Matching on the
  // value rather than a row index keeps the text fields' positions stable for
  // content authored before this field existed.
  const boolRows = fieldRows.filter((row) => /^(true|false)$/i.test(row.textContent.trim()));
  const loopVideo = boolRows.some((row) => /^true$/i.test(row.textContent.trim()));
  const textRows = fieldRows.filter((row) => !boolRows.includes(row));
  const fieldText = (i) => (textRows[i] ? textRows[i].textContent.trim() : '');
  const eyebrow = fieldText(0);
  const heading = fieldText(1);
  const mobileHeading = fieldText(2);

  const headingMarkup = mobileHeading
    ? html`<span class="title-desktop">${heading}</span><span class="title-mobile">${multiline(mobileHeading)}</span>`
    : html`${heading}`;

  const template = html`
    <div class="section-heading">
      ${isTech && eyebrow ? html`<p class="section-eyebrow">${eyebrow}</p>` : nothing}
      ${heading ? html`<h2>${headingMarkup}</h2>` : nothing}
    </div>
    <div class="home-horizontal" data-home-horizontal>
      <div class="home-horizontal-track" data-horizontal-track>
        ${cards.map((card) => cardMarkup(card, loopVideo))}
      </div>
      ${cards.length > 1 ? html`
        ${cards.length > 2 ? html`<button class="home-horizontal-arrow home-horizontal-arrow-prev" type="button" data-horizontal-prev aria-label="Previous">${ARROW_PREV}</button>` : nothing}
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
