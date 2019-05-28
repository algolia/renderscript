import getChromiumExecutablePath from "lib/helpers/getChromiumExecutablePath";
import getExtensionPath, { EXTENSIONS } from "lib/helpers/getExtensionPath";

(async () => {
  await Promise.all([
    getChromiumExecutablePath(),
    ...EXTENSIONS.map(getExtensionPath)
  ]);
})();
