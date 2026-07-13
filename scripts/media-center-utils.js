import { moveInstrumentation } from './scripts.js';

export const directRows = (block) => [...block.children];

export function propSource(rows, name) {
  const selector = `[data-aue-prop="${name}"]`;
  return rows.find((row) => row.matches(selector))
    || rows.map((row) => row.querySelector(selector)).find(Boolean)
    || null;
}

export const propText = (rows, name) => propSource(rows, name)?.textContent.trim() || '';
export const isImageHref = (href = '') => /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#]|$)/i.test(href);

export function linkedPicture(source) {
  if (!source) return null;
  const anchor = [...source.querySelectorAll('a')]
    .find((link) => isImageHref(link.getAttribute('href') || ''));
  if (!anchor) return null;
  const picture = document.createElement('picture');
  const image = document.createElement('img');
  image.src = anchor.href;
  image.alt = anchor.textContent.trim();
  picture.append(image);
  return picture;
}

export const propPicture = (rows, name) => {
  const source = propSource(rows, name);
  return source?.querySelector('picture') || linkedPicture(source);
};
export const propLink = (rows, name) => propSource(rows, name)?.querySelector('a') || null;

export function hasModel(row, model) {
  return row.getAttribute('data-aue-model') === model
    || Boolean(row.querySelector(`[data-aue-model="${model}"]`));
}

export function rowTexts(row) {
  return [...row.children]
    .filter((cell) => !cell.querySelector('picture, img, a'))
    .map((cell) => cell.textContent.trim());
}

export function rowPicture(row) {
  return row.querySelector('picture') || linkedPicture(row);
}

export function imageLinkCellIndex(row) {
  return [...row.children].findIndex((cell) => [...cell.querySelectorAll('a')]
    .some((link) => isImageHref(link.getAttribute('href') || '')));
}

export function rowLinks(row) {
  return [...row.querySelectorAll('a')];
}

export function imageAlt(picture) {
  return picture?.querySelector('img')?.getAttribute('alt') || '';
}

export function instrument(source, target) {
  if (source && target) moveInstrumentation(source, target);
}

export function instrumentProp(rows, name, target) {
  instrument(propSource(rows, name), target);
}

export function appendPropAnchors(target, rows, names) {
  names.forEach((name) => {
    const source = propSource(rows, name);
    if (!source) return;
    const anchor = document.createElement('span');
    anchor.className = 'media-aue-anchor';
    anchor.setAttribute('aria-hidden', 'true');
    instrument(source, anchor);
    target.append(anchor);
  });
}

export function appendPicture(target, picture, alt, eager = false) {
  if (!picture) {
    target.classList.add('is-media-fallback');
    target.dataset.fallbackLabel = 'LI AUTO';
    return null;
  }
  const image = picture.querySelector('img');
  if (image) {
    image.alt = alt || image.alt || '';
    image.loading = eager ? 'eager' : 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => {
      picture.remove();
      target.classList.add('is-media-fallback');
      target.dataset.fallbackLabel = 'LI AUTO';
    }, { once: true });
  }
  target.append(picture);
  return image;
}

export function richNodes(source) {
  if (!source) return [];
  const nodes = [...source.querySelectorAll('p, h2, h3, ul, ol, blockquote')]
    .map((node) => node.cloneNode(true));
  if (nodes.length) return nodes;
  if (!source.textContent.trim()) return [];
  const paragraph = document.createElement('p');
  paragraph.textContent = source.textContent.trim();
  return [paragraph];
}

export function createReveal(block, selector) {
  const elements = [...block.querySelectorAll(selector)];
  elements.forEach((element, index) => {
    element.classList.add('media-reveal');
    element.style.setProperty('--media-delay', `${Math.min(index, 5) * 90}ms`);
  });
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
  elements.forEach((element) => observer.observe(element));
}

function createHeading(text, level, id = '') {
  const heading = document.createElement(`h${level}`);
  heading.textContent = text;
  if (id) heading.id = id;
  return heading;
}

function createDetailHeader(detail, className = '') {
  const header = document.createElement('header');
  header.className = `media-detail-header ${className}`.trim();
  const title = createHeading(detail.title, 2, detail.titleId || '');
  const date = document.createElement('p');
  date.textContent = [detail.date, detail.duration].filter(Boolean).join(' · ');
  header.append(title, date);
  return header;
}

