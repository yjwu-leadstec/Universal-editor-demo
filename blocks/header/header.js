/**
 * Global header and navigation.
 *
 * The content is authored in a nav fragment with three sections:
 * brand, primary navigation, and tools/language.
 */
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const DESKTOP_MQ = window.matchMedia('(min-width: 720px)');
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

function directContent(element, selector) {
  return [...(element?.children || [])].find((child) => child.matches(selector));
}

function directLabel(element) {
  const source = directContent(element, 'a, p, strong, span, em') || element;
  return source?.textContent?.trim() || '';
}

function mediaNodes(element) {
  const nodes = [];
  element.querySelectorAll('img').forEach((img) => {
    const media = img.closest('picture') || img;
    if (!nodes.includes(media)) nodes.push(media);
  });
  return nodes;
}

function directTextBetween(element, start, end) {
  if (!start) return '';
  let collecting = false;
  const values = [];

  element.childNodes.forEach((node) => {
    if (node === start) {
      collecting = true;
      return;
    }
    if (node === end) {
      collecting = false;
      return;
    }
    if (collecting && node.nodeType === Node.TEXT_NODE) {
      const value = node.textContent.trim();
      if (value) values.push(value);
    }
  });

  return values.join(' ');
}

function extractDropdownEntry(element) {
  const links = [...element.querySelectorAll('a')];
  if (!links.length) {
    return {
      type: 'group',
      label: directLabel(element),
      element,
      instrumentation: captureInstrumentation(element),
    };
  }

  const link = links.find((anchor) => anchor.querySelector('strong, em, span')
    || anchor.textContent.trim()) || links[links.length - 1];
  const titleElement = directContent(link, 'strong');
  const ctaElement = directContent(link, 'em');
  const title = titleElement?.textContent?.trim()
    || [...link.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent.trim())
      .filter(Boolean)
      .join(' ')
    || link.textContent.trim();

  return {
    type: 'card',
    title,
    subtitle: directContent(link, 'span')?.textContent?.trim()
      || directTextBetween(link, titleElement, ctaElement),
    cta: ctaElement?.textContent?.trim() || '',
    href: link.href || links[0].href,
    media: mediaNodes(element),
    element,
    instrumentation: captureInstrumentation(element),
  };
}

function groupDropdownEntries(entries) {
  const groups = [];
  let current = {
    label: '', cards: [], element: null, instrumentation: [],
  };

  entries.forEach((entry) => {
    if (entry.type === 'group') {
      if (current.cards.length || current.label) groups.push(current);
      current = {
        label: entry.label,
        cards: [],
        element: entry.element,
        instrumentation: entry.instrumentation,
      };
    } else {
      current.cards.push(entry);
    }
  });

  if (current.cards.length || current.label) groups.push(current);
  return groups.filter((group) => group.cards.length);
}

/**
 * Extract navigation data from the authored fragment.
 * @param {HTMLElement} fragment
 * @returns {Object}
 */
function extractNavData(fragment) {
  const sections = [...fragment.children];
  const brandSection = sections[0];
  const navSection = sections[1];
  const toolsSection = sections[2];
  const brandLink = brandSection?.querySelector('a');
  const brandImg = brandSection?.querySelector('img');

  const topList = navSection?.querySelector('ul');
  const navItems = topList ? [...topList.children].map((element, index) => {
    const labelSource = directContent(element, 'a, p, strong, span');
    const labelLink = labelSource?.matches('a')
      ? labelSource
      : labelSource?.querySelector(':scope > a');
    const subList = directContent(element, 'ul');
    const entries = subList
      ? [...subList.children].map((child) => extractDropdownEntry(child))
      : [];

    return {
      index,
      label: labelLink?.textContent?.trim()
        || labelSource?.textContent?.trim()
        || directLabel(element),
      href: labelLink?.href || '',
      groups: groupDropdownEntries(entries),
      element,
      instrumentation: captureInstrumentation(element),
    };
  }) : [];

  const toolsLink = toolsSection?.querySelector('a');
  return {
    brandSection,
    brandLink: brandLink?.href || '/',
    brandImg: brandImg?.src || '',
    brandImgAlt: brandImg?.alt || 'Li Auto',
    navItems,
    toolsSection,
    toolsInstrumentation: captureInstrumentation(toolsSection),
    toolsLink: toolsLink?.href || '',
    toolsLabel: toolsLink?.textContent?.trim() || 'Language',
  };
}

