Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginManager = undefined;
exports.checkBundleCompressionSetting = checkBundleCompressionSetting;

const { join, dirname } = require("path");

const bundle_utils_1 = require("../share/bundle-utils");

const {
  getCommonOptions,
  calcValidOutputName,
} = require("../share/common-options-validator");

const platforms_options_1 = require("../share/platforms-options");
const plugin_manager_1 = require("../share/plugin-manager");
class PluginManager extends plugin_manager_1.PluginManagerBase {
  compsMap;
  customBuildButton = {};
  constructor() {
    super();
    const o = {};

    platforms_options_1.builtinPlugins.forEach((t) => {
      o[t] = {};
    });

    this.compsMap = o;
  }
  async unregister(o) {
    super.unregister(o);

    Object.keys(this.compsMap).forEach((t) => {
      delete this.compsMap[t][o.name];
    });
  }
  async internalRegister(t, o) {
    var { platform, config } = t;
    const { name, buildPath, displayName } = o;
    super.internalRegister(t, o);

    if (
      Editor.App.dev ||
      process.platform !== "win32" ||
      !["mac", "ios", "ios-app-clip"].includes(name)
    ) {
      if (
        (Editor.App.dev ||
          process.platform !== "darwin" ||
          name !== "windows") &&
        (config.doc &&
          !config.doc.startsWith("http") &&
          (config.doc = Editor.Utils.Url.getDocUrl(config.doc)),
        (t = this.customIconConfigs[platform][name]) &&
          t.forEach((o) => {
            if (o.type === "image") {
              let o_value = o.value;

              if (o_value.startsWith(".")) {
                o_value = join(dirname(buildPath), o_value);
              } else if (o_value.startsWith("project://")) {
                o_value = Editor.UI.__protected__.File.resolveToRaw(o_value);
              }

              if (o_value !== o.value) {
                o.value = o_value;
              }
            }
          }),
        (o = {
          options: config.options,
          displayName: displayName,
          wrapWithFold: config.wrapWithFold ?? true,
          doc: config.doc,
        }),
        (this.compsMap[platform][name] = Object.assign(
          this.compsMap[platform][name] || {},
          o
        )),
        config.panel) &&
        ((t = dirname(buildPath)),
        (o = Editor.Module.__protected__.requireFile(config.panel, { root: t }))
          .template && (this.compsMap[platform][name].panelInfo = o),
        o.customButton)
      ) {
        this.customBuildButton[platform] = o.customButton;
      }
    }
  }
  getSupportPlatformInfoMap() {
    const o = {};

    Object.keys(this.platformInfoMap).forEach((t) => {
      if (
        (Editor.App.dev ||
          process.platform !== "win32" ||
          !["mac", "ios", "ios-app-clip"].includes(t)) &&
        (Editor.App.dev || process.platform !== "darwin" || t !== "windows")
      ) {
        o[t] = this.platformInfoMap[t];
      }
    });

    return o;
  }
  getPanelComponent() {
    const s = {};

    Object.keys(this.compsMap).forEach((t) => {
      const e = this.compsMap[t];
      Object.keys(e).forEach((t) => {
        var o = e[t].options;
        var o = (o && (s[o.name] = o), e[t].custom);

        if (o) {
          s[o.name] = o;
        }
      });
    });

    return s;
  }
  getPlatformCompInfos(i) {
    if (!i) {
      return [];
    }
    var t = this.compsMap[i];
    if (Object.keys(t).length === 0) {
      return [];
    }
    t = Object.keys(t);
    t.sort((t, o) => this.pkgPriorities[o] - this.pkgPriorities[t]);
    const r = [];

    t.forEach((t) => {
      if (Editor.Package.getPackages({ name: t, enable: true }).length) {
        const e = this.compsMap[i][t].options;
        var o = this.compsMap[i][t].panelInfo;
        const s = {};

        if (e) {
          Object.keys(e).forEach((t) => {
            if (e[t].render || e[t].itemConfigs) {
              s[t] = e[t];
            }
          });
        }

        if (Object.keys(s).length || o) {
          r.push(
            Object.assign(this.compsMap[i][t], { pkgName: t, options: s })
          );
        }
      }
    });

    return r;
  }
  getButtonsConfig(o) {
    if (!this.customBuildStages[o]) {
      return null;
    }
    const e = {};
    var t;

    if (
      this.customBuildStages[o] &&
      ((e.buttons = []), (t = Object.keys(this.customBuildStages[o])).length)
    ) {
      t.sort((t, o) => this.pkgPriorities[o] - this.pkgPriorities[t]);

      t.forEach((t) => {
        e.buttons.push(
          ...this.customBuildStages[o][t].filter((t) => !t.hidden)
        );
      });
    }

    return e;
  }
  getCustomIconConfigs(t) {
    if (!this.customIconConfigs[t]) {
      return null;
    }
    const e = [];
    var o;

    if (
      this.customIconConfigs[t] &&
      (o = Object.keys(this.customIconConfigs[t])).length
    ) {
      o.sort((t, o) => this.pkgPriorities[o] - this.pkgPriorities[t]);

      o.forEach((o) => {
        e.push(
          ...this.customIconConfigs[t][o].map((t) => ({
            ...t,
            pkgName: o,
          }))
        );
      });
    }

    return e;
  }
  async getOptionsByPlatform(t, o = false) {
    var e = await getCommonOptions(t, o);
    for (const i of Object.keys(this.compsMap[t])) {
      e.packages[i] = await Editor.Profile.getConfig(
        i,
        "builder.options." + t,
        o ? "default" : undefined
      );

      if (e.packages[i]) {
        e.packages[i].__version__ = this.packageRegisterInfo.get(i)?.version;
      }
    }
    var s = JSON.parse(JSON.stringify(e));
    s.platform = t;

    s.outputName = await calcValidOutputName(s.buildPath, t, t);

    if (!s.taskName) {
      s.taskName = s.outputName;
    }

    s.__version__ = require(join(__dirname, "../../package.json")).version;

    return s;
  }
}
function checkBundleCompressionSetting(t, o) {
  var e = { error: "", newValue: t };

  if (o && !o.includes(t)) {
    e.newValue = bundle_utils_1.BundleCompressionTypes.MERGE_DEP;
    e.error = ` compression type(${t}) is invalid for this platform!`;
  }

  return e;
}
exports.pluginManager = new PluginManager();
