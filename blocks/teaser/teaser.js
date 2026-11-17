/**
 * Teaser block: an image and a text cell side by side.
 * Content model: one row with two cells, [image] | [eyebrow, heading, text, call to action].
 * @param {Element} block The teaser block element
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;

  const cells = [...row.children];
  cells.forEach((cell) => {
    const onlyPicture = cell.children.length === 1 && cell.querySelector('picture');
    cell.classList.add(onlyPicture ? 'teaser-image' : 'teaser-content');
  });

  // a first paragraph that contains only bold text is the eyebrow
  const content = block.querySelector('.teaser-content');
  const first = content?.firstElementChild;
  if (first?.tagName === 'P') {
    const strong = first.querySelector(':scope > strong');
    if (
      first.children.length === 1
      && strong
      && strong.textContent.trim() === first.textContent.trim()
    ) {
      first.classList.add('teaser-eyebrow');
    }
  }

  // move the cells directly under the block, dropping the row wrapper
  block.replaceChildren(...cells);
}
