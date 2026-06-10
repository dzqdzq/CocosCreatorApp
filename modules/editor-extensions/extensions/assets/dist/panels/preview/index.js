Object.defineProperty(exports, "__esModule", { value: true });

exports.listeners = undefined;
exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;

exports.ready = ready;
exports.close = close;

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const home_1 = require("./components/home");
const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel = null;
let vm = null;
async function ready() {
  panel = this;
  vm?.$destroy();
  (vm = new home_1.AssetsPreviewHomeVM()).$mount(panel.$.container);
  exports.methods.refresh();
}
function close() {
  vm?.$destroy();
  vm = null;
  panel = null;
}

exports.style = readFileSync(
  join(__dirname, "../../../dist/preview.css"),
  "utf8"
);

exports.template = '<div class="container"></div>';
exports.$ = { container: ".container" };

exports.methods = {
  selected(e, t) {
    if (vm && !panel.hidden && e === "asset") {
      vm.select(t);
    }
  },
  unselected(e, t) {
    if (vm && e === "asset") {
      vm.unselect(t);
    }
  },
  changed(e) {
    if (vm && !panel.hidden && vm.uuid === e) {
      vm.select(e);
    }
  },
  refresh() {
    var e = Editor.Selection.getSelected("asset");

    if (e[0] && vm) {
      vm.select(e[0]);
    }
  },
};

exports.listeners = {
  show() {
    exports.methods.refresh();
  },
};
