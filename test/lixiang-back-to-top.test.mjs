import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [componentJs, componentCss, scriptsJs, footerJs, footerCss] = await Promise.all([
  readFile(new URL('../blocks/lixiang-back-to-top/lixiang-back-to-top.js', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/lixiang-back-to-top/lixiang-back-to-top.css', import.meta.url), 'utf8'),
  readFile(new URL('../scripts/scripts.js', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/footer/footer.js', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/footer/footer.css', import.meta.url), 'utf8'),
]);

test('the site shell loads one independent back-to-top block', () => {
  assert.match(scriptsJs, /buildBlock\('lixiang-back-to-top', ''\)/);
  assert.match(scriptsJs, /loadBlock\(backToTop\)/);
  assert.doesNotMatch(footerJs, /footer-back-to-top|initBackToTop/);
  assert.doesNotMatch(footerCss, /footer-back-to-top/);
});

test('the control follows the live-site visibility and click behavior', () => {
  assert.match(componentJs, /const SCROLL_THRESHOLD = 100;/);
  assert.match(componentJs, /window\.scrollY >= SCROLL_THRESHOLD/);
  assert.match(componentJs, /window\.scrollTo\(0, 0\)/);
  assert.match(componentJs, /tabIndex = visible \? 0 : -1/);
});

test('desktop and mobile dimensions match the live site', () => {
  assert.match(
    componentCss,
    /\.lixiang-back-to-top-button\s*\{[^}]*right:\s*40px;[^}]*bottom:\s*40px;[^}]*width:\s*48px;[^}]*height:\s*48px;/s,
  );
  assert.match(
    componentCss,
    /@media \(width <= 719px\)\s*\{[^}]*right:\s*16px;[^}]*bottom:\s*28px;[^}]*width:\s*40px;[^}]*height:\s*40px;/s,
  );
  assert.match(componentCss, /background:\s*rgb\(236 236 236 \/ 60%\);/);
  assert.match(componentCss, /z-index:\s*201;/);
});

test('the control rises above the footer by the viewport base offset', () => {
  assert.match(componentJs, /const baseBottom = desktop\.matches \? 40 : 28;/);
  assert.match(
    componentJs,
    /Math\.max\(baseBottom, window\.innerHeight - footerTop \+ baseBottom\)/,
  );
});
