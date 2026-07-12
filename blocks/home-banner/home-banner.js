/**
 * Home Banner Block
 *
 * 首页主视觉 Banner 轮播，像素对齐 liauto.com：
 * - 全宽，桌面高度 42.55vw，移动端 aspect-ratio 2/3。
 * - 无限循环（首尾各加一张克隆），5s 自动轮播，底部指示器切换。
 * - hover 暂停自动轮播；激活 slide 图片 hover 放大 5%。
 * - 有 logo 时显示 logo 字标，否则显示标题 + 副标题。
 *
 * 每个 slide row 的 cell 顺序（与 _home-banner.json 的 banner-slide 模型一致）：
 *   image, imageAlt, mobileImage, logo, title, subtitle, link, ctaText
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

function cellAnchor(cell) {
  return cell ? cell.querySelector('a') : null;
}

function pictureAlt(picture) {
  const img = picture ? picture.querySelector('img') : null;
  return img ? (img.getAttribute('alt') || '') : '';
}

function extractSlide(row, index) {
  const [
    imageCell, mobileImageCell, logoCell, titleCell, subtitleCell, linkCell,
  ] = [...row.children];

  const bgPicture = cellPicture(imageCell);
  const img = bgPicture ? bgPicture.querySelector('img') : null;
  const anchor = cellAnchor(linkCell);

  return {
    index,
    row,
    bgPicture,
    bgSrc: img ? img.getAttribute('src') : '',
    alt: pictureAlt(bgPicture),
    mobilePicture: cellPicture(mobileImageCell),
    logoPicture: cellPicture(logoCell),
    title: cellText(titleCell),
    subtitle: cellText(subtitleCell),
    link: anchor ? anchor.getAttribute('href') : '',
    ctaText: (anchor && anchor.textContent.trim()) || 'Learn More',
    mediaRef: createRef(),
    logoRef: createRef(),
    articleRef: createRef(),
  };
}

function slideMarkup(slide, { clone = false, active = false } = {}) {
  return html`
    <article
      class="hero-slide ${active ? 'is-active' : ''}"
      data-slide-index="${slide.index}"
      ?data-slide=${!clone}
      ?data-slide-clone=${clone}
      style="--hero-bg: url('${slide.bgSrc}')"
      ${clone ? nothing : ref(slide.articleRef)}
    >
      <span class="hero-slide-media" ${clone ? nothing : ref(slide.mediaRef)} aria-hidden="${clone ? 'true' : 'false'}"></span>
      <div class="hero-slide-copy">
        ${slide.logoPicture
    ? html`<span class="hero-banner-logo" ${clone ? nothing : ref(slide.logoRef)}></span>`
    : html`<h2>${slide.title}</h2><p>${slide.subtitle}</p>`}
        <a class="button-link primary" href="${slide.link || '#'}">${slide.ctaText}</a>
      </div>
    </article>
  `;
}

/**
 * 轮播交互：克隆无缝循环 + 自动播放 + 指示器 + hover 暂停
 */
function setupCarousel(carousel, slideCount) {
  const track = carousel.querySelector('.carousel-track');
  const dotsWrap = carousel.querySelector('[data-dots]');
  const realSlides = Array.from(carousel.querySelectorAll('[data-slide]'));
  const visualSlides = Array.from(carousel.querySelectorAll('.hero-slide'));
  if (slideCount <= 1 || !track || !dotsWrap) return;

  const hasClones = visualSlides.length > realSlides.length;
  let active = 0;
  let timer;
  let resetTimer;

  const setActive = (index) => {
    window.clearTimeout(resetTimer);
    active = (index + slideCount) % slideCount;
    let trackIndex = active;
    if (hasClones) {
      if (index < 0) trackIndex = 0;
      else if (index >= slideCount) trackIndex = slideCount + 1;
      else trackIndex = active + 1;
    }
    track.style.setProperty('--active-slide', trackIndex);
    visualSlides.forEach((slide) => {
      slide.classList.toggle(
        'is-active',
        slide.hasAttribute('data-slide') && Number(slide.dataset.slideIndex) === active,
      );
    });
    Array.from(dotsWrap.children).forEach((dot, i) => {
      if (i === active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });

    if (hasClones && (index < 0 || index >= slideCount)) {
      resetTimer = window.setTimeout(() => {
        track.classList.add('is-resetting');
        track.style.setProperty('--active-slide', active + 1);
        track.getBoundingClientRect();
        window.requestAnimationFrame(() => track.classList.remove('is-resetting'));
      }, 520);
    }
  };

  const restart = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => setActive(active + 1), 5000);
  };

  dotsWrap.innerHTML = realSlides
    .map((_, i) => `<button type="button" aria-label="Go to slide ${i + 1}"></button>`)
    .join('');
  Array.from(dotsWrap.children).forEach((dot, i) => dot.addEventListener('click', () => {
    setActive(i);
    restart();
  }));

  carousel.addEventListener('mouseenter', () => window.clearInterval(timer));
  carousel.addEventListener('mouseleave', restart);
  setActive(0);
  restart();
}

export default function decorate(block) {
  const rows = [...block.children].filter(
    (row) => row.textContent.trim() || row.querySelector('picture, img'),
  );
  if (!rows.length) return;

  const slides = rows.map((row, index) => extractSlide(row, index));
  const hasLoop = slides.length > 1;
  const visual = hasLoop
    ? [{ ...slides[slides.length - 1], clone: true }, ...slides, { ...slides[0], clone: true }]
    : slides;

  const template = html`
    <div class="hero-carousel" data-carousel>
      <div class="carousel-track" style="--active-slide: ${hasLoop ? 1 : 0}">
        ${visual.map((slide) => slideMarkup(slide, {
    clone: !!slide.clone,
    active: !slide.clone && slide.index === 0,
  }))}
      </div>
      <div class="carousel-controls">
        ${hasLoop ? html`<div class="dots" data-dots></div>` : nothing}
      </div>
    </div>
  `;

  block.textContent = '';
  render(template, block);

  // 迁移图片 + instrumentation（仅真实 slide）
  slides.forEach((slide) => {
    if (slide.articleRef.value && slide.row) moveInstrumentation(slide.row, slide.articleRef.value);

    if (slide.mediaRef.value && slide.bgPicture) {
      const picture = slide.bgPicture.cloneNode(true);
      if (slide.mobilePicture) {
        const mobileImg = slide.mobilePicture.querySelector('img');
        if (mobileImg) {
          const source = document.createElement('source');
          source.setAttribute('media', '(max-width: 820px)');
          source.setAttribute('srcset', mobileImg.getAttribute('src'));
          picture.prepend(source);
        }
      }
      const img = picture.querySelector('img');
      if (img) {
        if (slide.alt) img.setAttribute('alt', slide.alt);
        img.setAttribute('loading', slide.index === 0 ? 'eager' : 'lazy');
        img.setAttribute('decoding', 'async');
      }
      slide.mediaRef.value.append(picture);
    }

    if (slide.logoRef.value && slide.logoPicture) {
      const logo = slide.logoPicture.cloneNode(true);
      const img = logo.querySelector('img');
      if (img && slide.title) img.setAttribute('alt', slide.title);
      slide.logoRef.value.append(logo);
    }
  });

  setupCarousel(block.querySelector('[data-carousel]'), slides.length);
}
