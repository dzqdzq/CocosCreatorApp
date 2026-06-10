Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.close = close;

const { readFileSync } = require("fs");

const { join } = require("path");

const { getVueComponentFromConfig } = require("./custom-render");

const Vue = require("vue/dist/vue.js");
function translateName(e) {
  return e ? ((e = e.replace("i18n:", "")), Editor.I18n.t(e) || e) : "";
}
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel = null;
let vm = null;

const vueTemplate = readFileSync(
  join(__dirname, "../../../static/template/platform-debug-tools.html"),
  "utf8"
);

const BuilderPlatformDebugToolsVM = Vue.extend({
  name: "BuilderPlatformDebugToolsVM",
  data() {
    return {
      platforms: [],
      currentPlatform: "vivo-mini-game",
      currentProjectPath: "",
      projectList: {},
      platformConfigMap: {},
      processState: {},
      selectProject: "",
      consoleInfo: {},
    };
  },
  computed: {
    project() {
      return this.currentProjectPath || this.selectProject;
    },
  },
  methods: {
    translateName,
    async executeCompMethod(t) {
      if (this.currentPlatform && this.currentProjectPath) {
        let e = this.$refs[this.currentPlatform + "custom"];
        if ((e = Array.isArray(e) ? e[0] : e) && e.handleCommand) {
          if (await e.handleCommand(t)) {
            return;
          }
        }
        Editor.Message.send(
          "builder",
          t + "-build-task",
          this.currentProjectPath,
          this.currentPlatform
        );
      }
    },
    resetSelection() {
      this.currentProjectPath = "";
    },
    onPlatformChange(e) {
      e = e.target;
      this.currentPlatform = e.value;
      this.currentProjectPath = "";
    },
  },
  template: vueTemplate,
});

async function ready(e, t, r) {
  console.debug("ready", e, t, r);
  panel = this;
  const o = {};
  const a = [];
  const s = {};
  const n = {};
  const l = await Editor.Message.request("builder", "query-platform-config");

  if (l && Array.isArray(l.order)) {
    l.order.forEach((e) => {
      var t = l.config[e];
      if (
        t &&
        t.name &&
        t.supportRun &&
        t.supportRun &&
        ((o[e] = {}),
        (n[e] = { requireCompile: t.requireCompile, supportRun: t.supportRun }),
        a.push({ label: translateName(t.name), value: e }),
        t.debugConfig)
      ) {
        t = getVueComponentFromConfig(t.debugConfig, e);
        for (const r of t) {
          s[r.name] = r;
        }
        n[e].compNames = t.map((e) => e.name);
      }
    });
  }

  var i = await Editor.Message.request("builder", "query-tasks");

  Object.values(i).forEach((e) => {
    var t;
    var r;

    if (
      e.options &&
      (({ platform: e, buildPath: r, outputName: t } = e.options), o[e]) &&
      r &&
      t
    ) {
      r = join(Editor.UI.__protected__.File.resolveToRaw(r), t);
      o[e][r] = { name: t, path: r };
    }
  });

  vm?.$destroy();

  (vm = new BuilderPlatformDebugToolsVM({
    data: {
      platforms: a,
      currentPlatform: e || "vivo-mini-game",
      currentProjectPath: t || "",
      projectList: o,
      platformConfigMap: n,
    },
    components: s,
  })).$mount(panel.$.container);

  if (r) {
    vm.executeCompMethod(r);
  }
}
function close() {
  vm?.$destroy();
  vm = null;
  panel = null;
}

exports.style = readFileSync(
  join(__dirname, "../../../dist/platform-debug-tools.css")
);

exports.template = `
<div class="container"></div>
`;

exports.$ = { container: ".container" };

exports.methods = {
  initState(e, t, r) {
    if (e) {
      panel.vm.platform = e;
    }

    if (t) {
      panel.vm.packagePath = t;
    }

    if (r) {
      panel.vm.executeCompMethod(r);
    }
  },
  updateCompileProcess(e, t) {
    panel.vm.$set(panel.vm.processState, e, t);
  },
  updateConsole(e, t, r) {
    var o;

    if (e && r && t) {
      o = panel.vm.consoleInfo[e];

      Array.isArray(o)
        ? o.push({ type: t, message: r })
        : panel.vm.$set(panel.vm.consoleInfo, e, [{ type: t, message: r }]);
    }
  },
};
