import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [modelRaw, navigationJs, headerJs, sectionRaw] = await Promise.all([
  readFile(new URL('../blocks/header-navigation/_header-navigation.json', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/header-navigation/header-navigation.js', import.meta.url), 'utf8'),
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
    assert.ok(itemModel.fields.length <= 4);
  });
});

test('header navigation destinations use the AEM Sites content picker', () => {
  const linkModels = model.models.filter(({ id }) => [
    'header-navigation-top',
    'header-navigation-card',
  ].includes(id));
  linkModels.forEach((itemModel) => {
    const destination = itemModel.fields.find(({ name }) => name === 'destination');
    assert.equal(destination.component, 'aem-content');
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
  assert.match(headerJs, /const structuredList = navSection\?\.querySelector/);
  assert.match(headerJs, /const topList = structuredList \|\| navSection\?\.querySelector\('ul'\)/);
});

test('new empty navigation items remain selectable only in Universal Editor', () => {
  assert.match(navigationJs, /data-aue-model/);
  assert.match(navigationJs, /header-navigation-empty-item/);
  assert.match(navigationJs, /!item\.row\.hasAttribute\('data-aue-resource'\)/);
  assert.match(navigationJs, /Configure Top Navigation/);
});
