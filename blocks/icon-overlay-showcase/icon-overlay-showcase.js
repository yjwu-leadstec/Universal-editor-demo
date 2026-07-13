import {
  addBlockAnchor,
  appendPicture,
  clamp,
  createMedia,
  createRichText,
  createSectionHeader,
  initProductBlock,
  modelItems,
  moveItemInstrumentation,
  propNumber,
  propPicture,
  propSource,
  propText,
  revealElements,
  setupTabs,
} from '../../scripts/product-block-utils.js';

function createPanel(panelSource) {
  const panel = document.createElement('section');
  panel.className = 'overlay-panel';
  const media = createMedia(panelSource, { autoplay: false, showControls: false }).element;
  media.classList.add('overlay-panel-media');
  const mask = propPicture(panelSource, 'mask');
  if (mask) {
    const layer = document.createElement('div');
    layer.className = 'overlay-mask';
    appendPicture(layer, mask, { alt: propText(panelSource, 'maskAlt'), fallbackLabel: '' });
    media.append(layer);
  }
  modelItems(panelSource, 'overlay-hotspot').forEach((item) => {
    const hotspot = document.createElement('div');
    hotspot.className = 'overlay-hotspot';
    const x = clamp(propNumber(item, 'x', 50), 0, 100);
    const y = clamp(propNumber(item, 'y', 50), 0, 100);
    const mobileX = clamp(propNumber(item, 'mobileX', x), 0, 100);
    const mobileY = clamp(propNumber(item, 'mobileY', y), 0, 100);
    hotspot.style.setProperty('--hotspot-x', `${x}%`);
    hotspot.style.setProperty('--hotspot-y', `${y}%`);
    hotspot.style.setProperty('--hotspot-mobile-x', `${mobileX}%`);
    hotspot.style.setProperty('--hotspot-mobile-y', `${mobileY}%`);
    if (x >= 70) hotspot.classList.add('overlay-hotspot-right');
    if (x <= 30) hotspot.classList.add('overlay-hotspot-left');
    if (y <= 25) hotspot.classList.add('overlay-hotspot-top');
    if (mobileX >= 70) hotspot.classList.add('overlay-hotspot-mobile-right');
    if (mobileX <= 30) hotspot.classList.add('overlay-hotspot-mobile-left');
    if (mobileY <= 25) hotspot.classList.add('overlay-hotspot-mobile-top');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'overlay-hotspot-button';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', propText(item, 'label') || 'Feature hotspot');
    button.textContent = '+';
    const detail = document.createElement('div');
    detail.className = 'overlay-hotspot-detail';
    const title = document.createElement('strong');
    title.textContent = propText(item, 'label');
    detail.append(title);
    const source = propSource(item, 'description');
    if (source?.textContent.trim()) detail.append(createRichText(source));
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!open));
      hotspot.classList.toggle('is-open', !open);
    });
    hotspot.append(button, detail);
    moveItemInstrumentation(item, hotspot);
    media.append(hotspot);
  });
  panel.append(media);
  moveItemInstrumentation(panelSource, panel);
  return panel;
}

export default function decorate(block) {
  initProductBlock(block);
  const sources = modelItems(block, 'overlay-panel');
  const shell = document.createElement('div');
  shell.className = 'overlay-showcase-shell';
  const header = createSectionHeader(block);
  if (header.childElementCount) shell.append(header);
  const panels = sources.map(createPanel);
  const panelList = document.createElement('div');
  panelList.className = 'overlay-panels';
  panelList.append(...panels);
  if (panels.length > 1) {
    const tabs = document.createElement('div');
    tabs.className = 'overlay-tabs';
    tabs.setAttribute('role', 'tablist');
    const buttons = sources.map((source, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = propText(source, 'title') || `View ${index + 1}`;
      tabs.append(button);
      return button;
    });
    shell.append(tabs, panelList);
    setupTabs(block, buttons, panels);
  } else shell.append(panelList);
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  revealElements(block, '.product-section-header, .overlay-panel');
}
