Object.defineProperty(exports, "__esModule", { value: true });

exports.listeners = undefined;
exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;

exports.ready = ready;
exports.close = close;
const remote_1 = require("@electron/remote");

const { readFileSync } = require("fs");

const { join } = require("path");

const { attach, detach, init, getConfig } = require("./extension");

const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;
Vue.config.devtools = false;
const Manager = require("./manager");

const allLogTypes = ["log", "warn", "error", "info"];
let panel = null;
let vm = null;

const vueTemplate = readFileSync(
  join(__dirname, "../static", "/template/index.html"),
  "utf8"
);

const ConsolePanelVM = Vue.extend({
  components: { "console-list": require("./components/list") },
  data() {
    return {
      updateAnimationId: null,
      tabbar: {
        displayDate: "",
        fontSize: 12,
        lineHeight: 24,
        filterTypes: [...allLogTypes],
        filterRegex: false,
      },
      extendsList: [],
      logTypes: [
        { label: "Log", value: "log" },
        { label: "Info", value: "info" },
        { label: "Warning", value: "warn" },
        { label: "Error", value: "error" },
      ],
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    async onHeaderChange(e, t) {
      var t_target = t.target;
      var r = t_target.value ?? "";
      switch (e) {
        case "clear": {
          Editor.Logger.clear();
          Manager.clear();
          break;
        }
        case "filterRegex": {
          Manager.setFilterRegex(r);
          break;
        }
        case "filterText": {
          Manager.setFilterText(r);
          break;
        }
        case "filterType": {
          const s = t_target.dataset.value;

          if (r) {
            if (s && !this.tabbar.filterTypes.includes(s)) {
              this.tabbar.filterTypes.push(s);
            }
          } else if (
            -1 !== (i = this.tabbar.filterTypes.findIndex((e) => e === s))
          ) {
            this.tabbar.filterTypes.splice(i, 1);
          }

          Manager.setFilterType(this.tabbar.filterTypes);

          await Editor.Profile.setConfig(
            "console",
            "panel.filterTypes",
            this.tabbar.filterTypes
          );

          break;
        }
        case "filterTypeAll": {
          this.tabbar.filterTypes = r ? [...allLogTypes] : [];
          Manager.setFilterType(this.tabbar.filterTypes);

          await Editor.Profile.setConfig(
            "console",
            "panel.filterTypes",
            this.tabbar.filterTypes
          );

          break;
        }
        case "openLog": {
          var i = join(Editor.Project.path, "./temp/logs/project.log");

          if (
            !(await Editor.Message.request(
              "program",
              "open-program",
              "scriptEditor",
              { _args: [i] }
            ))
          ) {
            remote_1.shell.openPath(i);
          }
        }
      }
    },
    update(...t) {
      window.cancelAnimationFrame(this.updateAnimationId);

      this.updateAnimationId = window.requestAnimationFrame(() => {
        var e = this.$refs.list;

        if (e) {
          e.renderList(...t);
        }
      });
    },
    t(e) {
      return Editor.I18n.t("console." + e);
    },
    async init() {
      await this.refresh();
      Manager.setUpdateFn(this.update.bind(this));
      Editor.Logger.__protected__.on("record", exports.methods.record);
      Editor.Logger.__protected__.on("clear", exports.methods.refresh);
    },
    async refresh() {
      var e = await Editor.Logger.query();
      var t = await Editor.Profile.getConfig("console", "panel");

      var a = t.filterType
        ? t.filterType === "all"
          ? [...allLogTypes]
          : [t.filterType]
        : null;

      var r = +t.fontSize || 12;
      this.tabbar.displayDate = t.displayDate;
      this.tabbar.filterTypes = t.filterTypes || a;
      this.tabbar.fontSize = r;
      this.tabbar.lineHeight = 2 * r;
      Manager.reset(e);
      Manager.setFilterType(this.tabbar.filterTypes);
      Manager.showDate(this.tabbar.displayDate);
      Manager.setLineHeight(this.tabbar.lineHeight);
    },
    onClearChange(e, t) {
      Editor.Profile.setConfig(
        e.name,
        e.key,
        { value: t.target.value, show: true },
        "global"
      );
    },
  },
  template: vueTemplate,
});

async function ready(e) {
  panel = this;

  if (e) {
    await Editor.Profile.setConfig("console", "panel.filterTypes", [e]);
  }

  vm?.$destroy();
  (vm = new ConsolePanelVM()).$mount(panel.$.container);

  Editor.Package.__protected__.on("enable", async (e) => {
    attach(e);
    panel.updateExtensionVisible();
  });

  Editor.Package.__protected__.on("disable", async (e) => {
    detach(e);
    panel.updateExtensionVisible();
  });

  init();
  panel.updateExtensionVisible();
}
async function close() {
  Manager.setUpdateFn(null);

  Editor.Logger.__protected__.removeListener("record", exports.methods.record);

  Editor.Logger.__protected__.removeListener("clear", exports.methods.refresh);

  vm?.$destroy();
  vm = null;
  panel = null;
}

exports.style = readFileSync(join(__dirname, "../dist/index.css"), "utf8");

exports.template = '<div class="container"></div>';
exports.$ = { container: ".container" };

exports.methods = {
  record(e) {
    Manager.addItem(e);
    Manager.update();
  },
  async refresh(e) {
    if (e) {
      await Editor.Profile.setConfig("console", "panel.filterType", e);
    }

    if (vm) {
      await vm.refresh();
    }
  },
  async updateExtensionVisible() {
    if (vm) {
      vm.extendsList = await getConfig();
    }
  },
};

exports.listeners = {
  resize() {
    Manager?.update?.(true);
  },
  show() {
    Manager.update();
  },
};
