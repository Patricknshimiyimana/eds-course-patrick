/**
 * Language helpers (module 12).
 *
 * Content structure: one folder per language, e.g. /en/… and /it/…
 */

export const LANGUAGES = ['en', 'it'];
export const DEFAULT_LANGUAGE = 'en';

/**
 * Returns the language of the current page, from the first folder of its path.
 * /it/about → 'it'; /about or /drafts/… → the default language.
 * @param {string} [pathname] defaults to the current page
 * @returns {string}
 */
export function getLanguage(pathname = window.location.pathname) {
  const [, first] = pathname.split('/');
  return LANGUAGES.includes(first) ? first : DEFAULT_LANGUAGE;
}

const placeholders = {};

/**
 * Fetches /<lang>/placeholders.json once per language and returns
 * an object { key: text }. Returns {} if the sheet is missing.
 * @param {string} [lang] defaults to the current page's language
 * @returns {Promise<Object<string, string>>}
 */
export function fetchPlaceholders(lang = getLanguage()) {
  if (!placeholders[lang]) {
    placeholders[lang] = fetch(`/${lang}/placeholders.json`)
      .then((resp) => (resp.ok ? resp.json() : { data: [] }))
      .then(({ data = [] }) => Object.fromEntries(data.map(({ Key, Text }) => [Key, Text])))
      .catch(() => ({}));
  }
  return placeholders[lang];
}
