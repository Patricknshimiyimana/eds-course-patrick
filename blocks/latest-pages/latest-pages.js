import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Latest pages block: the most recently modified pages from the query index.
 * Content model: optional cell with how many pages to show (default 3).
 * Needs a query index with path, title, description, image and lastModified.
 * @param {Element} block The latest-pages block element
 */
export default async function decorate(block) {
  const count = Number.parseInt(block.textContent.trim(), 10) || 3;

  let data = [];
  try {
    const resp = await fetch('/query-index.json?limit=500');
    if (resp.ok) ({ data = [] } = await resp.json());
  } catch {
    // no index: fall through and render nothing
  }

  const current = window.location.pathname.replace(/\/$/, '') || '/';
  const pages = data
    .filter(({ path }) => path && (path.replace(/\/$/, '') || '/') !== current)
    .sort((a, b) => Number(b.lastModified) - Number(a.lastModified))
    .slice(0, count);

  const ul = document.createElement('ul');
  pages.forEach(({
    path, title, description, image,
  }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = path;

    // the index uses a default image when a page has none; skip that one
    if (image && !image.includes('default-meta-image')) {
      const pic = document.createElement('div');
      pic.className = 'latest-pages-image';
      pic.append(createOptimizedPicture(image, '', false, [{ width: '750' }]));
      a.append(pic);
    }

    const body = document.createElement('div');
    body.className = 'latest-pages-body';
    const heading = document.createElement('h3');
    heading.textContent = title || path;
    body.append(heading);
    if (description) {
      const p = document.createElement('p');
      p.textContent = description;
      body.append(p);
    }
    a.append(body);
    li.append(a);
    ul.append(li);
  });

  // with no index (or no other pages), show nothing rather than the author's number
  block.replaceChildren(...(pages.length ? [ul] : []));
}
