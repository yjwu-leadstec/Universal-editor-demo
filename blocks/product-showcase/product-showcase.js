/**
 * Product Showcase Block
 *
 * Double-layer layout:
 * - Background: vehicle showcase image carousel with crossfade
 * - Foreground: product card grid with responsive layout
 */
import {
  html,
  render,
  nothing,
  classMap,
  createRef,
  ref,
} from '../../scripts/lit.js';
import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const AUTOPLAY_INTERVAL = 5000;

/**
 * Check if a row has actual content
 * @param {HTMLElement} row
 * @returns {boolean}
 */
function hasContent(row) {
  if (row.querySelector('picture, img')) return true;
  if (row.textContent.trim()) return true;
  if (row.querySelector('a')) return true;
  return false;
}

/**
 * Extract background images from the first row
 * @param {HTMLElement} row
 * @returns {HTMLElement[]}
 */
function extractBackgroundImages(row) {
  return [...row.querySelectorAll('picture')];
}

/**
 * Extract product card data from a row
 * @param {HTMLElement} row
 * @param {number} index
 * @returns {Object}
 */
function extractCardData(row, index) {
  const cells = [...row.children];
  const imageCell = cells.find((cell) => cell.querySelector('picture'));
  const contentCell = cells.find((cell) => !cell.querySelector('picture') && cell.textContent.trim());

  const link = row.querySelector('a');
  // Filter out paragraphs that only contain a link (CTA row)
  const textElements = contentCell
    ? [...contentCell.querySelectorAll('h1, h2, h3, h4, h5, h6, p')].filter(
      (el) => !(el.children.length === 1 && el.querySelector('a')),
    ) : [];

  return {
    index,
    row,
    imageCell,
    productName: textElements[0]?.textContent.trim() || '',
    subtitle: textElements[1]?.textContent.trim() || '',
    linkUrl: link?.href || '',
    linkText: link?.textContent.trim() || '',
    cardRef: createRef(),
    imageRef: createRef(),
  };
}

/**
 * Check if reduced motion is preferred
 * @returns {boolean}
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Decorate product-showcase block
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const rows = [...block.children].filter(hasContent);
  if (rows.length === 0) return;

  // First row = background images, remaining rows = product cards
  const bgRow = rows[0];
  const cardRows = rows.slice(1);

  const bgPictures = extractBackgroundImages(bgRow);
  const cards = cardRows.map((row, index) => extractCardData(row, index));

  let currentBgIndex = 0;
  let autoplayTimer = null;
  let instrumentationApplied = false;

  const bgRefs = bgPictures.map(() => createRef());

  const renderBlock = () => {
    const template = html`
      <div class="product-showcase-background" aria-hidden="true">
        ${bgPictures.map((_, i) => html`
          <div
            class=${classMap({
    'product-showcase-bg-slide': true,
    active: i === currentBgIndex,
  })}
            ${ref(bgRefs[i])}
          ></div>
        `)}
      </div>
      <div class="product-showcase-grid">
        ${cards.map((card) => {
    const hasLink = !!card.linkUrl;
    const cardContent = html`
              <div class="product-showcase-card-image" ${ref(card.imageRef)}></div>
              <div class="product-showcase-card-body">
                <h3 class="product-showcase-card-name">${card.productName}</h3>
                <p class="product-showcase-card-subtitle">${card.subtitle}</p>
                ${card.linkText ? html`<span class="product-showcase-card-cta">${card.linkText}</span>` : nothing}
              </div>
            `;
    return hasLink
      ? html`<a class="product-showcase-card" href=${card.linkUrl} ${ref(card.cardRef)}>${cardContent}</a>`
      : html`<div class="product-showcase-card" ${ref(card.cardRef)}>${cardContent}</div>`;
  })}
      </div>
    `;

    render(template, block);

    // Move background images and optimize (first render only)
    if (!instrumentationApplied) {
      bgPictures.forEach((pic, i) => {
        if (bgRefs[i].value && bgRefs[i].value.children.length === 0) {
          const img = pic.querySelector('img');
          if (img) {
            const optimized = createOptimizedPicture(img.src, img.alt || '', false, [
              { media: '(min-width: 1200px)', width: '1920' },
              { media: '(min-width: 600px)', width: '1200' },
              { width: '750' },
            ]);
            bgRefs[i].value.appendChild(optimized);
          }
        }
      });

      cards.forEach((card) => {
        if (card.cardRef.value && card.row) {
          moveInstrumentation(card.row, card.cardRef.value);
        }
        if (card.imageRef.value && card.imageCell) {
          if (card.imageRef.value.children.length === 0) {
            const img = card.imageCell.querySelector('img');
            if (img) {
              const optimized = createOptimizedPicture(img.src, img.alt || '', false, [
                { width: '440' },
              ]);
              card.imageRef.value.appendChild(optimized);
            }
          }
        }
      });

      instrumentationApplied = true;
    }
  };

  renderBlock();

  // Background autoplay with IntersectionObserver
  if (bgPictures.length > 1 && !prefersReducedMotion()) {
    const advanceSlide = () => {
      currentBgIndex = (currentBgIndex + 1) % bgPictures.length;
      // Only toggle active class, no full re-render
      bgRefs.forEach((bgRef, i) => {
        if (bgRef.value) {
          bgRef.value.classList.toggle('active', i === currentBgIndex);
        }
      });
    };

    const startAutoplay = () => {
      if (autoplayTimer) return;
      autoplayTimer = setInterval(advanceSlide, AUTOPLAY_INTERVAL);
    };

    const stopAutoplay = () => {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startAutoplay();
          } else {
            stopAutoplay();
          }
        });
      },
      { threshold: 0.25 },
    );

    observer.observe(block);
  }
}
