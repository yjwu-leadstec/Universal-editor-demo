import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [modelRaw, navigationJs, navigationCss, headerJs, sectionRaw] = await Promise.all([
  readFile(new URL('../blocks/header-navigation/_header-navigation.json', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/header-navigation/header-navigation.js', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/header-navigation/header-navigation.css', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/header/header.js', import.meta.url), 'utf8'),
  readFile(new URL('../models/_section.json', import.meta.url), 'utf8'),
]);

const model = JSON.parse(modelRaw);
const section = JSON.parse(sectionRaw);

test('header navigation uses a flat container/item authoring model', () => {
  const itemDefinitions = model.definitions.filter(({ id }) => id.startsWith('header-navigation-'));
  const itemModels = model.models.filter(({ id }) => id.startsWith('header-navigation-'));
  const filter = model.filters.find(({ id }) => id === 'header-navigation');

  assert.equal(itemDefinitions.length, 3);
  itemDefinitions.forEach((definition) => assert.equal(
    definition.plugins.xwalk.page.resourceType,
    'core/franklin/components/block/v1/block/item',
  ));
  assert.deepEqual(filter.components, [
    'header-navigation-top',
    'header-navigation-group',
    'header-navigation-card',
  ]);
  itemModels.forEach((itemModel) => {
    assert.equal(itemModel.fields.some(({ component }) => component === 'richtext'), false);
    assert.ok(itemModel.fields.length <= 5);
  });
});

test('header card exports background and vehicle foreground as separate DAM references', () => {
  const cardModel = model.models.find(({ id }) => id === 'header-navigation-card');
  const mediaFields = cardModel.fields.filter(({ name }) => [
    'backgroundImage',
    'foregroundImage',
  ].includes(name));

  assert.deepEqual(mediaFields.map(({ name }) => name), ['backgroundImage', 'foregroundImage']);
  mediaFields.forEach((field) => {
    assert.equal(field.component, 'reference');
    assert.equal(field.valueType, 'string');
    assert.equal(field.multi, undefined);
  });
  assert.equal(cardModel.fields.some(({ name }) => name === 'media'), false);
  assert.match(navigationJs, /fieldPicture\(\s*row,\s*'backgroundImage'/);
  assert.match(navigationJs, /fieldPicture\(\s*row,\s*'foregroundImage'/);
  assert.match(navigationJs, /fieldPicture\(\s*row,\s*'logoImage'/);
  assert.match(navigationJs, /directField\(row, 'media'\)/);
});

test('header navigation destinations use the AEM Sites content picker', () => {
  const linkModels = model.models.filter(({ id }) => [
    'header-navigation-top',
    'header-navigation-card',
  ].includes(id));
  linkModels.forEach((itemModel) => {
    const destination = itemModel.fields.find(({ name }) => name === 'destination');
    assert.equal(destination.component, 'aem-content');
    assert.equal(destination.label, 'Target Page or URL');
    assert.equal(destination.validation.rootPath, '/content/demo-site');
  });
  assert.match(sectionRaw, /"header-navigation"/);
  assert.ok(section.filters.find(({ id }) => id === 'section'));
});

test('header prefers structured items and retains the legacy rich-text fallback', () => {
  assert.match(navigationJs, /item\.kind === 'top'/);
  assert.match(navigationJs, /item\.kind === 'group'/);
  assert.match(navigationJs, /row\.children\.length > 2/);
  assert.match(navigationJs, /dataset\.headerNavigation = 'true'/);
  assert.match(navigationJs, /buildSemanticList\(items, actionLabel\)/);
  assert.match(headerJs, /const structuredList = navSection\?\.querySelector/);
  assert.match(headerJs, /const topList = structuredList \|\| navSection\?\.querySelector\('ul'\)/);
});

test('Universal Editor keeps every navigation item as a flat selectable card', () => {
  const semanticListSource = navigationJs.slice(
    navigationJs.indexOf('function buildSemanticList'),
    navigationJs.indexOf('function appendEditorDetail'),
  );
  assert.match(navigationJs, /data-aue-model/);
  assert.match(navigationJs, /header-navigation-editor-list/);
  assert.match(navigationJs, /moveInstrumentation\(item\.row, element\)/);
  assert.match(navigationJs, /list\.hidden = true/);
  assert.match(navigationJs, /dataset\.headerNavigationView = authoring \? 'author' : 'delivery'/);
  assert.match(navigationCss, /data-header-navigation-view="author"/);
  assert.doesNotMatch(semanticListSource, /moveInstrumentation/);
});

test('unfinished items stay in the author editor and stay out of delivery navigation', () => {
  assert.match(navigationJs, /items\.forEach\(\(item, index\) =>/);
  assert.match(navigationJs, /if \(!item\.kind \|\| !item\.label\) return/);
  assert.match(navigationJs, /No target selected/);
  assert.match(navigationJs, /Move this item below a Main Navigation Link before publishing/);
});
