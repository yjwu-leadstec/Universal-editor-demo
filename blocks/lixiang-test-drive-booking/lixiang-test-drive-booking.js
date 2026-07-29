import { moveInstrumentation } from '../../scripts/scripts.js';
import {
  buildLeadRequest,
  createTestDriveApiClient,
  isChallengeRequiredError,
  TEST_DRIVE_API,
} from './test-drive-api.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+()\s-]{6,24}$/;
const MODEL_FIELDS = [
  'modelKey',
  'modelName',
  'subtitle',
  'price',
  'pcImage',
  'pcImageAlt',
  'padImage',
  'padImageAlt',
];
const STORE_FIELDS = ['storeKey', 'city', 'storeName', 'availableModelKeys'];
const MODEL_FIELD_INDEXES = {
  modelKey: 0,
  modelName: 1,
  subtitle: 2,
  price: 3,
  pcImage: 4,
  pcImageAlt: -1,
  padImage: 5,
  padImageAlt: -1,
};
const COPY_FIELDS = [
  'id',
  'title',
  'intro',
  'privacyText',
  'privacyLink',
  'privacyLinkText',
  'submitLabel',
  'successTitle',
  'successDescription',
];
const COPY_FIELD_INDEXES = {
  id: 0,
  title: 1,
  intro: 2,
  privacyText: 3,
  privacyLink: 4,
  privacyLinkText: -1,
  submitLabel: 5,
  successTitle: 6,
  successDescription: 7,
};

const bookingControllers = new WeakMap();

function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function moveSource(source, target) {
  if (source) moveInstrumentation(source, target);
}

function instrumentedPropSource(row, name) {
  if (!row) return null;
  if (row.dataset.aueProp === name) return row;
  return row.querySelector(`[data-aue-prop="${name}"]`);
}

function propSource(row, name, index) {
  return instrumentedPropSource(row, name)
    || (index >= 0 ? row?.children[index] : null)
    || null;
}

function propText(row, name, index) {
  return propSource(row, name, index)?.textContent.trim() || '';
}

function propImage(row, name, index) {
  const source = propSource(row, name, index);
  const image = source?.matches('img') ? source : source?.querySelector('img');
  const picture = source?.matches('picture') ? source : source?.querySelector('picture');
  const responsiveSource = picture?.querySelector(
    'source[type="image/jpeg"][media], source[type="image/png"][media], source[media]',
  );
  const largestSource = responsiveSource?.srcset
    ?.split(',')
    .at(-1)
    .trim()
    .split(/\s+/)[0];
  return {
    source,
    src: largestSource ? new URL(largestSource, document.baseURI).href : image?.src || '',
    alt: image?.alt || '',
  };
}

function rowModel(row) {
  const model = row.dataset.aueModel || '';
  if (model === 'test-drive-model' || model === 'test-drive-store') return model;
  if (row.children.length === 6 || row.children.length === MODEL_FIELDS.length) {
    return 'test-drive-model';
  }
  if (row.children.length === STORE_FIELDS.length) return 'test-drive-store';
  return '';
}

function readItem(row, fields) {
  const values = Object.fromEntries(fields.map(
    (name, index) => [name, propText(row, name, index)],
  ));
  const sources = Object.fromEntries(fields.map(
    (name, index) => [name, propSource(row, name, index)],
  ));
  return { row, sources, values };
}

function readModel(row) {
  const sources = Object.fromEntries(MODEL_FIELDS.map((name) => [
    name,
    propSource(row, name, MODEL_FIELD_INDEXES[name]),
  ]));
  const values = Object.fromEntries(MODEL_FIELDS.map((name) => [
    name,
    sources[name]?.textContent.trim() || '',
  ]));
  const item = { row, sources, values };
  const pc = propImage(row, 'pcImage', 4);
  const pad = propImage(row, 'padImage', 5);
  return {
    ...item,
    key: item.values.modelKey,
    name: item.values.modelName,
    subtitle: item.values.subtitle,
    price: item.values.price,
    pcImage: pc.src,
    padImage: pad.src || pc.src,
    imageAlt: item.values.pcImageAlt || pc.alt || item.values.modelName,
    padImageAlt: item.values.padImageAlt
      || pad.alt
      || item.values.pcImageAlt
      || pc.alt,
  };
}

