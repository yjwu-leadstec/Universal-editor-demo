import { createOptimizedPicture } from '../../scripts/aem.js';
import {
  formatDate, loadMediaEntries, normalizePath, sortMediaEntries, titleFor, toEdsAssetPath,
} from '../../scripts/media-center-data.js';
import {
  createArticleDetail, createGalleryDetail, createVideoDetail, setupStandaloneGallery, setupVideo,
} from '../../scripts/media-center-utils.js';
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

function contentPicture(path, alt, eager = false) {
  return path ? createOptimizedPicture(toEdsAssetPath(path), alt, eager) : null;
}

function safeDamPath(path) {
  return normalizePath(path).startsWith('/content/dam/li-auto/') ? toEdsAssetPath(path) : '';
}

function routeFor(type, routeBase) {
  const base = normalizePath(routeBase).replace(/^\/content\/demo-site/, '');
  return type === 'newsroom' ? base : `${base}/${type}`;
}

function createBackLink(entry, routeBase) {
  const nav = document.createElement('nav');
  nav.className = 'media-center-detail-backbar';
  nav.setAttribute('aria-label', 'Media Center navigation');
  const link = document.createElement('a');
  link.href = routeFor(entry.type, routeBase);
  link.textContent = `Back to ${titleFor(entry.type)}`;
  nav.append(link);
  return nav;
}

function createBodySource(text) {
  const source = document.createElement('div');
  const paragraph = document.createElement('p');
  paragraph.textContent = text;
  source.append(paragraph);
  return source;
}

function createDetail(entry) {
  const picture = contentPicture(entry.image, entry.alt || entry.title, true);
  if (entry.type === 'photos') {
    const paths = entry.galleryImages.length ? entry.galleryImages : [entry.image];
    const images = paths.map((path, index) => {
      const imagePath = safeDamPath(path);
      return imagePath ? {
        picture: contentPicture(imagePath, `${entry.alt || entry.title} ${index + 1}`),
        alt: `${entry.alt || entry.title} ${index + 1}`,
        row: null,
      } : null;
    }).filter(Boolean);
    const detail = createGalleryDetail({
      title: entry.title,
      date: formatDate(entry.date),
      download: safeDamPath(entry.download),
      images,
    });
    return {
      detail,
      setup: () => setupStandaloneGallery(detail, {
        images,
        download: safeDamPath(entry.download),
      }),
    };
  }
  if (entry.type === 'videos') {
    const detail = createVideoDetail({
      title: entry.title,
      date: formatDate(entry.date),
      duration: entry.duration,
      poster: safeDamPath(entry.image),
      alt: entry.alt || entry.title,
      video: safeDamPath(entry.video),
    });
    return { detail, setup: () => setupVideo(detail) };
  }
  const detail = createArticleDetail({
    title: entry.title,
    date: formatDate(entry.date),
    picture,
    alt: entry.alt || entry.title,
    contents: entry.body ? [{ kind: 'copy', source: createBodySource(entry.body), row: null }] : [],
  });
  return { detail, setup: () => {} };
}

function renderEmpty(block, message) {
  const empty = document.createElement('p');
  empty.className = 'media-center-detail-empty';
  empty.textContent = message;
  block.replaceChildren(empty);
}

export default async function decorate(block) {
  const rows = [...block.children];
  const sourcePathSource = sourceFor(rows, 'sourcePath', 0);
  const routeBaseSource = sourceFor(rows, 'routeBase', 1);
  const sourcePath = sourceHref(sourcePathSource) || sourceText(sourcePathSource);
  const routeBase = normalizePath(sourceHref(routeBaseSource) || sourceText(routeBaseSource));

  try {
    const currentPath = normalizePath(window.location.pathname);
    const entry = sortMediaEntries(await loadMediaEntries(sourcePath))
      .find((item) => item.visible && normalizePath(item.path) === currentPath);
    if (!entry) {
      renderEmpty(block, 'This media entry is not available yet.');
      return;
    }
    const shell = document.createElement('section');
    shell.className = `media-center-detail-shell is-${entry.type}`;
    const back = createBackLink(entry, routeBase);
    const { detail, setup } = createDetail(entry);
    shell.append(back, detail);
    block.classList.add('media-center-detail');
    block.replaceChildren(shell);
    moveInstrumentation(sourcePathSource, detail);
    moveInstrumentation(routeBaseSource, back);
    setup();
  } catch {
    renderEmpty(block, 'This media entry will appear after publication.');
  }
}
