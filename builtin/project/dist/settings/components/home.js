Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectSettingsHomeVM = undefined;
const fs_1 = require("fs");

const { join } = require("path");

const { get } = require("lodash");

const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;

const template = ((Vue.config.devtools = false), fs_1.readFileSync)(
  join(__dirname, "../../../static/settings/index.html"),
  "utf8"
);

exports.ProjectSettingsHomeVM = Vue.extend({
  name: "ProjectSettingsHomeVM",
  data() {
    return {
      tab: "project",
      subTab: "general",
      configs: {},
      args: [],
      dbReady: false,
      position: 40,
    };
  },
  computed: {
    alignCustomPanelFollowContent() {
      return !!(
        get(this.configs, [this.tab, "tabs", this.subTab, "content"]) &&
        Object.keys(
          get(this.configs, [this.tab, "tabs", this.subTab, "content"])
        ).length > 0
      );
    },
    hasSlider() {
      return !!this.configs && !!Object.keys(this.configs).length;
    },
    hasContent() {
      var { configs, tab, subTab } = this;
      return (
        configs &&
        configs[tab] &&
        configs[tab].tabs[subTab] &&
        (configs[tab].tabs[subTab].content || configs[tab].tabs[subTab].custom)
      );
    },
  },
  watch: {
    subTab() {
      this.handleCustomConfig();
    },
    dbReady(t) {
      if (t) {
        this.handleCustomConfig();
      }
    },
  },
  async mounted() {
    await Promise.all([this.refreshPackagesConfigs(), this._queryDbStatus()]);

    Editor.Message.__protected__.addBroadcastListener(
      "project:packages-changed",
      this.refreshPackagesConfigs
    );
  },
  beforeDestroy() {
    Editor.Message.__protected__.removeBroadcastListener(
      "project:packages-changed",
      this.refreshPackagesConfigs
    );
  },
  methods: {
    changeTab(t, e) {
      this.position = 40;
      this.tab = t;
      this.subTab = e;
    },
    getRenderText(t, e) {
      t.attributes = t.attributes || {};
      t.attributes.path = e;
      return JSON.stringify(t);
    },
    t(t) {
      return typeof t != "string"
        ? ""
        : ((t = t.replace("i18n:", "")), Editor.I18n.t(t) || t);
    },
    popup(t, e, s) {
      if (this.tab) {
        Editor.Menu.popup({
          x: t,
          y: e,
          menu: [
            {
              label: Editor.I18n.t("project.menu.copyConfigKey"),
              click: () => {
                var t = `'${this.tab}', '${s}'`;
                Editor.Clipboard.write("text", t);
              },
            },
            {
              label: Editor.I18n.t("project.menu.copyTabKey"),
              click: () => {
                var t = `'${this.tab}', '${this.subTab}'`;
                Editor.Clipboard.write("text", t);
              },
            },
          ],
        });
      }
    },
    async refreshPackagesConfigs() {
      this.configs = await Editor.Message.request(
        "project",
        "query-project-configs"
      );

      if (
        !this.configs ||
        !this.configs[this.tab] ||
        !this.configs[this.tab].tabs[this.subTab]
      ) {
        this.tab = "project";
        this.subTab = "general";
      }
    },
    handleCustomConfig() {
      if (get(this.configs, [this.tab, "tabs", this.subTab, "custom"])) {
        const e = Editor.Module.__protected__.requireFile(
          get(this.configs, [this.tab, "tabs", this.subTab, "custom"])
        );

        const s = document.createElement("ui-panel");
        const i = {};

        if (
          e &&
          (Object.keys(e).forEach((t) => {
            i[t] = e[t];
          }),
          e.ready)
        ) {
          i.ready = () => {
            s.ready = true;
            return e.ready.call(s.panelObject, ...this.args);
          };
        }

        s.config = i;

        this.$nextTick(() => {
          var t = this.$refs[this.tab + "-" + this.subTab];

          if (t) {
            t.innerHTML = "";
            t.appendChild(s);
          }
        });
      }
    },
    async _queryDbStatus() {
      if (await Editor.Message.request("asset-db", "query-ready")) {
        this.dbReady = true;
      }
    },
    splitResize(t) {
      this.position = t.detail.ratio;
    },
  },
  template,
});