export function createArticleDetail(detail) {
  const article = document.createElement('article');
  article.className = 'media-detail media-detail-article';
  const header = createDetailHeader(detail);
  const hero = document.createElement('div');
  hero.className = 'media-detail-hero media-detail-media';
  appendPicture(hero, detail.picture, detail.alt || detail.title, true);
  const body = document.createElement('div');
  body.className = 'media-detail-body';
  if (detail.contents?.length) {
    detail.contents.forEach((content) => {
      if (content.kind === 'image') {
        const figure = document.createElement('figure');
        const media = document.createElement('div');
        media.className = 'media-detail-figure-media media-detail-media';
        appendPicture(media, content.picture, content.alt || content.caption || detail.title);
        figure.append(media);
        if (content.caption) {
          const caption = document.createElement('figcaption');
          caption.textContent = content.caption;
          figure.append(caption);
        }
        instrument(content.row, figure);
        body.append(figure);
      } else {
        const wrapper = document.createElement('div');
        wrapper.className = 'media-detail-copy';
        wrapper.append(...richNodes(content.source));
        instrument(content.row, wrapper);
        body.append(wrapper);
      }
    });
  } else {
    body.append(...richNodes(detail.body));
  }
  article.append(header, hero, body);
  return article;
}

export function createGalleryDetail(detail) {
  const article = document.createElement('article');
  article.className = 'media-detail media-detail-gallery';
  const header = createDetailHeader(detail, 'media-detail-header-split');
  if (detail.download) {
    const download = document.createElement('a');
    download.className = 'media-download';
    download.href = detail.download;
    download.download = '';
    download.textContent = 'Download';
    header.append(download);
  }
  const grid = document.createElement('div');
  grid.className = 'media-gallery-grid';
  detail.images.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'media-gallery-tile';
    button.dataset.mediaLightboxIndex = String(index);
    button.setAttribute('aria-label', `Open ${item.alt || detail.title} image ${index + 1}`);
    const media = document.createElement('span');
    media.className = 'media-gallery-image media-detail-media';
    appendPicture(media, item.picture, item.alt || `${detail.title} ${index + 1}`);
    button.append(media);
    instrument(item.row, button);
    grid.append(button);
  });
  article.append(header, grid);
  return article;
}

function createPlayMarker() {
  const marker = document.createElement('span');
  marker.className = 'media-play-marker';
  marker.setAttribute('aria-hidden', 'true');
  return marker;
}

export function createVideoDetail(detail) {
  const article = document.createElement('article');
  article.className = 'media-detail media-detail-video';
  const header = createDetailHeader(detail, 'media-detail-header-video');
  const player = document.createElement('div');
  player.className = 'media-video-player media-detail-media';
  const video = document.createElement('video');
  video.className = 'media-video-element';
  video.src = detail.video || '';
  video.poster = detail.poster
    || detail.picture?.querySelector('img')?.currentSrc
    || detail.picture?.querySelector('img')?.src
    || '';
  video.preload = 'metadata';
  video.playsInline = true;
  video.controls = true;
  video.setAttribute('aria-label', detail.title);
  const fullscreen = document.createElement('button');
  fullscreen.type = 'button';
  fullscreen.className = 'media-fullscreen';
  fullscreen.textContent = 'Fullscreen';
  fullscreen.dataset.mediaFullscreen = '';
  player.append(video, createPlayMarker(), fullscreen);
  article.append(header, player);
  return article;
}

function locationHash(type, key) {
  return `#${encodeURIComponent(type)}/${encodeURIComponent(key)}`;
}

function setupVideoFullscreen(scope) {
  const article = scope.querySelector('.media-detail-video');
  const button = scope.querySelector('[data-media-fullscreen]');
  if (!article || !button) return;
  button.addEventListener('click', async () => {
    article.classList.add('is-fullscreen');
    const player = article.querySelector('.media-video-player');
    if (player?.requestFullscreen) {
      try { await player.requestFullscreen(); } catch (error) { /* CSS fallback remains active. */ }
    }
  });
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) article.classList.remove('is-fullscreen');
  });
}

