const LANGUAGE_TAG_PATTERN = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i;
const MARKET_CODE_PATTERN = /^(?:global|[a-z]{2})$/;
const RTL_LANGUAGES = new Set([
  'ar', 'arc', 'ckb', 'dv', 'fa', 'he', 'ku', 'nqo', 'ps', 'sd', 'syr', 'ug', 'ur', 'yi',
]);
const NON_PAGE_PREFIXES = [
  '/blocks/', '/content/', '/fonts/', '/icons/', '/scripts/', '/styles/', '/tools/',
];

/**
 * Normalize a delivered page or fragment path.
 * @param {string} value
 * @returns {string}
 */
export function normalizePath(value) {
  if (!value) return '/';
  const rawPath = String(value)
    .split(/[?#]/, 1)[0]
    .replace(/(?:\.plain)?\.html$/i, '')
    .replace(/\/{2,}/g, '/');
  const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

/**
 * Return a canonical BCP 47 tag, or an empty string when invalid.
 * @param {string} value
 * @returns {string}
 */
export function canonicalLanguageTag(value) {
  const candidate = String(value || '').trim().replace(/_/g, '-');
  if (!LANGUAGE_TAG_PATTERN.test(candidate)) return '';
  try {
    return Intl.getCanonicalLocales(candidate)[0] || '';
  } catch {
    return '';
  }
}

/**
 * Resolve language-master, Global English, or market/language roots in a delivery URL.
 * @param {string} pathname
 * @returns {{ root: string, marketCode: string, languageTag: string } | null}
 */
export function resolveLocaleContext(pathname) {
  const path = normalizePath(pathname);
  const segments = path.split('/').filter(Boolean);
  if (!segments.length) return null;

  const localeIndex = segments[0] === 'content' ? 2 : 0;
  const segment = segments[localeIndex]?.toLowerCase();
  if (!segment) return null;

  if (segment === 'language-master') {
    const languageTag = canonicalLanguageTag(segments[localeIndex + 1]);
    if (languageTag) {
      return {
        root: `/${segments.slice(0, localeIndex).concat(segment, segments[localeIndex + 1].toLowerCase()).join('/')}`,
        marketCode: 'language-master',
        languageTag,
      };
    }
  }

  if (segment === 'en') {
    return {
      root: `/${segments.slice(0, localeIndex).concat(segment).join('/')}`,
      marketCode: 'global',
      languageTag: 'en',
    };
  }

  const languageTag = canonicalLanguageTag(segments[localeIndex + 1]);
  if (MARKET_CODE_PATTERN.test(segment) && languageTag) {
    return {
      root: `/${segments.slice(0, localeIndex).concat(
        segment,
        segments[localeIndex + 1].toLowerCase(),
      ).join('/')}`,
      marketCode: segment,
      languageTag,
    };
  }

  return null;
}

/**
 * Validate and normalize an authored shell fragment override.
 * @param {string} value
 * @param {string} origin
 * @returns {string}
 */
export function safeFragmentOverride(value, origin) {
  const candidate = String(value || '').trim();
  if (!candidate) return '';
  if (!candidate.startsWith('/') && !/^https?:\/\//i.test(candidate)) return '';
  try {
    const url = new URL(candidate, origin);
    if (!/^https?:$/.test(url.protocol) || url.origin !== origin) return '';
    return normalizePath(url.pathname);
  } catch {
    return '';
  }
}

/**
 * Build ordered localized fragment candidates.
 * @param {'nav'|'footer'} kind
 * @param {object} options
 * @param {string} options.pathname
 * @param {string} options.origin
 * @param {string} [options.metadata]
 * @param {boolean} [options.migrationFallback]
 * @returns {string[]}
 */
export function getFragmentCandidates(kind, {
  pathname,
  origin,
  metadata = '',
  migrationFallback = true,
}) {
  if (!['nav', 'footer'].includes(kind)) return [];
  const candidates = [];
  const override = safeFragmentOverride(metadata, origin);
  const context = resolveLocaleContext(pathname);
  if (override) candidates.push(override);
  if (context) candidates.push(`${context.root}/${kind}`);
  if (migrationFallback) candidates.push(`/${kind}`);
  return [...new Set(candidates)];
}

/**
 * Rebase a fragment's same-origin page link into the active language root.
 * @param {string} href
 * @param {string} localeRoot
 * @param {string} origin
 * @returns {string}
 */
export function localizeSiteHref(href, localeRoot, origin) {
  const value = String(href || '').trim();
  if (!value || !localeRoot) return value;
  if (value.startsWith('#')) return value;
  try {
    const url = new URL(value, origin);
    if (['mailto:', 'tel:', 'sms:'].includes(url.protocol)) return value;
    if (!/^https?:$/.test(url.protocol)) return '';
    if (url.origin !== origin) return value;

    const pathname = normalizePath(url.pathname);
    if (NON_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return value;
    if (resolveLocaleContext(pathname)) return `${pathname}${url.search}${url.hash}`;

    const root = normalizePath(localeRoot);
    const localized = pathname === '/' ? root : `${root}${pathname}`;
    return `${localized}${url.search}${url.hash}`;
  } catch {
    return '';
  }
}

/**
 * Resolve the document language and initial writing direction.
 * @param {object} options
 * @param {string} options.pathname
 * @param {string} [options.language]
 * @param {string} [options.direction]
 * @returns {{ languageTag: string, direction: 'ltr'|'rtl' } | null}
 */
export function getDocumentLocale({ pathname, language = '', direction = '' }) {
  const context = resolveLocaleContext(pathname);
  const languageTag = canonicalLanguageTag(language) || context?.languageTag || '';
  if (!languageTag) return null;
  const authoredDirection = String(direction || '').toLowerCase();
  const primaryLanguage = languageTag.split('-')[0].toLowerCase();
  let resolvedDirection = RTL_LANGUAGES.has(primaryLanguage) ? 'rtl' : 'ltr';
  if (['ltr', 'rtl'].includes(authoredDirection)) resolvedDirection = authoredDirection;
  return {
    languageTag,
    direction: resolvedDirection,
  };
}

/**
 * Check whether a path is the localized homepage.
 * @param {string} pathname
 * @returns {boolean}
 */
export function isLocalizedHomepage(pathname) {
  const path = normalizePath(pathname);
  if (path === '/') return true;
  const context = resolveLocaleContext(path);
  return !!context && (path === context.root || path === `${context.root}/homepage`);
}

/**
 * Check whether an authored destination belongs to the current locale root.
 * @param {string} href
 * @param {string} pathname
 * @param {string} origin
 * @returns {boolean}
 */
export function isCurrentLocaleDestination(href, pathname, origin) {
  try {
    const destination = new URL(href, origin);
    if (destination.origin !== origin) return false;
    const current = resolveLocaleContext(pathname);
    const target = resolveLocaleContext(destination.pathname);
    return !!current && !!target && current.root === target.root;
  } catch {
    return false;
  }
}
