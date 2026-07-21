import {
  addBlockAnchor,
  createMedia,
  createRichText,
  createSectionHeader,
  initProductBlock,
  instrumentProp,
  modelItems,
  moveItemInstrumentation,
  propBoolean,
  propNumber,
  propSource,
  propText,
  revealElements,
  setupTabs,
} from '../../scripts/product-block-utils.js';

function createPanel(block, item) {
  const panel = document.createElement('article');
  panel.className = 'image-switcher-panel';
  const { element: media } = createMedia(item, {
    autoplay: true,
    showControls: propBoolean(block, 'showVideoControl', true),
    showProgress: propBoolean(block, 'showProgress', true),
  });
  const copy = document.createElement('div');
  copy.className = 'image-switcher-copy';
  const title = propText(item, 'title');
  if (title) {
    const heading = document.createElement('h3');
    heading.textContent = title;
    instrumentProp(item, 'title', heading);
    copy.append(heading);
  }
  const descriptionSource = propSource(item, 'description');
  if (descriptionSource?.textContent.trim()) {
    const description = createRichText(descriptionSource, 'image-switcher-description');
    instrumentProp(item, 'description', description);
    copy.append(description);
  }
  const value = propText(item, 'value');
  const unit = propText(item, 'unit');
  if (value || unit) {
    const metric = document.createElement('p');
    metric.className = 'image-switcher-metric';
    const strong = document.createElement('strong');
    strong.textContent = value;
    const suffix = document.createElement('span');
    suffix.textContent = unit;
    metric.append(strong, suffix);
    copy.append(metric);
  }
  const note = propText(item, 'note');
  if (note) {
    const element = document.createElement('p');
    element.className = 'image-switcher-note';
    element.textContent = note;
    instrumentProp(item, 'note', element);
    copy.append(element);
  }
  panel.append(media, copy);
  moveItemInstrumentation(item, panel);
  return panel;
}

export default function decorate(block) {
  initProductBlock(block);
  const accentColor = propText(block, 'accentColor');
  if (accentColor) block.style.setProperty('--product-accent', accentColor);
  const items = modelItems(block, 'image-switcher-item');
  const shell = document.createElement('div');
  shell.className = 'image-switcher-shell';
  const header = createSectionHeader(block);
  if (header.childElementCount) shell.append(header);

  const stage = document.createElement('div');
  stage.className = 'image-switcher-stage';
  const panels = items.map((item) => createPanel(block, item));
  const tabs = document.createElement('div');
  tabs.className = 'image-switcher-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Media options');
  const buttons = items.map((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = propText(item, 'label') || propText(item, 'title') || `Option ${index + 1}`;
    instrumentProp(item, 'label', button);
    tabs.append(button);
    return button;
  });
  stage.append(...panels);
  if (buttons.length > 1) stage.append(tabs);
  if (panels.length) shell.append(stage);
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  if (buttons.length > 1) {
    setupTabs(block, buttons, panels, {
      autoPlay: propBoolean(block, 'autoPlay', true),
      interval: propNumber(block, 'interval', 4) * 1000,
    });
  }
  revealElements(block, '.product-section-header, .image-switcher-stage');
}
