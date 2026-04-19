/**
 * Footer Block — Li Auto style
 *
 * Features:
 * - Pure black background with white text
 * - Desktop: 5-column nav grid
 * - Mobile (<900px): accordion-style collapsible sections
 * - Back-to-top button with scroll threshold
 * - Universal Editor support via moveInstrumentation
 */
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import {
  html, render, nothing, repeat, ref, createRef,
} from '../../scripts/lit.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const SCROLL_THRESHOLD = 300;
/**
 * Extract footer data from fragment DOM.
 * Expects:
 *   Section 0 — nav columns (each default-content-wrapper has h3 + ul)
 *   Section 1 — bottom bar (policy links, copyright, ICP)
 * @param {HTMLElement} fragment
 * @returns {{ columns: Array, bottomItems: Array }}
 */
function extractFooterData(fragment) {
  const sections = [...fragment.querySelectorAll(':scope .section')];

  // Nav columns from the first section
  const columns = [];
  const navSection = sections[0];
  if (navSection) {
    const wrappers = [...navSection.querySelectorAll('.default-content-wrapper')];
    wrappers.forEach((wrapper) => {
      const heading = wrapper.querySelector('h2, h3, h4, h5, h6');
      const list = wrapper.querySelector('ul');
      if (heading && list) {
        const links = [...list.querySelectorAll('li')].map((li) => {
          const a = li.querySelector('a');
          return {
            text: a ? a.textContent.trim() : li.textContent.trim(),
            href: a ? a.href : '#',
            element: li,
          };
        });
        columns.push({
          title: heading.textContent.trim(),
          links,
          wrapperElement: wrapper,
        });
      }
    });
  }

  // Bottom bar from the second section
  const bottomItems = [];
  const bottomSection = sections[1];
  if (bottomSection) {
    const wrappers = [...bottomSection.querySelectorAll('.default-content-wrapper')];
    wrappers.forEach((wrapper) => {
      const anchors = [...wrapper.querySelectorAll('a')];
      const texts = [];
      // Collect text nodes and links
      wrapper.querySelectorAll('p').forEach((p) => {
        const a = p.querySelector('a');
        if (a) {
          texts.push({
            type: 'link', text: a.textContent.trim(), href: a.href, element: p,
          });
        } else if (p.textContent.trim()) {
          texts.push({ type: 'text', text: p.textContent.trim(), element: p });
        }
      });
      if (texts.length) {
        bottomItems.push(...texts);
      } else if (anchors.length) {
        anchors.forEach((a) => {
          bottomItems.push({
            type: 'link', text: a.textContent.trim(), href: a.href, element: a,
          });
        });
      }
    });
  }

  return {
    columns, bottomItems, navSection, bottomSection,
  };
}

/**
 * Back-to-top button template
 */
function backToTopTemplate(btnRef) {
  return html`
    <button
      class="footer-back-to-top"
      aria-label="Back to top"
      ${ref(btnRef)}
      @click=${() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 3L2 9l1.4 1.4L8 5.8l4.6 4.6L14 9z" fill="currentColor"/>
      </svg>
    </button>
  `;
}

/**
 * Desktop nav column template
 */
function navColumnTemplate(column, colRef) {
  return html`
    <div class="footer-nav-column" ${ref(colRef)}>
      <h3 class="footer-nav-title">${column.title}</h3>
      <ul class="footer-nav-list">
        ${repeat(column.links, (link, i) => i, (link) => html`
          <li><a href="${link.href}">${link.text}</a></li>
        `)}
      </ul>
    </div>
  `;
}

/**
 * Mobile accordion item template
 */
function accordionItemTemplate(column, colRef) {
  return html`
    <div class="footer-accordion-item" ${ref(colRef)}>
      <button
        class="footer-accordion-header"
        aria-expanded="false"
        @click=${(e) => {
    const btn = e.currentTarget;
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    // Close all other accordions
    btn.closest('.footer-nav-mobile')
      .querySelectorAll('.footer-accordion-header[aria-expanded="true"]')
      .forEach((other) => {
        if (other !== btn) other.setAttribute('aria-expanded', 'false');
      });
    btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  }}
      >
        <span>${column.title}</span>
        <span class="footer-accordion-chevron" aria-hidden="true"></span>
      </button>
      <div class="footer-accordion-content">
        <ul>
          ${repeat(column.links, (link, i) => i, (link) => html`
            <li><a href="${link.href}">${link.text}</a></li>
          `)}
        </ul>
      </div>
    </div>
  `;
}

/**
 * Bottom bar template
 */
function bottomBarTemplate(bottomItems, bottomRef) {
  return html`
    <div class="footer-bottom" ${ref(bottomRef)}>
      ${repeat(bottomItems, (item, i) => i, (item) => (item.type === 'link'
    ? html`<a class="footer-bottom-link" href="${item.href}">${item.text}</a>`
    : html`<span class="footer-bottom-text">${item.text}</span>`
  ))}
    </div>
  `;
}

/**
 * Main footer template
 */
function footerTemplate(data, refs) {
  return html`
    <div class="footer-inner">
      ${backToTopTemplate(refs.backToTop)}
      <div class="footer-nav">
        ${repeat(data.columns, (col, i) => i, (col, i) => navColumnTemplate(col, refs.columns[i]))}
      </div>
      <div class="footer-nav-mobile">
        ${repeat(data.columns, (col, i) => i, (col, i) => accordionItemTemplate(col, refs.mobileColumns[i]))}
      </div>
      ${data.bottomItems.length
    ? bottomBarTemplate(data.bottomItems, refs.bottom)
    : nothing}
    </div>
  `;
}

/**
 * Set up back-to-top button visibility on scroll
 */
function initBackToTop(btnRef) {
  const btn = btnRef.value;
  if (!btn) return;

  function onScroll() {
    btn.classList.toggle('visible', window.scrollY > SCROLL_THRESHOLD);
  }

  window.addEventListener('scroll', onScroll, {
    passive: true,
  });
  onScroll();
}

/**
 * Apply Universal Editor instrumentation to rendered elements
 */
function applyInstrumentation(data, refs) {
  // Nav columns
  data.columns.forEach((col, i) => {
    const desktopEl = refs.columns[i]?.value;
    const mobileEl = refs.mobileColumns[i]?.value;
    if (desktopEl && col.wrapperElement) {
      moveInstrumentation(col.wrapperElement, desktopEl);
    }
    if (mobileEl && col.wrapperElement) {
      // Clone instrumentation attrs for mobile duplicate
      [...col.wrapperElement.attributes]
        .filter((attr) => attr.name.startsWith('data-aue-') || attr.name.startsWith('data-richtext-'))
        .forEach((attr) => mobileEl.setAttribute(attr.name, attr.value));
    }
  });

  // Bottom bar
  if (refs.bottom.value && data.bottomSection) {
    moveInstrumentation(data.bottomSection, refs.bottom.value);
  }
}

/**
 * Loads and decorates the footer
 * @param {HTMLElement} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  if (!fragment) return;

  const data = extractFooterData(fragment);

  // Create refs for instrumentation
  const refs = {
    backToTop: createRef(),
    columns: data.columns.map(() => createRef()),
    mobileColumns: data.columns.map(() => createRef()),
    bottom: createRef(),
  };

  block.textContent = '';
  render(footerTemplate(data, refs), block);

  // Post-render setup
  applyInstrumentation(data, refs);
  initBackToTop(refs.backToTop);
}
