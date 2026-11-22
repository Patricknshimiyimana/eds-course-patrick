import { readBlockConfig, toClassName } from '../../scripts/aem.js';

/**
 * Turns the Fields value into a same-origin path.
 * An author may type a path or paste a full preview/live URL.
 * @param {string} value the Fields value from the block
 * @returns {string|null} the path, or null if it is not a .json on this site
 */
function toFieldsPath(value) {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    if (!url.pathname.endsWith('.json')) return null;
    return url.pathname;
  } catch (e) {
    return null;
  }
}

/**
 * Checks the Action value: only absolute https:// addresses are accepted.
 * @param {string} value the Action value from the block
 * @returns {string|null} the URL, or null if it is missing or invalid
 */
function toActionUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch (e) {
    return null;
  }
}

function isTrue(value) {
  return ['true', 'yes', 'x', '1'].includes(String(value || '').trim().toLowerCase());
}

/**
 * Builds one field: wrapper, label, control and error paragraph.
 * @param {object} def a row of the fields sheet
 * @param {string} prefix id prefix unique to this block
 * @returns {HTMLElement|null} the field wrapper
 */
function buildField(def, prefix) {
  const name = toClassName(def.Name || '');
  if (!name) return null;
  const type = (def.Type || 'text').trim().toLowerCase();
  const id = `${prefix}-${name}`;
  const errorId = `${id}-error`;

  const wrapper = document.createElement('div');
  wrapper.className = `contact-form-field contact-form-${type}`;

  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = def.Label || def.Name;

  let control;
  if (type === 'textarea') {
    control = document.createElement('textarea');
    control.rows = 5;
  } else if (type === 'select') {
    control = document.createElement('select');
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = '—';
    control.append(empty);
    (def.Options || '').split(',').map((o) => o.trim()).filter(Boolean).forEach((text) => {
      const option = document.createElement('option');
      option.value = text;
      option.textContent = text;
      control.append(option);
    });
  } else {
    control = document.createElement('input');
    control.type = ['text', 'email', 'tel', 'url', 'number', 'date', 'checkbox'].includes(type) ? type : 'text';
    if (type === 'email') control.autocomplete = 'email';
    if (name === 'name') control.autocomplete = 'name';
  }
  control.id = id;
  control.name = name;
  control.required = isTrue(def.Required);
  control.setAttribute('aria-describedby', errorId);

  const error = document.createElement('p');
  error.className = 'contact-form-error';
  error.id = errorId;

  if (type === 'checkbox') {
    wrapper.append(control, label, error);
  } else {
    wrapper.append(label, control, error);
  }
  return wrapper;
}

function buildHoneypot(prefix) {
  const wrapper = document.createElement('div');
  wrapper.className = 'contact-form-hp';
  wrapper.setAttribute('aria-hidden', 'true');
  const label = document.createElement('label');
  label.htmlFor = `${prefix}-website`;
  label.textContent = 'Leave this field empty';
  const input = document.createElement('input');
  input.type = 'text';
  input.id = `${prefix}-website`;
  input.name = 'website';
  input.tabIndex = -1;
  input.autocomplete = 'off';
  wrapper.append(label, input);
  return wrapper;
}

function showError(control, message) {
  const error = document.getElementById(control.getAttribute('aria-describedby'));
  if (message) {
    control.setAttribute('aria-invalid', 'true');
  } else {
    control.removeAttribute('aria-invalid');
  }
  if (error) error.textContent = message;
}

function readValues(form) {
  const values = {};
  form.querySelectorAll('.contact-form-field input, .contact-form-field select, .contact-form-field textarea')
    .forEach((control) => {
      values[control.name] = control.type === 'checkbox' ? control.checked : control.value.trim();
    });
  return values;
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.textContent = '';

  const fieldsPath = toFieldsPath(config.fields);
  if (!fieldsPath) return;

  let rows = [];
  try {
    const resp = await fetch(fieldsPath);
    if (!resp.ok) return;
    const json = await resp.json();
    rows = json.data || [];
  } catch (e) {
    return;
  }

  const prefix = `contact-form-${document.querySelectorAll('.contact-form form').length + 1}`;
  const form = document.createElement('form');
  form.noValidate = true;

  rows.forEach((def) => {
    const field = buildField(def, prefix);
    if (field) form.append(field);
  });
  form.append(buildHoneypot(prefix));

  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = 'Send';
  const actions = document.createElement('div');
  actions.className = 'contact-form-actions';
  actions.append(button);
  form.append(actions);

  const status = document.createElement('p');
  status.className = 'contact-form-status';
  status.setAttribute('role', 'status');

  const controls = [...form.querySelectorAll('.contact-form-field input, .contact-form-field select, .contact-form-field textarea')];

  // clear a field's error as soon as it becomes valid
  controls.forEach((control) => {
    const evt = control.type === 'checkbox' || control.tagName === 'SELECT' ? 'change' : 'input';
    control.addEventListener(evt, () => {
      if (control.getAttribute('aria-invalid') && control.checkValidity()) showError(control, '');
    });
  });

  const succeed = () => {
    status.className = 'contact-form-status contact-form-success';
    status.textContent = config.success || 'Thank you!';
    form.reset();
  };
  const fail = (message) => {
    status.className = 'contact-form-status contact-form-failure';
    status.textContent = message;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    status.className = 'contact-form-status';

    const invalid = controls.filter((control) => {
      const valid = control.checkValidity();
      showError(control, valid ? '' : control.validationMessage);
      return !valid;
    });
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    // honeypot filled: a bot. Behave as if it worked, send nothing.
    if (form.elements.website.value) {
      succeed();
      return;
    }

    if (!config.action) {
      // demo mode: no endpoint configured
      succeed();
      return;
    }

    const action = toActionUrl(config.action);
    if (!action) {
      fail('This form is not set up correctly, so your message was not sent.');
      return;
    }

    button.disabled = true;
    try {
      const resp = await fetch(action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(readValues(form)),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      succeed();
    } catch (err) {
      fail('Sorry, your message could not be sent. Please try again later.');
    } finally {
      button.disabled = false;
    }
  });

  block.append(form, status);
}
