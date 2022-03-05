import { log as mainLog } from 'helpers/logger';

export const log = mainLog.child({ svc: 'api' });
