/* Content-driven Media Center feed. */
import { createOptimizedPicture } from '../../scripts/aem.js';
import {
  formatDate, loadMediaEntries, MEDIA_TYPES, normalizePath, sortMediaEntries,
  titleFor, toEdsAssetPath,
} from '../../scripts/media-center-data.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function sourceFor(rows, name, fallbackIndex) {
  const selector = `[data-aue-prop="${name}"]`;
  return rows.find((row) => row.matches(selector))
    || rows.map((row) => row.querySelector(selector)).find(Boolean)
    || rows[fallbackIndex]
    || null;
}

function sourceText(source) {
  return source?.textContent.trim() || '';
}

function sourceHref(source) {
  const link = source?.matches('a') ? source : source?.querySelector('a');
  return link?.getAttribute('href') || '';
}

function createCard(entry, type) {
  const card = document.createElement('a');
  card.className = 'media-center-feed-card';
  if (entry.displayMode === 'full-width') card.classList.add('is-full-width');
  card.href = entry.path || '#';
  card.setAttribute('aria-label', entry.title || titleFor(type));

  const media = document.createElement('span');
  media.className = 'media-center-feed-media';
  if (entry.image) {
    media.append(createOptimizedPicture(toEdsAssetPath(entry.image), entry.alt || entry.title));
  }
  if (type === 'videos') {
    const marker = document.createElement('span');
    marker.className = `media-center-feed-marker is-${type}`;
    marker.setAttribute('aria-hidden', 'true');
    media.append(marker);
  }

  const copy = document.createElement('span');
  copy.className = 'media-center-feed-copy';
  const title = document.createElement('span');
  title.className = 'media-center-feed-title';
  title.textContent = entry.title;
  const meta = document.createElement('span');
  meta.className = 'media-center-feed-meta';
  if (type === 'photos') {
    const countIcon = document.createElement('span');
    countIcon.className = 'media-center-feed-count-icon';
    countIcon.setAttribute('aria-hidden', 'true');
    meta.append(countIcon, document.createTextNode(` ${entry.quantity || '0'} | ${formatDate(entry.date)}`));
  } else {
    const detail = type === 'videos' ? entry.duration : '';
    meta.textContent = [detail, formatDate(entry.date)].filter(Boolean).join(' | ');
  }
  copy.append(title, meta);
  card.append(media, copy);
  return card;
}

function renderEmpty(container, message) {
  const empty = document.createElement('p');
  empty.className = 'media-center-feed-empty';
  empty.textContent = message;
  container.replaceChildren(empty);
}

export default async function decorate(block) {
  const rows = [...block.children];
  const titleSource = sourceFor(rows, 'title', 0);
  const typeSource = sourceFor(rows, 'activeType', 1);
  const sourcePathSource = sourceFor(rows, 'sourcePath', 2);
  const routeBaseSource = sourceFor(rows, 'routeBase', 3);
  const typeValue = sourceText(typeSource).toLowerCase();
  const activeType = MEDIA_TYPES.includes(typeValue) ? typeValue : 'newsroom';
  const routeBase = normalizePath(sourceHref(routeBaseSource) || sourceText(routeBaseSource));

  const shell = document.createElement('section');
  shell.className = 'media-center-feed-shell';
  const header = document.createElement('header');
  const heading = document.createElement('h1');
  heading.textContent = sourceText(titleSource) || titleFor(activeType);
  const navigation = document.createElement('nav');
  navigation.className = 'media-center-feed-tabs';
  navigation.setAttribute('aria-label', 'Media Center sections');
  MEDIA_TYPES.forEach((type) => {
    const tab = document.createElement('a');
    tab.className = 'media-center-feed-tab';
    if (type === activeType) {
      tab.classList.add('is-active');
      tab.setAttribute('aria-current', 'page');
    }
    tab.href = routeBase || '#';
    if (routeBase && type !== 'newsroom') tab.href = `${routeBase}/${type}`;
    tab.textContent = titleFor(type);
    navigation.append(tab);
  });
  header.append(heading, navigation);

  const list = document.createElement('div');
  list.className = 'media-center-feed-list';
  shell.append(header, list);
  block.classList.add('media-center-feed');
  block.replaceChildren(shell);
  moveInstrumentation(titleSource, heading);
  moveInstrumentation(typeSource, navigation);
  moveInstrumentation(sourcePathSource, list);
  moveInstrumentation(routeBaseSource, navigation);

  try {
    const sourcePath = sourceHref(sourcePathSource) || sourceText(sourcePathSource);
    const entries = sortMediaEntries((await loadMediaEntries(sourcePath))
      .filter((entry) => entry.visible && entry.type === activeType));
    if (!entries.length) {
      renderEmpty(list, 'No published media entries are available yet.');
      return;
    }
    list.append(...entries.map((entry) => createCard(entry, activeType)));
  } catch {
    renderEmpty(list, 'Media entries will appear after publication.');
  }
}
