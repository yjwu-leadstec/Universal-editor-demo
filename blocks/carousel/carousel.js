/**
 * Carousel Block - 轮播组件
 *
 * 功能特性:
 * - 多 slide 支持，每个 slide 可配置图片、标题、描述、CTA 按钮、背景色
 * - 自动轮播（可配置间隔时间）
 * - 底部圆点导航
 * - 无限循环
 * - 三种过渡动画：slide（滑动）、fade（淡入淡出）、none（无动画）
 * - 支持 Universal Editor 可视化编辑
 */
import {
  html, render, nothing, repeat, createRef, ref,
} from '../../scripts/lit.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * 从 block 属性中提取配置
 * @param {HTMLElement} block
 * @returns {Object} 配置对象
 */
function getConfig(block) {
  return {
    autoPlay: block.dataset.autoPlay !== 'false',
    autoPlayInterval: parseInt(block.dataset.autoPlayInterval, 10) || 5000,
    loop: block.dataset.loop !== 'false',
    transition: block.dataset.transition || 'slide',
  };
}

/**
 * 从 slide 行提取数据
 * @param {HTMLElement} row - slide 行元素
 * @param {number} index - slide 索引
 * @returns {Object} slide 数据
 */
function extractSlideData(row, index) {
  const cells = [...row.children];
  const data = {
    index,
    sourceRow: row,
    picture: null,
    imageAlt: '',
    text: '',
    link: null,
  };

  cells.forEach((cell) => {
    const picture = cell.querySelector('picture');
    const link = cell.querySelector('a');

    if (picture) {
      data.picture = picture;
      const img = picture.querySelector('img');
      if (img) data.imageAlt = img.alt || '';
    } else if (link && !data.link) {
      data.link = link;
    } else if (cell.innerHTML.trim() && !data.text) {
      data.text = cell.innerHTML;
    }
  });

  return data;
}

/**
 * 渲染单个 slide
 * @param {Object} slide - slide 数据
 * @param {number} currentIndex - 当前活动 slide 索引
 * @param {Object} refs - slide refs 数组
 * @returns {TemplateResult}
 */
function renderSlide(slide, currentIndex, refs) {
  const isActive = slide.index === currentIndex;
  const slideRef = refs[slide.index];

  return html`
    <div
      class="carousel-slide ${isActive ? 'active' : ''}"
      ${ref(slideRef)}
      data-index="${slide.index}"
    >
      ${slide.picture ? html`
        <div class="slide-image">${slide.picture}</div>
      ` : nothing}
      <div class="slide-content">
        ${slide.text ? html`<div class="slide-text">${slide.text}</div>` : nothing}
        ${slide.link ? html`
          <a href="${slide.link.href}" class="slide-cta">${slide.link.textContent}</a>
        ` : nothing}
      </div>
    </div>
  `;
}

/**
 * 渲染圆点导航
 * @param {number} total - slide 总数
 * @param {number} current - 当前 slide 索引
 * @param {Function} onClick - 点击回调
 * @returns {TemplateResult}
 */
function renderDots(total, current, onClick) {
  if (total <= 1) return nothing;

  const dots = Array.from({ length: total }, (_, i) => i);
  return html`
    <div class="carousel-dots">
      ${dots.map((i) => html`
        <button
          class="carousel-dot ${i === current ? 'active' : ''}"
          data-index="${i}"
          @click="${() => onClick(i)}"
          aria-label="Go to slide ${i + 1}"
        ></button>
      `)}
    </div>
  `;
}

/**
 * 检测是否处于编辑器模式
 * @returns {boolean}
 */
function detectEditorMode() {
  return window.location.href.includes('adobeaemcloud.com')
    || document.body.classList.contains('adobe-ue-edit');
}

/**
 * Carousel 控制器类
 */
class CarouselController {
  constructor(block, slides, config) {
    this.block = block;
    this.slides = slides;
    this.config = config;
    this.currentIndex = 0;
    this.autoPlayTimer = null;
    this.slideRefs = slides.map(() => createRef());
    this.isEditorMode = detectEditorMode();
  }

  goTo(index) {
    const { slides, config } = this;
    let newIndex = index;

    if (config.loop) {
      if (newIndex < 0) newIndex = slides.length - 1;
      if (newIndex >= slides.length) newIndex = 0;
    } else {
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= slides.length) newIndex = slides.length - 1;
    }

    this.currentIndex = newIndex;
    this.render();
  }

  next() {
    this.goTo(this.currentIndex + 1);
  }

  prev() {
    this.goTo(this.currentIndex - 1);
  }

  startAutoPlay() {
    const { config, slides } = this;
    if (!config.autoPlay || slides.length <= 1 || this.isEditorMode) return;

    this.stopAutoPlay();
    this.autoPlayTimer = setInterval(() => this.next(), config.autoPlayInterval);
  }

  stopAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  handleMouseEnter() {
    this.stopAutoPlay();
  }

  handleMouseLeave() {
    this.startAutoPlay();
  }

  render() {
    const {
      block, slides, config, currentIndex, slideRefs,
    } = this;
    const transitionClass = `transition-${config.transition}`;

    const slidesTemplate = repeat(
      slides,
      (slide) => slide.index,
      (slide) => renderSlide(slide, currentIndex, slideRefs),
    );

    render(html`
      <div
        class="carousel-container ${transitionClass}"
        @mouseenter="${() => this.handleMouseEnter()}"
        @mouseleave="${() => this.handleMouseLeave()}"
      >
        <div class="carousel-slides" style="--current-slide: ${currentIndex}">
          ${slidesTemplate}
        </div>
        ${renderDots(slides.length, currentIndex, (i) => this.goTo(i))}
      </div>
    `, block);

    // 应用 instrumentation
    slides.forEach((slide, i) => {
      const el = slideRefs[i].value;
      if (el && slide.sourceRow) {
        moveInstrumentation(slide.sourceRow, el);
      }
    });
  }

  init() {
    this.render();
    this.startAutoPlay();
  }

  destroy() {
    this.stopAutoPlay();
  }
}

/**
 * Decorate carousel block
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const config = getConfig(block);
  const rows = [...block.children];

  // 提取所有 slide 数据
  const slides = rows.map((row, index) => extractSlideData(row, index));

  // 如果没有 slides，不渲染
  if (slides.length === 0) return;

  // 清空 block 内容
  block.textContent = '';

  // 创建并初始化控制器
  const controller = new CarouselController(block, slides, config);
  controller.init();

  // 存储控制器引用，便于清理
  block.carouselController = controller;
}
