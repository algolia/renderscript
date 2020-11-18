import getChromiumExecutablePath from 'lib/helpers/getChromiumExecutablePath';

(async () => {
  await Promise.all([getChromiumExecutablePath()]);
})();
