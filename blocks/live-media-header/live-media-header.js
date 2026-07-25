/* Live-site aligned Media Center route header. */
import { moveInstrumentation } from '../../scripts/scripts.js';

const TAB_KEYS = ['newsroom', 'photos', 'videos'];

function rowSource(rows, name, fallbackIndex) {
  const selector = `[data-aue-prop="${name}"]`;
  return rows.find((row) => row.matches(selector))
    || rows.map((row) => row.querySelector(selector)).find(Boolean)
    || rows[fallbackIndex]
    || null;
}

function sourceText(source) {
  return source?.textContent.trim() || '';
}

function sourceHref(source) {
  const link = source?.matches('a') ? source : source?.querySelector('a');
  return link?.getAttribute('href') || '';
}

function hasModel(row, model) {
  return row.getAttribute('data-aue-model') === model
    || Boolean(row.querySelector(`[data-aue-model="${model}"]`));
}

function tabLabel(key) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export default function decorate(block) {
  const rows = [...block.children];
  const titleSource = rowSource(rows, 'title', 0);
  const activeSource = rowSource(rows, 'activeTab', 1);
  const activeTab = TAB_KEYS.includes(sourceText(activeSource)) ? sourceText(activeSource) : 'newsroom';
  const routeRows = rows.filter((row) => hasModel(row, 'live-media-route'));
  const routes = new Map(routeRows.map((row) => [
    sourceText(rowSource([row], 'tabKey', 0)),
    { source: row, href: sourceHref(rowSource([row], 'href', 1)) },
  ]));
  const links = Object.fromEntries(TAB_KEYS.map((key, index) => {
    const route = routes.get(key);
    if (route) return [key, route];
    const source = rowSource(rows, `${key}Url`, index + 2);
    return [key, { source, href: sourceHref(source) }];
  }));

  const header = document.createElement('header');
  header.className = 'live-media-header-shell';
  const heading = document.createElement('h1');
  heading.textContent = sourceText(titleSource) || 'Newsroom';
  header.append(heading);

  const navigation = document.createElement('nav');
  navigation.className = 'live-media-tabs';
  navigation.setAttribute('aria-label', 'Media Center sections');
  TAB_KEYS.forEach((key) => {
    const link = document.createElement('a');
    link.className = 'live-media-tab';
    if (key === activeTab) link.classList.add('is-active');
    link.href = links[key].href || '#';
    link.textContent = tabLabel(key);
    if (key === activeTab) link.setAttribute('aria-current', 'page');
    navigation.append(link);
    moveInstrumentation(links[key].source, link);
  });
  header.append(navigation);

  block.parentElement?.classList.add('live-media-header-wrapper');
  block.classList.add('live-media-header');
  block.replaceChildren(header);
  moveInstrumentation(titleSource, heading);
  moveInstrumentation(activeSource, navigation);
}
