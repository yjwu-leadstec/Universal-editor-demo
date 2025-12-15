/**
 * Carousel Block - 轮播组件 (lit-html 版本)
 *
 * 功能特性:
 * - 多 slide 支持
 * - 自动轮播（5秒间隔）
 * - 底部圆点导航
 * - 支持 Universal Editor 可视化编辑
 */
import { html, render, classMap, createRef, ref } from '../../scripts/lit.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * 检查 row 是否有实际内容（图片、文字等）
 * @param {HTMLElement} row
 * @returns {boolean}
 */
function hasContent(row) {
  if (row.querySelector('picture, img')) return true;
  const text = row.textContent.trim();
  if (text) return true;
  if (row.querySelector('a')) return true;
  return false;
}

/**
 * 提取 slide 数据
 * @param {HTMLElement} row
 * @param {number} index
 * @returns {Object}
 */
function extractSlideData(row, index) {
  const cells = [...row.children];
  const imageCell = cells.find((cell) => cell.querySelector('picture'));
  const contentCell = cells.find((cell) => !cell.querySelector('picture'));

  return {
    index,
    row,
    imageCell,
    contentCell,
    slideRef: createRef(),
    imageCellRef: createRef(),
    contentCellRef: createRef(),
  };
}

/**
 * Decorate carousel block
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  // 过滤掉空的 rows
  const rows = [...block.children].filter(hasContent);

  // eslint-disable-next-line no-console
  console.log('[Carousel] Valid slides count:', rows.length);

  if (rows.length === 0) return;

  // 提取所有 slide 数据
  const slides = rows.map((row, index) => extractSlideData(row, index));
  const slideCount = slides.length;

  // 当前 slide 索引
  let currentIndex = 0;

  // 切换到指定 slide
  const goToSlide = (index) => {
    currentIndex = index;
    renderCarousel();
  };

  // 渲染轮播组件
  const renderCarousel = () => {
    const template = html`
      <div class="carousel-container transition-slide">
        <div class="carousel-slides" style="--current-slide: ${currentIndex}">
          ${slides.map((slide) => html`
            <div
              class=${classMap({
                'carousel-slide': true,
                active: slide.index === currentIndex,
              })}
              data-index=${slide.index}
              ${ref(slide.slideRef)}
            >
              ${slide.imageCell ? html`
                <div class="slide-image" ${ref(slide.imageCellRef)}></div>
              ` : ''}
              ${slide.contentCell ? html`
                <div class="slide-content" ${ref(slide.contentCellRef)}></div>
              ` : ''}
            </div>
          `)}
        </div>
        ${slideCount > 1 ? html`
          <div class="carousel-dots">
            ${slides.map((slide) => html`
              <button
                class=${classMap({
                  'carousel-dot': true,
                  active: slide.index === currentIndex,
                })}
                data-index=${slide.index}
                aria-label="Go to slide ${slide.index + 1}"
                @click=${() => goToSlide(slide.index)}
              ></button>
            `)}
          </div>
        ` : ''}
      </div>
    `;

    render(template, block);

    // 首次渲染后，移动内容和应用 instrumentation
    slides.forEach((slide) => {
      // 应用 Universal Editor instrumentation
      if (slide.slideRef.value && slide.row) {
        moveInstrumentation(slide.row, slide.slideRef.value);
      }

      // 移动图片内容
      if (slide.imageCellRef.value && slide.imageCell) {
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

  // 自动轮播
  if (slideCount > 1) {
    setInterval(() => {
      currentIndex = (currentIndex + 1) % slideCount;
      renderCarousel();
    }, 5000);
  }
}
