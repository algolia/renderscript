import getChromiumExecutablePath from 'lib/helpers/getChromiumExecutablePath';

(async (): Promise<void> => {
  await Promise.all([getChromiumExecutablePath()]);
})();
