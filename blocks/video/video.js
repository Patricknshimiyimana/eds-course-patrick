import { readBlockConfig } from '../../scripts/aem.js';

/**
 * Returns the 11-character YouTube id from a watch, youtu.be or embed URL,
 * or null if the URL is not a valid YouTube video link.
 * @param {string} href
 * @returns {string|null}
 */
export function getYouTubeId(href) {
  let url;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  let id = null;
  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
  if (host === 'youtu.be') {
    [, id] = url.pathname.split('/');
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [, first, second] = url.pathname.split('/');
    if (first === 'watch') id = url.searchParams.get('v');
    else if (first === 'embed') id = second;
  }
  return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : null;
}

function buildIframe(id, title, autoplay) {
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube-nocookie.com/embed/${id}${autoplay ? '?autoplay=1' : ''}`;
  iframe.title = title || 'YouTube video';
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  iframe.loading = 'lazy';
  return iframe;
}

/**
 * Video block (configuration block): rows URL, Poster, Title.
 * Default: poster + play button, the player loads on click.
 * Variant `autoload`: the player loads when the block approaches the screen.
 * @param {Element} block
 */
export default function decorate(block) {
  const config = readBlockConfig(block);
  const id = getYouTubeId(config.url);
  // not a YouTube video: leave the author's table as it is
  if (!id) return;

  const title = typeof config.title === 'string' ? config.title : '';
  // keep the authored responsive <picture> rather than the plain src from readBlockConfig
  const poster = block.querySelector('picture');

  const frame = document.createElement('div');
  frame.className = 'video-frame';
  const play = (autoplay) => frame.replaceChildren(buildIframe(id, title, autoplay));

  if (block.classList.contains('autoload')) {
    if (poster) frame.append(poster);
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        play(false);
      }
    }, { rootMargin: '200px 0px' });
    observer.observe(block);
  } else {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'video-play';
    button.setAttribute('aria-label', title ? `Play video: ${title}` : 'Play video');
    if (poster) button.append(poster);
    button.addEventListener('click', () => play(true), { once: true });
    frame.append(button);
  }

  block.replaceChildren(frame);
}
