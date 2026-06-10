Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.close = close;

const { readFileSync } = require("fs");

const { join } = require("path");

const home_1 = require("./components/home");
const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel = null;
let vm;
function ready(e, ...t) {
  panel = this;
  vm?.$destroy();
  vm = new home_1.PreferenceHomeVM();

  if (e) {
    vm.tab = e;
  }

  if (t) {
    vm.args = t;
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
  changeTab(e, ...t) {
    if (e) {
      vm.tab = e;
      vm.args = t;
    }
  },
  refreshTab(e) {
    panel = this;

    const { tab, args } = vm;

    if (e === tab) {
      panel.changeTab(-1);

      setTimeout(() => {
        panel.changeTab(tab, ...args);
      }, 0);
    }
  },
  queryTab() {
    return vm.tab;
  },
};
