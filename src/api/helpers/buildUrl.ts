export default function buildUrl(href: string) {
  const url = new URL(href);
  if (process.env.USE_DOCKER_LOCALHOST !== 'true') return url;
  const host = url.host || '';
  url.host = host.replace(/^localhost(:|$)/, 'host.docker.internal$1');
  return url;
}
