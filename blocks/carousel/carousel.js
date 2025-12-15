/**
 * Carousel Block - 轮播组件 (简化版)
 *
 * 功能特性:
 * - 多 slide 支持
 * - 自动轮播（5秒间隔）
 * - 底部圆点导航
 * - 支持 Universal Editor 可视化编辑
 */
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * 切换到指定 slide
 * @param {HTMLElement} container - carousel 容器
 * @param {number} index - 目标 slide 索引
 */
function goToSlide(container, index) {
  const slides = container.querySelectorAll('.carousel-slide');
  const dots = container.querySelectorAll('.carousel-dot');

  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });

  container.querySelector('.carousel-slides').style.setProperty('--current-slide', index);
}

/**
 * 检查 row 是否有实际内容（图片、文字等）
 * @param {HTMLElement} row
 * @returns {boolean}
 */
function hasContent(row) {
  // 检查是否有图片
  if (row.querySelector('picture, img')) return true;
  // 检查是否有非空文本
  const text = row.textContent.trim();
  if (text) return true;
  // 检查是否有链接
  if (row.querySelector('a')) return true;
  return false;
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

  // 创建容器
  const container = document.createElement('div');
  container.className = 'carousel-container transition-slide';

  const slidesWrapper = document.createElement('div');
  slidesWrapper.className = 'carousel-slides';

  // 处理每个 slide
  rows.forEach((row, index) => {
    const slide = document.createElement('div');
    slide.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
    slide.dataset.index = index;
    moveInstrumentation(row, slide);

    // 将 row 中的内容移动到 slide
    while (row.firstElementChild) {
      const cell = row.firstElementChild;
      // 检查是否是图片
      if (cell.querySelector('picture')) {
        cell.className = 'slide-image';
      } else {
        cell.className = 'slide-content';
      }
      slide.append(cell);
    }
    slidesWrapper.append(slide);
  });

  container.append(slidesWrapper);

  // 添加圆点导航
  const slideCount = rows.length;
  if (slideCount > 1) {
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'carousel-dots';

    for (let i = 0; i < slideCount; i += 1) {
      const dot = document.createElement('button');
      dot.className = `carousel-dot ${i === 0 ? 'active' : ''}`;
      dot.dataset.index = i;
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dotsContainer.append(dot);
    }
    container.append(dotsContainer);
  }

  // 清空并添加新内容
  block.textContent = '';
  block.append(container);

  // 自动轮播状态
  let currentIndex = 0;

  // 添加点击事件
  container.querySelectorAll('.carousel-dot').forEach((dot, i) => {
    dot.addEventListener('click', () => {
      currentIndex = i;
      goToSlide(container, i);
    });
  });

  // 自动轮播
  if (slideCount > 1) {
    setInterval(() => {
      currentIndex = (currentIndex + 1) % slideCount;
      goToSlide(container, currentIndex);
    }, 5000);
  }
}
