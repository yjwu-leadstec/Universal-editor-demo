import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [componentJs, componentCss, componentModel, sectionModel] = await Promise.all([
  readFile(new URL('../blocks/lixiang-cookie-banner/lixiang-cookie-banner.js', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/lixiang-cookie-banner/lixiang-cookie-banner.css', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/lixiang-cookie-banner/_lixiang-cookie-banner.json', import.meta.url), 'utf8'),
  readFile(new URL('../models/_section.json', import.meta.url), 'utf8'),
]);

test('the block is registered for Universal Editor authoring', () => {
  const model = JSON.parse(componentModel);
  const definition = model.definitions.find((entry) => entry.id === 'lixiang-cookie-banner');
  assert.ok(definition, 'definition exists');
  assert.equal(definition.plugins.xwalk.page.template.model, 'lixiang-cookie-banner');
  const { fields } = model.models.find((entry) => entry.id === 'lixiang-cookie-banner');
  assert.deepEqual(
    fields.map((field) => field.name),
    ['title', 'body', 'acceptLabel', 'rejectLabel'],
  );
  assert.equal(fields.find((field) => field.name === 'body').component, 'richtext');
  assert.match(sectionModel, /"lixiang-cookie-banner"/);
});

test('consent is persisted in localStorage and broadcast as a custom event', () => {
  assert.match(componentJs, /const STORAGE_KEY = 'lixiang-cookie-consent';/);
  assert.match(componentJs, /window\.localStorage\.getItem\(STORAGE_KEY\)/);
  assert.match(componentJs, /JSON\.stringify\(\{ choice, at: new Date\(\)\.toISOString\(\) \}\)/);
  assert.match(
    componentJs,
    /document\.dispatchEvent\(new CustomEvent\(CONSENT_EVENT, \{ detail: \{ choice \} \}\)\)/,
  );
  assert.match(componentJs, /const CONSENT_EVENT = 'lixiang:consent';/);
});

test('a stored choice keeps the banner hidden outside the editor', () => {
  assert.match(componentJs, /if \(!editor && hasStoredChoice\(\)\)/);
  assert.match(componentJs, /lixiang-cookie-banner-hidden/);
  assert.match(componentCss, /\.lixiang-cookie-banner\.lixiang-cookie-banner-hidden\s*\{\s*display:\s*none;/);
});

test('every authored field keeps Universal Editor instrumentation', () => {
  assert.match(componentJs, /import \{ moveInstrumentation \} from '\.\.\/\.\.\/scripts\/scripts\.js';/);
  assert.match(componentJs, /moveInstrumentation\(title\.source, heading\)/);
  assert.match(componentJs, /moveInstrumentation\(bodySource, body\)/);
  assert.match(componentJs, /moveInstrumentation\(source, button\)/);
  assert.match(componentJs, /makeButton\(accept, 'accepted', accept\.source\)/);
  assert.match(componentJs, /makeButton\(reject, 'rejected', reject\.source\)/);
});

test('desktop bar matches the design spec', () => {
  assert.match(
    componentCss,
    /\.lixiang-cookie-banner\s*\{[^}]*position:\s*fixed;[^}]*height:\s*100px;[^}]*background:\s*rgb\(255 255 255 \/ 90%\);[^}]*backdrop-filter:\s*blur\(10px\);[^}]*box-shadow:\s*0 -4px 8px rgb\(0 0 0 \/ 4%\);/s,
  );
  assert.match(componentCss, /padding:\s*0 80px;/);
  assert.match(componentCss, /\.lixiang-cookie-banner-content\s*\{[^}]*max-width:\s*1385px;/s);
  assert.match(
    componentCss,
    /\.lixiang-cookie-banner-button\s*\{[^}]*width:\s*135px;[^}]*height:\s*44px;[^}]*border:\s*1px solid #191919;[^}]*border-radius:\s*100px;/s,
  );
  assert.match(componentCss, /\.lixiang-cookie-banner-button:focus-visible\s*\{[^}]*outline:/s);
});

test('mobile sheet uses the 720px breakpoint with rounded top and wrapping buttons', () => {
  const mobile = componentCss.match(/@media \(width <= 719px\)\s*\{([\s\S]*)\n\}/);
  assert.ok(mobile, 'mobile media query exists');
  const rules = mobile[1];
  assert.match(rules, /border-radius:\s*16px 16px 0 0;/);
  assert.match(rules, /padding:\s*20px;/);
  assert.match(rules, /flex-wrap:\s*wrap;/);
  assert.match(rules, /background:\s*#f5f5f5;/);
});

test('the Universal Editor override is static and comes after all media queries', () => {
  assert.match(
    componentCss,
    /\.adobe-ue-edit main \.lixiang-cookie-banner\s*\{\s*position:\s*static;/,
  );
  assert.ok(
    componentCss.indexOf('.adobe-ue-edit') > componentCss.lastIndexOf('@media'),
    'ue-edit rules follow every media query',
  );
});
