import { moveInstrumentation } from './scripts.js';

const PRODUCT_STYLES = '/styles/product-blocks.css';

export function initProductBlock(block) {
  block.dataset.productBlock = block.classList[0] || 'product';
  if (!document.querySelector(`link[href="${PRODUCT_STYLES}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = PRODUCT_STYLES;
    document.head.append(link);
  }
}

export function directRows(root) {
  return [...root.children];
}

export function propSource(root, name) {
  if (root.matches?.(`[data-aue-prop="${name}"]`)) return root;
  return root.querySelector?.(`[data-aue-prop="${name}"]`) || null;
}

export function textWithBreaks(source) {
  if (!source) return '';
  const copy = source.cloneNode(true);
  copy.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  return copy.textContent.trim();
}

export function propText(root, name) {
  return textWithBreaks(propSource(root, name));
}

export function propBoolean(root, name, fallback = false) {
  const value = propText(root, name).toLowerCase();
  if (!value) return fallback;
  return ['true', '1', 'yes', 'on'].includes(value);
}

export function propNumber(root, name, fallback = 0) {
  const value = Number.parseFloat(propText(root, name));
  return Number.isFinite(value) ? value : fallback;
}

export function propLink(root, name) {
  const source = propSource(root, name);
  return source?.matches('a') ? source : source?.querySelector('a') || null;
}

export function propUrl(root, name) {
  const source = propSource(root, name);
  return propLink(root, name)?.getAttribute('href') || source?.textContent.trim() || '';
}

export function propPicture(root, name) {
  const source = propSource(root, name);
  if (!source) return null;
  return source.matches('picture') ? source : source.querySelector('picture');
}

export function modelItems(root, model) {
  const explicit = [...root.querySelectorAll(`[data-aue-model="${model}"]`)];
  if (explicit.length) return explicit;
  if (root.querySelector('[data-aue-model]')) return [];
  return directRows(root).filter((row) => !row.hasAttribute('data-aue-prop'));
}

export function moveItemInstrumentation(source, target) {
  if (source && target) moveInstrumentation(source, target);
}

export function instrumentProp(root, name, target) {
  const source = propSource(root, name);
  if (source && target) moveInstrumentation(source, target);
}

export function createHeading(text, level = 2, className = '') {
  const heading = document.createElement(`h${level}`);
  if (className) heading.className = className;
  heading.textContent = text;
  return heading;
}

export function createRichText(source, className = '') {
  const wrapper = document.createElement('div');
  if (className) wrapper.className = className;
  if (!source) return wrapper;
  const selectors = 'p, ul, ol, blockquote';
  const semantic = source.matches?.(selectors)
    ? [source]
    : [...source.querySelectorAll(selectors)];
  if (semantic.length) wrapper.append(...semantic.map((node) => node.cloneNode(true)));
  else if (source.textContent.trim()) {
    const paragraph = document.createElement('p');
    paragraph.textContent = source.textContent.trim();
    wrapper.append(paragraph);
  }
  return wrapper;
}

export function createSectionHeader(root, {
  headingLevel = 2,
  className = 'product-section-header',
} = {}) {
  const header = document.createElement('header');
  header.className = className;
  const eyebrow = propText(root, 'eyebrow');
  const title = propText(root, 'title');
  const mobileTitle = propText(root, 'mobileTitle');
  const descriptionSource = propSource(root, 'description');

  if (eyebrow) {
    const element = document.createElement('p');
    element.className = 'product-eyebrow';
    element.textContent = eyebrow;
    instrumentProp(root, 'eyebrow', element);
    header.append(element);
  }
  if (title) {
    const element = createHeading(title, headingLevel, 'product-title product-title-desktop');
    instrumentProp(root, 'title', element);
    header.append(element);
  }
  if (mobileTitle) {
    const element = createHeading(mobileTitle, headingLevel, 'product-title product-title-mobile');
    instrumentProp(root, 'mobileTitle', element);
    header.append(element);
  }
  if (descriptionSource?.textContent.trim()) {
    const element = createRichText(descriptionSource, 'product-description');
    instrumentProp(root, 'description', element);
    header.append(element);
  }
  return header;
}

export function addBlockAnchor(block, root = block, parent = block) {
  const id = propText(root, 'id');
  if (id) block.id = id;
  const anchor = document.createElement('span');
  anchor.className = 'product-aue-anchor';
  anchor.setAttribute('aria-hidden', 'true');
  instrumentProp(root, 'id', anchor);
  parent.append(anchor);

  root.querySelectorAll('[data-aue-prop], [data-aue-model]').forEach((source) => {
    const marker = document.createElement('span');
    marker.className = 'product-aue-anchor';
    marker.setAttribute('aria-hidden', 'true');
    moveInstrumentation(source, marker);
    parent.append(marker);
  });
}

export function createProductLink(root, prefix = '', className = 'product-link') {
  const field = prefix ? `${prefix}Link` : 'link';
  const textField = prefix ? `${prefix}LinkText` : 'linkText';
  const typeField = prefix ? `${prefix}LinkType` : 'linkType';
  const source = propLink(root, field);
  const href = source?.getAttribute('href') || propUrl(root, field);
  const text = propText(root, textField) || source?.textContent.trim() || '';
  if (!href || !text) return null;
  const link = document.createElement('a');
  link.className = `${className} ${className}-${propText(root, typeField) || 'text'}`;
  link.href = href;
  link.textContent = text;
  instrumentProp(root, field, link);
  return link;
}

export function appendPicture(container, picture, {
  alt = '',
  loading = 'lazy',
  fallbackLabel = 'LI AUTO',
} = {}) {
  if (!picture) {
    container.classList.add('is-media-fallback');
    container.dataset.fallbackLabel = fallbackLabel;
    return null;
  }
  const image = picture.querySelector('img');
  if (image) {
    image.alt = alt || image.alt || '';
    image.loading = loading;
    image.decoding = 'async';
    image.addEventListener('error', () => {
      picture.remove();
      container.classList.add('is-media-fallback');
      container.dataset.fallbackLabel = fallbackLabel;
    }, { once: true });
  }
  container.append(picture);
  return image;
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function safePlay(video) {
  const result = video.play();
  if (result?.catch) result.catch(() => {});
}

function setupVideoPlayback(media, video, button, autoplay) {
  const icon = button?.querySelector('.product-video-icon');
  const updateControl = () => {
    if (!button) return;
    const playing = !video.paused && !video.ended;
    button.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
    if (icon) icon.textContent = playing ? 'Ⅱ' : '▶';
  };
  const updateProgress = () => {
    if (!button || !Number.isFinite(video.duration) || video.duration <= 0) return;
    button.style.setProperty('--video-progress', `${(video.currentTime / video.duration) * 360}deg`);
  };
  video.addEventListener('play', updateControl);
  video.addEventListener('pause', updateControl);
  video.addEventListener('timeupdate', updateProgress);
  video.addEventListener('loadeddata', () => media.classList.add('is-video-ready'));
  video.addEventListener('error', () => media.classList.add('is-video-error'));
  button?.addEventListener('click', () => {
    if (video.paused) {
      delete video.dataset.userPaused;
      safePlay(video);
    } else {
      video.dataset.userPaused = 'true';
      video.pause();
    }
  });
  updateControl();

  if (!autoplay || prefersReducedMotion()) return;
  if (!('IntersectionObserver' in window)) {
    safePlay(video);
    return;
  }
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !video.dataset.userPaused) safePlay(video);
    else video.pause();
  }, { threshold: 0.25 });
  observer.observe(media);
}

export function createMedia(root, {
  eager = false,
  autoplay = true,
  loop = true,
  showControls = true,
  showProgress = true,
  fallbackLabel = 'LI AUTO',
} = {}) {
  const media = document.createElement('div');
  media.className = 'product-media';
  const image = propPicture(root, 'image') || root.querySelector('picture');
  const mobileImage = propPicture(root, 'mobileImage');
  const desktopSlot = document.createElement('div');
  desktopSlot.className = 'product-picture product-picture-desktop';
  const desktopImg = appendPicture(desktopSlot, image, {
    alt: propText(root, 'imageAlt'),
    loading: eager ? 'eager' : 'lazy',
    fallbackLabel,
  });
  instrumentProp(root, 'image', desktopSlot);
  media.append(desktopSlot);

  if (mobileImage) {
    const mobileSlot = document.createElement('div');
    mobileSlot.className = 'product-picture product-picture-mobile';
    appendPicture(mobileSlot, mobileImage, {
      alt: propText(root, 'mobileImageAlt') || desktopImg?.alt || '',
      loading: eager ? 'eager' : 'lazy',
      fallbackLabel,
    });
    instrumentProp(root, 'mobileImage', mobileSlot);
    media.classList.add('has-mobile-picture');
    media.append(mobileSlot);
  }

  const videoUrl = propUrl(root, 'video');
  const mobileVideoUrl = propUrl(root, 'mobileVideo');
  let video = null;
  if (videoUrl || mobileVideoUrl) {
    video = document.createElement('video');
    video.className = 'product-video';
    video.muted = true;
    video.playsInline = true;
    video.loop = loop;
    video.preload = 'metadata';
    if (desktopImg?.currentSrc || desktopImg?.src) {
      video.poster = desktopImg.currentSrc || desktopImg.src;
    }
    if (mobileVideoUrl) {
      const source = document.createElement('source');
      source.media = '(max-width: 719px)';
      source.src = mobileVideoUrl;
      video.append(source);
    }
    if (videoUrl) {
      const source = document.createElement('source');
      source.src = videoUrl;
      video.append(source);
    }
    instrumentProp(root, 'video', video);
    media.append(video);

    let button = null;
    if (showControls) {
      button = document.createElement('button');
      button.className = `product-video-control${showProgress ? ' has-progress' : ''}`;
      button.type = 'button';
      const icon = document.createElement('span');
      icon.className = 'product-video-icon';
      icon.setAttribute('aria-hidden', 'true');
      button.append(icon);
      media.append(button);
    }
    setupVideoPlayback(media, video, button, autoplay);
  }
  return { element: media, video };
}

export function revealElements(block, selector, enabled = true) {
  const elements = [...block.querySelectorAll(selector)];
  elements.forEach((element) => element.classList.add('product-reveal'));
  if (!enabled || prefersReducedMotion() || !('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
  elements.forEach((element) => observer.observe(element));
}

export function setupTabs(block, tabs, panels, {
  autoPlay = false,
  interval = 4000,
  onChange = () => {},
} = {}) {
  if (!tabs.length || tabs.length !== panels.length) return () => {};
  let active = 0;
  let timer = null;
  const activate = (index, focus = false) => {
    active = (index + tabs.length) % tabs.length;
    tabs.forEach((tab, itemIndex) => {
      const selected = itemIndex === active;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[itemIndex].hidden = !selected;
    });
    if (focus) tabs[active].focus();
    onChange(active);
  };
  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };
  const start = () => {
    stop();
    if (!autoPlay || tabs.length < 2 || prefersReducedMotion()) return;
    timer = window.setInterval(() => activate(active + 1), Math.max(2000, interval));
  };
  tabs.forEach((tab, index) => {
    const panel = panels[index];
    const tabId = `${block.id || block.dataset.productBlock || 'product'}-tab-${index + 1}`;
    const panelId = `${block.id || block.dataset.productBlock || 'product'}-panel-${index + 1}`;
    tab.id = tabId;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panelId);
    panel.id = panelId;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabId);
    tab.addEventListener('click', () => {
      activate(index);
      start();
    });
    tab.addEventListener('keydown', (event) => {
      const keys = {
        ArrowRight: index + 1,
        ArrowDown: index + 1,
        ArrowLeft: index - 1,
        ArrowUp: index - 1,
        Home: 0,
        End: tabs.length - 1,
      };
      if (!(event.key in keys)) return;
      event.preventDefault();
      activate(keys[event.key], true);
      start();
    });
  });
  block.addEventListener('mouseenter', stop);
  block.addEventListener('mouseleave', start);
  block.addEventListener('focusin', stop);
  block.addEventListener('focusout', start);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
  activate(0);
  start();
  return activate;
}

export function openVideoDialog(url, trigger, title = 'Product video') {
  if (!url) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'product-video-dialog';
  dialog.setAttribute('aria-label', title);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'product-dialog-close';
  close.setAttribute('aria-label', 'Close video');
  close.textContent = '×';
  const video = document.createElement('video');
  video.src = url;
  video.controls = true;
  video.autoplay = !prefersReducedMotion();
  video.playsInline = true;
  dialog.append(close, video);
  document.body.append(dialog);
  document.body.classList.add('product-dialog-open');
  const closeDialog = () => dialog.close();
  close.addEventListener('click', closeDialog);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('product-dialog-open');
    dialog.remove();
    trigger?.focus();
  });
  dialog.showModal();
  close.focus();
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function slug(value, fallback = 'item') {
  const normalized = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return normalized || fallback;
}
