Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.close = close;
exports.exportConfig = exportConfig;
exports.importConfig = importConfig;
exports.compareEngineInfo = compareEngineInfo;

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;
Vue.config.devtools = false;
const lodash = require("lodash");

let panel = null;
let vm = null;

const vueTemplate = readFileSync(
  join(__dirname, "../../../static/contributions/preferences-engine.html"),
  "utf8"
);

const EnginePreferenceVM = Vue.extend({
  name: "EnginePreferenceVM",
  data() {
    return {
      config: {
        native: { builtin: true, custom: "" },
        javascript: { builtin: true, custom: "" },
      },
      types: {
        "javascript.builtin": "global",
        "javascript.custom": "global",
        "native.builtin": "global",
      },
      showRestartInfo: false,
      engineInfo: null,
    };
  },
  watch: {
    "config.javascript.builtin": {
      async handler(e) {
        if (e) {
          lodash.set(this.config, "native.builtin", true);

          await Editor.Profile.setConfig(
            "engine",
            `engine.${Editor.App.version.replace(/\./g, "")}.native.builtin`,
            true,
            this.types["native.builtin"]
          );
        }
      },
      deep: true,
    },
    "config.javascript.custom": {
      handler(e) {
        if (e.startsWith("project://")) {
          e = Editor.UI.__protected__.File.resolveToRaw(e);
        }

        this.config.native.custom = e ? join(e, "./native") : "";
      },
      deep: true,
    },
  },
  async mounted() {
    var e = await Editor.Profile.getConfig(
      "engine",
      "engine." + Editor.App.version.replace(/\./g, "")
    );

    if (e) {
      this.config = e;
    }

    this.$set(
      this.config.javascript,
      "path",
      join(Editor.App.path, "../resources/3d/engine")
    );

    this.$set(
      this.config.native,
      "path",
      join(Editor.App.path, "../resources/3d/engine/native")
    );

    for (const i of Object.keys(this.types)) {
      await this.refresh(i);
    }
    e = await Editor.Message.request("engine", "query-engine-info");
    this.engineInfo = e;
    this.showRestartInfo = compareEngineInfo(e, this.config);
  },
  methods: {
    async onConfirm(e) {
      var i = e.target.getAttribute("path");
      let t = e.target.value;

      if (i === "javascript.builtin") {
        t = !this.config.javascript.builtin;
      } else if (i === "native.builtin") {
        t = !this.config.native.builtin;
      }

      lodash.set(this.config, i, t);

      await Editor.Profile.setConfig(
        "engine",
        `engine.${Editor.App.version.replace(/\./g, "")}.` + i,
        t,
        this.types[i]
      );

      if (this.engineInfo) {
        this.showRestartInfo = compareEngineInfo(this.engineInfo, this.config);
      }
    },
    async refresh(e) {
      var i = await Editor.Profile.getConfig(
        "engine",
        `engine.${Editor.App.version.replace(/\./g, "")}.` + e,
        "local"
      );
      this.types[e] = i != null ? "local" : "global";
    },
    relaunch() {
      Editor.Message.send("engine", "relaunch");
    },
    onChangePosition(e, i, t) {
      Editor.Menu.popup({
        x: e,
        y: i,
        menu: [
          {
            label: Editor.I18n.t("preferences.menu.move_local"),
            enabled: this.types[t] === "global",
            click: async () => {
              var e = await Editor.Profile.getConfig(
                "engine",
                `engine.${Editor.App.version.replace(/\./g, "")}.` + t
              );

              await Editor.Profile.setConfig(
                "engine",
                `engine.${Editor.App.version.replace(/\./g, "")}.` + t,
                e
              );

              await this.refresh(t);

              if (t === "javascript.builtin") {
                e = await Editor.Profile.getConfig(
                  "engine",
                  `engine.${Editor.App.version.replace(
                    /\./g,
                    ""
                  )}.javascript.custom`
                );

                await Editor.Profile.setConfig(
                  "engine",
                  `engine.${Editor.App.version.replace(
                    /\./g,
                    ""
                  )}.javascript.custom`,
                  e
                );

                await this.refresh("javascript.custom");
              }
            },
          },
          {
            label: Editor.I18n.t("preferences.menu.move_global"),
            enabled: this.types[t] === "local",
            click: async () => {
              var e = await Editor.Profile.getConfig(
                "engine",
                `engine.${Editor.App.version.replace(/\./g, "")}.` + t,
                "local"
              );

              await Editor.Profile.setConfig(
                "engine",
                `engine.${Editor.App.version.replace(/\./g, "")}.` + t,
                e,
                "global"
              );

              await Editor.Profile.removeConfig(
                "engine",
                `engine.${Editor.App.version.replace(/\./g, "")}.` + t,
                this.types[t]
              );

              await this.refresh(t);

              if (t === "javascript.builtin") {
                e = await Editor.Profile.getConfig(
                  "engine",
                  `engine.${Editor.App.version.replace(
                    /\./g,
                    ""
                  )}.javascript.custom`,
                  "local"
                );

                await Editor.Profile.setConfig(
                  "engine",
                  `engine.${Editor.App.version.replace(
                    /\./g,
                    ""
                  )}.javascript.custom`,
                  e,
                  "global"
                );

                await Editor.Profile.removeConfig(
                  "engine",
                  `engine.${Editor.App.version.replace(
                    /\./g,
                    ""
                  )}.javascript.custom`,
                  this.types["javascript.custom"]
                );

                this.refresh("javascript.custom");
              }
            },
          },
        ],
      });
    },
  },
  template: vueTemplate,
});

async function ready() {
  panel = this;
  vm?.$destroy();
  (vm = new EnginePreferenceVM()).$mount(panel.$.container);
}
function close() {
  vm?.$destroy();
  vm = null;
  panel = null;
}
async function exportConfig() {
  var e = {};
  var i = Editor.App.version.replace(/\./g, "");
  let t = "global";
  var n = await Editor.Message.request(
    "preferences",
    "query-config",
    "engine",
    "engine." + i,
    "local"
  );

  if (n != null) {
    t = "local";
  }

  e["engine." + i] = {
    type: t,
    value: await Editor.Message.request(
      "preferences",
      "query-config",
      "engine",
      "engine." + i
    ),
  };

  return e;
}
async function importConfig(e) {
  var i = Editor.App.version.replace(/\./g, "");

  if (e["engine." + i]) {
    await Editor.Message.request(
      "preferences",
      "set-config",
      "engine",
      "engine." + i,
      e["engine." + i].value,
      e["engine." + i].type
    );
  }
}
function compareEngineInfo(e, i) {
  try {
    var t = e.typescript.type === "builtin";
    var n = e.typescript.path;
    var r = e.native.type === "builtin";
    var o = t !== i.javascript.builtin;
    var a = r !== i.native.builtin;

    var s = i.javascript.custom.startsWith("project://")
      ? Editor.UI.__protected__.File.resolveToRaw(i.javascript.custom)
      : i.javascript.custom;

    if (o || a || (!t && n !== s)) {
      return true;
    }
  } catch (e) {
    console.error(e);
  }
  return false;
}

exports.style = readFileSync(join(__dirname, "./engine.css"), "utf8");

exports.template = '<div class="container"></div>';
exports.$ = { container: ".container" };
