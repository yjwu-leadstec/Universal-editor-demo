import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  MOBILE_MEDIA_QUERY,
  resolveResponsiveDefault,
} from '../scripts/product-media-defaults.mjs';

const productMediaSource = await readFile(
  new URL('../scripts/product-block-utils.js', import.meta.url),
  'utf8',
);
const chapterModel = JSON.parse(await readFile(
  new URL('../blocks/chapter-intro/_chapter-intro.json', import.meta.url),
  'utf8',
));

test('desktop media is the default and mobile media only overrides on mobile', () => {
  const cases = [
    ['desktop', 'mobile', false, 'desktop'],
    ['desktop', 'mobile', true, 'mobile'],
    ['desktop', '', true, 'desktop'],
    ['', 'mobile', false, ''],
    ['', 'mobile', true, 'mobile'],
    ['', '', true, ''],
  ];

  cases.forEach(([desktop, mobile, isMobile, expected]) => {
    assert.equal(resolveResponsiveDefault(desktop, mobile, isMobile), expected);
  });
  assert.equal(MOBILE_MEDIA_QUERY, '(max-width: 719px)');
});

test('shared video controls follow the active breakpoint source', () => {
  assert.match(productMediaSource, /window\.matchMedia\(MOBILE_MEDIA_QUERY\)/);
  assert.match(productMediaSource, /hasActiveSource: \(\) => Boolean\(resolveResponsiveDefault\(/);
  assert.match(productMediaSource, /sourceMedia: mobileVideoUrl \? mobileMedia : null/);
  assert.match(productMediaSource, /if \(button\) button\.hidden = !available/);
  assert.match(productMediaSource, /media\.classList\.remove\('is-video-ready', 'has-active-video'\);[\s\S]*media\.classList\.add\('is-video-error'\)/);
  assert.match(productMediaSource, /source\.media = MOBILE_MEDIA_QUERY/);
});

test('chapter intro dialog identifies desktop defaults and optional mobile overrides', () => {
  const fields = new Map(chapterModel.models[0].fields.map((field) => [field.name, field]));

  assert.match(fields.get('image').label, /\(Default\)$/);
  assert.match(fields.get('video').label, /\(Default\)$/);
  assert.match(fields.get('mobileImage').label, /\(Optional Override\)$/);
  assert.match(fields.get('mobileVideo').label, /\(Optional Override\)$/);
  assert.match(fields.get('mobileImage').description, /Never used on desktop/);
  assert.match(fields.get('mobileVideo').description, /Never used on desktop/);
});
