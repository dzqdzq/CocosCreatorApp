Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginManager = undefined;
const platforms_options_1 = require("../share/platforms-options");
const CustomAssetHandlerTypes = ["compressTextures"];
class PluginManager {
  builderPathsMap;
  assetHandlers = {};
  pkgPriorities = {};
  hookInfos = {};
  customBuildStages = {};
  hasOnLoaded = {};
  hasOnUnloaded = {};
  platformConfigs = {};
  buildTemplateConfigMap = {};
  constructor() {
    const e = {};

    platforms_options_1.PLATFORMS.forEach((s) => {
      e[s] = {};
    });

    CustomAssetHandlerTypes.forEach((s) => {
      this.assetHandlers[s] = {};
    });

    this.builderPathsMap = e;
    this.customBuildStages = JSON.parse(JSON.stringify(e));
  }
  async init(s, e, t) {
    await Promise.all(s.map((s) => this.register(s)));

    this.platformConfigs = e;
    this.buildTemplateConfigMap = t;
  }
  async register(e) {
    this.pkgPriorities[e.pkgName] = e.priority;
    this.hookInfos[e.pkgName] = e;
    try {
      if (e.assetHandlers) {
        var s = Editor.Module.__protected__.requireFile(e.assetHandlers);
        for (const r of CustomAssetHandlerTypes) {
          if (s[r]) {
            if (this.assetHandlers[r]) {
              this.assetHandlers[r][e.pkgName] = s[r];
            } else {
              this.assetHandlers[r] = { [e.pkgName]: s[r] };
            }
          }
        }
      }
      if (e.hooks) {
        for (const i of Object.keys(e.hooks)) {
          var t = e.hooks[i];
          var o = Editor.Module.__protected__.requireFile(t);

          if (o.load && !this.hasOnLoaded[t]) {
            this.hasOnLoaded[t] = true;
            this.hasOnUnloaded[t] = false;
            await o.load();
          }

          this.builderPathsMap[i][e.pkgName] = t;
        }
      }
      if (e.customBuildStages) {
        for (const a of Object.keys(e.customBuildStages)) {
          this.customBuildStages[a][e.pkgName] = e.customBuildStages[a];
        }
      }
    } catch (s) {
      console.error(s);
      console.error(`register plugin ${e.pkgName} in build worker failed!`);
    }
  }
  async unregister(e) {
    try {
      delete this.pkgPriorities[e.pkgName];

      if (e.assetHandlers) {
        Editor.Module.__protected__.removeCache(e.assetHandlers);
      }

      CustomAssetHandlerTypes.forEach((s) => {
        delete this.assetHandlers[s][e.pkgName];
      });

      var s;
      var t = [];
      for (const o of platforms_options_1.PLATFORMS) {
        if (this.builderPathsMap[o]) {
          delete this.builderPathsMap[o][e.pkgName];
        }

        if (
          e.hooks &&
          e.hooks[o] &&
          !this.hasOnUnloaded[e.hooks[o]] &&
          !t.includes(e.hooks[o])
        ) {
          (s = Editor.Module.__protected__.requireFile(e.hooks[o])).unload &&
            !this.hasOnUnloaded[e.hooks[o]] &&
            ((this.hasOnUnloaded[e.hooks[o]] = true),
            (this.hasOnLoaded[e.hooks[o]] = false),
            await s.unload());

          Editor.Module.__protected__.removeCache(e.hooks[o]);
          t.push(e.hooks[o]);
        }
      }
    } catch (s) {
      console.error(s);
      console.error(`unregister plugin ${e.pkgName} in build worker failed!`);
    }
  }
  getAssetHandlers(s) {
    var e = Object.keys(this.assetHandlers[s]);
    return {
      pkgNameOrder: this.sortPkgNameWidthPriority(e),
      handles: this.assetHandlers[s],
    };
  }
  getHooksInfo(e) {
    const t = { pkgNameOrder: [], infos: {} };

    Object.keys(this.builderPathsMap[e]).forEach((s) => {
      t.infos[s] = {
        path: this.builderPathsMap[e][s],
        internal: platforms_options_1.builtinPlugins.includes(s),
      };
    });

    t.pkgNameOrder = this.sortPkgNameWidthPriority(Object.keys(t.infos));
    return t;
  }
  getBuildTemplateConfig(s) {
    return this.buildTemplateConfigMap[
      this.platformConfigs[s].createTemplateLabel
    ];
  }
  queryPlatformType(s) {
    return this.platformConfigs[s].platformType || "INVALID_PLATFORM";
  }
  getBuildStageWithHookTasks(s, e) {
    var t = this.customBuildStages[s];
    if (t) {
      for (const r of this.sortPkgNameWidthPriority(Object.keys(t))) {
        var o = t[r].find((s) => s.type === "hook" && s.hook === e);
        if (o) {
          return o;
        }
      }
    }
    return null;
  }
  getHookPath(s, e) {
    return this.builderPathsMap[s]?.[e];
  }
  sortPkgNameWidthPriority(s) {
    return s.sort((s, e) =>
      !platforms_options_1.platformPlugins.includes(s) &&
      platforms_options_1.platformPlugins.includes(e)
        ? 1
        : platforms_options_1.platformPlugins.includes(s) &&
          !platforms_options_1.platformPlugins.includes(e)
        ? -1
        : this.pkgPriorities[e] - this.pkgPriorities[s]
    );
  }
}
exports.pluginManager = new PluginManager();