function readStore(row) {
  const item = readItem(row, STORE_FIELDS);
  return {
    ...item,
    key: item.values.storeKey,
    city: item.values.city,
    name: item.values.storeName,
    models: item.values.availableModelKeys
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  };
}

function readContent(block) {
  const rows = [...block.children];
  const firstItem = rows.findIndex((row) => rowModel(row));
  const copyRows = firstItem < 0 ? rows : rows.slice(0, firstItem);
  const itemRows = rows.filter((row) => rowModel(row));
  const sources = Object.fromEntries(COPY_FIELDS.map((name) => {
    const index = COPY_FIELD_INDEXES[name];
    const indexedRow = index >= 0 ? copyRows[index] : null;
    return [
      name,
      propSource(indexedRow, name, 0)
        || copyRows.map((row) => instrumentedPropSource(row, name)).find(Boolean)
        || null,
    ];
  }));
  const copy = Object.fromEntries(COPY_FIELDS.map(
    (name) => [name, sources[name]?.textContent.trim() || ''],
  ));

  const privacyAnchor = sources.privacyLink?.matches('a')
    ? sources.privacyLink
    : sources.privacyLink?.querySelector('a');

  return {
    rows,
    sources,
    copy: {
      id: copy.id,
      title: copy.title || 'Schedule a Drive',
      intro: copy.intro,
      privacyText: copy.privacyText || 'By submitting this form, you agree to the Privacy Notice.',
      privacyLink: privacyAnchor?.getAttribute('href') || '#privacy-policy',
      privacyLinkText: copy.privacyLinkText || privacyAnchor?.textContent.trim() || 'Privacy Notice',
      submitLabel: copy.submitLabel || 'Submit',
      successTitle: copy.successTitle || 'Thank you for booking a test drive',
      successDescription: copy.successDescription,
    },
    models: itemRows
      .filter((row) => rowModel(row) === 'test-drive-model')
      .map(readModel)
      .filter((model) => model.key && model.name && model.pcImage),
    stores: itemRows
      .filter((row) => rowModel(row) === 'test-drive-store')
      .map(readStore)
      .filter((store) => store.key && store.name),
  };
}

function createField(label, name, type, placeholder) {
  const field = element('div', 'test-drive-field');
  field.dataset.fieldName = name;
  const inputId = `test-drive-${name}-${Math.random().toString(36).slice(2, 8)}`;
  const labelElement = element('label', '', label);
  labelElement.htmlFor = inputId;
  const input = element('input');
  input.id = inputId;
  input.name = name;
  input.type = type;
  input.placeholder = placeholder;
  input.autocomplete = type === 'email' ? 'email' : 'name';
  if (type === 'email') input.inputMode = 'email';
  const error = element('small', 'test-drive-field-error');
  error.id = `${inputId}-error`;
  error.hidden = true;
  input.setAttribute('aria-describedby', error.id);
  field.append(labelElement, input, error);
  return field;
}

function createSelectField(label, name, placeholder, chooserId) {
  const field = element('div', 'test-drive-field');
  field.dataset.fieldName = name;
  const labelId = `test-drive-${name}-label-${Math.random().toString(36).slice(2, 8)}`;
  const labelElement = element('span', 'test-drive-field-label', label);
  labelElement.id = labelId;
  const button = element('button', 'test-drive-select');
  button.type = 'button';
  button.dataset.select = name;
  button.setAttribute('aria-labelledby', labelId);
  button.setAttribute('aria-controls', chooserId);
  button.setAttribute('aria-expanded', 'false');
  button.append(
    element('span', 'test-drive-select-value', placeholder),
    element('span', 'test-drive-select-chevron'),
  );
  const input = element('input');
  input.type = 'hidden';
  input.name = name;
  const error = element('small', 'test-drive-field-error');
  error.hidden = true;
  field.append(labelElement, button, input, error);
  return field;
}

