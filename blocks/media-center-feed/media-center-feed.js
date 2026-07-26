/* Content-driven Media Center feed. */
import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const MEDIA_TYPES = ['newsroom', 'photos', 'videos'];
const CONTENT_FRAGMENT_ROOT = '/content/dam/li-auto/media-center-v2';
const GRAPHQL_QUERY_URL = 'https://publish-p80707-e1685574.adobeaemcloud.com/graphql/execute.json/global/media-center-feed';
const GRAPHQL_CACHE_WINDOW_MS = 5 * 60 * 1000;

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

function firstValue(entry, names) {
  const value = names.map((name) => entry[name])
    .find((item) => item !== undefined && item !== null);
  return typeof value === 'string' ? value.trim() : value || '';
}

function isVisible(value) {
  return !['false', '0', 'no'].includes(String(value).trim().toLowerCase());
}

function normalizePath(path) {
  return String(path || '').replace(/^https?:\/\/[^/]+/, '').replace(/\.html$/, '').replace(/\/$/, '');
}

function localizeDetailPath(path) {
  const normalizedPath = normalizePath(path);
  if (!normalizedPath.startsWith('/media-library/')) return normalizedPath;
  const currentPath = normalizePath(window.location.pathname);
  const pageIndex = currentPath.indexOf('/media-center-v2');
  return pageIndex === -1 ? normalizedPath : `${currentPath.slice(0, pageIndex)}${normalizedPath}`;
}

function toEdsAssetPath(path) {
  return normalizePath(path).replace(/^\/content\/dam\/li-auto\//, '/assets/');
}

function titleFor(type) {
  return type === 'newsroom' ? 'Newsroom' : `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
}

function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function mediaEntry(entry) {
  const path = localizeDetailPath(firstValue(entry, ['detailPath', 'detail-path', 'path']));
  const displayMode = String(firstValue(entry, ['displayMode', 'display-mode']) || 'grid').toLowerCase();
  return {
    path,
    contentFragmentPath: normalizePath(firstValue(entry, ['_path', 'contentFragmentPath'])),
    title: firstValue(entry, ['title', 'name']),
    date: firstValue(entry, ['publishDate', 'publish-date', 'date']),
    type: String(firstValue(entry, ['mediaType', 'media-type', 'type'])).toLowerCase(),
    image: firstValue(entry, ['coverImage', 'cover-image', 'image']),
    alt: firstValue(entry, ['imageAlt', 'image-alt']),
    visible: isVisible(firstValue(entry, ['visible'])),
    displayMode: displayMode === 'full-width' ? displayMode : 'grid',
    featured: isVisible(firstValue(entry, ['featured'])) && firstValue(entry, ['featured']) !== '',
    sortOrder: Number(firstValue(entry, ['sortOrder', 'sort-order'])) || Number.MAX_SAFE_INTEGER,
    quantity: firstValue(entry, ['photoCount', 'photo-count', 'quantity']),
    duration: firstValue(entry, ['videoDuration', 'video-duration', 'duration']),
  };
}

function sortEntries(entries) {
  return entries.sort((left, right) => {
    if (left.featured !== right.featured) return left.featured ? -1 : 1;
    if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
    return String(right.date).localeCompare(String(left.date));
  });
}

function parseJsonEntry(entry) {
  const jsonEntry = firstValue(entry, ['jsonEntry']);
  const value = Array.isArray(jsonEntry) ? jsonEntry[0] : jsonEntry;
  if (typeof value === 'object' && value) return value;
  if (typeof value !== 'string') return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function fragmentEntry(entry) {
  const fragmentPath = Object.getOwnPropertyDescriptor(entry, '_path')?.value;
  return mediaEntry({ ...parseJsonEntry(entry), _path: fragmentPath });
}

function contentFragmentRoot(sourcePath) {
  const configuredRoot = normalizePath(sourcePath);
  return configuredRoot.startsWith('/content/dam/') ? configuredRoot : CONTENT_FRAGMENT_ROOT;
}

async function loadEntries(sourcePath) {
  const queryUrl = new URL(GRAPHQL_QUERY_URL);
  queryUrl.searchParams.set('cache', Math.floor(Date.now() / GRAPHQL_CACHE_WINDOW_MS));
  const response = await fetch(queryUrl, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Media content request failed (${response.status})`);
  const payload = await response.json();
  const items = payload?.data?.simpleJsonObjectList?.items;
  const root = contentFragmentRoot(sourcePath);
  if (!Array.isArray(items)) return [];
  return items
    .map(fragmentEntry)
    .filter((entry) => entry.contentFragmentPath === root
      || entry.contentFragmentPath.startsWith(`${root}/`));
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
    const entries = sortEntries((await loadEntries(sourcePath))
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
