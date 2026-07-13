/**
 * Global footer loaded from an authored footer fragment.
 */
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import {
  html, render, nothing, repeat, ref, createRef,
} from '../../scripts/lit.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const SCROLL_THRESHOLD = 300;
const HEADING_SELECTOR = 'h2, h3, h4, h5, h6';
const INSTRUMENTATION_PREFIXES = ['data-aue-', 'data-richtext-'];

function captureInstrumentation(element) {
  if (!element) return [];
  return [...element.attributes]
    .filter(({ name }) => INSTRUMENTATION_PREFIXES.some((prefix) => name.startsWith(prefix)))
    .map(({ name, value }) => ({ name, value }));
}

function applyInstrumentation(attributes, element) {
  attributes.forEach(({ name, value }) => element.setAttribute(name, value));
}

function nextList(heading) {
  let sibling = heading.nextElementSibling;
  while (sibling) {
    if (sibling.matches(HEADING_SELECTOR)) return null;
    if (sibling.matches('ul')) return sibling;
    const nestedList = sibling.querySelector(':scope > ul');
    if (nestedList) return nestedList;
    sibling = sibling.nextElementSibling;
  }
  return null;
}

function extractColumns(navSection) {
  if (!navSection) return [];
  return [...navSection.querySelectorAll(HEADING_SELECTOR)].flatMap((heading) => {
    const list = nextList(heading);
    if (!list) return [];
    const links = [...list.querySelectorAll(':scope > li')].map((item) => {
      const anchor = item.querySelector('a');
      return {
        text: anchor?.textContent?.trim() || item.textContent.trim(),
        href: anchor?.href || '#',
      };
    }).filter((link) => link.text);
    if (!links.length) return [];

    const source = heading.closest('[data-aue-resource]') || heading;
    return [{
      title: heading.textContent.trim(),
      links,
      source,
      instrumentation: captureInstrumentation(source),
    }];
  });
}

function extractBottomItems(bottomSection) {
  if (!bottomSection) return [];
  const paragraphs = [...bottomSection.querySelectorAll('p')];
  if (paragraphs.length) {
    return paragraphs.flatMap((paragraph) => {
      const anchors = [...paragraph.querySelectorAll('a')];
      if (anchors.length) {
        return anchors.map((anchor) => ({
          type: 'link',
          text: anchor.textContent.trim(),
          href: anchor.href,
        }));
      }
      const text = paragraph.textContent.trim();
      return text ? [{ type: 'text', text }] : [];
    });
  }

  return [...bottomSection.querySelectorAll('a')].map((anchor) => ({
    type: 'link',
    text: anchor.textContent.trim(),
    href: anchor.href,
  }));
}

/**
 * Extract footer columns and legal information from semantic fragment content.
 * @param {HTMLElement} fragment
 * @returns {Object}
 */
function extractFooterData(fragment) {
  const sections = [...fragment.querySelectorAll(':scope > .section')];
  const resolvedSections = sections.length ? sections : [...fragment.children];
  const navSection = resolvedSections[0];
  const bottomSection = resolvedSections[1] || navSection;
  return {
    columns: extractColumns(navSection),
    bottomItems: extractBottomItems(bottomSection),
    bottomSection,
    bottomInstrumentation: captureInstrumentation(bottomSection),
  };
}

function backToTopTemplate(buttonRef) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  return html`
    <button
      class="footer-back-to-top"
      type="button"
      aria-label="Back to top"
      ${ref(buttonRef)}
      @click=${() => window.scrollTo({
    top: 0,
    behavior: reducedMotion.matches ? 'auto' : 'smooth',
  })}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 3L2 9l1.4 1.4L8 5.8l4.6 4.6L14 9z" fill="currentColor"></path>
      </svg>
    </button>
  `;
}