export function setupStandaloneGallery(scope, detail) {
  const buttons = [...scope.querySelectorAll('[data-media-lightbox-index]')];
  if (!buttons.length) return;
  let active = 0;
  const dialog = document.createElement('dialog');
  dialog.className = 'media-lightbox-dialog';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'media-dialog-close';
  close.setAttribute('aria-label', 'Close image viewer');
  const previous = document.createElement('button');
  previous.type = 'button';
  previous.className = 'media-lightbox-nav media-lightbox-prev';
  previous.setAttribute('aria-label', 'Previous image');
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'media-lightbox-nav media-lightbox-next';
  next.setAttribute('aria-label', 'Next image');
  const media = document.createElement('div');
  media.className = 'media-lightbox-media';
  const progress = document.createElement('div');
  progress.className = 'media-lightbox-progress';
  const download = document.createElement('a');
  download.className = 'media-lightbox-download';
  download.download = '';
  download.textContent = 'Download';
  dialog.append(close, previous, media, next, progress, download);
  document.body.append(dialog);

  const render = (index) => {
    active = (index + detail.images.length) % detail.images.length;
    const item = detail.images[active];
    media.replaceChildren();
    appendPicture(media, item.picture.cloneNode(true), item.alt || `${detail.title} ${active + 1}`, true);
    progress.style.setProperty('--media-progress', `${((active + 1) / detail.images.length) * 100}%`);
    progress.setAttribute('aria-label', `${active + 1} of ${detail.images.length}`);
    download.href = detail.download || item.picture.querySelector('img')?.currentSrc || item.picture.querySelector('img')?.src || '';
  };
  const dismiss = () => dialog.close();
  buttons.forEach((button, index) => button.addEventListener('click', () => {
    render(index);
    dialog.showModal();
    close.focus();
  }));
  close.addEventListener('click', dismiss);
  previous.addEventListener('click', () => render(active - 1));
  next.addEventListener('click', () => render(active + 1));
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dismiss(); });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') render(active - 1);
    if (event.key === 'ArrowRight') render(active + 1);
  });
}

export function setupMediaDialog(opener, detail) {
  const dialog = document.createElement('dialog');
  dialog.className = `media-dialog media-dialog-${detail.type}`;
  const titleId = `media-dialog-${detail.type}-${String(detail.key).replace(/[^a-z0-9]+/gi, '-')}`;
  detail.titleId = titleId;
  dialog.setAttribute('aria-labelledby', titleId);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'media-dialog-close';
  close.setAttribute('aria-label', `Close ${detail.type} detail`);
  let view;
  if (detail.type === 'photos') view = createGalleryDetail(detail);
  else if (detail.type === 'videos') view = createVideoDetail(detail);
  else view = createArticleDetail(detail);
  const shell = document.createElement('div');
  shell.className = 'media-dialog-shell';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'media-detail-back';
  back.textContent = `Back to ${detail.type === 'newsroom' ? 'Newsroom' : detail.type[0].toUpperCase() + detail.type.slice(1)}`;
  shell.append(back, view);
  dialog.append(close, shell);
  document.body.append(dialog);
  const baseHash = detail.type === 'newsroom' ? '' : `#${detail.type}`;
  const show = (updateHistory = true) => {
    dialog.showModal();
    document.documentElement.classList.add('media-dialog-open');
    if (updateHistory) window.history.pushState({ mediaDetail: true }, '', locationHash(detail.type, detail.key));
    close.focus();
  };
  const dismiss = (updateHistory = true) => {
    if (dialog.open) dialog.close();
    document.documentElement.classList.remove('media-dialog-open');
    if (updateHistory) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${baseHash}`);
  };
  opener.addEventListener('click', () => show());
  close.addEventListener('click', () => dismiss());
  back.addEventListener('click', () => dismiss());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dismiss(); });
  dialog.addEventListener('cancel', (event) => {
    const fullscreen = dialog.querySelector('.media-detail-video.is-fullscreen');
    if (fullscreen) {
      event.preventDefault();
      fullscreen.classList.remove('is-fullscreen');
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    }
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('media-dialog-open');
    window.setTimeout(() => opener.focus(), 0);
  });
  if (detail.type === 'photos') setupStandaloneGallery(dialog, detail);
  if (detail.type === 'videos') setupVideoFullscreen(dialog);
  const targetHash = locationHash(detail.type, detail.key);
  if (window.location.hash === targetHash) window.setTimeout(() => show(false), 0);
  return dialog;
}

export function setupVideo(scope) {
  setupVideoFullscreen(scope);
}

export function registerMediaPanel(block, panelId) {
  block.dataset.mediaPanel = panelId;
  const sync = (active) => {
    const visible = !active || active === panelId;
    block.toggleAttribute('hidden', !visible);
    if (visible) createReveal(block, '.media-card, .media-featured');
  };
  sync(document.documentElement.dataset.mediaActiveTab || 'newsroom');
  document.addEventListener('media-tab-change', (event) => sync(event.detail.id));
}