function isCurrentPage(href) {
  if (!href) return false;
  try {
    const target = new URL(href, window.location.href);
    const normalize = (path) => path.replace(/\/$/, '') || '/';
    return target.origin === window.location.origin
      && normalize(target.pathname) === normalize(window.location.pathname);
  } catch {
    return false;
  }
}

function getLocaleCode(href) {
  let linkLocale = '';
  try {
    const segments = new URL(href, window.location.href).pathname.split('/').filter(Boolean);
    const candidate = segments[segments.length - 1] || '';
    if (/^[a-z]{2,3}$/i.test(candidate)) linkLocale = candidate;
  } catch (error) {
    // Use the document locale fallback below.
  }
  const locale = document.documentElement.lang || linkLocale || 'en';
  return locale.split('-')[0].slice(0, 2).toUpperCase();
}

function buildPanelCard(card) {
  const link = document.createElement('a');
  link.className = 'panel-card';
  link.href = card.href || '#';
  if (card.media.length > 1) link.classList.add('has-layered-media');
  else if (card.media.length) link.classList.add('has-single-media');
  else link.classList.add('without-media');

  if (card.media.length) {
    const media = document.createElement('span');
    media.className = 'panel-card-media';
    media.setAttribute('aria-hidden', 'true');
    card.media.forEach((node, index) => {
      node.classList.add(card.media.length > 1 && index === 0 ? 'panel-card-background' : 'panel-card-foreground');
      media.append(node);
    });
    link.append(media);
  }

  const title = document.createElement('span');
  title.className = 'panel-card-title';
  title.textContent = card.title;
  link.append(title);

  if (card.subtitle) {
    const subtitle = document.createElement('span');
    subtitle.className = 'panel-card-subtitle';
    subtitle.textContent = card.subtitle;
    link.append(subtitle);
  }

  if (card.cta) {
    const action = document.createElement('span');
    action.className = 'panel-card-action';
    action.textContent = card.cta;
    link.append(action);
  }

  moveInstrumentation(card.element, link);
  return link;
}

function buildPanelItem(item) {
  const panelItem = document.createElement('div');
  panelItem.className = 'header-panel-item';
  panelItem.dataset.panelId = item.index;
  panelItem.setAttribute('aria-hidden', 'true');

  const groups = document.createElement('div');
  groups.className = 'header-panel-groups';
  item.groups.forEach((group) => {
    const groupElement = document.createElement('section');
    groupElement.className = 'header-panel-group';
    if (group.label) {
      const label = document.createElement('h2');
      label.className = 'header-panel-label';
      label.textContent = group.label;
      if (group.element) moveInstrumentation(group.element, label);
      groupElement.append(label);
    } else {
      groupElement.classList.add('without-label');
    }

    const cards = document.createElement('div');
    cards.className = 'panel-cards';
    group.cards.forEach((card) => cards.append(buildPanelCard(card)));
    groupElement.append(cards);
    groups.append(groupElement);
  });

  const hasLayeredCards = item.groups
    .some((group) => group.cards.some((card) => card.media.length > 1));
  panelItem.classList.add(hasLayeredCards ? 'vehicle-panel' : 'image-panel');
  panelItem.append(groups);
  return panelItem;
}

