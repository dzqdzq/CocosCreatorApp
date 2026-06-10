var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, o, r = o) => {
        var n = Object.getOwnPropertyDescriptor(t, o);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[o];
            },
          };
        }

        Object.defineProperty(e, r, n);
      }
    : (e, t, o, r) => {
        e[(r = r === undefined ? o : r)] = t[o];
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
          var o = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              o[o.length] = t;
            }
          }
          return o;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var o = n(e), r = 0; r < o.length; r++) {
          if (o[r] !== "default") {
            __createBinding(t, e, o[r]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.beforeClose = beforeClose;
exports.close = close;

const { readFileSync } = require("fs");

const { join } = require("path");

const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;
Vue.config.devtools = false;
const home_1 = require("./components/home");

const buildProp = __importStar(require("./components/build-prop/index"));
const plugin_1 = require("./plugin");
const platformOptions = __importStar(require("../share/platforms-options"));
const validator_manager_1 = require("../share/validator-manager");

const {
  getCommonOptionDefaultByKey,
} = require("../share/common-options-validator");

let panel = null;
const vm = new home_1.BuilderHomeVM();
function ready(e, t) {
  panel = this;

  window.BuildPanel = {
    vueComps: { buildProp },
    validator: validator_manager_1.validator,
    validatorManager: validator_manager_1.validatorManager,
    Vue,
  };

  vm.$destroy();
  vm.$mount(panel.$.container);
  exports.methods["open-page"](e, t);
}
async function updateVmAssetInfo(e, t) {
  if (vm) {
    if (t.importer === "scene") {
      vm.scenes = await getCommonOptionDefaultByKey("scenes");
    } else if (t.importer === "directory") {
      await vm.initAssets();
    }
  }
}
function beforeClose() {
  Editor.Message.send("builder", "save-task");
}
function close() {
  vm?.$destroy();
  panel = null;
  delete window.BuildPanel;
}

exports.style = readFileSync(join(__dirname, "../../dist/index.css"), "utf8");

exports.template = `
<div class="container"></div>
`;

exports.$ = { container: ".container" };

exports.methods = {
  async "asset-db:ready"() {
    if (vm) {
      vm.isDBReady = true;
      await vm.initAssets();
    }
  },
  "asset-db:asset-delete": updateVmAssetInfo,
  "asset-db:asset-add": updateVmAssetInfo,
  "asset-db:asset-change": updateVmAssetInfo,
  onBuildWorkerReady() {
    if (vm) {
      vm.isBuildWorkerReady = true;
      console.debug("onBuildWorkerReady");
    }
  },
  onBuildWorkerClosed() {
    if (vm) {
      vm.isBuildWorkerReady = false;
      console.debug("onBuildWorkerClosed");
    }
  },
  "builder:task-changed"(e, t, o) {
    if (vm) {
      vm.updateTasks(e, t, o);
    }
  },
  "builder:task-delete"(e, t) {
    if (vm) {
      vm.updateTasks(e, t);
    }
  },
  "change-debug-mode"() {
    if (window.pluginManager) {
      delete window.pluginManager;
      delete window.platformOptions;
      delete window.panel;
    } else {
      window.pluginManager = plugin_1.pluginManager;
      window.platformOptions = platformOptions;
      window.panel = panel;
    }
  },
  "open-page"(e, t = "") {
    if (vm && e) {
      vm.openPageSettings.type = e;
      vm.openPageSettings.id = t;
      vm.runOpenPageTask();
    }
  },
  buildByShortcut() {
    if (vm && vm.settingsType === "new" && vm.showSettings) {
      vm.$refs.settingsButtonsWrap.onKeyConfirm();
    }
  },
  "select-all-task"() {
    if (vm) {
      vm.selectAllTask();
    }
  },
  "clear-selected-task"() {
    if (vm) {
      vm.clearSelectedTask();
    }
  },
  "delete-selected-task"() {
    if (vm) {
      vm.deleteSelectedTask();
    }
  },
};
