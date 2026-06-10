Object.defineProperty(exports, "__esModule", { value: true });
exports.name = undefined;
exports.title = undefined;
exports.handle = handle;

const { join } = require("path");

const plugin_1 = require("../../../plugin");
async function handle(r, s, t) {
  let a = {};
  try {
    var e = plugin_1.pluginManager.platformConfigs[r.platform].type;

    if (e) {
      a = { ["loadPluginIn" + (e[0].toUpperCase() + e.slice(1))]: true };
    }
  } catch (t) {
    console.error(t);
    console.warn("Can not find platform type for " + r.platform);
  }

  s.pluginScripts = await Editor.Message.request(
    "programming",
    "query-sorted-plugins",
    a
  );

  if (!r.preview) {
    s.paths.polyfillsJs = join(s.paths.dir, "src", "polyfills.bundle.js");

    s.paths.systemJs = join(s.paths.dir, "src", "system.bundle.js");

    s.paths.engineDir = r.buildEngineParam.output;
    e = r.buildScriptParam.importMapFormat;
    let t;
    var i = join(s.paths.dir, "src");

    var e =
      ((t = e === undefined ? ".json" : ".js"), join(i, "import-map" + t));

    s.paths.importMap = e;

    r.buildScriptParam.commonDir = join(s.paths.dir, "src", "chunks");
  }
}
exports.title = "i18n:builder.tasks.sort_asset_bundle";
exports.name = "data-task/asset_script";
