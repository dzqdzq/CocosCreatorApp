var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, n, r = n) => {
        var o = Object.getOwnPropertyDescriptor(t, n);

        if (
          !o ||
          (!("get" in o) ? !o.writable && !o.configurable : t.__esModule)
        ) {
          o = {
            enumerable: true,
            get() {
              return t[n];
            },
          };
        }

        Object.defineProperty(e, r, o);
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
    var o = (e) =>
      (o =
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
        for (var n = o(e), r = 0; r < n.length; r++) {
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
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.close = close;
const AssetConfigComp = __importStar(require("./asset-config"));
const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel = null;
let vm = null;

const vueTemplate = `
<div class="assetDB">
    <div class="default-meta">
        <ui-label value="i18n:asset-db.preferences.defaultMeta"></ui-label>
        <ui-icon value="help" tooltip="i18n:asset-db.preferences.defaultMetaTip"></ui-icon>
        <asset-config></asset-config>
    </div>
</div>
`;

const PreferencesVM = Vue.extend({
  name: "PreferencesVM",
  components: { "asset-config": AssetConfigComp },
  template: vueTemplate,
});

function ready() {
  panel = this;
  vm?.$destroy();
  (vm = new PreferencesVM()).$mount(panel.$.container);
}
function close() {
  vm?.$destroy();
  vm = null;
  panel = null;
}

exports.style = `
ui-prop > ui-label { padding-left: 2em; }
ui-icon { cursor: pointer; }
.setting[type='local'] { color: var(--color-warn-fill); padding-right: 2px; }
`;

exports.template = `
<div class="container"></div>
`;

exports.$ = { container: ".container" };
