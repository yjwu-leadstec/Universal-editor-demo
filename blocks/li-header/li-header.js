/**
 * Header Block — Li Auto style navigation
 *
 * Features:
 * - Fixed transparent header (50px)
 * - Desktop: centered nav with hover dropdown panels
 * - Mobile (<900px): hamburger → full-screen overlay menu with accordion
 * - Keyboard navigation (Tab, Escape, Enter)
 * - Universal Editor support via moveInstrumentation
 */
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const DESKTOP_MQ = window.matchMedia('(min-width: 900px)');

/**
 * Extract nav data from fragment DOM
 * @param {HTMLElement} fragment
 * @returns {Object}
 */
function extractNavData(fragment) {
  const sections = [...fragment.children];
  const brandSection = sections[0];
  const navSection = sections[1];
  const toolsSection = sections[2];

  // Brand: logo image and link
  const brandLink = brandSection?.querySelector('a');
  const brandImg = brandSection?.querySelector('img');

  // Nav items: top-level list items with optional nested content
  const navItems = [];
  if (navSection) {
    const topList = navSection.querySelector('ul');
    if (topList) {
      [...topList.children].forEach((li, index) => {
        const label = li.firstChild?.textContent?.trim() || '';
        const subList = li.querySelector('ul');
        const hasDropdown = !!subList;
        // Collect dropdown content (sub-list items with links, images, etc.)
        const dropdownItems = [];
        if (subList) {
          [...subList.children].forEach((subLi) => {
            const link = subLi.querySelector('a');
            const img = subLi.querySelector('img');
            const text = subLi.textContent.trim();
            dropdownItems.push({
              element: subLi,
              text,
              link: link?.href || '',
              linkText: link?.textContent?.trim() || '',
              img: img?.src || '',
              imgAlt: img?.alt || '',
            });
          });
        }
        navItems.push({
          index,
          label,
          element: li,
          hasDropdown,
          dropdownItems,
        });
      });
    }
  }

  return {
    brandSection,
    brandLink: brandLink?.href || '/',
    brandImg: brandImg?.src || '',
    brandImgAlt: brandImg?.alt || 'Li Auto',
    navItems,
    toolsSection,
  };
}

