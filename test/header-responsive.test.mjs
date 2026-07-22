import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [headerCss, headerJs] = await Promise.all([
  readFile(new URL('../blocks/header/header.css', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/header/header.js', import.meta.url), 'utf8'),
]);

test('mobile accordions keep the logo shell instead of entering a hybrid detail view', () => {
  assert.doesNotMatch(headerCss, /data-mobile-view|header-mobile-(?:back|title)/);
  assert.doesNotMatch(headerJs, /dataset\.mobileView|header-mobile-(?:back|title)/);
});

test('mobile drawer locks the viewport and matches the compact official chrome', () => {
  assert.match(headerCss, /html\.nav-open,\s*body\.nav-open/);
  assert.match(headerJs, /document\.documentElement\.classList\.toggle\('nav-open', !shouldClose\)/);
  assert.match(headerCss, /header \.header-hamburger\s*\{[^}]*flex:\s*0 0 20px;[^}]*width:\s*20px;/s);
  assert.match(headerCss, /header \.header-menu-icon\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;/s);
  assert.match(
    headerCss,
    /header \.header-nav\[aria-expanded="true"\] \.header-menu-icon\s*\{[^}]*background:\s*currentcolor;/s,
  );
});

test('mobile accordion vertical rhythm matches the official 48 px rows', () => {
  assert.doesNotMatch(headerCss, /header \.header-mobile-item:first-child/);
  assert.match(headerCss, /header \.header-mobile-submenu\s*\{[^}]*padding-block:\s*14px;/s);
  assert.match(
    headerCss,
    /header \.header-mobile-item:has\([^)]*aria-expanded="true"[^)]*\) ~ \.header-mobile-language\s*\{[^}]*margin-top:\s*13px;/s,
  );
});

test('header projects authored links into the active Author or EDS namespace', () => {
  assert.match(headerJs, /brandTarget = '\/homepage'/);
  assert.match(headerJs, /extractLocaleMarkets\(directory, localeContext\?\.root \|\| ''\)/);
  assert.match(
    headerJs,
    /href: localizeSiteHref\([\s\S]*?link\.getAttribute\('href'\),[\s\S]*?localeRoot/,
  );
});

test('hidden mega-panel media is ready on first open without competing with page LCP', () => {
  assert.match(headerJs, /image\.loading = 'eager'/);
  assert.match(headerJs, /image\.fetchPriority = 'low'/);
});
