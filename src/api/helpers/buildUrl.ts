const DOCKER_LOCALHOST = 'host.docker.internal';

export function replaceHost(url: URL, from: string, to: string) {
  const fromRegex = new RegExp(`/^${from}(:|$)/`)
  const host = url.host || '';
  url.host = host.replace(fromRegex, `${to}$1`);
  return url;
}

export function revertUrl(href: string) {
  const url = new URL(href);
  if (process.env.USE_DOCKER_LOCALHOST !== 'true') return url;
  return replaceHost(url, DOCKER_LOCALHOST, 'localhost');
}

export function buildUrl(href: string) {
  const url = new URL(href);
  if (process.env.USE_DOCKER_LOCALHOST !== 'true') return url;
  return replaceHost(url, 'localhost', DOCKER_LOCALHOST);
}