function buildMobileSubmenu(item) {
  const submenu = document.createElement('div');
  submenu.className = 'header-mobile-submenu';

  item.groups.forEach((group) => {
    const groupElement = document.createElement('div');
    groupElement.className = 'mobile-submenu-group';
    if (group.label) {
      const label = document.createElement('p');
      label.className = 'mobile-submenu-group-label';
      label.textContent = group.label;
      applyInstrumentation(group.instrumentation, label);
      groupElement.append(label);
    }

    group.cards.forEach((card) => {
      const link = document.createElement('a');
      link.className = 'mobile-submenu-link';
      link.href = card.href || '#';

      const title = document.createElement('span');
      title.className = 'mobile-submenu-title';
      title.textContent = card.title;
      link.append(title);

      if (card.subtitle) {
        const subtitle = document.createElement('span');
        subtitle.className = 'mobile-submenu-subtitle';
        subtitle.textContent = card.subtitle;
        link.append(subtitle);
      }

      applyInstrumentation(card.instrumentation, link);
      groupElement.append(link);
    });
    submenu.append(groupElement);
  });

  return submenu;
}

function buildMobileItem(item) {
  const mobileItem = document.createElement('div');
  mobileItem.className = 'header-mobile-item';
  applyInstrumentation(item.instrumentation, mobileItem);

  if (!item.groups.length) {
    const link = document.createElement('a');
    link.className = 'mobile-item-label';
    link.href = item.href || '#';
    link.textContent = item.label;
    if (isCurrentPage(item.href)) link.setAttribute('aria-current', 'page');
    mobileItem.append(link);
    return mobileItem;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'mobile-item-label';
  button.dataset.mobileTitle = item.label;
  button.setAttribute('aria-expanded', 'false');
  const label = document.createElement('span');
  label.textContent = item.label;
  const chevron = document.createElement('span');
  chevron.className = 'mobile-item-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  button.append(label, chevron);
  mobileItem.append(button, buildMobileSubmenu(item));
  return mobileItem;
}

/**
 * Decorate the global header block.
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);
  if (!fragment) return;

  const data = extractNavData(fragment);
  block.textContent = '';

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.className = 'header-nav';
  nav.setAttribute('aria-label', 'Primary');
  nav.setAttribute('aria-expanded', 'false');

  const theme = getMetadata('header-theme').toLowerCase();
  const themeValues = theme.split(',').map((value) => value.trim()).filter(Boolean);
  const pagePath = window.location.pathname.replace(/\/+$/, '') || '/';
  const isTransparent = themeValues.includes('transparent')
    || (!themeValues.includes('white') && pagePath === '/');
  if (isTransparent) {
    nav.classList.add('is-transparent');
  }

  const inner = document.createElement('div');
  inner.className = 'header-nav-inner';

  const brand = document.createElement('div');
  brand.className = 'header-brand';
  const logoLink = document.createElement('a');
  logoLink.href = data.brandLink;
  logoLink.className = 'header-logo';
  logoLink.setAttribute('aria-label', data.brandImgAlt);
  if (data.brandImg) {
    const logoImg = document.createElement('img');
    logoImg.src = data.brandImg;
    logoImg.alt = data.brandImgAlt;
    logoImg.loading = 'eager';
    logoLink.append(logoImg);
  } else {
    logoLink.textContent = data.brandImgAlt;
  }
  brand.append(logoLink);
  if (data.brandSection) moveInstrumentation(data.brandSection, brand);

  const mobileBack = document.createElement('button');
  mobileBack.type = 'button';
  mobileBack.className = 'header-mobile-back';
  mobileBack.setAttribute('aria-label', 'Back to main navigation');
  const mobileBackIcon = document.createElement('span');
  mobileBackIcon.setAttribute('aria-hidden', 'true');
  mobileBack.append(mobileBackIcon);

  const mobileTitle = document.createElement('span');
  mobileTitle.className = 'header-mobile-title';
  mobileTitle.setAttribute('aria-live', 'polite');

  const navList = document.createElement('div');
  navList.className = 'header-sections';
  const navListInner = document.createElement('div');
  navListInner.className = 'header-navlist';

  data.navItems.forEach((item) => {
    const navItem = document.createElement('a');
    navItem.className = 'header-navlist-item';
    navItem.dataset.navId = item.index;
    navItem.href = item.href || '#';
    navItem.textContent = item.label;
    if (item.groups.length) {
      navItem.setAttribute('aria-expanded', 'false');
      navItem.setAttribute('aria-haspopup', 'true');
    }
    if (isCurrentPage(item.href)) navItem.setAttribute('aria-current', 'page');
    moveInstrumentation(item.element, navItem);
    navListInner.append(navItem);
  });
  navList.append(navListInner);

  const tools = document.createElement('div');
  tools.className = 'header-tools';
  if (data.toolsLink) {
    const language = document.createElement('a');
    language.className = 'header-language';
    language.href = data.toolsLink;
    language.setAttribute('aria-label', data.toolsLabel);
    language.title = data.toolsLabel;
    const localeCode = document.createElement('span');
    localeCode.className = 'header-language-code';
    localeCode.textContent = getLocaleCode(data.toolsLink);
    const chevron = document.createElement('span');
    chevron.className = 'header-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    language.append(localeCode, chevron);
    tools.append(language);
  } else if (data.toolsSection) {
    while (data.toolsSection.firstChild) tools.append(data.toolsSection.firstChild);
  }
  if (data.toolsSection) moveInstrumentation(data.toolsSection, tools);

  const hamburger = document.createElement('button');
  hamburger.type = 'button';
  hamburger.className = 'header-hamburger';
  hamburger.setAttribute('aria-label', 'Open navigation');
  hamburger.setAttribute('aria-controls', 'header-mobile-menu');
  hamburger.setAttribute('aria-expanded', 'false');
  const menuIcon = document.createElement('span');
  menuIcon.className = 'header-menu-icon';
  menuIcon.setAttribute('aria-hidden', 'true');
  hamburger.append(menuIcon);

  inner.append(brand, mobileBack, mobileTitle, navList, tools, hamburger);
  nav.append(inner);

  const panel = document.createElement('div');
  panel.className = 'header-panel';
  panel.setAttribute('aria-hidden', 'true');
  data.navItems
    .filter((item) => item.groups.length)
    .forEach((item) => panel.append(buildPanelItem(item)));
  nav.append(panel);

  const mobileMenu = document.createElement('div');
  mobileMenu.id = 'header-mobile-menu';
  mobileMenu.className = 'header-mobile-menu';
  data.navItems.forEach((item) => mobileMenu.append(buildMobileItem(item)));
  if (data.toolsLink) {
    const language = document.createElement('a');
    language.className = 'header-mobile-language';
    language.href = data.toolsLink;
    language.textContent = data.toolsLabel;
    applyInstrumentation(data.toolsInstrumentation, language);
    const chevron = document.createElement('span');
    chevron.className = 'mobile-item-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    language.append(chevron);
    mobileMenu.append(language);
  }
  nav.append(mobileMenu);

  let closeTimer;

  function closePanel() {
    window.clearTimeout(closeTimer);
    panel.setAttribute('aria-hidden', 'true');
    nav.classList.remove('is-panel-open');
    panel.querySelectorAll('.header-panel-item').forEach((item) => item.setAttribute('aria-hidden', 'true'));
    navListInner.querySelectorAll('[aria-expanded]').forEach((item) => item.setAttribute('aria-expanded', 'false'));
  }

  function openPanel(navId) {
    window.clearTimeout(closeTimer);
    const target = panel.querySelector(`[data-panel-id="${navId}"]`);
    if (!target) return;
    closePanel();
    target.setAttribute('aria-hidden', 'false');
    panel.setAttribute('aria-hidden', 'false');
    nav.classList.add('is-panel-open');
    navListInner.querySelector(`[data-nav-id="${navId}"]`)?.setAttribute('aria-expanded', 'true');
  }

  function schedulePanelClose() {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(closePanel, 120);
  }

  navListInner.querySelectorAll('.header-navlist-item[aria-haspopup]').forEach((item) => {
    const open = () => {
      if (DESKTOP_MQ.matches) openPanel(item.dataset.navId);
    };
    item.addEventListener('pointerenter', open);
    item.addEventListener('focus', open);
    item.addEventListener('click', (event) => {
      if (!DESKTOP_MQ.matches) return;
      event.preventDefault();
      openPanel(item.dataset.navId);
    });
  });
  navListInner.querySelectorAll('.header-navlist-item:not([aria-haspopup])').forEach((item) => {
    item.addEventListener('pointerenter', closePanel);
  });
  nav.addEventListener('pointerenter', () => window.clearTimeout(closeTimer));
  nav.addEventListener('pointerleave', schedulePanelClose);
  nav.addEventListener('focusout', (event) => {
    if (DESKTOP_MQ.matches && !nav.contains(event.relatedTarget)) schedulePanelClose();
  });
  document.addEventListener('click', (event) => {
    if (DESKTOP_MQ.matches && !nav.contains(event.target)) closePanel();
  });

  function toggleMobileMenu(forceClose, restoreFocus = false) {
    const isOpen = nav.getAttribute('aria-expanded') === 'true';
    const shouldClose = forceClose === true || isOpen;
    nav.setAttribute('aria-expanded', shouldClose ? 'false' : 'true');
    hamburger.setAttribute('aria-expanded', shouldClose ? 'false' : 'true');
    hamburger.setAttribute('aria-label', shouldClose ? 'Open navigation' : 'Close navigation');
    document.body.classList.toggle('nav-open', !shouldClose);
    if (!shouldClose) closePanel();
    if (shouldClose) {
      mobileMenu.querySelectorAll('.mobile-item-label[aria-expanded="true"]')
        .forEach((button) => button.setAttribute('aria-expanded', 'false'));
      delete nav.dataset.mobileView;
      mobileTitle.textContent = '';
    }
    if (shouldClose && restoreFocus) hamburger.focus();
  }

  function showMobileRoot(restoreFocus = false) {
    const expanded = mobileMenu.querySelector('.mobile-item-label[aria-expanded="true"]');
    mobileMenu.querySelectorAll('.mobile-item-label[aria-expanded="true"]')
      .forEach((button) => button.setAttribute('aria-expanded', 'false'));
    delete nav.dataset.mobileView;
    mobileTitle.textContent = '';
    if (restoreFocus && expanded) expanded.focus();
  }

  hamburger.addEventListener('click', () => toggleMobileMenu());
  mobileBack.addEventListener('click', () => showMobileRoot(true));
  mobileMenu.querySelectorAll('.mobile-item-label[aria-expanded]').forEach((button) => {
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      mobileMenu.querySelectorAll('.mobile-item-label[aria-expanded="true"]').forEach((other) => {
        if (other !== button) other.setAttribute('aria-expanded', 'false');
      });
      button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      if (expanded) {
        delete nav.dataset.mobileView;
        mobileTitle.textContent = '';
      } else {
        nav.dataset.mobileView = 'detail';
        mobileTitle.textContent = button.dataset.mobileTitle;
      }
    });
  });
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => toggleMobileMenu(true));
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (DESKTOP_MQ.matches) closePanel();
      else if (nav.dataset.mobileView === 'detail') showMobileRoot(true);
      else if (nav.getAttribute('aria-expanded') === 'true') toggleMobileMenu(true, true);
      return;
    }

    if (event.key !== 'Tab' || DESKTOP_MQ.matches || nav.getAttribute('aria-expanded') !== 'true') return;
    const focusable = [hamburger, ...mobileMenu.querySelectorAll('a, button:not([disabled])')]
      .filter((element) => element.getClientRects().length);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  DESKTOP_MQ.addEventListener('change', () => {
    toggleMobileMenu(true);
    closePanel();
  });

  if (nav.classList.contains('is-transparent')) {
    const updateScrolledState = () => nav.classList.toggle('is-scrolled', window.scrollY > 10);
    window.addEventListener('scroll', updateScrolledState, { passive: true });
    updateScrolledState();
  }

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
