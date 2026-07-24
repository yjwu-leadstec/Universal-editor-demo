import {
  addBlockAnchor,
  createHeading,
  createMedia,
  createProductLink,
  createRichText,
  initProductBlock,
  instrumentProp,
  modelItems,
  moveItemInstrumentation,
  prefersReducedMotion,
  propBoolean,
  propNumber,
  propSource,
  propText,
  revealElements,
} from '../../scripts/product-block-utils.js';

const ITEM_MODELS = {
  slides: ['lixiang-product-intro-slide'],
  highlightGroups: ['lixiang-product-intro-highlight-group'],
  highlights: ['lixiang-product-intro-highlight'],
  bottomMetrics: ['lixiang-product-intro-metric'],
};

let carouselInstance = 0;

function itemsFor(root, models) {
  const items = models.flatMap((model) => modelItems(root, model));
  return [...new Set(items)];
}

function directPropSource(root, name) {
  if (root.matches?.(`[data-aue-prop="${name}"]`)) return root;
  return [...root.children].find(
    (child) => child.matches?.(`[data-aue-prop="${name}"]`),
  ) || null;
}

function directPropText(root, name) {
  return directPropSource(root, name)?.textContent.trim() || '';
}

function createIntroHeader(block) {
  const header = document.createElement('header');
  header.className = 'product-section-header';
  const eyebrow = directPropText(block, 'eyebrow');
  const title = directPropText(block, 'title');
  const mobileTitle = directPropText(block, 'mobileTitle');
  const descriptionSource = directPropSource(block, 'description');
  if (eyebrow) {
    const element = document.createElement('p');
    element.className = 'product-eyebrow';
    element.textContent = eyebrow;
    instrumentProp(block, 'eyebrow', element);
    header.append(element);
  }
  if (title) {
    const element = createHeading(title, 2, 'product-title product-title-desktop');
    instrumentProp(block, 'title', element);
    header.append(element);
  }
  if (mobileTitle) {
    const element = createHeading(
      mobileTitle,
      2,
      'product-title product-title-mobile',
    );
    instrumentProp(block, 'mobileTitle', element);
    header.append(element);
  }
  if (descriptionSource?.textContent.trim()) {
    const element = createRichText(descriptionSource, 'product-description');
    instrumentProp(block, 'description', element);
    header.append(element);
  }
  return header;
}

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
  const primaryUnit = propText(item, 'primaryUnit');
  const primaryLabel = propText(item, 'primaryLabel');
  if (primaryValue || primaryUnit || primaryLabel) {
    const metric = document.createElement('p');
    metric.className = 'feature-primary-metric';
    if (primaryValue) {
      const value = document.createElement('strong');
      value.textContent = primaryValue;
      instrumentProp(item, 'primaryValue', value);
      metric.append(value);
    }
    if (primaryUnit) {
      const unit = document.createElement('span');
      unit.textContent = primaryUnit;
      instrumentProp(item, 'primaryUnit', unit);
      metric.append(unit);
    }
    if (primaryLabel) {
      const label = document.createElement('small');
      label.textContent = primaryLabel;
      instrumentProp(item, 'primaryLabel', label);
      metric.append(label);
    }
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
  article.className = 'product-intro-slide-card';
  const { element: media } = createMedia(item, options);
  const copy = createFeatureCopy(item);
  article.append(media);
  if (copy.childElementCount) article.append(copy);
  moveItemInstrumentation(item, article);
  return article;
}

function createHighlight(item, showTags) {
  const highlight = document.createElement('article');
  highlight.className = 'product-intro-highlight';
  const valueText = propText(item, 'value');
  const unitText = propText(item, 'unit');
  const tagText = propText(item, 'tag') || propText(item, 'label');
  if (showTags && tagText) {
    const tag = document.createElement('p');
    tag.className = 'product-intro-highlight-tag';
    tag.textContent = tagText;
    instrumentProp(item, propText(item, 'tag') ? 'tag' : 'label', tag);
    highlight.append(tag);
  }
  if (valueText || unitText) {
    const value = document.createElement('p');
    value.className = 'product-intro-highlight-value';
    if (valueText) {
      const strong = document.createElement('strong');
      strong.textContent = valueText;
      instrumentProp(item, 'value', strong);
      value.append(strong);
    }
    if (unitText) {
      const unit = document.createElement('span');
      unit.textContent = unitText;
      instrumentProp(item, 'unit', unit);
      value.append(unit);
    }
    highlight.append(value);
  }
  const descriptionSource = propSource(item, 'description');
  if (descriptionSource?.textContent.trim()) {
    const description = createRichText(
      descriptionSource,
      'product-intro-highlight-description',
    );
    instrumentProp(item, 'description', description);
    highlight.append(description);
  }
  if (!highlight.childElementCount) return null;
  moveItemInstrumentation(item, highlight);
  return highlight;
}

