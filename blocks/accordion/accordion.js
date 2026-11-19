/**
 * Accordion block.
 * Content model: one row per item, [question] | [answer].
 * Each row becomes a native <details>/<summary>, so opening and closing
 * works with the mouse and the keyboard (Enter/Space) without extra script.
 * The author's elements are moved, never rebuilt.
 * @param {Element} block The accordion block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [label, body] = row.children;
    if (!label) return;

    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    summary.append(...label.childNodes);

    const details = document.createElement('details');
    details.className = 'accordion-item';
    details.append(summary);

    if (body) {
      body.className = 'accordion-item-body';
      details.append(body);
    }

    row.replaceWith(details);
  });
}