function createPhoneField() {
  const field = element('div', 'test-drive-field');
  field.dataset.fieldName = 'phone';
  const inputId = `test-drive-phone-${Math.random().toString(36).slice(2, 8)}`;
  const label = element('label', '', 'Phone Number (optional)');
  label.htmlFor = inputId;
  const phone = element('div', 'test-drive-phone');
  phone.append(element('span', 'test-drive-phone-code', 'KZ +7'));
  const input = element('input');
  input.id = inputId;
  input.name = 'phone';
  input.type = 'tel';
  input.autocomplete = 'tel-national';
  input.inputMode = 'tel';
  input.placeholder = 'Phone number';
  const countryCode = element('input');
  countryCode.type = 'hidden';
  countryCode.name = 'countryCode';
  countryCode.value = '+7';
  const error = element('small', 'test-drive-field-error');
  error.hidden = true;
  phone.append(input, countryCode);
  field.append(label, phone, error);
  return field;
}

function appendPrivacyCopy(container, content) {
  const { privacyText, privacyLinkText, privacyLink } = content.copy;
  const index = privacyText.indexOf(privacyLinkText);
  const before = index < 0 ? `${privacyText} ` : privacyText.slice(0, index);
  const after = index < 0 ? '' : privacyText.slice(index + privacyLinkText.length);
  const copy = element('span', 'test-drive-consent-copy', before);
  const link = element('a');
  link.href = privacyLink;
  const linkText = element('span', '', privacyLinkText);
  link.append(linkText);
  container.append(copy, link, document.createTextNode(after));
  moveSource(content.sources.privacyText, copy);
  moveSource(content.sources.privacyLink, link);
  moveSource(content.sources.privacyLinkText, linkText);
}

function createForm(content, chooserId) {
  const form = element('form', 'test-drive-booking-form');
  form.noValidate = true;
  const title = element('h1', '', content.copy.title);
  const name = createField('Name', 'name', 'text', 'Please enter your name');
  const model = createSelectField('Select a Model', 'model', 'Please select a model', chooserId);
  const store = createSelectField('Select a Store', 'store', 'Please select a store', chooserId);
  const email = createField('Email Address', 'email', 'email', 'Please enter your email address');
  const phone = createPhoneField();
  const intro = element('p', 'test-drive-booking-intro', content.copy.intro);
  const consent = element('div', 'test-drive-consent');
  consent.dataset.fieldName = 'consent';
  const consentLabel = element('label');
  const consentInput = element('input');
  consentInput.name = 'consent';
  consentInput.type = 'checkbox';
  const consentBox = element('span', 'test-drive-consent-box');
  const consentText = element('span', 'test-drive-consent-text');
  appendPrivacyCopy(consentText, content);
  const consentError = element('small', 'test-drive-field-error');
  consentError.hidden = true;
  consentLabel.append(consentInput, consentBox, consentText);
  consent.append(consentLabel, consentError);
  const submit = element('button', 'test-drive-submit');
  submit.type = 'submit';
  const submitText = element('span', '', content.copy.submitLabel);
  submit.append(submitText);

  form.append(title, name, model, store, email, phone, intro, consent, submit);
  moveSource(content.sources.title, title);
  moveSource(content.sources.intro, intro);
  moveSource(content.sources.submitLabel, submitText);
  return form;
}

function createSuccess(content) {
  const success = element('section', 'test-drive-booking-success');
  success.hidden = true;
  success.tabIndex = -1;
  success.setAttribute('aria-live', 'polite');
  const icon = element('span', 'test-drive-success-icon');
  icon.setAttribute('aria-hidden', 'true');
  const title = element('h1', '', content.copy.successTitle);
  const description = element('p', '', content.copy.successDescription);
  success.append(icon, title, description);
  moveSource(content.sources.successTitle, title);
  moveSource(content.sources.successDescription, description);
  return success;
}

function createHero(content) {
  const hero = element('aside', 'test-drive-booking-hero');
  hero.setAttribute('aria-live', 'polite');
  const picture = element('picture', 'test-drive-booking-hero-media');
  const pad = element('source');
  pad.media = '(width <= 1440px)';
  pad.dataset.heroPad = '';
  const image = element('img');
  image.dataset.heroImage = '';
  image.loading = 'eager';
  image.decoding = 'async';
  picture.append(pad, image);
  const copy = element('div', 'test-drive-booking-hero-copy');
  copy.append(
    element('h2', '', ''),
    element('p', 'test-drive-booking-hero-subtitle', ''),
    element('p', 'test-drive-booking-hero-price', ''),
  );
  const dots = element('div', 'test-drive-booking-model-dots');
  dots.setAttribute('aria-label', 'Vehicle preview');
  content.models.forEach((model, index) => {
    const button = element('button');
    button.type = 'button';
    button.dataset.modelDot = model.key;
    button.setAttribute('aria-label', `Preview ${model.name}`);
    if (index === 0) button.setAttribute('aria-current', 'true');
    dots.append(button);
  });
  hero.append(picture, copy, dots);
  return hero;
}

