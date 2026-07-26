export const MEDIA_TYPES = ['newsroom', 'photos', 'videos'];

const CONTENT_FRAGMENT_ROOT = '/content/dam/li-auto/media-center-v2';
const GRAPHQL_QUERY_URL = 'https://publish-p80707-e1685574.adobeaemcloud.com/graphql/execute.json/global/media-center-feed';
const GRAPHQL_CACHE_WINDOW_MS = 5 * 60 * 1000;

function firstValue(entry, names) {
  const value = names.map((name) => entry[name])
    .find((item) => item !== undefined && item !== null);
  return typeof value === 'string' ? value.trim() : value || '';
}

function isVisible(value) {
  return !['false', '0', 'no'].includes(String(value).trim().toLowerCase());
}

export function normalizePath(path) {
  return String(path || '').replace(/^https?:\/\/[^/]+/, '').replace(/\.html$/, '').replace(/\/$/, '');
}

export function localizeDetailPath(path) {
  const normalizedPath = normalizePath(path);
  if (!normalizedPath.startsWith('/media-library/')) return normalizedPath;
  const currentPath = normalizePath(window.location.pathname);
  const mediaLibraryIndex = currentPath.indexOf('/media-library/');
  if (mediaLibraryIndex !== -1) return `${currentPath.slice(0, mediaLibraryIndex)}${normalizedPath}`;
  const pageIndex = currentPath.indexOf('/media-center-v2');
  return pageIndex === -1 ? normalizedPath : `${currentPath.slice(0, pageIndex)}${normalizedPath}`;
}

export function toEdsAssetPath(path) {
  return normalizePath(path).replace(/^\/content\/dam\/li-auto\//, '/assets/');
}

export function titleFor(type) {
  return type === 'newsroom' ? 'Newsroom' : `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
}

export function formatDate(value) {
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

function paths(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string');
  if (typeof value !== 'string') return [];
  try {
    return paths(JSON.parse(value));
  } catch {
    return value ? [value] : [];
  }
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
    body: firstValue(entry, ['body', 'summary']),
    galleryImages: paths(firstValue(entry, ['galleryImages', 'gallery-images'])),
    download: firstValue(entry, ['download', 'downloadUrl', 'download-url']),
    video: firstValue(entry, ['video', 'videoUrl', 'video-url']),
  };
}

export function sortMediaEntries(entries) {
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

function contentFragmentRoot(sourcePath) {
  const configuredRoot = normalizePath(sourcePath);
  return configuredRoot.startsWith('/content/dam/') ? configuredRoot : CONTENT_FRAGMENT_ROOT;
}

export async function loadMediaEntries(sourcePath) {
  const queryUrl = new URL(GRAPHQL_QUERY_URL);
  queryUrl.searchParams.set('cache', Math.floor(Date.now() / GRAPHQL_CACHE_WINDOW_MS));
  const response = await fetch(queryUrl, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Media content request failed (${response.status})`);
  const payload = await response.json();
  const items = payload?.data?.simpleJsonObjectList?.items;
  const root = contentFragmentRoot(sourcePath);
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => mediaEntry({
      ...parseJsonEntry(item),
      _path: Object.getOwnPropertyDescriptor(item, '_path')?.value,
    }))
    .filter((entry) => entry.contentFragmentPath === root
      || entry.contentFragmentPath.startsWith(`${root}/`));
}
