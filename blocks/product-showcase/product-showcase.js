/**
 * Product Showcase Block
 *
 * Dual-layer layout:
 *  - Background layer: auto-rotating vehicle images with fade transition
 *  - Foreground layer: responsive product card grid
 *
 * Row parsing strategy (order-agnostic):
 *  - A row containing ONLY picture(s) with no meaningful text → background images row
 *  - A row containing a single numeric cell → backgroundInterval
 *  - Any other row → product-card item
 */
import {
  html,
  render,
  classMap,
  createRef,
  ref,
} from '../../scripts/lit.js';
import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const DEFAULT_INTERVAL = 5000;
const MIN_INTERVAL = 1500;

function textOf(cell) {
  return (cell?.textContent || '').trim();
}

function hasPicture(cell) {
  return !!cell?.querySelector('picture, img');
}

function classifyRow(row) {
  const cells = [...row.children];
  if (cells.length === 0) return { kind: 'empty' };

  const pictures = [...row.querySelectorAll('picture')];
  const text = textOf(row);

  if (pictures.length > 0 && text === '') {
    return { kind: 'background', pictures };
  }

  if (pictures.length === 0 && cells.length === 1 && /^\d+$/.test(text)) {
    return { kind: 'interval', value: parseInt(text, 10) };
  }

  return { kind: 'card', cells };
}

function extractCard(row) {
  const cells = [...row.children];
  const imageCell = cells.find((c) => hasPicture(c));
  const textCells = cells.filter((c) => !hasPicture(c));
  const linkCell = cells.find((c) => c.querySelector('a'));

  const [nameCell, subtitleCell, linkTextCell] = textCells.filter(
    (c) => c !== linkCell,
  );

  return {
    row,
    imageCell,
    productName: textOf(nameCell),
    subtitle: textOf(subtitleCell),
    linkEl: linkCell?.querySelector('a'),
    linkText: textOf(linkTextCell) || linkCell?.querySelector('a')?.textContent?.trim() || 'Learn More',
    cardRef: createRef(),
    imageRef: createRef(),
  };
}

function optimizePicture(picture) {
  const img = picture.querySelector('img');
  if (!img) return picture;
  const optimized = createOptimizedPicture(
    img.src,
    img.alt || '',
    false,
    [{ width: '1600' }, { width: '900' }],
  );
  moveInstrumentation(img, optimized.querySelector('img'));
  picture.replaceWith(optimized);
  return optimized;
}

function optimizeCardPicture(picture) {
  const img = picture.querySelector('img');
  if (!img) return picture;
  const optimized = createOptimizedPicture(
    img.src,
    img.alt || '',
    false,
    [{ width: '440' }, { width: '220' }],
  );
  moveInstrumentation(img, optimized.querySelector('img'));
  picture.replaceWith(optimized);
  return optimized;
}

export default function decorate(block) {
  const rows = [...block.children];
  let intervalMs = DEFAULT_INTERVAL;
  let backgroundPictures = [];
  const cards = [];

  rows.forEach((row) => {
    const info = classifyRow(row);
    if (info.kind === 'background') {
      backgroundPictures = info.pictures;
    } else if (info.kind === 'interval') {
      intervalMs = Math.max(MIN_INTERVAL, info.value);
    } else if (info.kind === 'card') {
      cards.push(extractCard(row));
    }
  });

  // Optimize background pictures once
  backgroundPictures = backgroundPictures.map(optimizePicture);

  // Render with lit-html
  const bgContainerRef = createRef();

  const template = html`
    <div class="product-showcase-bg" ${ref(bgContainerRef)} aria-hidden="true"></div>
    <ul class="product-showcase-grid">
      ${cards.map((card) => {
    const cardClass = classMap({
      'product-showcase-card': true,
    });
    return html`
          <li class=${cardClass} ${ref(card.cardRef)}>
            <a class="product-showcase-card-link"
               href=${card.linkEl?.getAttribute('href') || '#'}
               aria-label=${card.productName || card.linkText}>
              <div class="product-showcase-card-image" ${ref(card.imageRef)}></div>
              <div class="product-showcase-card-body">
                ${card.productName ? html`<h3 class="product-showcase-card-title">${card.productName}</h3>` : ''}
                ${card.subtitle ? html`<p class="product-showcase-card-subtitle">${card.subtitle}</p>` : ''}
                <span class="product-showcase-card-cta">
                  ${card.linkText}
                  <span aria-hidden="true" class="product-showcase-card-cta-arrow">→</span>
                </span>
              </div>
            </a>
          </li>
        `;
  })}
    </ul>
  `;

  block.textContent = '';
  render(template, block);

  // Populate background layer
  const bgContainer = bgContainerRef.value;
  if (bgContainer && backgroundPictures.length > 0) {
    backgroundPictures.forEach((pic, i) => {
      const slide = document.createElement('div');
      slide.className = 'product-showcase-bg-slide';
      if (i === 0) slide.classList.add('is-active');
      slide.appendChild(pic);
      bgContainer.appendChild(slide);
    });
  }

  // Apply UE instrumentation + move picture content for cards
  cards.forEach((card) => {
    if (card.cardRef.value && card.row) {
      moveInstrumentation(card.row, card.cardRef.value);
    }
    if (card.imageRef.value && card.imageCell) {
      const pic = card.imageCell.querySelector('picture');
      if (pic) {
        const optimized = optimizeCardPicture(pic);
        card.imageRef.value.appendChild(optimized);
      }
    }
  });

  // Background auto-rotation
  const slides = bgContainer ? [...bgContainer.querySelectorAll('.product-showcase-bg-slide')] : [];
  if (slides.length > 1) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      let currentIdx = 0;
      let timerId = null;

      const advance = () => {
        slides[currentIdx].classList.remove('is-active');
        currentIdx = (currentIdx + 1) % slides.length;
        slides[currentIdx].classList.add('is-active');
      };

      const start = () => {
        if (timerId) return;
        timerId = window.setInterval(advance, intervalMs);
      };

      const stop = () => {
        if (!timerId) return;
        window.clearInterval(timerId);
        timerId = null;
      };

      // Only rotate while visible
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) start();
            else stop();
          });
        }, { threshold: 0.15 });
        io.observe(block);
      } else {
        start();
      }

      // Pause when tab hidden
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else start();
      });
    }
  }
}
