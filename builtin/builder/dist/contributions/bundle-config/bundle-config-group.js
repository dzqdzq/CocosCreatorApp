var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, o = r) => {
        var i = Object.getOwnPropertyDescriptor(t, r);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, o, i);
      }
    : (e, t, r, o) => {
        e[(o = o === undefined ? r : o)] = t[r];
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
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = i(e), o = 0; o < r.length; o++) {
          if (r[o] !== "default") {
            __createBinding(t, e, r[o]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.computed = undefined;
exports.data = undefined;
exports.components = undefined;
exports.props = undefined;
exports.template = undefined;

exports.created = created;
exports.beforeDestroy = beforeDestroy;

const { readFileSync } = require("fs");

const { join } = require("path");

const bundle_utils_1 = require("../../share/bundle-utils");

const { checkRemoteDisabled } = bundle_utils_1;

const ConfigItem = __importStar(require("./bundle-config-item"));
const PlatformGroup = __importStar(require("./platform-config-group"));
const DefaultBundleConfigItem = {
  isRemote: false,
  compressionType: "merge_dep",
};

exports.template = readFileSync(
  join(__dirname, "../../../static/contributions/bundle-config-group.html"),
  "utf8"
);

exports.props = ["renderConfig", "customConfig", "readonly"];

exports.components = {
  "config-item": ConfigItem,
  "platform-group": PlatformGroup,
};

const data = () => ({
  platformTypes: bundle_utils_1.BundlePlatformTypes,
  currentPlatform: Object.keys(bundle_utils_1.BundlePlatformTypes)[0],

  compressRenderList: Object.freeze(bundle_utils_1.BundlecompressionTypeMap),

  selectPlatform: [],
  updateSettings: -1,
  platformRenderMap: {},
  restPlatformList: [],
});

function created() {
  var e = this.clearSelect.bind(this);
  this.clearSelectBind = e;
  document.addEventListener("click", this.clearSelectBind);
}
function beforeDestroy() {
  document.removeEventListener("click", this.clearSelectBind);
}
exports.data = data;

exports.computed = {
  resetUniDisabledState() {
    var e = this;
    if (e.readonly) {
      return true;
    }
    var t = e.customConfig[e.currentPlatform].overwriteSettings || {};
    let r = e.customConfig[e.currentPlatform].fallbackOptions;
    return (
      (!r && Object.keys(t).length === 0) ||
      ((r = { ...DefaultBundleConfigItem, ...(r || {}) }),
      Object.keys(t).length
        ? Object.values(t).every(
            (e) =>
              e.isRemote === r.isRemote &&
              e.compressionType === r.compressionType
          )
        : DefaultBundleConfigItem.isRemote === r.isRemote &&
          DefaultBundleConfigItem.compressionType === r.compressionType)
    );
  },
  resetDisabledState() {
    var e = this;
    return (
      !!e.readonly ||
      ((e = e.customConfig[e.currentPlatform].overwriteSettings || {}),
      Object.keys(e).length === 0) ||
      Object.values(e).every(
        (e) =>
          !(
            (e.isRemote !== undefined &&
              e.isRemote !== DefaultBundleConfigItem.isRemote) ||
            (e.compressionType &&
              e.compressionType !== DefaultBundleConfigItem.compressionType)
          )
      )
    );
  },
  resetAllDisabledState() {
    var e = this;
    return (
      !!e.readonly ||
      !(e = e.customConfig[e.currentPlatform].fallbackOptions) ||
      Object.keys(e).length === 0 ||
      ((e = { ...DefaultBundleConfigItem, ...(e || {}) }).isRemote ===
        DefaultBundleConfigItem.isRemote &&
        e.compressionType === DefaultBundleConfigItem.compressionType)
    );
  },
};

exports.methods = {
  getRenderList(e, t) {
    var r = this;
    return r.renderConfig[r.currentPlatform].platformConfigs[e]
      ? [
          {
            label:
              r.renderConfig[r.currentPlatform].platformConfigs[e].platformName,
            value: e,
          },
          ...t,
        ]
      : t;
  },
  changePlatform(e) {
    this.currentPlatform = e;
    this.selectPlatform = [];
    this.$emit("changeplatform", e);
  },
  getRestPlatformList() {
    const t = this;
    if (!t.customConfig[t.currentPlatform]) {
      return [];
    }
    const r = t.customConfig[t.currentPlatform].overwriteSettings;
    let e = [];
    return (e =
      r && Object.keys(r).length
        ? Object.keys(t.renderConfig[t.currentPlatform].platformConfigs).filter(
            (e) => !r[e]
          )
        : Object.keys(t.renderConfig[t.currentPlatform].platformConfigs)).map(
      (e) => ({
        label:
          t.renderConfig[t.currentPlatform].platformConfigs[e].platformName,

        value: e,
      })
    );
  },
  onOverwriteSettingsReset(e) {
    const t = this.customConfig[this.currentPlatform].fallbackOptions;
    if (!t || e) {
      this.customConfig[this.currentPlatform].overwriteSettings = {};
    } else {
      const r = this.customConfig[this.currentPlatform].overwriteSettings || {};

      Object.keys(
        this.renderConfig[this.currentPlatform].platformConfigs
      ).forEach((e) => {
        r[e] = JSON.parse(JSON.stringify(t));
      });

      this.$set(this.customConfig[this.currentPlatform], "overwriteSettings", {
        ...r,
      });
    }
    this.onConfigChange();
  },
  onFallbackOptionsReset() {
    this.$set(this.customConfig[this.currentPlatform], "fallbackOptions", {});
    this.onConfigChange();
  },
  onChangeConfigMode(e, t) {
    this.$set(
      this.customConfig[this.currentPlatform],
      "configMode",
      (e && t === "fallback") || (!e && t === "overwrite")
        ? "fallback"
        : "overwrite"
    );

    this.onConfigChange();
  },
  onBundleConfigChange(e, t, r) {
    var o = this.customConfig[this.currentPlatform][r] || {};
    o[e] = t;
    this.$set(this.customConfig[this.currentPlatform], r, { ...o });
    this.onConfigChange();
  },
  onPlatformSettingsChange(e, t) {
    var r = this.customConfig[this.currentPlatform].overwriteSettings || {};
    r[e] = t;

    this.$set(this.customConfig[this.currentPlatform], "overwriteSettings", {
      ...r,
    });

    this.onConfigChange();
  },
  deletePlatformOverwrite() {
    const t = this.customConfig[this.currentPlatform].overwriteSettings;
    var e;

    if (t) {
      this.selectPlatform.length
        ? this.selectPlatform.forEach((e) => {
            delete t[e];
          })
        : ((e = Object.keys(t)[Object.keys(t).length - 1]), delete t[e]);

      this.$set(this.customConfig[this.currentPlatform], "overwriteSettings", {
        ...t,
      });

      this.updatePlatformRenderMap();
      this.onConfigChange();
    }
  },
  addPlatformOverwriteMenu(e) {
    const t = this.customConfig[this.currentPlatform].overwriteSettings || {};
    var r = Object.keys(
      this.renderConfig[this.currentPlatform].platformConfigs
    ).map((e) => ({
      label:
        this.renderConfig[this.currentPlatform].platformConfigs[e].platformName,

      enabled: !t[e],

      click: () => {
        this.addPlatformOverwrite(e);
      },
    }));
    Editor.Menu.popup({ x: e.x, y: e.y, menu: r });
  },
  addPlatformOverwrite(e) {
    var t = this.customConfig[this.currentPlatform].overwriteSettings || {};
    t[e] = JSON.parse(JSON.stringify(DefaultBundleConfigItem));

    this.$set(this.customConfig[this.currentPlatform], "overwriteSettings", {
      ...t,
    });

    this.updatePlatformRenderMap();
    this.onConfigChange();
  },
  changeOverWritePlatform(e, t) {
    var r = this.customConfig[this.currentPlatform].overwriteSettings || {};
    var o = r[t];

    var i =
      this.renderConfig[this.currentPlatform].platformConfigs[e].supportOptions;

    if (!i.compressionType.includes(o.compressionType)) {
      o.compressionType = i.compressionType[0];
    }

    r[e] = o;
    delete r[t];
    this.updatePlatformRenderMap();
    this.onConfigChange();
  },
  isRemoteLocked(e) {
    return checkRemoteDisabled(e);
  },
  updatePlatformRenderMap() {
    var e = this.customConfig[this.currentPlatform].overwriteSettings;
    if (e && Object.keys(e).length) {
      const t = this.getRestPlatformList();
      Object.keys(e).forEach((e) => {
        this.$set(this.platformRenderMap, e, this.getRenderList(e, t));
      });
    } else {
      this.platformRenderMap = {};
    }
  },
  onConfigChange() {
    this.updateSettings = -this.updateSettings;
    this.$emit("update", this.customConfig);
  },
  clearSelect() {
    this.selectPlatform = [];
  },
};
