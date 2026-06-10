var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, s, r = s) => {
        var i = Object.getOwnPropertyDescriptor(t, s);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[s];
            },
          };
        }

        Object.defineProperty(e, r, i);
      }
    : (e, t, s, r) => {
        e[(r = r === undefined ? s : r)] = t[s];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var i = (e) =>
      (i =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var s = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              s[s.length] = t;
            }
          }
          return s;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var s = i(e), r = 0; r < s.length; r++) {
          if (s[r] !== "default") {
            __createBinding(t, e, s[r]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildResult = undefined;
exports.InternalBuildResult = undefined;

const { join } = require("path");

const asset_library_1 = require("./asset-library");
const BundleUtils = __importStar(require("../asset-handler/bundle/utils"));
const events_1 = __importDefault(require("events"));
const global_1 = require("../../../share/global");

const { getBuildPath } = require("../utils");

class Paths {
  dir;
  output;
  cache = {};
  compileConfig;
  effectBin = "";
  engineMeta = "";
  hashedMap = {};
  plugins = {};
  constructor(e) {
    this.dir = e || "";
    this.output = this.dir;

    this.compileConfig = join(e, global_1.BuildGlobalInfo.buildOptionsFileName);
  }
  get settings() {
    return this.cache.settings || join(this.dir, "src", "settings.json");
  }
  set settings(e) {
    this.cache.settings = e;
  }
  get subpackages() {
    return this.cache.subpackages || join(this.dir, Build.SUBPACKAGES_HEADER);
  }
  set subpackages(e) {
    this.cache.subpackages = e;
  }
  get assets() {
    return this.cache.assets || join(this.dir, Build.ASSETS_HEADER);
  }
  set assets(e) {
    this.cache.assets = e;
  }
  get remote() {
    return this.cache.remote || join(this.dir, Build.REMOTE_HEADER);
  }
  set remote(e) {
    this.cache.remote = e;
  }
  get applicationJS() {
    return this.cache.applicationJS || join(this.dir, "application.js");
  }
  set applicationJS(e) {
    this.cache.applicationJS = e;
  }
  get importMap() {
    return this.cache.importMap || join(this.dir, "import-map.js");
  }
  set importMap(e) {
    this.cache.importMap = e;
  }
  get bundleScripts() {
    return (
      this.cache.bundleScripts ||
      join(this.dir, "src", Build.BUNDLE_SCRIPTS_HEADER)
    );
  }
  set bundleScripts(e) {
    this.cache.bundleScripts = e;
  }
}
class InternalBuildResult extends events_1.default {
  settings = {
    CocosEngine: "0.0.0",
    engine: {
      debug: true,
      platform: "web-desktop",
      customLayers: [],
      sortingLayers: [],
      macros: {},
      builtinAssets: [],
    },
    animation: { customJointTextureLayouts: [] },
    assets: {
      server: "",
      remoteBundles: [],
      subpackages: [],
      preloadBundles: [],
      bundleVers: {},
      preloadAssets: [],
      projectBundles: [],
    },
    plugins: { jsList: [] },
    scripting: {},
    launch: { launchScene: "" },
    screen: {
      exactFitScreen: true,
      designResolution: { width: 960, height: 640, policy: 0 },
    },
    rendering: { renderPipeline: "" },
  };
  scriptPackages = [];
  pluginVers = {};
  compressImageResult = {};
  importMap = { imports: {} };
  rawOptions;
  paths;
  compileOptions = null;
  staticsInfo = {};
  __task;
  pluginScripts = [];
  separateEngineResult;
  get dest() {
    return this.paths.dir;
  }
  get bundles() {
    console.log(
      Editor.I18n.t("builder.warn.deprecatedTip", {
        oldName: "result.bundles",
        newName: "this.bundleManager.bundles",
      })
    );

    return this.__task.bundleManager.bundles;
  }
  get bundleMap() {
    console.log(
      Editor.I18n.t("builder.warn.deprecatedTip", {
        oldName: "result.bundleMap",
        newName: "this.bundleManager.bundleMap",
      })
    );

    return this.__task.bundleManager.bundleMap;
  }
  constructor(e, t) {
    super();
    this.rawOptions = JSON.parse(JSON.stringify(e.options));
    let s = join(Editor.Project.path, "build", "preview");

    if (!t) {
      s = getBuildPath(e.options);
    }

    this.paths = new Paths(s);
    this.__task = e;
  }
}
exports.InternalBuildResult = InternalBuildResult;
class BuildResult {
  __task;
  settings;
  dest;
  get paths() {
    return this.__task.result.paths;
  }
  constructor(e) {
    this.__task = e;
    this.dest = getBuildPath(e.options);
    this.settings = e.result.settings;
  }
  containsAsset(t) {
    return !!this.__task.bundleManager.bundles.find((e) => e.containsAsset(t));
  }
  getRawAssetPaths(s) {
    var e;
    return asset_library_1.buildAssetLibrary.getAsset(s) &&
      (e = this.__task.bundleManager.bundles.filter((e) =>
        e.containsAsset(s, true)
      )).length
      ? e.flatMap((e) => {
          var t = { bundleName: e.name, raw: [] };

          if (e.getRedirect(s)) {
            t.redirect = e.getRedirect(s);
          } else {
            t.raw = BundleUtils.getRawAssetPaths(s, e);
          }

          return t.raw.length || t.redirect ? t : [];
        })
      : [];
  }
  getAssetPathInfo(s) {
    var e = this.__task.bundleManager.bundles.filter((e) =>
      e.containsAsset(s, true)
    );
    return e.length
      ? e.flatMap((e) => {
          var t = { bundleName: e.name };

          if (e.getRedirect(s)) {
            t.redirect = e.getRedirect(s);
          } else {
            Object.assign(t, BundleUtils.getAssetPathInfo(s, e));
          }

          return t.raw || t.redirect || t.import ? t : [];
        })
      : [];
  }
  getJsonPathInfo(e) {
    console.warn(
      Editor.I18n.t("builder.warn.deprecatedTip", {
        oldName: "result.getJsonPathInfo",
        newName: "result.getImportAssetPaths",
      })
    );

    return this.getImportAssetPaths(e);
  }
  getImportAssetPaths(s) {
    var e = this.__task.bundleManager.bundles.filter((e) => e.containsAsset(s));
    return e.length
      ? e.flatMap((e) => {
          var t = { bundleName: e.name };
          if (e.getRedirect(s)) {
            t.redirect = e.getRedirect(s);
          } else {
            e = BundleUtils.getImportPathInfo(s, e);
            if (!e) {
              return [];
            }
            Object.assign(t, e);
          }
          return t;
        })
      : [];
  }
}
exports.BuildResult = BuildResult;
