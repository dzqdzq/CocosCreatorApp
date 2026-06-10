Object.defineProperty(exports, "__esModule", { value: true });
exports.name = undefined;
exports.title = undefined;
exports.handle = handle;

const { basename, dirname, join } = require("path");

const script_1 = require("../../asset-handler/script");

const { createHash } = require("crypto");

const { remove, outputFileSync } = require("fs-extra");

const md5_cache_handler_1 = require("./md5-cache-handler");
const asset_library_1 = require("../../manager/asset-library");
async function handle(t, a, s) {
  if (t.md5Cache) {
    if (
      t.md5CacheOptions.handleTemplateMd5Link &&
      this.buildTemplate.isEnable
    ) {
      t.md5CacheOptions.includes.push("*", "src/*");
    }

    var e = new md5_cache_handler_1.md5CacheHandler(
      a.paths.dir,
      t.md5CacheOptions
    );
    for (let t = 0; t < a.settings.plugins.jsList.length; t++) {
      var i = a.settings.plugins.jsList[t];
      var p = asset_library_1.buildAssetLibrary.url2uuid("db://" + i);
      var p = a.paths.plugins[p];
      var r = await e.addMd5ToPath(p);
      a.settings.plugins.jsList[t] = i.replace(basename(p), basename(r));
    }
    for (const u of Object.keys(a.importMap.imports)) {
      var h = dirname(a.paths.importMap);
      var n = a.importMap.imports[u];

      if (n.startsWith(".")) {
        n = join(h, n);
        n = await e.addMd5ToPath(n);
        a.importMap.imports[u] = "./" + Build.Utils.relativeUrl(h, n);
      }
    }

    await script_1.ScriptBuilder.outputImportMap(a.importMap, {
      dest: a.paths.importMap,
      importMapFormat: t.buildScriptParam.importMapFormat,
      debug: t.debug,
    });

    a.paths.importMap = await e.addMd5ToPath(a.paths.importMap);

    if (a.paths.polyfillsJs) {
      a.paths.polyfillsJs = await e.addMd5ToPath(a.paths.polyfillsJs);
    }

    if (a.paths.systemJs) {
      a.paths.systemJs = await e.addMd5ToPath(a.paths.systemJs);
    }

    for (let t = 0; t < a.scriptPackages.length; t++) {
      var d = a.scriptPackages[t];
      var o = await e.addMd5ToPath(d);
      a.scriptPackages[t] = o;

      a.settings.scripting.scriptPackages[t] =
        a.settings.scripting.scriptPackages[t].replace(
          basename(d),
          basename(o)
        );
    }
    var a_settings = a.settings;
    for (const m of this.bundleManager.bundles
      .filter((t) => t.output)
      .sort((t, a) => t.name.localeCompare(a.name))) {
      a_settings.assets.bundleVers[m.name] = m.version;
    }
    var c = createHash("md5");
    c.update(JSON.stringify(a.settings));

    e.hashedPathMap[a.paths.settings] = join(
      dirname(a.paths.settings),
      `settings.${c.digest("hex").slice(0, 5)}.json`
    );

    await remove(a.paths.settings);
    a.paths.settings = e.hashedPathMap[a.paths.settings];

    outputFileSync(
      a.paths.settings,
      JSON.stringify(a_settings, null, t.debug ? 4 : 0)
    );

    await e.run();
    a.paths.hashedMap = e.hashedPathMap;
    a.paths.applicationJS = e.hashedPathMap[a.paths.applicationJS];

    console.debug(
      `add suffix to assets(${Object.keys(e.hashedPathMap).length}) success!`
    );
  }
}
exports.title = "i18n:builder.tasks.build_suffix";
exports.name = "build-task/suffix";