function navColumnTemplate(column, columnRef) {
  return html`
    <div class="footer-nav-column" ${ref(columnRef)}>
      <h3 class="footer-nav-title">${column.title}</h3>
      <ul class="footer-nav-list">
        ${repeat(column.links, (link, index) => index, (link) => html`
          <li><a href="${link.href}">${link.text}</a></li>
        `)}
      </ul>
    </div>
  `;
}

function accordionItemTemplate(column, columnRef) {
  return html`
    <div class="footer-accordion-item" ${ref(columnRef)}>
      <button
        class="footer-accordion-header"
        type="button"
        aria-expanded="false"
        @click=${(event) => {
    const button = event.currentTarget;
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.closest('.footer-nav-mobile')
      .querySelectorAll('.footer-accordion-header[aria-expanded="true"]')
      .forEach((other) => {
        if (other !== button) other.setAttribute('aria-expanded', 'false');
      });
    button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  }}
      >
        <span>${column.title}</span>
        <span class="footer-accordion-chevron" aria-hidden="true"></span>
      </button>
      <div class="footer-accordion-content">
        <ul>
          ${repeat(column.links, (link, index) => index, (link) => html`
            <li><a href="${link.href}">${link.text}</a></li>
          `)}
        </ul>
      </div>
    </div>
  `;
}

function bottomBarTemplate(items, bottomRef) {
  return html`
    <div class="footer-bottom" ${ref(bottomRef)}>
      ${repeat(items, (item, index) => index, (item) => (item.type === 'link'
    ? html`<a class="footer-bottom-link" href="${item.href}">${item.text}</a>`
    : html`<span class="footer-bottom-text">${item.text}</span>`
  ))}
    </div>
  `;
}

function footerTemplate(data, refs) {
  return html`
    <div class="footer-inner">
      ${backToTopTemplate(refs.backToTop)}
      <div class="footer-nav">
        ${repeat(
    data.columns,
    (column, index) => index,
    (column, index) => navColumnTemplate(column, refs.columns[index]),
  )}
      </div>
      <div class="footer-nav-mobile">
        ${repeat(
    data.columns,
    (column, index) => index,
    (column, index) => accordionItemTemplate(column, refs.mobileColumns[index]),
  )}
      </div>
      ${data.bottomItems.length ? bottomBarTemplate(data.bottomItems, refs.bottom) : nothing}
    </div>
  `;
}

function initBackToTop(buttonRef) {
  const button = buttonRef.value;
  if (!button) return;
  const footer = button.closest('footer');

  function update() {
    button.classList.toggle('visible', window.scrollY > SCROLL_THRESHOLD);
    const baseBottom = window.innerWidth >= 720 ? 48 : 24;
    const footerTop = footer?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
    const clampedBottom = Math.max(baseBottom, window.innerHeight - footerTop + 12);
    button.style.bottom = `${clampedBottom}px`;
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

function applyEditorInstrumentation(data, refs) {
  data.columns.forEach((column, index) => {
    const desktop = refs.columns[index]?.value;
    const mobile = refs.mobileColumns[index]?.value;
    if (desktop && column.source) {
      moveInstrumentation(column.source, desktop);
      applyInstrumentation(column.instrumentation, desktop);
    }
    if (mobile) applyInstrumentation(column.instrumentation, mobile);
  });

  if (refs.bottom.value && data.bottomSection) {
    moveInstrumentation(data.bottomSection, refs.bottom.value);
    applyInstrumentation(data.bottomInstrumentation, refs.bottom.value);
  }
}

/**
 * Load and decorate the global footer.
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);
  if (!fragment) return;

  const data = extractFooterData(fragment);
  const refs = {
    backToTop: createRef(),
    columns: data.columns.map(() => createRef()),
    mobileColumns: data.columns.map(() => createRef()),
    bottom: createRef(),
  };

  block.textContent = '';
  render(footerTemplate(data, refs), block);
  applyEditorInstrumentation(data, refs);
  initBackToTop(refs.backToTop);
}
