import { moveInstrumentation } from '../../scripts/scripts.js';

const STORAGE_KEY = 'lixiang-cookie-consent';
const CONSENT_EVENT = 'lixiang:consent';
const EXIT_DURATION = 300;

const DEFAULTS = {
  title: 'Help Us Improve Our Website with Cookies',
  acceptLabel: 'Accept all',
  rejectLabel: 'Reject all',
};

function isEditor() {
  return Boolean(document.querySelector('.adobe-ue-edit'));
}

function hasStoredChoice() {
  return window.localStorage.getItem(STORAGE_KEY) !== null;
}

function fieldSource(block, name, fallbackRow) {
  const match = block.querySelector(`[data-aue-prop="${name}"]`);
  if (match) return match;
  return fallbackRow || null;
}

function fieldText(block, name, fallbackRow, fallback) {
  const source = fieldSource(block, name, fallbackRow);
  const text = source?.textContent.trim();
  return { source, text: text || fallback };
}

export default function decorate(block) {
  const rows = [...block.children];
  const editor = isEditor();

  if (!editor && hasStoredChoice()) {
    block.textContent = '';
    block.classList.add('lixiang-cookie-banner-hidden');
    return;
  }

  const title = fieldText(block, 'title', rows[0], DEFAULTS.title);
  const bodySource = fieldSource(block, 'body', rows[1]);
  const accept = fieldText(block, 'acceptLabel', rows[2], DEFAULTS.acceptLabel);
  const reject = fieldText(block, 'rejectLabel', rows[3], DEFAULTS.rejectLabel);

  const region = document.createElement('div');
  region.className = 'lixiang-cookie-banner-region';
  region.setAttribute('role', 'region');
  region.setAttribute('aria-label', 'Cookie consent');

  const content = document.createElement('div');
  content.className = 'lixiang-cookie-banner-content';

  const heading = document.createElement('p');
  heading.className = 'lixiang-cookie-banner-title';
  heading.textContent = title.text;
  if (title.source) moveInstrumentation(title.source, heading);
  content.append(heading);

  if (bodySource) {
    const body = document.createElement('div');
    body.className = 'lixiang-cookie-banner-body';
    while (bodySource.firstChild) body.append(bodySource.firstChild);
    moveInstrumentation(bodySource, body);
    content.append(body);
  }

  const actions = document.createElement('div');
  actions.className = 'lixiang-cookie-banner-actions';

  const makeButton = (label, choice, source) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `lixiang-cookie-banner-button lixiang-cookie-banner-${choice}`;
    button.textContent = label.text;
    if (source) moveInstrumentation(source, button);
    button.addEventListener('click', () => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice, at: new Date().toISOString() }),
      );
      document.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { choice } }));
      region.classList.add('is-exiting');
      window.setTimeout(() => block.remove(), EXIT_DURATION);
    });
    return button;
  };

  actions.append(
    makeButton(accept, 'accepted', accept.source),
    makeButton(reject, 'rejected', reject.source),
  );

  region.append(content, actions);
  block.textContent = '';
  block.append(region);
}
