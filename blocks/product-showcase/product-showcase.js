/**
 * Product Showcase Block
 *
 * CSS Grid card layout with full-bleed background images,
 * logo overlays, gradient masks, and bottom-aligned text.
 * Supports big (span 2) and small (span 1) card sizes.
 */
import {
  html,
  render,
  nothing,
  createRef,
  ref,
} from '../../scripts/lit.js';
import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Extract product card data from a row
 * @param {HTMLElement} row
 * @param {number} index
 * @returns {Object}
 */
function extractCardData(row, index) {
  const cells = [...row.children];
  const pictures = row.querySelectorAll('picture');
  const link = row.querySelector('a');

  // First picture = background image, second picture = logo (if present)
  const bgPicture = pictures[0] || null;
  const logoPicture = pictures[1] || null;

  // Find the content cell (non-picture text content)
  const textElements = [];
  cells.forEach((cell) => {
    cell.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach((el) => {
      // Skip paragraphs that only contain a link or a picture
      if (el.children.length === 1 && (el.querySelector('a') || el.querySelector('picture'))) return;
      if (el.textContent.trim()) textElements.push(el);
    });
  });

  // Detect size: check for 'big' class on block or text content
  const sizeText = [...cells]
    .map((c) => c.textContent.trim().toLowerCase())
    .find((t) => t === 'big' || t === 'small');
  const size = row.classList.contains('big') || sizeText === 'big' ? 'big' : 'small';

  return {
    index,
    row,
    bgPicture,
    logoPicture,
    productName: textElements[0]?.textContent.trim() || '',
    subtitle: textElements[1]?.textContent.trim() || '',
    linkUrl: link?.href || '',
    linkText: link?.textContent.trim() || '',
    size,
    cardRef: createRef(),
    bgRef: createRef(),
    logoRef: createRef(),
  };
}

/**
 * Decorate product-showcase block
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const rows = [...block.children].filter((row) => row.textContent.trim() || row.querySelector('picture, img'));
  if (rows.length === 0) return;

  const cards = rows.map((row, index) => extractCardData(row, index));
  let instrumentationApplied = false;

  const template = html`
    ${cards.map((card) => {
    const hasLink = !!card.linkUrl;
    const cardContent = html`
        <div class="product-showcase-card-bg" ${ref(card.bgRef)} aria-hidden="true"></div>
        ${card.logoPicture ? html`<div class="product-showcase-card-logo" ${ref(card.logoRef)} aria-hidden="true"></div>` : nothing}
        <div class="product-showcase-card-mask" aria-hidden="true"></div>
        <div class="product-showcase-card-bottom">
          ${card.productName ? html`<h3 class="product-showcase-card-name">${card.productName}</h3>` : nothing}
          ${card.subtitle ? html`<p class="product-showcase-card-subtitle">${card.subtitle}</p>` : nothing}
          ${card.linkText ? html`<div class="product-showcase-card-cta-wrap"><span class="product-showcase-card-cta">${card.linkText}</span></div>` : nothing}
        </div>
      `;

    return hasLink
      ? html`<a class="product-showcase-card" data-size=${card.size} role="listitem" href=${card.linkUrl} aria-label="${card.productName}" ${ref(card.cardRef)}>${cardContent}</a>`
      : html`<div class="product-showcase-card" data-size=${card.size} role="listitem" ${ref(card.cardRef)}>${cardContent}</div>`;
  })}
  `;

  block.textContent = '';
  block.setAttribute('role', 'list');
  block.setAttribute('aria-label', 'Product showcase');
  render(template, block);

  // Apply images and instrumentation (once)
  if (!instrumentationApplied) {
    cards.forEach((card) => {
      // Move UE instrumentation
      if (card.cardRef.value && card.row) {
        moveInstrumentation(card.row, card.cardRef.value);
      }

      // Background image
      if (card.bgRef.value && card.bgPicture) {
        const img = card.bgPicture.querySelector('img');
        if (img) {
          const optimized = createOptimizedPicture(img.src, img.alt || '', false, [
            { media: '(min-width: 1200px)', width: '1920' },
            { media: '(min-width: 600px)', width: '1200' },
            { width: '750' },
          ]);
          card.bgRef.value.appendChild(optimized);
        }
      }

      // Logo image
      if (card.logoRef.value && card.logoPicture) {
        const img = card.logoPicture.querySelector('img');
        if (img) {
          const optimized = createOptimizedPicture(img.src, img.alt || '', false, [
            { width: '440' },
          ]);
          card.logoRef.value.appendChild(optimized);
        }
      }
    });

    instrumentationApplied = true;
  }
}