function createHighlightGroup(group, highlightItems, showTags) {
  const groupElement = document.createElement('div');
  groupElement.className = 'product-intro-highlight-group';
  highlightItems.forEach((item) => {
    const highlight = createHighlight(item, showTags);
    if (highlight) groupElement.append(highlight);
  });
  if (!groupElement.childElementCount) return null;
  if (group) moveItemInstrumentation(group, groupElement);
  return groupElement;
}

function createHighlights(groups, showTags) {
  const list = document.createElement('div');
  list.className = 'product-intro-highlights';
  groups.forEach((group) => {
    const groupElement = createHighlightGroup(
      group,
      itemsFor(group, ITEM_MODELS.highlights),
      showTags,
    );
    if (groupElement) list.append(groupElement);
  });
  return list;
}

function createBottomMetric(item) {
  const metric = document.createElement('article');
  metric.className = 'product-intro-bottom-metric';
  const valueText = propText(item, 'value');
  const unitText = propText(item, 'unit');
  const titleText = propText(item, 'title');
  if (valueText || unitText) {
    const value = document.createElement('p');
    value.className = 'product-intro-bottom-metric-value';
    if (valueText) {
      const strong = document.createElement('strong');
      strong.textContent = valueText;
      instrumentProp(item, 'value', strong);
      value.append(strong);
    }
    if (unitText) {
      const unit = document.createElement('span');
      unit.textContent = unitText;
      instrumentProp(item, 'unit', unit);
      value.append(unit);
    }
    metric.append(value);
  }
  if (titleText) {
    const title = document.createElement('p');
    title.className = 'product-intro-bottom-metric-title';
    title.textContent = titleText;
    instrumentProp(item, 'title', title);
    metric.append(title);
  }
  if (!metric.childElementCount) return null;
  moveItemInstrumentation(item, metric);
  return metric;
}

function createBottomMetrics(items, { standalone = false } = {}) {
  const list = document.createElement('div');
  list.className = `product-intro-bottom-metrics${standalone ? ' is-standalone' : ''}`;
  list.setAttribute('role', 'list');
  items.forEach((item) => {
    const metric = createBottomMetric(item);
    if (metric) {
      metric.setAttribute('role', 'listitem');
      list.append(metric);
    }
  });
  return list;
}

