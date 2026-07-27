import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [blockJs, blockCss, modelRaw, sectionRaw] = await Promise.all([
  readFile(new URL('../blocks/test-drive-booking/test-drive-booking.js', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/test-drive-booking/test-drive-booking.css', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/test-drive-booking/_test-drive-booking.json', import.meta.url), 'utf8'),
  readFile(new URL('../models/_section.json', import.meta.url), 'utf8'),
]);

const config = JSON.parse(modelRaw);
const model = (id) => config.models.find((entry) => entry.id === id);

test('test drive booking exposes one container with repeatable models and stores', () => {
  assert.deepEqual(config.definitions.map(({ id }) => id), [
    'test-drive-booking',
    'test-drive-model',
    'test-drive-store',
  ]);
  assert.deepEqual(config.filters[0].components, ['test-drive-model', 'test-drive-store']);
  assert.deepEqual(model('test-drive-model').fields.map(({ name }) => name), [
    'modelKey',
    'modelName',
    'subtitle',
    'price',
    'desktopImage',
    'desktopImageAlt',
    'mobileImage',
    'mobileImageAlt',
  ]);
  assert.deepEqual(model('test-drive-store').fields.map(({ name }) => name), [
    'storeKey',
    'city',
    'storeName',
    'availableModelKeys',
  ]);
  assert.match(blockJs, /row\.children\.length === 6/);
  assert.match(blockJs, /privacyLinkText:\s*-1/);
  assert.match(sectionRaw, /"test-drive-booking"/);
});

test('test drive booking keeps Universal Editor instrumentation and PII ephemeral', () => {
  assert.match(blockJs, /moveSource\(item\.row, card\)/);
  assert.match(blockJs, /moveSource\(content\.sources\.title, title\)/);
  assert.match(blockJs, /if \(source\) moveInstrumentation\(source, target\)/);
  assert.match(blockJs, /new CustomEvent\('testdrive:submit'/);
  assert.match(blockJs, /credentials: 'same-origin'/);
  assert.match(blockJs, /url\.origin !== window\.location\.origin/);
  assert.doesNotMatch(blockJs, /localStorage|sessionStorage/);
  assert.doesNotMatch(blockJs, /console\.(?:log|info|warn|error)/);
});

test('test drive booking has the approved responsive and author geometry', () => {
  assert.match(blockCss, /grid-template-columns:\s*clamp\(416px, 28vw, 520px\)/);
  assert.match(blockCss, /@media \(width >= 720px\) and \(width <= 1440px\)/);
  assert.match(blockCss, /@media \(width <= 719px\)/);
  assert.match(blockCss, /height:\s*410px/);
  assert.match(blockCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(blockCss, /\.adobe-ue-edit[\s\S]*max-height:\s*1080px/);
  assert.match(blockCss, /\.test-drive-select:focus-visible/);
});
