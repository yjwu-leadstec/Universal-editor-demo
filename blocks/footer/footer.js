/**
 * Global footer loaded from an authored footer fragment.
 */
import { getMetadata } from '../../scripts/aem.js';
import { loadFragmentCandidates } from '../fragment/fragment.js';
import {
  html, render, nothing, repeat, ref, createRef,
} from '../../scripts/lit.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import {
  getFragmentCandidates,
  localizeSiteHref,
  resolveLocaleContext,
} from '../../scripts/site-shell.mjs';

const SCROLL_THRESHOLD = 300;
const MIGRATION_ROOT_FALLBACK = false;
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

function extractColumns(navSection, localeRoot) {
  if (!navSection) return [];
  return [...navSection.querySelectorAll(HEADING_SELECTOR)].flatMap((heading) => {
    const list = nextList(heading);
    if (!list) return [];
    const links = [...list.querySelectorAll(':scope > li')].map((item) => {
      const anchor = item.querySelector('a');
      return {
        text: anchor?.textContent?.trim() || item.textContent.trim(),
        href: anchor
          ? localizeSiteHref(anchor.getAttribute('href'), localeRoot, window.location.origin)
          : '',
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

function extractBottomItems(bottomSection, localeRoot) {
  if (!bottomSection) return [];
  const paragraphs = [...bottomSection.querySelectorAll('p')];
  if (paragraphs.length) {
    return paragraphs.flatMap((paragraph) => {
      const anchors = [...paragraph.querySelectorAll('a')];
      if (anchors.length) {
        return anchors.map((anchor) => ({
          type: anchor.getAttribute('href') === '#top' ? 'back-to-top' : 'link',
          text: anchor.textContent.trim(),
          href: localizeSiteHref(
            anchor.getAttribute('href'),
            localeRoot,
            window.location.origin,
          ),
        }));
      }
      const text = paragraph.textContent.trim();
      return text ? [{ type: 'text', text }] : [];
    });
  }

  return [...bottomSection.querySelectorAll('a')].map((anchor) => ({
    type: anchor.getAttribute('href') === '#top' ? 'back-to-top' : 'link',
    text: anchor.textContent.trim(),
    href: localizeSiteHref(anchor.getAttribute('href'), localeRoot, window.location.origin),
  }));
}

/**
 * Extract footer columns and legal information from semantic fragment content.
 * @param {HTMLElement} fragment
 * @returns {Object}
 */
function extractFooterData(fragment, localeRoot) {
  const sections = [...fragment.querySelectorAll(':scope > .section')];
  const resolvedSections = sections.length ? sections : [...fragment.children];
  const navSection = resolvedSections[0];
  const bottomSection = resolvedSections[1] || navSection;
  const items = extractBottomItems(bottomSection, localeRoot);
  return {
    columns: extractColumns(navSection, localeRoot),
    bottomItems: items.filter((item) => item.type !== 'back-to-top'),
    backToTop: items.find((item) => item.type === 'back-to-top') || null,
    bottomSection,
    bottomInstrumentation: captureInstrumentation(bottomSection),
  };
}

function backToTopTemplate(item, buttonRef) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  return html`
    <button
      class="footer-back-to-top"
      type="button"
      aria-label="${item.text}"
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

function footerLinkTemplate(link) {
  return link.href
    ? html`<a href="${link.href}">${link.text}</a>`
    : html`<span>${link.text}</span>`;
}

function navColumnTemplate(column, columnRef) {
  return html`
    <div class="footer-nav-column" ${ref(columnRef)}>
      <h3 class="footer-nav-title">${column.title}</h3>
      <ul class="footer-nav-list">
        ${repeat(column.links, (link, index) => index, (link) => html`
          <li>${footerLinkTemplate(link)}</li>
        `)}
      </ul>
    </div>
  `;
}

function accordionItemTemplate(column, columnRef, index) {
  const buttonId = `footer-accordion-button-${index}`;
  const panelId = `footer-accordion-panel-${index}`;
  return html`
    <div class="footer-accordion-item" ${ref(columnRef)}>
      <button
        class="footer-accordion-header"
        type="button"
        id="${buttonId}"
        aria-controls="${panelId}"
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
      <div class="footer-accordion-content" id="${panelId}" aria-labelledby="${buttonId}">
        <ul>
          ${repeat(column.links, (link, linkIndex) => linkIndex, (link) => html`
            <li>${footerLinkTemplate(link)}</li>
          `)}
        </ul>
      </div>
    </div>
  `;
}

function bottomItemTemplate(item) {
  return item.type === 'link' && item.href
    ? html`<a class="footer-bottom-link" href="${item.href}">${item.text}</a>`
    : html`<span class="footer-bottom-text">${item.text}</span>`;
}

function bottomBarTemplate(items, bottomRef) {
  const legalStart = items.findIndex((item) => item.type === 'text');
  const policyItems = legalStart >= 0 ? items.slice(0, legalStart) : items;
  const legalItems = legalStart >= 0 ? items.slice(legalStart) : [];
  return html`
    <div class="footer-bottom" ${ref(bottomRef)}>
      <div class="footer-bottom-policies">
        ${repeat(
    policyItems,
    (item, index) => index,
    (item) => bottomItemTemplate(item),
  )}
      </div>
      <div class="footer-bottom-legal">
        ${repeat(
    legalItems,
    (item, index) => index,
    (item) => bottomItemTemplate(item),
  )}
      </div>
    </div>
  `;
}

function footerTemplate(data, refs) {
  return html`
    <div class="footer-inner">
      ${data.backToTop ? backToTopTemplate(data.backToTop, refs.backToTop) : nothing}
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
    (column, index) => accordionItemTemplate(column, refs.mobileColumns[index], index),
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
  const localeContext = resolveLocaleContext(window.location.pathname);
  const footerCandidates = getFragmentCandidates('footer', {
    pathname: window.location.pathname,
    origin: window.location.origin,
    metadata: footerMeta,
    migrationFallback: MIGRATION_ROOT_FALLBACK,
  });
  const { fragment } = await loadFragmentCandidates(footerCandidates);
  if (!fragment) return;

  const data = extractFooterData(fragment, localeContext?.root || '');
  if (!data.columns.length && !data.bottomItems.length && !data.backToTop) {
    block.replaceChildren(...fragment.childNodes);
    return;
  }
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
