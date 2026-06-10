Object.defineProperty(exports, "__esModule", { value: true });
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
let panel = null;
let vm;

const vueTemplate = readFileSync(
  join(__dirname, "../../../static/template/debug-tools.html"),
  "utf8"
);

const BuilderDebugVM = Vue.extend({
  name: "BuilderDebugVM",
  data() {
    return {
      taskMap: {},
      debugOptions: { config: {}, cacheConfig: { engine: true } },
      debug: false,
      tips: "",
      tipsTimer: null,
    };
  },
  async mounted() {
    var e = await Editor.Message.request(
      "builder",
      "request-to-build-worker",
      "build-worker:query-task-map"
    );

    var e =
      (e && (this.taskMap = e),
      await Editor.Profile.getConfig("builder", "debug-tools"));

    Object.assign(this.debugOptions, e);
  },
  methods: {
    onConfirm(e, t, i) {
      if (!this.debugOptions.config[t]) {
        this.debugOptions.config[t] = {};
      }

      this.debugOptions.config[t][i] = e;
    },
    async save() {
      await Editor.Profile.setConfig(
        "builder",
        "debug-tools",
        this.debugOptions,
        "local"
      );

      clearTimeout(this.tipsTimer);
      this.tips = "The debug configuration was saved successfully.";

      this.tipsTimer = setTimeout(() => {
        this.tips = "";
      }, 1000 /* 1e3 */);
    },
    async onDebug(e) {
      this.debug = e;

      await Editor.Message.send(
        "builder",
        "request-to-build-worker",
        "build-worker:change-debug-mode",
        e
      );
    },
    async noCacheOption(e, t) {
      e = e.target.value;
      this.debugOptions.cacheConfig[t] = e;

      await Editor.Message.send(
        "builder",
        "request-to-build-worker",
        "build-worker:change-cache-config",
        t,
        e
      );
    },
    isSelectAll(e, t) {
      var i = this.taskMap[e];
      if (Array.isArray(i) && t) {
        for (const e of i) {
          if (t[e] === false) {
            return false;
          }
        }
      }
      return true;
    },
    selectAllTask(e, t) {
      var i = this.taskMap[e];
      if (Array.isArray(i)) {
        for (const e of i) {
          this.debugOptions.config[e] = t;
        }
      }
    },
  },
  template: vueTemplate,
});

function ready() {
  panel = this;
  vm?.$destroy();
  (vm = new BuilderDebugVM()).$mount(panel.$.container);
}
async function beforeClose() {
  if (vm) {
    await vm.onDebug(false);
  }

  return true;
}
function close() {
  vm?.$destroy();
  vm = null;
  panel = null;
}

exports.style = readFileSync(
  join(__dirname, "../../../dist/debug-tools.css"),
  "utf8"
);

exports.template = `
<div class="container"></div>
`;

exports.$ = { container: ".container" };
