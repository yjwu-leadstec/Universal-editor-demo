import {
  appendPropAnchors, directRows, hasModel, instrument, instrumentProp, propText, rowTexts,
} from '../../scripts/media-center-utils.js';

function activate(block, id, updateHash = true) {
  document.documentElement.dataset.mediaActiveTab = id;
  block.querySelectorAll('[data-media-tab]').forEach((button) => {
    const active = button.dataset.mediaTab === id;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  document.dispatchEvent(new CustomEvent('media-tab-change', { detail: { id } }));
  if (updateHash) {
    const hash = id === 'newsroom' ? '' : `#${encodeURIComponent(id)}`;
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
  }
}

export default function decorate(block) {
  const rows = directRows(block);
  const tabs = rows.filter((row) => hasModel(row, 'media-tab')).map((row, index) => {
    const [key = `tab-${index + 1}`, label = key] = rowTexts(row);
    return { key, label, row };
  });
  const titleText = propText(rows, 'title') || 'Newsroom';
  const defaultTab = propText(rows, 'defaultTab') || tabs[0]?.key || 'newsroom';
  const hashTab = decodeURIComponent(window.location.hash.replace('#', '').split('/')[0]);
  const initial = tabs.some((tab) => tab.key === hashTab) ? hashTab : defaultTab;
  const shell = document.createElement('div');
  shell.className = 'media-tabs-shell';
  const title = document.createElement('h1');
  title.textContent = titleText;
  instrumentProp(rows, 'title', title);
  const nav = document.createElement('div');
  nav.className = 'media-tabs-nav';
  nav.setAttribute('role', 'tablist');
  nav.setAttribute('aria-label', 'Media center sections');
  tabs.forEach((tab) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'media-tab';
    button.dataset.mediaTab = tab.key;
    button.textContent = tab.label;
    button.setAttribute('role', 'tab');
    button.addEventListener('click', () => activate(block, tab.key));
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const next = (tabs.findIndex((item) => item.key === tab.key) + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      activate(block, tabs[next].key);
      block.querySelector(`[data-media-tab="${tabs[next].key}"]`)?.focus();
    });
    instrument(tab.row, button);
    nav.append(button);
  });
  shell.append(title, nav);
  block.replaceChildren(shell);
  appendPropAnchors(block, rows, ['defaultTab', 'id', 'classes']);
  const id = propText(rows, 'id');
  if (id) block.id = id;
  activate(block, initial, false);
  const sticky = () => block.classList.toggle('is-stuck', block.getBoundingClientRect().top < -150);
  sticky();
  window.addEventListener('scroll', sticky, { passive: true });
  window.addEventListener('hashchange', () => {
    const idFromHash = decodeURIComponent(window.location.hash.replace('#', '').split('/')[0]) || defaultTab;
    if (tabs.some((tab) => tab.key === idFromHash)) activate(block, idFromHash, false);
  });
}
