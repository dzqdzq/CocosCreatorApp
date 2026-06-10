Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferenceHomeVM = undefined;
exports.template = undefined;

const { readFileSync } = require("fs");

const { join } = require("path");

const Vue = require("vue/dist/vue.js");

exports.template = readFileSync(
  join(__dirname, "../../../static/settings/index.html"),
  "utf8"
);

exports.PreferenceHomeVM = Vue.extend({
  components: {
    general: require("./general"),
    laboratory: require("./laboratory"),
    item: require("./item"),
  },
  data() {
    return {
      tab: "general",
      data: {},
      args: [],
      position: 40,
      preferencesPackagesChanged() {},
    };
  },
  watch: {
    tab() {
      this.handleCustomConfig();
    },
  },
  async mounted() {
    await this.refreshPackagesConfigs();

    this.preferencesPackagesChanged = () => {
      const e = this.tab;
      this.tab = "";

      this.$nextTick(() => {
        this.tab = e;
        this.refreshPackagesConfigs();
      });
    };

    Editor.Message.__protected__.addBroadcastListener(
      "preferences:packages-changed",
      this.preferencesPackagesChanged
    );
  },
  beforeDestroy() {
    Editor.Message.__protected__.removeBroadcastListener(
      "project:packages-changed",
      this.preferencesPackagesChanged
    );
  },
  methods: {
    t(e) {
      return e.startsWith("i18n:") ? Editor.I18n.t(e.substring(5)) : e;
    },
    changeTab(e) {
      this.tab = e;
      this.position = 40;
    },
    splitResize(e) {
      this.position = e.detail.ratio;
    },
    inform(e, t, a) {
      if (t.message) {
        Editor.Message.send(e, t.message, t.path, a);
      }
    },
    async refreshPackagesConfigs() {
      this.data = await Editor.Message.request(
        "preferences",
        "query-preferences-configs"
      );

      if (!this.data || (!this.data[this.tab] && this.tab !== "laboratory")) {
        this.tab = "general";
      }

      this.handleCustomConfig();
    },
    handleCustomConfig() {
      if (this.data && this.data[this.tab] && this.data[this.tab].custom) {
        const t = Editor.Module.__protected__.requireFile(
          this.data[this.tab].custom
        );

        const a = document.createElement("ui-panel");
        const s = {};

        if (
          t &&
          (Object.keys(t).forEach((e) => {
            s[e] = t[e];
          }),
          t.ready)
        ) {
          s.ready = () => {
            a.ready = true;
            return t.ready.call(a.panelObject, ...this.args);
          };
        }

        a.config = s;

        this.$nextTick(() => {
          var e = this.$refs[this.tab];

          if (e) {
            e.innerHTML = "";
            e.appendChild(a);
          }
        });
      }
    },
  },
  template: exports.template,
});
