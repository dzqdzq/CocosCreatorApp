Object.defineProperty(exports, "__esModule", { value: true });
exports.title = undefined;
exports.handle = handle;

const { basename } = require("path");

const { removeDbHeader } = require("../../utils");

async function handle(s, i, e) {
  var i_settings = i.settings;

  i_settings.scripting.scriptPackages = i.scriptPackages.map((e) =>
    Build.Utils.relativeUrl(i.paths.engineDir, e)
  );

  i_settings.plugins.jsList = i.pluginScripts.map((e) => {
    let t = removeDbHeader(e.url);
    return (t = s.md5Cache && i.paths.plugins[e.uuid]
      ? t.replace(/[^\/]*$/, () => basename(i.paths.plugins[e.uuid]))
      : t);
  });
}
exports.title = "i18n:builder.tasks.settings.script";
