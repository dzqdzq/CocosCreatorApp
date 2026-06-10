Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.$ = undefined;
exports.style = undefined;
exports.template = undefined;
exports.ready = ready;

const { readdirSync, existsSync, readFileSync } = require("fs-extra");

const { join } = require("path");

const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel = null;
let vm;
const platforms = {};
async function ready(e) {
  panel = this;
  loadComponents();

  if (platforms[e]) {
    vm = new Vue({
      el: panel.$.tools,
      components: platforms,
      data: { page: e },
    });
  }
}
function loadComponents() {
  try {
    const s = join(__dirname, "../platform");
    readdirSync(s).forEach((e) => {
      var t = join(s, e);
      var o = join(s, e, "index");
      if (existsSync(t)) {
        try {
          platforms[e] = require(o);
        } catch (e) {
          console.error(e);
        }
      } else {
        console.error(`Load ${e} plugin failed`);
      }
    });
  } catch (e) {
    console.error("Load components failed");
  }
}

exports.template = readFileSync(
  join(__dirname, "../../static/ui/index.html"),
  "utf-8"
);

exports.style = readFileSync(join(__dirname, "index.css"), "utf8");

exports.$ = { tools: ".channel-upload-tools" };

exports.methods = {
  async loginResult(e, t) {
    vm.$emit("loginResult", e, t);
  },
  async oAuthWindowClose(e) {
    vm.$emit("oAuthWindowClose", e);
  },
};