function createChooser(id) {
  const chooser = element('div', 'test-drive-chooser');
  chooser.id = id;
  chooser.hidden = true;
  chooser.dataset.chooser = '';
  const backdrop = element('button', 'test-drive-chooser-backdrop');
  backdrop.type = 'button';
  backdrop.tabIndex = -1;
  backdrop.dataset.chooserClose = '';
  backdrop.setAttribute('aria-label', 'Close selection');
  const sheet = element('section', 'test-drive-chooser-sheet');
  sheet.setAttribute('role', 'dialog');
  const header = element('header', 'test-drive-chooser-header');
  const title = element('h2');
  title.dataset.chooserTitle = '';
  const close = element('button', 'test-drive-chooser-close');
  close.type = 'button';
  close.dataset.chooserClose = '';
  close.setAttribute('aria-label', 'Close selection');
  close.append(element('span'), element('span'));
  const options = element('div', 'test-drive-chooser-options');
  options.dataset.chooserOptions = '';
  options.setAttribute('role', 'listbox');
  header.append(title, close);
  sheet.append(header, options);
  chooser.append(backdrop, sheet);
  return chooser;
}

function createAuthorItems(content) {
  const rail = element('aside', 'test-drive-author-items');
  const appendItem = (item, fields, kind) => {
    const card = element('article', `test-drive-author-item test-drive-author-item-${kind}`);
    const title = element('strong', '', item.name);
    card.append(title);
    fields.forEach((name) => {
      const value = item.values[name];
      const property = element('span', '', value);
      property.dataset.testDriveAuthorProp = name;
      moveSource(item.sources[name], property);
      card.append(property);
    });
    moveSource(item.row, card);
    rail.append(card);
  };
  content.models.forEach((model) => appendItem(model, MODEL_FIELDS, 'model'));
  content.stores.forEach((store) => appendItem(store, STORE_FIELDS, 'store'));
  return rail;
}

async function submitToOntest(block, payload) {
  const client = createTestDriveApiClient({
    baseUrl: block.dataset.apiBaseUrl || TEST_DRIVE_API.baseUrl,
  });
  const leadRequest = buildLeadRequest(payload, {
    sourceUrl: window.location.href,
    leadSource: block.dataset.leadSource,
    leadsLanguage: block.dataset.leadsLanguage,
    countryCode: block.dataset.countryCode,
    phoneCountryCode: block.dataset.phoneCountryCode,
    agreementId: block.dataset.agreementId,
    agreementVersion: block.dataset.agreementVersion,
  });

  try {
    await client.addLead(leadRequest);
  } catch (error) {
    if (!isChallengeRequiredError(error)) throw error;
    block.dispatchEvent(new CustomEvent('testdrive:challenge-required', {
      bubbles: true,
      detail: { code: error.code },
    }));
    if (typeof block.testDriveChallengeProvider !== 'function') throw error;
    const challengeToken = await block.testDriveChallengeProvider({ code: error.code });
    await client.addLeadWithCaptcha(leadRequest, challengeToken);
  }
}

