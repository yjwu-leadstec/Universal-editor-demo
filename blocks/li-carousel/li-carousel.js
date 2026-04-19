/**
 * Carousel Block - 轮播组件 (lit-html 版本)
 *
 * 功能特性:
 * - 多 slide 支持（图片 + 视频）
 * - 自动轮播（可配置间隔）
 * - 底部圆点导航 + 箭头导航
 * - 键盘导航（← →）
 * - 视频懒加载（IntersectionObserver）
 * - 支持 Universal Editor 可视化编辑
 */
import {
  html,
  render,
  nothing,
  classMap,
  createRef,
  ref,
} from '../../scripts/lit.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * 检查 row 是否有实际内容（图片、文字、视频等）
 * @param {HTMLElement} row
 * @returns {boolean}
 */
function hasContent(row) {
  if (row.querySelector('picture, img, video, a[href*=".mp4"]')) return true;
  const text = row.textContent.trim();
  if (text) return true;
  if (row.querySelector('a')) return true;
  return false;
}

/**
 * 检测 slide 的媒体类型
 * @param {HTMLElement} cell
 * @returns {'video'|'image'}
 */
function detectMediaType(cell) {
  if (!cell) return 'image';
  if (cell.querySelector('video')) return 'video';
  const videoLink = cell.querySelector('a[href*=".mp4"]');
  if (videoLink) return 'video';
  return 'image';
}

/**
 * 提取视频源 URL
 * @param {HTMLElement} cell
 * @returns {string|null}
 */
function extractVideoSrc(cell) {
  if (!cell) return null;
  const video = cell.querySelector('video');
  if (video) {
    const source = video.querySelector('source');
    return source ? source.getAttribute('src') : video.getAttribute('src');
  }
  const videoLink = cell.querySelector('a[href*=".mp4"]');
  if (videoLink) return videoLink.href;
  return null;
}

/**
 * 提取视频封面图
 * @param {HTMLElement} cell
 * @returns {string|null}
 */
function extractVideoPoster(cell) {
  if (!cell) return null;
  const video = cell.querySelector('video');
  if (video && video.poster) return video.poster;
  const picture = cell.querySelector('picture img');
  if (picture) return picture.src;
  return null;
}

/**
 * 提取 slide 数据
 * @param {HTMLElement} row
 * @param {number} index
 * @returns {Object}
 */
function extractSlideData(row, index) {
  const cells = [...row.children];
  const imageCell = cells.find((cell) => cell.querySelector('picture, video, a[href*=".mp4"]'));
  const contentCell = cells.find((cell) => !cell.querySelector('picture, video, a[href*=".mp4"]'));

  const mediaType = detectMediaType(imageCell);

  return {
    index,
    row,
    imageCell,
    contentCell,
    mediaType,
    videoSrc: mediaType === 'video' ? extractVideoSrc(imageCell) : null,
    videoPoster: mediaType === 'video' ? extractVideoPoster(imageCell) : null,
    slideRef: createRef(),
    imageCellRef: createRef(),
    contentCellRef: createRef(),
    videoRef: createRef(),
  };
}

/**
 * 设置视频懒加载 IntersectionObserver + 错误回退
 * @param {HTMLElement} block
 */
