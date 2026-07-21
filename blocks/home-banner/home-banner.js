/**
 * Home Banner Block
 *
 * 首页主视觉 Banner 轮播，像素对齐 liauto.com：
 * - 全宽，桌面高度 42.55vw，移动端 aspect-ratio 2/3。
 * - 无限循环（首尾各加一张克隆），5s 自动轮播，底部指示器切换。
 * - <720px 可使用 block 级 mobileImage/mobileLogo 渲染独立静态主视觉。
 * - hover 暂停自动轮播；激活 slide 图片 hover 放大 5%。
 * - 有 logo 时显示 logo 字标，否则显示标题 + 副标题。
 *
 * 稳健取值（按类型查询）：pictures[0]=背景图, pictures[1]=logo；anchor=link（含 CTA 文案）；
 * text cells 依模型顺序 = title / subtitle。
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

function propertyElement(block, property) {
  return block.querySelector(`[data-aue-prop="${property}"]`);
}

function propertyPicture(block, property) {
  const element = propertyElement(block, property);
  if (!element) return null;
  if (element.matches('picture')) return element;
  if (element.matches('img')) return element.closest('picture');
  return element.querySelector('picture');
}

function propertyText(block, property) {
  return propertyElement(block, property)?.textContent.trim() || '';
}

function propertyBoolean(block, property, fallback = false) {
  const value = propertyText(block, property).toLowerCase();
  if (!value) return fallback;
  return ['true', '1', 'yes', 'on'].includes(value);
}

function propertyDamFolder(block, property) {
  const value = propertyText(block, property);
  if (value) return value;

  // AEM renders text values that look like repository paths as anchors and may
  // omit data-aue-prop. Only inspect block-level rows so slide links are ignored.
  const pathLink = [...block.children]
    .find((row) => !row.hasAttribute('data-aue-model')
      && row.querySelector('a[href^="/content/dam/"]'))
    ?.querySelector('a[href^="/content/dam/"]');

  return pathLink?.getAttribute('href')?.replace(/\.html$/, '') || '';
}

function extractMobileHero(block) {
  const imagePicture = propertyPicture(block, 'mobileImage');
  if (!imagePicture) return null;

  return {
    imagePicture,
    imageAlt: propertyText(block, 'mobileImageAlt') || pictureAlt(imagePicture),
    logoPicture: propertyPicture(block, 'mobileLogo'),
    title: propertyText(block, 'mobileImageAlt') || pictureAlt(imagePicture),
    damFolder: propertyDamFolder(block, 'mobileDamFolder'),
    mediaRef: createRef(),
    logoRef: createRef(),
  };
}

function damOriginalUrl(img, folder) {
  if (!img || !folder?.startsWith('/content/dam/')) return '';

  const source = img.getAttribute('src') || '';
  const fileName = decodeURIComponent(source.split('?')[0].split('/').pop() || '');
  if (!fileName || fileName === '.' || fileName === '..') return '';

  return `${folder.replace(/\/+$/, '')}/${encodeURIComponent(fileName)}`;
}

function addDamOriginalFallback(img, folder, onFinalError) {
  const fallbackUrl = damOriginalUrl(img, folder);
  let fallbackApplied = false;

  const handleError = () => {
    if (!fallbackUrl || fallbackApplied) {
      onFinalError?.();
      return;
    }

    fallbackApplied = true;
    img.closest('picture')?.querySelectorAll('source').forEach((source) => source.remove());
    img.setAttribute('src', fallbackUrl);
  };

  img.addEventListener('error', handleError);
  if (img.complete && !img.naturalWidth) handleError();
}

function extractSlide(row, index) {
  const pics = [...row.querySelectorAll('picture')];
  const anchor = row.querySelector('a');
  const [title = '', subtitle = ''] = textCells(row);
  const bgPicture = pics[0] || null;
  const img = bgPicture ? bgPicture.querySelector('img') : null;

  return {
    index,
    row,
    bgPicture,
    bgSrc: img ? img.getAttribute('src') : '',
    alt: pictureAlt(bgPicture),
    logoPicture: pics[1] || null,
    title,
    subtitle,
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

function mobileHeroMarkup(hero) {
  return html`
    <article class="mobile-hero-slide" aria-label="${hero.title || hero.imageAlt}">
      <span class="hero-slide-media" ${ref(hero.mediaRef)}></span>
      <div class="hero-slide-copy">
        ${hero.logoPicture
    ? html`<span class="hero-banner-logo" ${ref(hero.logoRef)}></span>`
    : html`<h2>${hero.title}</h2>`}
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
  // Backward compatible: existing banners without this field remain visible.
  block.classList.toggle(
    'hide-on-small-screens',
    !propertyBoolean(block, 'showOnSmallScreens', true),
  );

  const mobileHero = extractMobileHero(block);
  const mobilePictures = new Set([
    mobileHero?.imagePicture,
    mobileHero?.logoPicture,
  ].filter(Boolean));

  // 有图且不属于 block 级移动主视觉字段的行才是桌面 slide。
  const rows = [...block.children].filter((row) => row.querySelector('picture, img')
    && ![...mobilePictures].some((picture) => row.contains(picture)));
  if (!rows.length) return;

  const slides = rows.map((row, index) => extractSlide(row, index));
  const hasLoop = slides.length > 1;
  const visual = hasLoop
    ? [{ ...slides[slides.length - 1], clone: true }, ...slides, { ...slides[0], clone: true }]
    : slides;

  const template = html`
    <div class="hero-carousel ${mobileHero ? 'has-mobile-hero' : ''}" data-carousel>
      <div class="carousel-track" style="--active-slide: ${hasLoop ? 1 : 0}">
        ${visual.map((slide) => slideMarkup(slide, {
    clone: !!slide.clone,
    active: !slide.clone && slide.index === 0,
  }))}
      </div>
      <div class="carousel-controls">
        ${hasLoop ? html`<div class="dots" data-dots></div>` : nothing}
      </div>
      ${mobileHero ? mobileHeroMarkup(mobileHero) : nothing}
    </div>
  `;

  block.textContent = '';
  render(template, block);

  // 迁移图片 + instrumentation（仅真实 slide）
  slides.forEach((slide) => {
    if (slide.articleRef.value && slide.row) moveInstrumentation(slide.row, slide.articleRef.value);

    if (slide.mediaRef.value && slide.bgPicture) {
      const picture = slide.bgPicture.cloneNode(true);
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

  if (mobileHero?.mediaRef.value) {
    const picture = mobileHero.imagePicture.cloneNode(true);
    const img = picture.querySelector('img');
    if (img) {
      if (mobileHero.imageAlt) img.setAttribute('alt', mobileHero.imageAlt);
      img.setAttribute('loading', 'eager');
      img.setAttribute('fetchpriority', 'high');
      img.setAttribute('decoding', 'async');

      // A newly uploaded AEM asset can be present in JCR before its delivery URL
      // is ready. Never leave the homepage hero blank in that state: fall back
      // to its DAM original, then to the existing carousel if that also fails.
      const carousel = block.querySelector('[data-carousel]');
      const showCarouselFallback = () => carousel?.classList.remove('has-mobile-hero');
      addDamOriginalFallback(img, mobileHero.damFolder, showCarouselFallback);
    }
    mobileHero.mediaRef.value.append(picture);
  }

  if (mobileHero?.logoRef.value && mobileHero.logoPicture) {
    const logo = mobileHero.logoPicture.cloneNode(true);
    const img = logo.querySelector('img');
    if (img) {
      if (mobileHero.title) img.setAttribute('alt', mobileHero.title);
      addDamOriginalFallback(
        img,
        mobileHero.damFolder,
        () => img.closest('.hero-banner-logo')?.remove(),
      );
    }
    mobileHero.logoRef.value.append(logo);
  }

  setupCarousel(block.querySelector('[data-carousel]'), slides.length);
}
