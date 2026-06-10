Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.exportConfig = exportConfig;
exports.importConfig = importConfig;
exports.close = close;

const { readFileSync } = require("fs");

const { join } = require("path");

const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;
Vue.config.devtools = false;
const home_1 = require("./components/home");

function ready(t) {
  var e = this;
  e.vm?.$destroy();
  e.vm = new home_1.ProjectJointHomeVM();
  e.vm.$mount(e.$.container);
}
async function exportConfig() {
  var t = {};

  t.custom_joint_texture_layouts =
    (await Editor.Message.request(
      "project",
      "query-config",
      "project",
      "custom_joint_texture_layouts"
    )) || [];

  return t;
}
async function importConfig(t) {
  if (t.custom_joint_texture_layouts) {
    await Editor.Message.request(
      "project",
      "set-config",
      "project",
      "custom_joint_texture_layouts",
      t.custom_joint_texture_layouts
    );
  }
}
function close() {
  this.vm?.$destroy();
  this.vm = null;
}

exports.style = readFileSync(join(__dirname, "../joint.css"), "utf8");

exports.template = '<div class="container"></div>';
exports.$ = { container: ".container" };
