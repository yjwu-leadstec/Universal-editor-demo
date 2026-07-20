import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [bannerCss, bannerJs, bannerModel] = await Promise.all([
  readFile(new URL('../blocks/home-banner/home-banner.css', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/home-banner/home-banner.js', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/home-banner/_home-banner.json', import.meta.url), 'utf8'),
]);

test('tablet banner switches to the official 16:9 composition', () => {
  assert.match(
    bannerCss,
    /@media \(width <= 1024px\)[\s\S]*?\.home-banner \.hero-carousel\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*9;/,
  );
});

test('mobile banner supports an independently authored static feature', () => {
  assert.match(bannerJs, /extractMobileHero\(block\)/);
  assert.match(bannerJs, /class="mobile-hero-slide"/);
  assert.match(bannerCss, /@media \(width < 720px\)[\s\S]*?\.has-mobile-hero \.carousel-track\s*\{[^}]*display:\s*none;/);

  const model = JSON.parse(bannerModel);
  const homeBanner = model.models.find(({ id }) => id === 'home-banner');
  const fieldNames = homeBanner.fields.map(({ name }) => name);
  assert.deepEqual(
    fieldNames,
    ['mobileImage', 'mobileImageAlt', 'mobileLogo', 'mobileDamFolder'],
  );
});

test('mobile asset failure uses the DAM original before restoring the carousel', () => {
  assert.match(
    bannerJs,
    /addDamOriginalFallback\(img, mobileHero\.damFolder, showCarouselFallback\)/,
  );
  assert.match(
    bannerJs,
    /folder\?\.startsWith\('\/content\/dam\/'\)/,
  );
  assert.match(
    bannerJs,
    /classList\.remove\('has-mobile-hero'\)/,
  );
});

test('mobile banner is ordered before the vehicle grid without changing authored order', () => {
  assert.match(
    bannerCss,
    /@media \(width <= 720px\)[\s\S]*?\.section\.home-banner-container > \.home-banner-wrapper\s*\{[^}]*order:\s*-1;/,
  );
});
