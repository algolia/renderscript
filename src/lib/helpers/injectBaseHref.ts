/**
 * Injects a <base> tag which allows other resources to load on the
 * page without trying to get them from the `renderscript` server.
 * Ithas no effect on serialised output, but allows it to verify render
 * quality.
 */
export default function injectBaseHref(origin: string) {
  const base = document.createElement('base');
  base.setAttribute('href', origin);

  const bases = document.head.querySelectorAll('base');
  if (bases.length) {
    // Patch existing <base> if it is relative.
    const existingBase = bases[0].getAttribute('href') || '';
    if (existingBase.startsWith('/')) {
      bases[0].setAttribute('href', origin + existingBase);
    }
  } else {
    // Only inject <base> if it doesn't already exist.
    document.head.insertAdjacentElement('afterbegin', base);
  }
}
