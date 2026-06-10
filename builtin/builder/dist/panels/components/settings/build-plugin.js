var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, n, r = n) => {
        var a = Object.getOwnPropertyDescriptor(t, n);

        if (
          !a ||
          (!("get" in a) ? !a.writable && !a.configurable : t.__esModule)
        ) {
          a = {
            enumerable: true,
            get() {
              return t[n];
            },
          };
        }

        Object.defineProperty(e, r, a);
      }
    : (e, t, n, r) => {
        e[(r = r === undefined ? n : r)] = t[n];
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
    var a = (e) =>
      (a =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var n = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              n[n.length] = t;
            }
          }
          return n;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var n = a(e), r = 0; r < n.length; r++) {
          if (n[r] !== "default") {
            __createBinding(t, e, n[r]);
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
exports.components = undefined;
exports.props = undefined;
exports.template = undefined;

exports.data = data;
exports.mounted = mounted;

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const platformConfig = __importStar(
  require("../../../share/platforms-options")
);
const buttonsComponent = __importStar(require("../buttons"));
const buildProp = __importStar(require("../build-prop/index"));
const Vue = require("vue/dist/vue.js");
function data() {
  return {
    builtinPlugins: platformConfig.builtinPlugins,
    internalNativePlugins: platformConfig.internalNativePlugins,
  };
}
function mounted() {
  var e = this;
  e.updatePluginRender(e.options.platform);
  e.dev = Editor.App.dev;
}
Vue.config.productionTip = false;
Vue.config.devtools = false;

exports.template = readFileSync(
  join(
    __dirname,
    "../../../../static",
    "/template/components/settings/build-plugin.html"
  ),
  "utf8"
);

exports.props = ["config", "options", "free", "errorMap", "name", "type"];
exports.components = { "build-prop": buildProp, buttons: buttonsComponent };

exports.computed = {
  pkgOptions() {
    var e = this;
    return JSON.parse(
      JSON.stringify(
        (e.options.packages && e.options.packages[e.config.pkgName]) || {}
      )
    );
  },
};

exports.methods = {
  t(e, t = true) {
    e = e.replace("i18n:", "");
    t = Editor.I18n.t((t ? "builder." : "") + e);
    return t && typeof t == "string" ? t : e;
  },
  onConfirm(e, t) {
    e = e.target.value;
    this.onDataUpdate(t, e);
  },
  onPanelUpdate(e, t, n) {
    this.$emit("datachange", this.config.pkgName, e, t, n);
  },
  onDataUpdate(e, t, n) {
    var r = this;
    r.$root.updateErrorMap(`packages.${r.config.pkgName}.` + e, n);

    r.$emit(
      "datachange",
      r.config.pkgName,
      `packages.${r.config.pkgName}.` + e,
      t,
      n
    );
  },
  updatePluginRender() {
    const t = this;
    const t_config = t.config;
    if (t_config.panelInfo) {
      const r = document.createElement("ui-panel");
      const a = {};

      Object.keys(t_config.panelInfo).forEach((e) => {
        a[e] = t_config.panelInfo[e];
      });

      if (t_config.panelInfo.ready) {
        a.ready = () => {
          r.ready = true;

          return t_config.panelInfo.ready.call(
            r.panelObject,
            JSON.parse(JSON.stringify(t.options)),
            t.type,
            t_config.pkgName,
            JSON.parse(JSON.stringify(t.errorMap))
          );
        };
      }

      a.style =
        readFileSync(
          join(__dirname, "./../../../../dist/build-plugin.css"),
          "utf8"
        ) + (a.style || "");

      r.config = a;
      r.setAttribute("name", t_config.displayName);
      t.$uiPanel = r;

      Vue.nextTick(() => {
        var e = Array.isArray(t.$refs[t_config.pkgName])
          ? t.$refs[t_config.pkgName][0]
          : t.$refs[t_config.pkgName];

        if (e) {
          e.innerHTML = "";
          e.appendChild(r);
        } else {
          console.warn("Can't get pluginContent from " + t_config.pkgName);
        }
      });
    }
  },
  async update(e, t) {
    var n = this;

    if (n.$uiPanel && n.$uiPanel.ready) {
      n.$uiPanel.update(JSON.parse(JSON.stringify(n.options)), t);
    }
  },
};
