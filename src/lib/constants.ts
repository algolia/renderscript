import { PRIVATE_IP_PREFIXES } from '@algolia/dns-filter';

export const IP_PREFIXES_WHITELIST = process.env.IP_PREFIXES_WHITELIST
  ? process.env.IP_PREFIXES_WHITELIST.split(',')
  : ['127.', '0.', '::1'];

export const RESTRICTED_IPS =
  process.env.ALLOW_LOCALHOST === 'true'
    ? PRIVATE_IP_PREFIXES.filter(
        (prefix: string) => !IP_PREFIXES_WHITELIST.includes(prefix)
      ) // relax filtering
    : PRIVATE_IP_PREFIXES;

export const IGNORED_RESOURCES = [
  'font',
  'image',
  'media',
  'websocket',
  'manifest',
  'texttrack',
];

export const DATA_REGEXP = /^data:/i;

export const WAIT_TIME = {
  min: 500,
  max: 20000,
};

export const MAX_WAIT_FOR_NEW_PAGE = process.env.MAX_WAIT_FOR_NEW_PAGE
  ? parseInt(process.env.MAX_WAIT_FOR_NEW_PAGE, 10)
  : 6000; // In feb 2022 p95 < 6s

export const UNHEALTHY_TASK_TTL = (MAX_WAIT_FOR_NEW_PAGE + WAIT_TIME.max) * 3;
