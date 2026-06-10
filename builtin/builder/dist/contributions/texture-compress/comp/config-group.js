var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, o = r) => {
        var n = Object.getOwnPropertyDescriptor(t, r);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, o, n);
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
    var n = (e) =>
      (n =
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
        for (var r = n(e), o = 0; o < r.length; o++) {
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
exports.props = undefined;
exports.components = undefined;
exports.template = undefined;

exports.created = created;
exports.beforeDestroy = beforeDestroy;

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const configItems = __importStar(require("./config-items"));
const event_bus_1 = require("../event-bus");

exports.template = readFileSync(
  join(__dirname, "../../../../static/contributions/config-group.html"),
  "utf8"
);

exports.components = { "config-items": configItems };

exports.props = ["compressConfig", "config", "readonly", "overwriteFormats"];

const data = () => ({
  currentPlatform: "web",
  selectPlatforms: [],
});

function created() {
  event_bus_1.EventBus.$on(
    "blank-click",
    (this.onBlankClickBind = this.onBlankClick.bind(this))
  );
}
function beforeDestroy() {
  event_bus_1.EventBus.$off("blank-click", this.onBlankClickBind);
}
exports.data = data;

exports.computed = {
  showOverWrite() {
    var e = this;
    return !(
      !e.platformConfig[e.currentPlatform] ||
      (e.readonly && (!e.config.overwrite || e.config.overwrite.length === 0))
    );
  },
  displayFormatInfo() {
    var e = this;
    if (
      Object.keys(e.config.options).length &&
      e.config.options[e.currentPlatform]
    ) {
      return e.getFormatInfo("options", e.currentPlatform);
    }
  },
  platformConfig() {
    const o = this;
    const n = o.compressConfig.platformConfig;
    const s = {};

    Object.keys(n).forEach((e) => {
      var t;
      var r = n[e];

      if (
        r.textureCompressConfig &&
        ((t = r.textureCompressConfig.platformType),
        o.compressConfig.configGroups[t].supportOverwrite)
      ) {
        s[t] || (s[t] = { [e]: { name: r.name } });
        s[t][e] = { name: r.name };
      }
    });

    return s;
  },
};

exports.methods = {
  onSelectPlatform(t) {
    var e = this.selectPlatforms.findIndex((e) => e === t);

    if (-1 === e) {
      this.selectPlatforms.push(t);
    } else {
      this.selectPlatforms.splice(e, 1);
    }
  },
  onBlankClick() {
    this.selectPlatforms = [];
  },
  showFormatMenu(e, t, r) {
    Editor.Menu.popup({
      x: e.pageX,
      y: e.pageY,
      menu: this.getPlatformMenu(t, r),
    });
  },
  getPlatformMenu(r, o) {
    const n = this;
    let t = [];

    if (r === "options") {
      e = n.compressConfig.configGroups[o].support;
      t = [...new Set([...e.rgba, ...e.rgb])];
    }

    const s = n.compressConfig.formatsInfo;
    const i = [];
    Object.keys(n.compressConfig.textureFormatConfigs).forEach((e) => {
      e = n.compressConfig.textureFormatConfigs[e];

      if (e.formats.length === 1) {
        i.push(n.formatConfigOption(r, e.formats[0], o));
      } else {
        t.length && e.formats.filter((e) => t.includes(e.value));

        i.push({
          label: e.displayName,
          submenu: e.formats.map((e) => n.formatConfigOption(r, e, o)),
        });
      }
    });
    var e = Object.keys(n.compressConfig.customFormats).map((e) => {
      return {
        label: s[e].displayName + " (custom)",
        enabled:
          !n.config[o] ||
          ((t = e),
          !Object.keys(n.config[r][o]).find(
            (e) =>
              !!s[e] &&
              s[t].formatType === s[e].formatType &&
              s[t].alpha === s[e].alpha
          )),
        click() {
          n.$emit("add", r, o, e);
        },
      };
      var t;
    });
    return [...i, { type: "separator" }, ...e];
  },
  checkFormatIsEnable(e, t, r) {
    const o = this;
    if (!o.config[e] || !o.config[e][r]) {
      return true;
    }
    const n = o.compressConfig.formatsInfo[t];
    return !Object.keys(o.config[e][r]).find(
      (e) =>
        o.compressConfig.formatsInfo[e].formatType === n.formatType &&
        n.alpha === o.compressConfig.formatsInfo[e].alpha
    );
  },
  formatConfigOption(e, t, r) {
    const o = this;
    return {
      label: t.displayName,
      enabled: o.checkFormatIsEnable(e, t.value, r),
      click() {
        o.$emit("add", e, r, t.value);
      },
    };
  },
  getFormatInfo(n, s) {
    const i = {};
    const a = this;

    Object.keys(a.config[n][s]).forEach((e) => {
      var t;
      var r;
      var o = a.compressConfig.formatsInfo[e];

      if (o) {
        t = JSON.parse(JSON.stringify(o));

        a.overwriteFormats[e] &&
          a.compressConfig.formatsInfo[a.overwriteFormats[e]] &&
          ((r = a.compressConfig.formatsInfo[a.overwriteFormats[e]]),
          (t.overwritedInfo = {
            displayName: r.displayName,
            id: a.overwriteFormats[e],
          }));

        t.value = a.config[n][s][e];

        r = JSON.parse(
          JSON.stringify(
            a.compressConfig.textureFormatConfigs[o.formatType].options
          )
        );

        a.readonly &&
          (r.quality.render = Object.assign(r.quality.render, {
            attributes: { disabled: true },
          }));

        t.options = r;
        i[e] = t;
      } else {
        i[e] = { displayName: "" + e, missing: true };
      }
    });

    return i;
  },
  removeFormat(e, t, r) {
    this.$emit("remove", e, t, r);
  },
  onChangeQuality(e, t, r, o, n) {
    var s = this;

    if (n && o) {
      s.config[e][t][n] = s.config[e][t][n] || {};
      s.config[e][t][n][r] = o;
      s.$emit("update", e, t, n, s.config[e][t][n]);
    }
  },
  getCustomConfigInfo(e) {
    var t = this.compressConfig.formatsInfo[e];
    return t || { displayName: e + "(missing)", missing: true };
  },
  deletePlatformOverwrite() {
    const t = this;
    t.selectPlatforms.forEach((e) => {
      t.$emit("remove", "overwrite", e);
    });
  },
  addPlatformOverwriteFormat(e, t) {
    return this.showFormatMenu(e, "overwrite", t);
  },
  addPlatformOverwriteMenu(e) {
    const t = this;
    var r = Object.keys(t.platformConfig[t.currentPlatform]).map((e) => ({
      label: t.platformConfig[t.currentPlatform][e].name,
      enabled: t.checkPlatformAddEnable(e),

      click: () => {
        t.$emit("add-platform", e, t.currentPlatform);
      },
    }));
    Editor.Menu.popup({ x: e.x, y: e.y, menu: r });
  },
  checkPlatformAddEnable(e) {
    return !this.config.overwrite || !this.config.overwrite[e];
  },
};
