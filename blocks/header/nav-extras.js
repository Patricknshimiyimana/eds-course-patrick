import { LANGUAGES, getLanguage } from '../../scripts/i18n.js';

const LANGUAGE_NAMES = { en: 'English', it: 'Italiano' };

/**
 * Removes the trailing slash so /en/ and /en match, except for the root.
 * @param {string} path
 * @returns {string}
 */
function normalize(path) {
  return path.length > 1 ? path.replace(/\/$/, '') : path;
}

/**
 * Marks the link in the main menu that points to the current page.
 * @param {Element} nav The nav element
 */
export function markCurrentPage(nav) {
  const current = normalize(window.location.pathname);
  nav.querySelectorAll('.nav-sections a[href]').forEach((a) => {
    const { pathname } = new URL(a.href, window.location.href);
    if (normalize(pathname) === current) a.setAttribute('aria-current', 'page');
  });
}

/**
 * Points the language links in the tools section (links to /en/, /it/, …)
 * to the current page in that language, and marks the current language.
 * Outside a language folder the links keep pointing to the home pages.
 * @param {Element} nav The nav element
 */
export function decorateLanguageSwitcher(nav) {
  const [, first, ...rest] = window.location.pathname.split('/');
  const inLanguageFolder = LANGUAGES.includes(first);
  const pageLang = getLanguage();

  nav.querySelectorAll('.nav-tools a[href]').forEach((a) => {
    const { pathname } = new URL(a.href, window.location.href);
    const match = pathname.match(/^\/([a-z]{2})\/?$/);
    if (!match || !LANGUAGES.includes(match[1])) return;
    const lang = match[1];

    if (inLanguageFolder) a.href = `/${lang}/${rest.join('/')}`;
    a.lang = lang;
    a.hreflang = lang;
    if (LANGUAGE_NAMES[lang]) a.setAttribute('aria-label', LANGUAGE_NAMES[lang]);
    if (inLanguageFolder && lang === pageLang) a.setAttribute('aria-current', 'true');
  });

  // icon-only links (e.g. search) need an accessible name
  nav.querySelectorAll('.nav-tools a[href]').forEach((a) => {
    const icon = a.querySelector('.icon');
    if (icon && !a.textContent.trim() && !a.getAttribute('aria-label')) {
      const name = [...icon.classList].find((c) => c.startsWith('icon-'))?.slice(5) || '';
      a.setAttribute('aria-label', name.charAt(0).toUpperCase() + name.slice(1));
    }
  });
}
