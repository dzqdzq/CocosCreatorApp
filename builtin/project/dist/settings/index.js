Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.close = close;

const { join } = require("path");

const { readFileSync } = require("fs");

const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;
Vue.config.devtools = false;
const home_1 = require("./components/home");

let panel = null;
let vm;
function ready(e, t, ...s) {
  panel = this;
  vm?.$destroy();
  vm = new home_1.ProjectSettingsHomeVM();

  if (e) {
    vm.tab = e;
  }

  if (t) {
    vm.subTab = t;
  }

  if (s) {
    vm.args = s;
  }

  vm.$mount(panel.$.container);
}
function close() {
  vm?.$destroy();
  vm = null;
  panel = null;
}

exports.style = readFileSync(join(__dirname, "./index.css"), "utf8");

exports.template = '<div class="container"></div>';
exports.$ = { container: ".container" };

exports.methods = {
  assetDbReady() {
    if (vm) {
      vm.dbReady = true;
    }
  },
  changeTab(e, t, ...s) {
    if (vm && e && t) {
      vm.tab = e;
      vm.subTab = t;
      vm.args = s;
    }
  },
  refreshTab(e, t) {
    if (vm) {
      const { tab, subTab, args } = vm;

      if (e === tab && t === subTab) {
        panel.changeTab(-1, -1);

        setTimeout(() => {
          panel.changeTab(tab, subTab, ...args);
        }, 0);
      }
    }
  },
  queryTab() {
    return vm && vm.tab && vm.subTab
      ? { tab: vm.tab, subTab: vm.subTab }
      : null;
  },
};
