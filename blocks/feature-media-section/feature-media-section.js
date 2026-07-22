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
} from '../../scripts/product-block-utils.js';

function createFeatureCopy(item, { showEyebrow = true } = {}) {
  const copy = document.createElement('div');
  copy.className = 'feature-media-copy';
  const eyebrow = propText(item, 'eyebrow');
  const title = propText(item, 'title');
  if (showEyebrow && eyebrow) {
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
  return copy;
}

function createFeatureItem(item, options) {
  const article = document.createElement('article');
  article.className = 'feature-media-item';
  const { element: media } = createMedia(item, options);
  const copy = createFeatureCopy(item);
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

function setupResponsiveTabs(block, buttons, panels, copies, viewport) {
  const mobileQuery = window.matchMedia('(width <= 719px)');
  const autoPlay = propBoolean(block, 'autoPlay', true);
  const interval = propNumber(block, 'interval', 4) * 1000;
  let active = 0;
  let timer = null;
  let scrollFrame = null;

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };
  const activate = (index, { focus = false, scroll = false } = {}) => {
    active = (index + panels.length) % panels.length;
    buttons.forEach((button, itemIndex) => {
      const selected = itemIndex === active;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      panels[itemIndex].hidden = !mobileQuery.matches && !selected;
      copies[itemIndex].hidden = !selected;
    });
    if (focus) buttons[active].focus();
    if (scroll && mobileQuery.matches) {
      const padding = Number.parseFloat(window.getComputedStyle(viewport).paddingInlineStart) || 0;
      viewport.scrollTo({
        left: Math.max(0, panels[active].offsetLeft - padding),
        behavior: 'smooth',
      });
    }
  };
  const start = () => {
    stop();
    if (!autoPlay || mobileQuery.matches || panels.length < 2) return;
    timer = window.setInterval(() => activate(active + 1), Math.max(2000, interval));
  };
  const syncFromScroll = () => {
    scrollFrame = null;
    if (!mobileQuery.matches) return;
    const padding = Number.parseFloat(window.getComputedStyle(viewport).paddingInlineStart) || 0;
    const closest = panels.map((panel, index) => ({
      index,
      distance: Math.abs(panel.offsetLeft - padding - viewport.scrollLeft),
    })).sort((first, second) => first.distance - second.distance)[0];
    if (closest && closest.index !== active) activate(closest.index);
  };
  const applyMode = () => {
    stop();
    activate(active);
    if (mobileQuery.matches) {
      window.requestAnimationFrame(() => {
        const styles = window.getComputedStyle(viewport);
        const padding = Number.parseFloat(styles.paddingInlineStart) || 0;
        viewport.scrollTo({
          left: Math.max(0, panels[active].offsetLeft - padding),
          behavior: 'auto',
        });
      });
    } else start();
  };

  buttons.forEach((button, index) => {
    const panel = panels[index];
    const copy = copies[index];
    const tabId = `${block.id || block.dataset.productBlock || 'feature'}-tab-${index + 1}`;
    const panelId = `${block.id || block.dataset.productBlock || 'feature'}-panel-${index + 1}`;
    const copyId = `${block.id || block.dataset.productBlock || 'feature'}-copy-${index + 1}`;
    button.id = tabId;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panelId);
    panel.id = panelId;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabId);
    panel.setAttribute('aria-describedby', copyId);
    copy.id = copyId;
    button.addEventListener('click', () => {
      activate(index, { scroll: mobileQuery.matches });
      start();
    });
    button.addEventListener('keydown', (event) => {
      const keys = {
        ArrowRight: index + 1,
        ArrowDown: index + 1,
        ArrowLeft: index - 1,
        ArrowUp: index - 1,
        Home: 0,
        End: buttons.length - 1,
      };
      if (!(event.key in keys)) return;
      event.preventDefault();
      activate(keys[event.key], { focus: true, scroll: mobileQuery.matches });
      start();
    });
  });
  viewport.addEventListener('scroll', () => {
    if (scrollFrame !== null) return;
    scrollFrame = window.requestAnimationFrame(syncFromScroll);
  }, { passive: true });
  block.addEventListener('mouseenter', stop);
  block.addEventListener('mouseleave', start);
  block.addEventListener('focusin', stop);
  block.addEventListener('focusout', start);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
  mobileQuery.addEventListener('change', applyMode);
  activate(0);
  start();
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
  const copiesContainer = document.createElement('div');
  copiesContainer.className = 'feature-media-tab-copies';
  const buttons = [];
  const copies = [];
  items.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    const eyebrow = propText(item, 'eyebrow');
    button.textContent = eyebrow || propText(item, 'title') || `Feature ${index + 1}`;
    if (eyebrow) instrumentProp(item, 'eyebrow', button);
    buttons.push(button);
    nav.append(button);
    const panel = document.createElement('article');
    panel.className = 'feature-media-item';
    const { element: media } = createMedia(item, {
      autoplay: true,
      showControls: propBoolean(block, 'showVideoControl', true),
      showProgress: propBoolean(block, 'showProgress', true),
    });
    panel.append(media);
    moveItemInstrumentation(item, panel);
    panels.append(panel);
    const copy = createFeatureCopy(item, { showEyebrow: false });
    copy.classList.add('feature-media-tab-copy');
    copies.push(copy);
    copiesContainer.append(copy);
  });
  container.append(panels, nav, copiesContainer);
  setupResponsiveTabs(block, buttons, [...panels.children], copies, panels);
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
    if (mediaItems.length > 1) block.classList.add('is-tabbed');
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
  const revealSelector = block.classList.contains('is-tabbed')
    ? '.product-section-header, .feature-media-content'
    : '.product-section-header, .feature-stat, .feature-media-item';
  revealElements(block, revealSelector, propBoolean(block, 'enableMotion', true));
}
