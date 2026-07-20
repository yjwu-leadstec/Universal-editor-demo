import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canonicalLanguageTag,
  getDocumentLocale,
  getFragmentCandidates,
  isCurrentLocaleDestination,
  isLocalizedHomepage,
  localizeSiteHref,
  normalizePath,
  resolveLocaleContext,
  safeFragmentOverride,
} from '../scripts/site-shell.mjs';

const ORIGIN = 'https://example.aem.page';

test('normalizes delivery and fragment paths', () => {
  assert.equal(normalizePath('/ae/en/nav.plain.html?x=1'), '/ae/en/nav');
  assert.equal(normalizePath('language-master/en/homepage/'), '/language-master/en/homepage');
});

test('resolves blueprint and public locale roots', () => {
  assert.deepEqual(resolveLocaleContext('/language-master/en/homepage'), {
    root: '/language-master/en', marketCode: 'language-master', languageTag: 'en',
  });
  assert.deepEqual(resolveLocaleContext('/content/demo-site/language-master/en/homepage.html'), {
    root: '/content/demo-site/language-master/en',
    marketCode: 'language-master',
    languageTag: 'en',
  });
  assert.deepEqual(resolveLocaleContext('/en/homepage'), {
    root: '/en', marketCode: 'global', languageTag: 'en',
  });
  assert.deepEqual(resolveLocaleContext('/content/demo-site/ae/ar/service.html'), {
    root: '/content/demo-site/ae/ar', marketCode: 'ae', languageTag: 'ar',
  });
  assert.deepEqual(resolveLocaleContext('/kz/ru/service'), {
    root: '/kz/ru', marketCode: 'kz', languageTag: 'ru',
  });
  assert.deepEqual(resolveLocaleContext('/content/demo-site/kz/ru/service.html'), {
    root: '/content/demo-site/kz/ru', marketCode: 'kz', languageTag: 'ru',
  });
  assert.equal(resolveLocaleContext('/service/guide'), null);
  assert.equal(resolveLocaleContext('/about/us'), null);
});

test('canonicalizes valid language tags and rejects invalid tags', () => {
  assert.equal(canonicalLanguageTag('pt_br'), 'pt-BR');
  assert.equal(canonicalLanguageTag('not-a-language-tag'), '');
});

test('accepts only same-origin fragment overrides', () => {
  assert.equal(safeFragmentOverride('/ae/en/nav.html', ORIGIN), '/ae/en/nav');
  assert.equal(safeFragmentOverride(`${ORIGIN}/special/nav`, ORIGIN), '/special/nav');
  assert.equal(safeFragmentOverride('https://attacker.example/nav', ORIGIN), '');
  // eslint-disable-next-line no-script-url
  assert.equal(safeFragmentOverride('javascript:alert(1)', ORIGIN), '');
  assert.equal(safeFragmentOverride('relative/nav', ORIGIN), '');
});

test('orders metadata, localized, and migration fragment candidates', () => {
  assert.deepEqual(getFragmentCandidates('nav', {
    pathname: '/language-master/en/homepage',
    origin: ORIGIN,
    metadata: '/campaign/nav',
  }), ['/campaign/nav', '/language-master/en/nav', '/nav']);
  assert.deepEqual(getFragmentCandidates('footer', {
    pathname: '/en/service',
    origin: ORIGIN,
    migrationFallback: false,
  }), ['/en/footer']);
  assert.deepEqual(getFragmentCandidates('nav', {
    pathname: '/ae/ar/homepage',
    origin: ORIGIN,
    migrationFallback: false,
  }), ['/ae/ar/nav']);
  assert.deepEqual(getFragmentCandidates('footer', {
    pathname: '/uz/ru/service',
    origin: ORIGIN,
    migrationFallback: false,
  }), ['/uz/ru/footer']);
  assert.deepEqual(getFragmentCandidates('nav', {
    pathname: '/content/demo-site/language-master/en/homepage.html',
    origin: ORIGIN,
    migrationFallback: false,
  }), ['/content/demo-site/language-master/en/nav']);
});

test('rebases only same-origin page links into the active locale root', () => {
  assert.equal(localizeSiteHref('/service', '/language-master/en', ORIGIN), '/language-master/en/service');
  assert.equal(localizeSiteHref('/', '/language-master/en', ORIGIN), '/language-master/en');
  assert.equal(localizeSiteHref('/en', '/language-master/en', ORIGIN), '/en');
  assert.equal(localizeSiteHref('https://www.lixiang.com/', '/language-master/en', ORIGIN), 'https://www.lixiang.com/');
  assert.equal(localizeSiteHref('mailto:hello@example.com', '/language-master/en', ORIGIN), 'mailto:hello@example.com');
  // eslint-disable-next-line no-script-url
  assert.equal(localizeSiteHref('javascript:alert(1)', '/language-master/en', ORIGIN), '');
});

test('derives document language and direction', () => {
  assert.deepEqual(getDocumentLocale({ pathname: '/en/homepage' }), {
    languageTag: 'en', direction: 'ltr',
  });
  assert.deepEqual(getDocumentLocale({ pathname: '/sa/ar' }), {
    languageTag: 'ar', direction: 'rtl',
  });
  assert.deepEqual(getDocumentLocale({ pathname: '/ae/ar' }), {
    languageTag: 'ar', direction: 'rtl',
  });
  assert.deepEqual(getDocumentLocale({
    pathname: '/sa/ar', language: 'en-GB', direction: 'ltr',
  }), { languageTag: 'en-GB', direction: 'ltr' });
  assert.equal(getDocumentLocale({ pathname: '/service' }), null);
});

test('recognizes both localized homepage forms', () => {
  assert.equal(isLocalizedHomepage('/language-master/en'), true);
  assert.equal(isLocalizedHomepage('/language-master/en/homepage'), true);
  assert.equal(isLocalizedHomepage('/content/demo-site/language-master/en/homepage.html'), true);
  assert.equal(isLocalizedHomepage('/en'), true);
  assert.equal(isLocalizedHomepage('/en/homepage'), true);
  assert.equal(isLocalizedHomepage('/en/service'), false);
});

test('matches locale destinations by locale root, not item order', () => {
  assert.equal(isCurrentLocaleDestination('/kz/ru', '/kz/ru/service', ORIGIN), true);
  assert.equal(isCurrentLocaleDestination('/kz/kk', '/kz/ru/service', ORIGIN), false);
  assert.equal(isCurrentLocaleDestination('https://www.lixiang.com/', '/kz/ru/service', ORIGIN), false);
});
