import {
  addBlockAnchor,
  createMedia,
  createProductLink,
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

function createFeatureItem(item, options) {
  const article = document.createElement('article');
  article.className = 'feature-media-item';
  const { element: media } = createMedia(item, options);
  const copy = document.createElement('div');
  copy.className = 'feature-media-copy';
  const eyebrow = propText(item, 'eyebrow');
  const title = propText(item, 'title');
  if (eyebrow) {
    const element = document.createElement('p');
    element.className = 'feature-media-eyebrow';
    element.textContent = eyebrow;
    instrumentProp(item, 'eyebrow', element);
    copy.append(element);
  }
  if (title) {
    const element = document.createElement('h3');
    element.textContent = title;
    instrumentProp(item, 'title', element);
    copy.append(element);
  }
  const descriptionSource = propSource(item, 'description');
  if (descriptionSource?.textContent.trim()) {
    const description = createRichText(descriptionSource, 'feature-media-description');
    instrumentProp(item, 'description', description);
    copy.append(description);
  }
  const primaryValue = propText(item, 'primaryValue');
  if (primaryValue) {
    const metric = document.createElement('p');
    metric.className = 'feature-primary-metric';
    const value = document.createElement('strong');
    value.textContent = primaryValue;
    const unit = document.createElement('span');
    unit.textContent = propText(item, 'primaryUnit');
    const label = document.createElement('small');
    label.textContent = propText(item, 'primaryLabel');
    metric.append(value, unit, label);
    copy.append(metric);
  }
  const note = propText(item, 'note');
  if (note) {
    const element = document.createElement('p');
    element.className = 'feature-media-note';
    element.textContent = note;
    instrumentProp(item, 'note', element);
    copy.append(element);
  }
  const link = createProductLink(item);
  if (link) copy.append(link);
  article.append(media);
  if (copy.childElementCount) article.append(copy);
  moveItemInstrumentation(item, article);
  return article;
}

function createStats(items) {
  const list = document.createElement('div');
  list.className = 'feature-stat-list';
  items.forEach((item) => {
    const stat = document.createElement('div');
    stat.className = 'feature-stat';
    const value = document.createElement('p');
    value.className = 'feature-stat-value';
    const strong = document.createElement('strong');
    strong.textContent = propText(item, 'value');
    const unit = document.createElement('span');
    unit.textContent = propText(item, 'unit');
    value.append(strong, unit);
    const label = document.createElement('p');
    label.className = 'feature-stat-label';
    label.textContent = propText(item, 'label');
    stat.append(value, label);
    const descriptionSource = propSource(item, 'description');
    if (descriptionSource?.textContent.trim()) stat.append(createRichText(descriptionSource, 'feature-stat-description'));
    moveItemInstrumentation(item, stat);
    list.append(stat);
  });
  return list;
}

function buildTabbed(block, items, container, variant) {
  if (items.length === 1) {
    container.append(createFeatureItem(items[0], {
      autoplay: true,
      showControls: propBoolean(block, 'showVideoControl', true),
      showProgress: propBoolean(block, 'showProgress', true),
    }));
    return;
  }
  const nav = document.createElement('div');
  nav.className = 'feature-media-tabs';
  nav.setAttribute('role', 'tablist');
  nav.setAttribute('aria-label', 'Feature media');
  const panels = document.createElement('div');
  panels.className = 'feature-media-panels';
  const buttons = [];
  items.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = propText(item, 'eyebrow') || propText(item, 'title') || `Feature ${index + 1}`;
    buttons.push(button);
    nav.append(button);
    panels.append(createFeatureItem(item, {
      autoplay: true,
      showControls: propBoolean(block, 'showVideoControl', true),
      showProgress: propBoolean(block, 'showProgress', true),
    }));
  });
  container.append(panels, nav);
  setupTabs(block, buttons, [...panels.children], {
    autoPlay: propBoolean(block, 'autoPlay', true),
    interval: propNumber(block, 'interval', 4) * 1000,
  });
  if (variant === 'overlay-tabs') container.classList.add('feature-tabs-overlay');
}

export default function decorate(block) {
  initProductBlock(block);
  const variant = propText(block, 'variant') || 'default';
  block.classList.add(`variant-${variant}`);
  const accentColor = propText(block, 'accentColor');
  if (accentColor) block.style.setProperty('--product-accent', accentColor);
  const mediaItems = modelItems(block, 'feature-media-item');
  const statItems = modelItems(block, 'feature-stat-item');
  const shell = document.createElement('div');
  shell.className = 'feature-media-shell';
  const header = createSectionHeader(block);
  if (header.childElementCount) shell.append(header);
  if (statItems.length) shell.append(createStats(statItems));

  const content = document.createElement('div');
  content.className = 'feature-media-content';
  if (['default', 'overlay-tabs'].includes(variant) && mediaItems.length) {
    buildTabbed(block, mediaItems, content, variant);
  } else {
    const grid = document.createElement('div');
    grid.className = 'feature-media-grid';
    mediaItems.forEach((item) => grid.append(createFeatureItem(item, {
      autoplay: true,
      showControls: propBoolean(block, 'showVideoControl', true),
      showProgress: propBoolean(block, 'showProgress', true),
    })));
    if (grid.childElementCount) content.append(grid);
  }

  if (variant === 'expandable' && content.childElementCount) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'feature-expand-toggle';
    button.setAttribute('aria-expanded', 'false');
    button.textContent = propText(block, 'openLabel') || 'View More';
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      content.classList.toggle('is-expanded', !expanded);
      button.textContent = !expanded ? propText(block, 'closeLabel') || 'View Less' : propText(block, 'openLabel') || 'View More';
    });
    shell.append(content, button);
  } else if (content.childElementCount) shell.append(content);
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  revealElements(block, '.product-section-header, .feature-stat, .feature-media-item', propBoolean(block, 'enableMotion', true));
}
