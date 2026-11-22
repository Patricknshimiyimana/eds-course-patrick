import { fetchPlaceholders } from '../../scripts/i18n.js';

/**
 * Offices block: shows one card per row of a sheet.
 * Content model: one cell with a link to the sheet, e.g. /data/offices.json
 * Sheet columns: City, Address, Telephone (older sheets: Phone).
 * @param {Element} block The offices block element
 */
export default async function decorate(block) {
  const link = block.querySelector('a');
  const source = link ? link.getAttribute('href') : block.textContent.trim();
  if (!source) return;

  // fetch the path only, so the block works on localhost, aem.page and aem.live
  let path;
  try {
    path = new URL(source, window.location.href).pathname;
  } catch {
    return;
  }
  if (!path.endsWith('.json')) return;

  let data = [];
  try {
    const resp = await fetch(path);
    if (!resp.ok) return;
    ({ data = [] } = await resp.json());
  } catch {
    return;
  }

  const placeholders = await fetchPlaceholders();
  const phoneLabel = placeholders.phone || 'Phone';

  const ul = document.createElement('ul');
  data.forEach((office) => {
    const { City, Address } = office;
    // expand: read the new column name and fall back to the old one
    const Phone = office.Telephone ?? office.Phone;
    if (!City) return;
    const li = document.createElement('li');

    const city = document.createElement('h3');
    city.textContent = City;
    li.append(city);

    if (Address) {
      const address = document.createElement('p');
      address.className = 'offices-address';
      address.textContent = Address;
      li.append(address);
    }

    if (Phone) {
      const p = document.createElement('p');
      const label = document.createElement('span');
      label.className = 'offices-phone-label';
      label.textContent = `${phoneLabel}: `;
      p.append(label);
      const phone = document.createElement('a');
      phone.className = 'offices-phone';
      phone.href = `tel:${Phone.replace(/[^\d+]/g, '')}`;
      phone.textContent = Phone;
      p.append(phone);
      li.append(p);
    }

    ul.append(li);
  });

  block.replaceChildren(ul);
}