function setupBooking(block, content, elements, controller) {
  const {
    form, success, hero, chooser, toast,
  } = elements;
  const chooserSheet = chooser.querySelector('.test-drive-chooser-sheet');
  const chooserTitle = chooser.querySelector('[data-chooser-title]');
  const chooserOptions = chooser.querySelector('[data-chooser-options]');
  const heroImage = hero.querySelector('[data-hero-image]');
  const heroPad = hero.querySelector('[data-hero-pad]');
  const heroName = hero.querySelector('h2');
  const heroSubtitle = hero.querySelector('.test-drive-booking-hero-subtitle');
  const heroPrice = hero.querySelector('.test-drive-booking-hero-price');
  let selectedModelKey = '';
  let selectedStoreKey = '';
  let openType = '';
  let lastTriggerName = '';
  let toastTimer = 0;

  const modelByKey = (key) => content.models.find((model) => model.key === key);
  const storeByKey = (key) => content.stores.find((store) => store.key === key);
  const selectedModel = () => modelByKey(selectedModelKey);
  const selectedStore = () => storeByKey(selectedStoreKey);
  const availableStores = () => content.stores.filter(
    (store) => !selectedModelKey
      || !store.models.length
      || store.models.includes(selectedModelKey),
  );

  function updateHero(model) {
    const target = model || content.models[0];
    if (!target) return;
    hero.classList.remove('has-media-error');
    heroImage.hidden = false;
    heroImage.src = target.pcImage;
    heroImage.alt = target.imageAlt;
    heroPad.srcset = target.padImage || target.pcImage;
    heroName.textContent = target.name;
    heroSubtitle.textContent = target.subtitle;
    heroPrice.textContent = target.price;
    heroSubtitle.hidden = !target.subtitle;
    heroPrice.hidden = !target.price;
    hero.querySelectorAll('[data-model-dot]').forEach((dot) => {
      if (dot.dataset.modelDot === target.key) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  function clearError(name) {
    const field = form.querySelector(`[data-field-name="${name}"]`);
    if (!field) return;
    field.classList.remove('has-error');
    field.querySelector('input, button')?.removeAttribute('aria-invalid');
    const error = field.querySelector('.test-drive-field-error');
    if (error) {
      error.hidden = true;
      error.textContent = '';
    }
  }

  function setError(name, message) {
    const field = form.querySelector(`[data-field-name="${name}"]`);
    if (!field) return;
    field.classList.add('has-error');
    field.querySelector('input, button')?.setAttribute('aria-invalid', 'true');
    const error = field.querySelector('.test-drive-field-error');
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
  }

  function setStore(key) {
    selectedStoreKey = storeByKey(key)?.key || '';
    form.elements.store.value = selectedStoreKey;
    const trigger = form.querySelector('[data-select="store"]');
    trigger.querySelector('.test-drive-select-value').textContent = selectedStore()?.name || 'Please select a store';
    trigger.classList.toggle('has-value', Boolean(selectedStoreKey));
    clearError('store');
  }

  function setModel(key, updatePreview = true) {
    selectedModelKey = modelByKey(key)?.key || '';
    form.elements.model.value = selectedModelKey;
    const trigger = form.querySelector('[data-select="model"]');
    trigger.querySelector('.test-drive-select-value').textContent = selectedModel()?.name || 'Please select a model';
    trigger.classList.toggle('has-value', Boolean(selectedModelKey));
    const previousStore = selectedStore();
    if (previousStore && !availableStores().some((store) => store.key === previousStore.key)) setStore('');
    if (updatePreview) updateHero(selectedModel());
    clearError('model');
  }

  function modelOptionButton(model) {
    const option = element('button', 'test-drive-option test-drive-option-model');
    option.type = 'button';
    option.dataset.optionKey = model.key;
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', String(selectedModelKey === model.key));
    const image = element('img');
    image.src = model.pcImage;
    image.alt = '';
    image.loading = 'lazy';
    option.append(image);
    const copy = element('span', 'test-drive-option-copy');
    copy.append(element('strong', '', model.name));
    if (model.subtitle) copy.append(element('small', '', model.subtitle));
    option.append(copy, element('span', 'test-drive-option-check'));
    return option;
  }

  function storeOptionButton(store) {
    const option = element('button', 'test-drive-option test-drive-option-store');
    option.type = 'button';
    option.dataset.optionKey = store.key;
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', String(selectedStoreKey === store.key));
    option.append(element('span', 'test-drive-option-city', store.city));
    const copy = element('span', 'test-drive-option-copy');
    copy.append(element('strong', '', store.name));
    option.append(copy, element('span', 'test-drive-option-check'));
    return option;
  }

  function closeChooser({ restoreFocus = true } = {}) {
    if (!openType) return;
    chooser.classList.remove('is-open');
    chooser.hidden = true;
    document.body.classList.remove('test-drive-chooser-open');
    block.querySelectorAll('[data-select]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
    openType = '';
    if (restoreFocus && lastTriggerName) {
      form.querySelector(`[data-select="${lastTriggerName}"]`)?.focus();
    }
  }

  function openChooser(type, trigger) {
    openType = type;
    lastTriggerName = type;
    chooserTitle.textContent = type === 'model' ? 'Select a Model' : 'Select a Store';
    chooserOptions.replaceChildren(
      ...(type === 'model'
        ? content.models.map(modelOptionButton)
        : availableStores().map(storeOptionButton)),
    );
    chooser.dataset.type = type;
    chooser.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    chooserSheet.setAttribute('aria-modal', String(window.matchMedia('(width <= 719px)').matches));
    document.body.classList.add('test-drive-chooser-open');

    if (window.matchMedia('(width >= 720px)').matches) {
      const rect = trigger.getBoundingClientRect();
      chooserSheet.style.setProperty('--chooser-left', `${rect.left}px`);
      chooserSheet.style.setProperty('--chooser-top', `${Math.min(rect.bottom + 4, window.innerHeight - 360)}px`);
      chooserSheet.style.setProperty('--chooser-width', `${rect.width}px`);
    } else {
      chooserSheet.style.removeProperty('--chooser-left');
      chooserSheet.style.removeProperty('--chooser-top');
      chooserSheet.style.removeProperty('--chooser-width');
    }

    requestAnimationFrame(() => {
      chooser.classList.add('is-open');
      const selected = chooserOptions.querySelector('[aria-selected="true"]');
      (selected || chooserOptions.querySelector('button'))?.focus();
    });
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 3200);
  }

  function validate() {
    ['name', 'model', 'store', 'email', 'phone', 'consent'].forEach(clearError);
    const values = new FormData(form);
    const errors = new Map();
    if (!String(values.get('name') || '').trim()) errors.set('name', 'Please enter your name');
    if (!selectedModelKey) errors.set('model', 'Please select a model');
    if (!selectedStoreKey) errors.set('store', 'Please select a store');
    if (!EMAIL_PATTERN.test(String(values.get('email') || '').trim())) {
      errors.set('email', 'Please enter a valid email address');
    }
    const phone = String(values.get('phone') || '').trim();
    if (phone && !PHONE_PATTERN.test(phone)) errors.set('phone', 'Please enter a valid phone number');
    if (!values.get('consent')) errors.set('consent', 'Please accept the Privacy Notice');
    errors.forEach((message, name) => setError(name, message));
    if (errors.size) {
      showToast('Please review the highlighted fields');
      const [firstError] = errors.keys();
      form.querySelector(`[data-field-name="${firstError}"] input, [data-field-name="${firstError}"] button`)?.focus();
    }
    return errors.size === 0;
  }

  function showSuccess() {
    closeChooser({ restoreFocus: false });
    form.hidden = true;
    success.hidden = false;
    block.classList.add('is-success');
    document.body.classList.add('test-drive-success');
    success.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  block.addEventListener('click', (event) => {
    const select = event.target.closest('[data-select]');
    if (select) {
      openChooser(select.dataset.select, select);
      return;
    }
    if (event.target.closest('[data-chooser-close]')) {
      closeChooser();
      return;
    }
    const option = event.target.closest('[data-option-key]');
    if (option) {
      if (openType === 'model') setModel(option.dataset.optionKey);
      else setStore(option.dataset.optionKey);
      closeChooser();
      return;
    }
    const dot = event.target.closest('[data-model-dot]');
    if (dot) updateHero(modelByKey(dot.dataset.modelDot));
  }, { signal: controller.signal });

  block.addEventListener('keydown', (event) => {
    if (!openType) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeChooser();
      return;
    }
    const option = event.target.closest('[role="option"]');
    const navigationKeys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (option && navigationKeys.includes(event.key)) {
      event.preventDefault();
      const options = [...chooserOptions.querySelectorAll('[role="option"]')];
      const index = options.indexOf(option);
      let nextIndex = index;
      if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = options.length - 1;
      else nextIndex = (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      options[nextIndex]?.focus();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...chooser.querySelectorAll('button:not([disabled])')]
      .filter((button) => button.offsetParent !== null && button.tabIndex >= 0);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, { signal: controller.signal });

  heroImage.addEventListener('load', () => {
    hero.classList.remove('has-media-error');
    heroImage.hidden = false;
  }, { signal: controller.signal });
  heroImage.addEventListener('error', () => {
    hero.classList.add('has-media-error');
    heroImage.hidden = true;
  }, { signal: controller.signal });
  chooserOptions.addEventListener('error', (event) => {
    if (event.target instanceof HTMLImageElement) event.target.remove();
  }, { capture: true, signal: controller.signal });
  form.addEventListener('input', (event) => {
    const field = event.target.closest('[data-field-name]');
    if (field) clearError(field.dataset.fieldName);
  }, { signal: controller.signal });
  document.addEventListener('pointerdown', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (openType && !target?.closest('.test-drive-chooser-sheet') && !target?.closest('[data-select]')) {
      closeChooser({ restoreFocus: false });
    }
  }, { signal: controller.signal });
  window.addEventListener('resize', () => closeChooser({ restoreFocus: false }), {
    passive: true,
    signal: controller.signal,
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validate()) return;
    const submit = form.querySelector('.test-drive-submit');
    submit.disabled = true;
    submit.classList.add('is-loading');
    const payload = Object.fromEntries(new FormData(form).entries());
    const submitEvent = new CustomEvent('testdrive:submit', {
      bubbles: true,
      cancelable: true,
      detail: payload,
    });
    if (!block.dispatchEvent(submitEvent)) {
      submit.disabled = false;
      submit.classList.remove('is-loading');
      return;
    }

    try {
      if (block.dataset.apiMode === TEST_DRIVE_API.mode) {
        await submitToOntest(block, payload);
        showSuccess();
        return;
      }
      const endpoint = block.dataset.submitEndpoint;
      if (!endpoint) throw new Error('No test-drive submission endpoint configured');
      const url = new URL(endpoint, window.location.href);
      if (url.origin !== window.location.origin) throw new Error('Cross-origin submission endpoint rejected');
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Submission failed (${response.status})`);
      showSuccess();
    } catch (error) {
      showToast(isChallengeRequiredError(error)
        ? 'Please complete verification and try again.'
        : 'We could not submit your request. Please try again.');
      submit.disabled = false;
      submit.classList.remove('is-loading');
    }
  }, { signal: controller.signal });

  const params = new URLSearchParams(window.location.search);
  const initialModel = modelByKey(params.get('model'));
  const initialStore = storeByKey(params.get('store'));
  if (initialModel) setModel(initialModel.key);
  else updateHero(content.models[0]);
  if (initialStore && availableStores().some((store) => store.key === initialStore.key)) {
    setStore(initialStore.key);
  }
}

export default function decorate(block) {
  bookingControllers.get(block)?.abort();
  const controller = new AbortController();
  bookingControllers.set(block, controller);
  const content = readContent(block);
  document.body.classList.add('has-lixiang-test-drive-booking');

  if (!content.models.length) {
    const warning = element('p', 'test-drive-booking-empty', 'Add at least one Test Drive Model item.');
    block.replaceChildren(warning);
    return;
  }

  const chooserId = `test-drive-chooser-${Math.random().toString(36).slice(2, 8)}`;
  const panel = element('section', 'test-drive-booking-panel');
  const panelInner = element('div', 'test-drive-booking-panel-inner');
  const form = createForm(content, chooserId);
  const success = createSuccess(content);
  panelInner.append(form, success);
  panel.append(panelInner);
  const hero = createHero(content);
  const chooser = createChooser(chooserId);
  const toast = element('div', 'test-drive-toast');
  toast.hidden = true;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  const authorItems = createAuthorItems(content);

  block.replaceChildren(panel, hero, chooser, toast, authorItems);
  if (content.copy.id) block.id = content.copy.id;
  if (content.sources.id) {
    const anchor = element('span', 'test-drive-aue-anchor');
    anchor.setAttribute('aria-hidden', 'true');
    moveSource(content.sources.id, anchor);
    block.append(anchor);
  }

  setupBooking(block, content, {
    form, success, hero, chooser, toast,
  }, controller);
  block.addEventListener('aem:block-unload', () => {
    controller.abort();
    document.body.classList.remove(
      'has-lixiang-test-drive-booking',
      'test-drive-success',
      'test-drive-chooser-open',
    );
  }, { once: true });
}
