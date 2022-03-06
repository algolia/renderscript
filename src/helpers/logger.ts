import { pino } from 'pino';

const isProd = process.env.NODE_ENV === 'production';
export const log = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: true,
  base: {},
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  hooks: {
    // By default pino does Sprintf instead we merge objects.
    logMethod(args, method) {
      const final: Record<string, any> = { msg: '', data: {} };
      args.forEach((m) => {
        if (typeof m === 'string') {
          final.msg += m;
        } else if (typeof m === 'object' && m instanceof Error) {
          final.err = m;
        } else {
          final.data = { ...final.data, ...m };
        }
      });
      method.apply(this, [final as unknown as string]);
    },
  },
  prettifier: !isProd,
  transport: !isProd
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: true,
          messageFormat: '{svc} \x1B[37m{msg}',
          translateTime: 'HH:MM',
          ignore: 'svc',
        },
      }
    : undefined,
});