function setupVideoObserver(block) {
  const videos = block.querySelectorAll('video[data-src]');
  if (videos.length === 0) return;

  videos.forEach((video) => {
    // 视频加载失败时回退到 poster
    video.addEventListener('error', () => {
      const { poster } = video;
      if (poster) {
        const img = document.createElement('img');
        img.src = poster;
        img.alt = '';
        img.classList.add('video-fallback');
        video.parentElement.replaceChild(img, video);
      }
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      if (entry.isIntersecting) {
        if (!video.src && video.dataset.src) {
          video.src = video.dataset.src;
          video.load();
        }
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.25 });

  videos.forEach((video) => observer.observe(video));
}

/**
 * 检查用户是否偏好减少动画
 * @returns {boolean}
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 读取 block 上的 data attribute 配置
 * @param {HTMLElement} block
 * @returns {Object}
 */
function getBlockConfig(block) {
  const isShowcase = block.closest('.section.hero, .section.feature') !== null;
  return {
    showArrows: block.dataset.showArrows !== 'false',
    showDots: block.dataset.showDots !== 'false',
    loop: block.dataset.loop !== 'false',
    autoPlay: isShowcase ? false : block.dataset.autoPlay !== 'false',
  };
}

/**
 * Decorate carousel block
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const rows = [...block.children].filter(hasContent);

  if (rows.length === 0) return;

  const slides = rows.map((row, index) => extractSlideData(row, index));
  const slideCount = slides.length;
  const config = getBlockConfig(block);

  let currentIndex = 0;

  const canGoPrev = () => config.loop || currentIndex > 0;
  const canGoNext = () => config.loop || currentIndex < slideCount - 1;

  const goToSlide = (index) => {
    if (config.loop) {
      currentIndex = (index + slideCount) % slideCount;
    } else {
      currentIndex = Math.max(0, Math.min(index, slideCount - 1));
    }
    // eslint-disable-next-line no-use-before-define
    renderCarousel();
  };

  const goPrev = () => { if (canGoPrev()) goToSlide(currentIndex - 1); };
  const goNext = () => { if (canGoNext()) goToSlide(currentIndex + 1); };

  // 自动轮播状态
  let autoPlayPaused = false;
  let autoPlayTimer = null;

  const toggleAutoPlay = () => {
    autoPlayPaused = !autoPlayPaused;
  };

  // 键盘导航
  const handleKeydown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    } else if (e.key === ' ') {
      e.preventDefault();
      toggleAutoPlay();
    }
  };

  // 触摸 swipe 支持
  let touchStartX = 0;
  const SWIPE_THRESHOLD = 50;

  const handleTouchStart = (e) => { touchStartX = e.changedTouches[0].screenX; };
  const handleTouchEnd = (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  const renderCarousel = () => {
    const slideClasses = (slide) => classMap({
      'carousel-slide': true,
      active: slide.index === currentIndex,
    });

    const dotClasses = (slide) => classMap({
      'carousel-dot': true,
      active: slide.index === currentIndex,
    });

    const arrowPrevClasses = classMap({
      'carousel-arrow': true,
      'carousel-arrow-prev': true,
    });

    const arrowNextClasses = classMap({
      'carousel-arrow': true,
      'carousel-arrow-next': true,
    });

    const renderSlideMedia = (slide) => {
      if (slide.mediaType === 'video' && slide.videoSrc) {
        return html`
          <div class="slide-media slide-video" ${ref(slide.imageCellRef)}>
            <video
              ${ref(slide.videoRef)}
              data-src="${slide.videoSrc}"
              poster="${slide.videoPoster || ''}"
              muted
              loop
              playsinline
              preload="none"
              aria-hidden="true"
            ></video>
          </div>
        `;
      }
      if (slide.imageCell) {
        return html`
          <div class="slide-media slide-image" ${ref(slide.imageCellRef)}></div>
        `;
      }
      return nothing;
    };

    const template = html`
      <div
        class="carousel-container transition-slide"
        role="region"
        aria-roledescription="carousel"
        aria-label="Carousel"
        tabindex="0"
        @keydown=${handleKeydown}
        @touchstart=${handleTouchStart}
        @touchend=${handleTouchEnd}
      >
        <div class="carousel-slides" style="--current-slide: ${currentIndex}">
          ${slides.map((slide) => html`
            <div
              class=${slideClasses(slide)}
              role="group"
              aria-roledescription="slide"
              aria-label="Slide ${slide.index + 1} of ${slideCount}"
              aria-hidden=${slide.index !== currentIndex}
              data-index=${slide.index}
              ${ref(slide.slideRef)}
            >
              ${renderSlideMedia(slide)}
              ${slide.contentCell ? html`
                <div class="slide-content" ${ref(slide.contentCellRef)}></div>
              ` : ''}
            </div>
          `)}
        </div>
        ${slideCount > 1 && config.showArrows ? html`
          <button
            class=${arrowPrevClasses}
            aria-label="Previous slide"
            ?disabled=${!canGoPrev()}
            @click=${goPrev}
          >&#8249;</button>
          <button
            class=${arrowNextClasses}
            aria-label="Next slide"
            ?disabled=${!canGoNext()}
            @click=${goNext}
          >&#8250;</button>
        ` : nothing}
        ${slideCount > 1 && config.showDots ? html`
          <div class="carousel-dots" role="tablist" aria-label="Slide controls">
            ${slides.map((slide) => html`
              <button
                class=${dotClasses(slide)}
                role="tab"
                aria-selected=${slide.index === currentIndex}
                aria-label="Go to slide ${slide.index + 1}"
                data-index=${slide.index}
                @click=${() => goToSlide(slide.index)}
              ></button>
            `)}
          </div>
        ` : nothing}
      </div>
    `;

    render(template, block);

    // 首次渲染后，移动内容和应用 instrumentation
    slides.forEach((slide) => {
      if (slide.slideRef.value && slide.row) {
        moveInstrumentation(slide.row, slide.slideRef.value);
      }

      // 移动图片内容（仅限 image 类型）
      if (slide.mediaType === 'image' && slide.imageCellRef.value && slide.imageCell) {
        if (slide.imageCellRef.value.children.length === 0) {
          while (slide.imageCell.firstChild) {
            slide.imageCellRef.value.appendChild(slide.imageCell.firstChild);
          }
        }
      }

      // 移动文字内容
      if (slide.contentCellRef.value && slide.contentCell) {
        if (slide.contentCellRef.value.children.length === 0) {
          while (slide.contentCell.firstChild) {
            slide.contentCellRef.value.appendChild(slide.contentCell.firstChild);
          }
        }
      }
    });
  };

  // 初始渲染
  renderCarousel();

  // 设置视频懒加载
  setupVideoObserver(block);

  // Hero 变体：首张幻灯片图片 eager 加载（LCP 优化）
  if (block.closest('.section.hero')) {
    const firstSlideImg = block.querySelector('.carousel-slide:first-child img');
    if (firstSlideImg) {
      firstSlideImg.loading = 'eager';
      firstSlideImg.fetchPriority = 'high';
    }
  }

  // 自动轮播（hero 变体默认关闭，reduced-motion 时禁用）
  if (slideCount > 1 && config.autoPlay && !prefersReducedMotion()) {
    const autoAdvance = () => {
      if (!autoPlayPaused) {
        currentIndex = (currentIndex + 1) % slideCount;
        renderCarousel();
      }
    };

    autoPlayTimer = setInterval(autoAdvance, 5000);

    block.addEventListener('mouseenter', () => clearInterval(autoPlayTimer));
    block.addEventListener('mouseleave', () => {
      autoPlayTimer = setInterval(autoAdvance, 5000);
    });
  }
}
