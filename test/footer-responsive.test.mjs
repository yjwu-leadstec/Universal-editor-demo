import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [footerCss, footerJs] = await Promise.all([
  readFile(new URL('../blocks/footer/footer.css', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/footer/footer.js', import.meta.url), 'utf8'),
]);

test('desktop footer uses the official 460 px black shell', () => {
  assert.match(footerCss, /background:\s*#000;/);
  assert.doesNotMatch(footerCss, /background:\s*#141414;/);
  assert.match(footerCss, /min-height:\s*460px;/);
  assert.doesNotMatch(footerCss, /min-height:\s*639px;/);
});

test('desktop footer columns use intrinsic widths with the official 10 percent rhythm', () => {
  assert.match(
    footerCss,
    /footer \.footer-nav\s*\{[^}]*display:\s*flex;[^}]*gap:\s*10%;/s,
  );
  assert.doesNotMatch(footerCss, /repeat\(5,\s*minmax\(/);
});

test('mobile footer uses 47 px closed rows and expanded 16 px list rhythm', () => {
  assert.match(
    footerCss,
    /footer \.footer-accordion-header\s*\{[^}]*min-height:\s*46px;[^}]*padding:\s*12px 0;[^}]*font-size:\s*12px;/s,
  );
  assert.match(
    footerCss,
    /footer \.footer-accordion-content ul\s*\{[^}]*display:\s*grid;[^}]*gap:\s*16px;/s,
  );
});

test('footer bottom bar separates policy and legal rows for responsive layout', () => {
  assert.match(footerJs, /footer-bottom-policies/);
  assert.match(footerJs, /footer-bottom-legal/);
  assert.match(footerCss, /footer \.footer-bottom-policies/);
  assert.match(footerCss, /footer \.footer-bottom-legal/);
});