function setupResponsiveTabs(block, buttons, panels, copies, viewport) {
  const mobileQuery = window.matchMedia('(width <= 820px)');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const autoPlay = propBoolean(block, 'autoPlay', true);
  const interval = propNumber(block, 'interval', 4) * 1000;
  const instanceId = `lixiang-product-intro-carousel-${carouselInstance += 1}`;
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
      copies[itemIndex].classList.toggle('is-active', selected);
      copies[itemIndex].setAttribute('aria-hidden', String(!selected));
    });
    if (focus) buttons[active].focus();
    if (scroll && mobileQuery.matches) {
      const padding = Number.parseFloat(
        window.getComputedStyle(viewport).paddingInlineStart,
      ) || 0;
      viewport.scrollTo({
        left: Math.max(0, panels[active].offsetLeft - padding),
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
    }
  };
  const start = () => {
    stop();
    if (!autoPlay || mobileQuery.matches || motionQuery.matches || panels.length < 2) return;
    timer = window.setInterval(() => activate(active + 1), Math.max(2000, interval));
  };
  const syncFromScroll = () => {
    scrollFrame = null;
    if (!mobileQuery.matches) return;
    const padding = Number.parseFloat(
      window.getComputedStyle(viewport).paddingInlineStart,
    ) || 0;
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
    const tabId = `${instanceId}-tab-${index + 1}`;
    const panelId = `${instanceId}-panel-${index + 1}`;
    const copyId = `${instanceId}-copy-${index + 1}`;
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
  motionQuery.addEventListener('change', applyMode);
  activate(0);
  start();
}

function buildTabbed(block, items, container, bottomMetrics) {
  if (items.length === 1) {
    const item = items[0];
    const panel = document.createElement('article');
    panel.className = 'product-intro-slide-card';
    const { element: media } = createMedia(item, {
      autoplay: true,
      showControls: propBoolean(block, 'showVideoControl', true),
      showProgress: propBoolean(block, 'showProgress', true),
    });
    panel.append(media);
    moveItemInstrumentation(item, panel);
    container.append(panel);
    if (bottomMetrics?.childElementCount) container.append(bottomMetrics);
    const copy = createFeatureCopy(item, { showEyebrow: false });
    if (copy.childElementCount) {
      copy.classList.add('feature-media-single-copy');
      container.append(copy);
    }
    return;
  }
  const nav = document.createElement('div');
  nav.className = 'feature-media-tabs';
  nav.setAttribute('role', 'tablist');
  nav.setAttribute(
    'aria-label',
    directPropText(block, 'title') || 'Product introduction',
  );
  const panels = document.createElement('div');
  panels.className = 'feature-media-panels';
  const copiesContainer = document.createElement('div');
  copiesContainer.className = 'feature-media-tab-copies';
  const buttons = [];
  const copies = [];
  items.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'feature-media-tab';
    const eyebrow = propText(item, 'eyebrow');
    button.textContent = eyebrow || propText(item, 'title') || `Feature ${index + 1}`;
    if (eyebrow) instrumentProp(item, 'eyebrow', button);
    buttons.push(button);
    nav.append(button);
    const panel = document.createElement('article');
    panel.className = 'product-intro-slide-card';
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
  container.append(panels);
  if (bottomMetrics?.childElementCount) container.append(bottomMetrics);
  container.append(nav, copiesContainer);
  setupResponsiveTabs(block, buttons, [...panels.children], copies, panels);
}

export default function decorate(block) {
  initProductBlock(block);
  const variant = propText(block, 'variant') || 'default';
  block.classList.add(`variant-${variant}`);
  const accentColor = propText(block, 'accentColor');
  const tagColor = propText(block, 'highlightTagColor');
  const unitColor = propText(block, 'highlightUnitColor');
  if (accentColor) block.style.setProperty('--product-accent', accentColor);
  if (tagColor) block.style.setProperty('--product-intro-tag', tagColor);
  if (unitColor) block.style.setProperty('--product-intro-unit', unitColor);

  const mediaItems = itemsFor(block, ITEM_MODELS.slides);
  const highlightGroups = itemsFor(block, ITEM_MODELS.highlightGroups);
  const bottomMetricItems = itemsFor(block, ITEM_MODELS.bottomMetrics);
  const bottomMetrics = createBottomMetrics(bottomMetricItems);
  if (bottomMetrics.childElementCount) block.classList.add('has-bottom-metrics');

  const shell = document.createElement('div');
  shell.className = 'feature-media-shell';
  const header = createIntroHeader(block);
  const videoLink = createProductLink(block, 'video', 'product-intro-video-link');
  if (videoLink) header.append(videoLink);
  if (header.childElementCount) shell.append(header);

  const highlights = createHighlights(
    highlightGroups,
    propBoolean(block, 'showHighlightTags', true),
  );
  if (highlights.childElementCount) shell.append(highlights);

  const content = document.createElement('div');
  content.className = 'feature-media-content';
  if (variant === 'stat') {
    if (bottomMetrics.childElementCount) {
      bottomMetrics.classList.add('is-standalone');
      content.append(bottomMetrics);
    }
  } else if (variant === 'default' && mediaItems.length) {
    if (mediaItems.length > 1) block.classList.add('is-tabbed');
    buildTabbed(block, mediaItems, content, bottomMetrics);
  } else {
    const grid = document.createElement('div');
    grid.className = 'feature-media-grid';
    mediaItems.forEach((item) => grid.append(createFeatureItem(item, {
      autoplay: true,
      showControls: propBoolean(block, 'showVideoControl', true),
      showProgress: propBoolean(block, 'showProgress', true),
    })));
    if (grid.childElementCount) content.append(grid);
    if (bottomMetrics.childElementCount) content.append(bottomMetrics);
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
      button.textContent = !expanded
        ? propText(block, 'closeLabel') || 'View Less'
        : propText(block, 'openLabel') || 'View More';
    });
    shell.append(content, button);
  } else if (content.childElementCount) shell.append(content);
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  const revealSelector = block.classList.contains('is-tabbed')
    ? '.product-section-header, .product-intro-highlights, .feature-media-content'
    : [
      '.product-section-header',
      '.product-intro-highlight',
      '.product-intro-bottom-metric',
      '.product-intro-slide-card',
    ].join(', ');
  revealElements(block, revealSelector, propBoolean(block, 'enableMotion', true));
}