/**
 * Decorate header block
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  if (!fragment) return;

  const data = extractNavData(fragment);

  block.textContent = '';

  // Build nav DOM
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.className = 'header-nav';
  nav.setAttribute('aria-expanded', 'false');

  // -- Inner bar (logo + nav items + tools) --
  const inner = document.createElement('div');
  inner.className = 'header-nav-inner';

  // Brand
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
    logoImg.loading = 'lazy';
    logoLink.appendChild(logoImg);
  }
  brand.appendChild(logoLink);
  if (data.brandSection) moveInstrumentation(data.brandSection, brand);

  // Nav list (desktop)
  const navList = document.createElement('div');
  navList.className = 'header-sections';
  const navListInner = document.createElement('div');
  navListInner.className = 'header-navlist';
  navListInner.setAttribute('role', 'menubar');

  data.navItems.forEach((item) => {
    const navItem = document.createElement('span');
    navItem.className = 'header-navlist-item';
    navItem.setAttribute('role', 'menuitem');
    navItem.setAttribute('data-nav-id', item.index);
    navItem.textContent = item.label;
    if (item.hasDropdown) {
      navItem.setAttribute('aria-expanded', 'false');
      navItem.setAttribute('tabindex', '0');
      navItem.setAttribute('aria-haspopup', 'true');
    }
    moveInstrumentation(item.element, navItem);
    navListInner.appendChild(navItem);
  });
  navList.appendChild(navListInner);

  // Tools
  const tools = document.createElement('div');
  tools.className = 'header-tools';
  if (data.toolsSection) {
    while (data.toolsSection.firstChild) {
      tools.appendChild(data.toolsSection.firstChild);
    }
    moveInstrumentation(data.toolsSection, tools);
  }

  // Hamburger (mobile)
  const hamburger = document.createElement('button');
  hamburger.className = 'header-hamburger';
  hamburger.setAttribute('aria-label', 'Open navigation');
  hamburger.setAttribute('aria-controls', 'nav');
  hamburger.innerHTML = '<span class="hamburger-line"></span><span class="hamburger-line"></span><span class="hamburger-line"></span>';

  inner.append(brand, navList, tools, hamburger);
  nav.appendChild(inner);

  // -- Dropdown panel (desktop) --
  const panel = document.createElement('div');
  panel.className = 'header-panel';
  panel.setAttribute('aria-hidden', 'true');

  data.navItems.forEach((item) => {
    if (!item.hasDropdown) return;
    const panelItem = document.createElement('div');
    panelItem.className = 'header-panel-item';
    panelItem.setAttribute('data-panel-id', item.index);
    panelItem.style.display = 'none';

    const panelCards = document.createElement('div');
    panelCards.className = 'panel-cards';

    item.dropdownItems.forEach((drop) => {
      const card = document.createElement('a');
      card.className = 'panel-card';
      card.href = drop.link || '#';

      if (drop.img) {
        const cardImg = document.createElement('img');
        cardImg.src = drop.img;
        cardImg.alt = drop.imgAlt || drop.text;
        cardImg.loading = 'lazy';
        card.appendChild(cardImg);
      }

      const cardBody = document.createElement('div');
      cardBody.className = 'panel-card-body';
      const cardName = document.createElement('span');
      cardName.className = 'panel-card-name';
      cardName.textContent = drop.linkText || drop.text;
      cardBody.appendChild(cardName);
      card.appendChild(cardBody);

      moveInstrumentation(drop.element, card);
      panelCards.appendChild(card);
    });

    panelItem.appendChild(panelCards);
    panel.appendChild(panelItem);
  });
  nav.appendChild(panel);

  // -- Mobile menu --
  const mobileMenu = document.createElement('div');
  mobileMenu.className = 'header-mobile-menu';

  data.navItems.forEach((item) => {
    const mobileItem = document.createElement('div');
    mobileItem.className = 'header-mobile-item';

    const mobileLabel = document.createElement('button');
    mobileLabel.className = 'mobile-item-label';
    mobileLabel.textContent = item.label;

    if (item.hasDropdown) {
      mobileLabel.setAttribute('aria-expanded', 'false');
      const chevron = document.createElement('span');
      chevron.className = 'mobile-item-chevron';
      mobileLabel.appendChild(chevron);

      const submenu = document.createElement('div');
      submenu.className = 'header-mobile-submenu';

      item.dropdownItems.forEach((drop) => {
        const subLink = document.createElement('a');
        subLink.className = 'mobile-submenu-link';
        subLink.href = drop.link || '#';
        subLink.textContent = drop.linkText || drop.text;
        submenu.appendChild(subLink);
      });

      mobileItem.appendChild(mobileLabel);
      mobileItem.appendChild(submenu);
    } else {
      mobileItem.appendChild(mobileLabel);
    }

    moveInstrumentation(item.element, mobileItem);
    mobileMenu.appendChild(mobileItem);
  });
  nav.appendChild(mobileMenu);

  // -- Interactions --
  let activeNavId = null;

  function closePanel() {
    activeNavId = null;
    panel.setAttribute('aria-hidden', 'true');
    panel.querySelectorAll('.header-panel-item').forEach((p) => { p.style.display = 'none'; });
    navListInner.querySelectorAll('[aria-expanded]').forEach((el) => el.setAttribute('aria-expanded', 'false'));
  }

  function openPanel(navId) {
    closePanel();
    activeNavId = navId;
    const target = panel.querySelector(`[data-panel-id="${navId}"]`);
    if (target) {
      target.style.display = '';
      panel.setAttribute('aria-hidden', 'false');
      const trigger = navListInner.querySelector(`[data-nav-id="${navId}"]`);
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
    }
  }

  // Desktop hover interactions
  navListInner.querySelectorAll('.header-navlist-item[aria-haspopup]').forEach((item) => {
    item.addEventListener('mouseenter', () => {
      if (DESKTOP_MQ.matches) openPanel(item.dataset.navId);
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (activeNavId === item.dataset.navId) closePanel();
        else openPanel(item.dataset.navId);
      }
    });
  });

  nav.querySelector('.header-nav-inner').addEventListener('mouseleave', () => {
    if (DESKTOP_MQ.matches) closePanel();
  });

  panel.addEventListener('mouseenter', () => {
    // keep panel open when hovering over it
  });
  panel.addEventListener('mouseleave', () => {
    if (DESKTOP_MQ.matches) closePanel();
  });

  // Mobile hamburger toggle
  function toggleMobileMenu(forceClose) {
    const isOpen = nav.getAttribute('aria-expanded') === 'true';
    const shouldClose = forceClose === true || isOpen;
    nav.setAttribute('aria-expanded', shouldClose ? 'false' : 'true');
    hamburger.setAttribute('aria-label', shouldClose ? 'Open navigation' : 'Close navigation');
    document.body.style.overflowY = shouldClose ? '' : 'hidden';
  }

  hamburger.addEventListener('click', () => toggleMobileMenu());

  // Mobile accordion
  mobileMenu.querySelectorAll('.mobile-item-label[aria-expanded]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      // Close all other accordions
      mobileMenu.querySelectorAll('.mobile-item-label[aria-expanded="true"]').forEach((other) => {
        if (other !== btn) other.setAttribute('aria-expanded', 'false');
      });
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });
  });

  // Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DESKTOP_MQ.matches) {
        closePanel();
      } else if (nav.getAttribute('aria-expanded') === 'true') {
        toggleMobileMenu(true);
        hamburger.focus();
      }
    }
  });

  // Resize: close mobile menu when switching to desktop
  DESKTOP_MQ.addEventListener('change', () => {
    if (DESKTOP_MQ.matches) {
      toggleMobileMenu(true);
    }
    closePanel();
  });

  // Wrap and append
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.appendChild(nav);
  block.appendChild(navWrapper);
}
