var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (t, e, r, a = r) => {
        var i = Object.getOwnPropertyDescriptor(e, r);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : e.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return e[r];
            },
          };
        }

        Object.defineProperty(t, a, i);
      }
    : (t, e, r, a) => {
        t[(a = a === undefined ? r : a)] = e[r];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (t, e) => {
        Object.defineProperty(t, "default", { enumerable: true, value: e });
      }
    : (t, e) => {
        t.default = e;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var i = (t) =>
      (i =
        Object.getOwnPropertyNames ||
        ((t) => {
          var e;
          var r = [];
          for (e in t) {
            if (Object.prototype.hasOwnProperty.call(t, e)) {
              r[r.length] = e;
            }
          }
          return r;
        }))(t);
    return (t) => {
      if (t && t.__esModule) {
        return t;
      }
      var e = {};
      if (t != null) {
        for (var r = i(t), a = 0; a < r.length; a++) {
          if (r[a] !== "default") {
            __createBinding(e, t, r[a]);
          }
        }
      }
      __setModuleDefault(e, t);
      return e;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptBuilder = undefined;

const { join, dirname } = require("path");

const { getCCEnvConstants } = require("./build-time-constants");

const { ensureDir, writeFile } = require("fs-extra");

const sub_process_manager_1 = require("../../../worker-pools/sub-process-manager");
const asset_library_1 = require("../../manager/asset-library");
const babel = __importStar(require("@babel/core"));
const preset_env_1 = __importDefault(require("@babel/preset-env"));
class ScriptBuilder {
  _scriptOptions;
  _importMapOptions;
  scriptPackages = [];
  static projectOptions;
  initTaskOptions(t) {
    var e = {};

    if (!t.buildScriptParam.polyfills?.asyncFunctions) {
      (e.excludes ?? (e.excludes = [])).push("transform-regenerator");
    }

    if (t.buildScriptParam.targets) {
      e.targets = t.buildScriptParam.targets;
    }

    let r = "facade";

    if (t.buildScriptParam.experimentalEraseModules) {
      r = "erase";
    }

    var a = t.buildScriptParam.hotModuleReload ?? false;
    return {
      scriptOptions: {
        modulePreservation: (r = a ? "preserve" : r),
        debug: t.debug,
        sourceMaps: t.sourceMaps,
        hotModuleReload: a,
        transform: e,
        moduleFormat: "system",
        commonDir: t.buildScriptParam.commonDir || "",
        bundleCommonChunk: t.buildScriptParam.bundleCommonChunk ?? false,
      },
      importMapOptions: {
        format: t.buildScriptParam.importMapFormat,
        data: { imports: {} },
        output: "",
      },
    };
  }
  async initProjectOptions(t) {
    var { scriptOptions, importMapOptions } = this.initTaskOptions(t);

    var scriptOptions =
      ((this._scriptOptions = scriptOptions),
      (this._importMapOptions = importMapOptions),
      await getCCEnvConstants({
        platform: t.buildScriptParam.platform,
        flags: t.buildScriptParam.flags,
      }));

    var importMapOptions = await Editor.Message.request(
      "programming",
      "query-shared-settings"
    );
    var t = await Editor.Message.request("asset-db", "query-db-list");

    var t = await Promise.all(
      t.map(async (t) => ({
        dbID: t,

        target: (
          await Editor.Message.request("asset-db", "query-db-info", t)
        ).target,
      }))
    );

    var a = await Editor.Profile.getProject("engine", "macroCustom");
    ScriptBuilder.projectOptions = {
      customMacroList: a,
      dbInfos: t,
      ccEnvConstants: scriptOptions,
      ...importMapOptions,
    };
  }
  async buildBundleScript(t) {
    const e = [];
    const r = {};

    t.forEach((t) => {
      if (t.output) {
        t.config.hasPreloadScript = !this._scriptOptions.hotModuleReload;

        e.push({
          id: t.name,
          scripts: t.scripts
            .map((t) => {
              r[t] = Build.Utils.compressUuid(t, false);
              return asset_library_1.buildAssetLibrary.getAssetInfo(t);
            })
            .sort((t, e) => t.name.localeCompare(e.name)),
          outFile: t.scriptDest,
        });
      }
    });

    if (e.length) {
      t = Editor.Message.request(
        "programming",
        "packer-driver/query-cc-editor-module-map"
      );

      t = {
        ...this._scriptOptions,
        ...ScriptBuilder.projectOptions,
        bundles: e,
        uuidCompressMap: r,
        applicationJS: "",
        cceModuleMap: t,
      };

      await sub_process_manager_1.workerManager.registerTask({
        name: "build-script",
        path: join(__dirname, "./build-script"),
      });

      if (
        (t = await sub_process_manager_1.workerManager.runTask(
          "build-script",
          "buildScriptCommand",
          [t]
        )) &&
        (t.scriptPackages && this.scriptPackages.push(...t.scriptPackages),
        t.importMappings)
      ) {
        Object.assign(this._importMapOptions.data.imports, t.importMappings);
      }

      sub_process_manager_1.workerManager.kill("build-script");
      console.debug("Copy externalScripts success!");
      return t;
    }

    console.debug("[script] no script to build");
  }
  static async buildPolyfills(t = {}, e) {
    await sub_process_manager_1.workerManager.registerTask({
      name: "build-script",
      path: join(__dirname, "./build-script"),
    });

    return sub_process_manager_1.workerManager.runTask(
      "build-script",
      "buildPolyfillsCommand",
      [t, e]
    );
  }
  static async buildSystemJs(t) {
    await sub_process_manager_1.workerManager.registerTask({
      name: "build-script",
      path: join(__dirname, "./build-script"),
    });

    return sub_process_manager_1.workerManager.runTask(
      "build-script",
      "buildSystemJsCommand",
      [t]
    );
  }
  static async outputImportMap(t, e) {
    t = (await transformImportMap(t, e)).content;
    await ensureDir(dirname(e.dest));
    await writeFile(e.dest, t, { encoding: "utf8" });
  }
}
async function transformImportMap(t, e) {
  var e_importMapFormat = e.importMapFormat;
  let a;
  let i = JSON.stringify(t, undefined, e.debug ? 2 : 0);

  if (e_importMapFormat === undefined) {
    a = ".json";
  } else {
    a = ".js";
    t = "export default " + i;

    i = (
      await babel.transformAsync(t, {
        presets: [
          [
            preset_env_1.default,
            { modules: e_importMapFormat !== "esm" && e_importMapFormat },
          ],
        ],
      })
    )?.code;
  }

  return { extension: a, content: i };
}
exports.ScriptBuilder = ScriptBuilder;
