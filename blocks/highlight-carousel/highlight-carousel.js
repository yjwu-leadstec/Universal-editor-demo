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
  prefersReducedMotion,
  propBoolean,
  propNumber,
  propSource,
  propText,
  revealElements,
} from '../../scripts/product-block-utils.js';

function createStat(item) {
  const stat = document.createElement('div');
  stat.className = 'highlight-stat';
  const label = propText(item, 'label');
  const value = propText(item, 'value');
  const unit = propText(item, 'unit');
  if (label) {
    const term = document.createElement('dt');
    term.textContent = label;
    instrumentProp(item, 'label', term);
    stat.append(term);
  }
  if (value || unit) {
    const detail = document.createElement('dd');
    detail.textContent = [value, unit].filter(Boolean).join(' ');
    instrumentProp(item, 'value', detail);
    stat.append(detail);
  }
  const descriptionSource = propSource(item, 'description');
  if (descriptionSource?.textContent.trim()) {
    const description = createRichText(descriptionSource, 'highlight-stat-description');
    instrumentProp(item, 'description', description);
    stat.append(description);
  }
  moveItemInstrumentation(item, stat);
  return stat;
}

function createSlide(block, item, index) {
  const slide = document.createElement('article');
  slide.className = 'highlight-slide';
  slide.setAttribute('aria-roledescription', 'slide');
  slide.setAttribute('aria-label', `Slide ${index + 1}`);
  const { element: media } = createMedia(item, {
    autoplay: false,
    showControls: true,
    showProgress: propBoolean(block, 'showProgress', true),
  });
  const copy = document.createElement('div');
  copy.className = 'highlight-slide-copy';
  const eyebrow = propText(item, 'eyebrow');
  const title = propText(item, 'title');
  if (eyebrow) {
    const element = document.createElement('p');
    element.className = 'highlight-eyebrow';
    element.textContent = eyebrow;
    instrumentProp(item, 'eyebrow', element);
    copy.append(element);
  }
  if (title) {
    const heading = document.createElement('h3');
    heading.textContent = title;
    instrumentProp(item, 'title', heading);
    copy.append(heading);
  }
  const descriptionSource = propSource(item, 'description');
  if (descriptionSource?.textContent.trim()) {
    const description = createRichText(descriptionSource, 'highlight-description');
    instrumentProp(item, 'description', description);
    copy.append(description);
  }
  const statItems = modelItems(item, 'highlight-stat');
  let scalarStats = [];
  try {
    const parsedMetrics = JSON.parse(propText(item, 'metrics') || '[]');
    if (Array.isArray(parsedMetrics)) scalarStats = parsedMetrics.slice(0, 4);
  } catch {
    scalarStats = [];
  }
  if (statItems.length || scalarStats.length) {
    const metrics = document.createElement('dl');
    metrics.className = 'highlight-metrics';
    statItems.forEach((stat) => metrics.append(createStat(stat)));
    if (!statItems.length) {
      scalarStats.forEach(({
        value, unit, label,
      }) => {
        const metric = document.createElement('div');
        metric.className = 'highlight-stat';
        const term = document.createElement('dt');
        term.textContent = label;
        instrumentProp(item, 'metrics', term);
        const detail = document.createElement('dd');
        detail.textContent = [value, unit].filter(Boolean).join(' ');
        instrumentProp(item, 'metrics', detail);
        metric.append(term, detail);
        metrics.append(metric);
      });
    }
    copy.append(metrics);
  }
  const note = propText(item, 'note');
  if (note) {
    const element = document.createElement('p');
    element.className = 'highlight-note';
    element.textContent = note;
    instrumentProp(item, 'note', element);
    copy.append(element);
  }
  const link = createProductLink(item);
  if (link) copy.append(link);
  slide.append(media, copy);
  moveItemInstrumentation(item, slide);
  return slide;
}

export default function decorate(block) {
  initProductBlock(block);
  const accentColor = propText(block, 'accentColor');
  if (accentColor) block.style.setProperty('--product-accent', accentColor);
  const items = modelItems(block, 'highlight-slide');
  const shell = document.createElement('div');
  shell.className = 'highlight-shell';
  const header = createSectionHeader(block);
  const viewport = document.createElement('div');
  viewport.className = 'highlight-viewport';
  viewport.setAttribute('aria-roledescription', 'carousel');
  const track = document.createElement('div');
  track.className = 'highlight-track';
  const slides = items.map((item, index) => createSlide(block, item, index));
  track.append(...slides);
  viewport.append(track);
  shell.append(header, viewport);

  let active = 0;
  let timer = null;
  const interval = Math.max(2000, propNumber(block, 'interval', 4) * 1000);
  const update = (next, scrollMobile = false) => {
    active = (next + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      slide.classList.toggle('is-active', index === active);
      slide.classList.toggle('is-previous', index === (active - 1 + slides.length) % slides.length);
      slide.classList.toggle('is-next', index === (active + 1) % slides.length);
      slide.setAttribute('aria-hidden', String(index !== active));
    });
    shell.style.setProperty('--active-slide', active);
    if (scrollMobile && window.matchMedia('(width <= 719px)').matches) {
      slides[active].scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
    }
  };
  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };
  const start = () => {
    stop();
    if (!propBoolean(block, 'autoPlay', true) || slides.length < 2 || prefersReducedMotion() || window.matchMedia('(width <= 719px)').matches) return;
    timer = window.setInterval(() => update(active + 1), interval);
  };
  if (slides.length > 1) {
    const controls = document.createElement('div');
    controls.className = 'highlight-controls';
    const previous = document.createElement('button');
    previous.type = 'button';
    previous.setAttribute('aria-label', 'Previous highlight');
    previous.textContent = '←';
    const status = document.createElement('div');
    status.className = 'highlight-status';
    status.setAttribute('aria-live', 'polite');
    const next = document.createElement('button');
    next.type = 'button';
    next.setAttribute('aria-label', 'Next highlight');
    next.textContent = '→';
    const refresh = () => { status.textContent = `${active + 1} / ${slides.length}`; };
    previous.addEventListener('click', () => { update(active - 1, true); refresh(); start(); });
    next.addEventListener('click', () => { update(active + 1, true); refresh(); start(); });
    controls.append(previous, status, next);
    shell.append(controls);
    refresh();
    viewport.addEventListener('scrollend', () => {
      if (!window.matchMedia('(width <= 719px)').matches) return;
      const closest = slides.map((slide, index) => ({
        index,
        distance: Math.abs(slide.offsetLeft - viewport.scrollLeft),
      })).sort((a, b) => a.distance - b.distance)[0];
      update(closest.index);
      refresh();
    });
  }
  shell.addEventListener('mouseenter', stop);
  shell.addEventListener('mouseleave', start);
  shell.addEventListener('focusin', stop);
  shell.addEventListener('focusout', start);
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  update(0);
  start();
  revealElements(block, '.product-section-header, .highlight-slide');
}
