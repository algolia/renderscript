import getChromiumExecutablePath from 'lib/helpers/getChromiumExecutablePath';
import getExtensionPath, { EXTENSIONS } from 'lib/helpers/getExtensionPath';
import getAdBlockListPath, {
  ADBLOCK_LISTS,
} from 'lib/helpers/getAdBlockListPath';

(async () => {
  await Promise.all([
    getChromiumExecutablePath(),
    ...EXTENSIONS.map(getExtensionPath),
    ...ADBLOCK_LISTS.map(getAdBlockListPath),
  ]);
})();
