import { pino } from 'pino';

export const log = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: false,
  base: {},
  // nestedKey: 'data',
  // formatters: {
  //   bindings({ pid, hostname, ...rest }) {
  //     return rest;
  //   },
  // },
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  hooks: {
    // By default pino does Sprintf instead we merge objects.
    logMethod(args, method) {
      const final = { msg: '', data: {} };
      args.forEach((m) => {
        if (typeof m === 'string') final.msg += m;
        else final.data = { ...final.data, ...m };
      });
      method.apply(this, [final as unknown as string]);
    },
  },
  prettifier: process.env.NODE_ENV !== 'production',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      singleLine: true,
      messageFormat: '{svc} \x1B[37m{msg}',
    },
  },
});
