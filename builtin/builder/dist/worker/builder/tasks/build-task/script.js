Object.defineProperty(exports, "__esModule", { value: true });
exports.title = undefined;
exports.handle = handle;

const { ensureDirSync, copyFileSync } = require("fs-extra");

const { dirname, join } = require("path");

const script_1 = require("../../asset-handler/script");

const {
  buildSplitEngine,
  buildEngineX,
  queryEngineImportMap,
} = require("../../asset-handler/script/engine");

const { removeDbHeader } = require("../../utils");

async function handle(e, t, i) {
  Editor.Metrics.trackTimeStart("builder:build-script-total");

  if (
    !(await script_1.ScriptBuilder.buildPolyfills(
      e.polyfills,
      t.paths.polyfillsJs
    ))
  ) {
    delete t.paths.polyfillsJs;
  }

  this.updateProcess("Generate systemJs...");

  await script_1.ScriptBuilder.buildSystemJs({
    dest: t.paths.systemJs,
    sourceMaps: e.sourceMaps,
    debug: e.debug,
    platform: e.platform,
    hotModuleReload: e.buildScriptParam.hotModuleReload,
  });

  var a = await this.bundleManager.buildScript();

  if (
    a &&
    (a.scriptPackages && t.scriptPackages.push(...a.scriptPackages),
    a.importMappings)
  ) {
    Object.assign(t.importMap.imports, a.importMappings);
  }

  if (!e.buildEngineParam.skip) {
    e.buildEngineParam.targets = e.buildScriptParam.targets;
    e.buildEngineParam.flags = e.buildScriptParam.flags;

    if (e.buildEngineParam.platform && !e.buildEngineParam.platformType) {
      e.buildEngineParam.platformType = e.buildEngineParam.platform;
    }

    this.updateProcess(
      Editor.I18n.t("builder.tasks.build_engine") + " start..."
    );

    var a = e.buildEngineParam.separateEngineOptions;
    let i = !!a;

    if (a && Editor.App.isPackaged && a.checkVersionValid) {
      (e.debug || e.sourceMaps) &&
        console.warn(Editor.I18n.t("builder.warn.invalidModeInSeparateEngine"));

      /\d*\.\d*\.\d*$/.test(Editor.App.version)
        ? e.engineInfo.typescript.type === "custom" &&
          (console.warn(
            Editor.I18n.t("builder.warn.separateEngineWithCustomEngine")
          ),
          (i = false))
        : (console.warn(
            Editor.I18n.t("builder.warn.invalidVersionInSeparateEngine")
          ),
          (i = false));
    }

    Editor.Metrics.trackTimeStart("builder:build-engine");

    if (i && a) {
      a = await buildSplitEngine({
        ...e.buildEngineParam,
        ...a,
        platform: e.platform,
        engine: e.buildEngineParam.entry,
        importMapOutFile: t.paths.importMap,
        useCacheForce: Editor.App.isPackaged,
      });

      t.paths.engineMeta = a.paths.meta;
      Object.assign(t.importMap.imports, a.importMap);
      t.separateEngineResult = a;
    } else {
      a = (
        await buildEngineX(
          e.buildEngineParam,
          script_1.ScriptBuilder.projectOptions.ccEnvConstants
        )
      ).metaFile;
      t.paths.engineMeta = a;
      a = await queryEngineImportMap(
        a,
        e.buildEngineParam.output,
        dirname(t.paths.importMap)
      );
      Object.assign(t.importMap.imports, a);
    }

    a = await Editor.Metrics.trackTimeEnd("builder:build-engine");
    this.updateProcess(
      Editor.I18n.t("builder.tasks.build_engine") + ` in (${a} ms) √`
    );
  }

  this.updateProcess("Copy plugin script ...");
  for (const s of t.pluginScripts) {
    var r = removeDbHeader(s.url);
    var r = join(t.paths.dir, "src", r);
    ensureDirSync(dirname(r));
    copyFileSync(s.file, r);
    t.paths.plugins[s.uuid] = r;
  }
  this.updateProcess("Generate import-map...");

  await script_1.ScriptBuilder.outputImportMap(t.importMap, {
    dest: t.paths.importMap,
    importMapFormat: e.buildScriptParam.importMapFormat,
    debug: e.debug,
  });
}
exports.title = "i18n:builder.tasks.build_script";
