var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, i, n = i) => {
        var o = Object.getOwnPropertyDescriptor(t, i);

        if (
          !o ||
          (!("get" in o) ? !o.writable && !o.configurable : t.__esModule)
        ) {
          o = {
            enumerable: true,
            get() {
              return t[i];
            },
          };
        }

        Object.defineProperty(e, n, o);
      }
    : (e, t, i, n) => {
        e[(n = n === undefined ? i : n)] = t[i];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var o = (e) =>
      (o =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var i = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              i[i.length] = t;
            }
          }
          return i;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var i = o(e), n = 0; n < i.length; n++) {
          if (i[n] !== "default") {
            __createBinding(t, e, i[n]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.exportConfig = exportConfig;
exports.importConfig = importConfig;
exports.close = close;

const { readFileSync } = require("fs");

const { readJSONSync, outputFile } = require("fs-extra");

const { join } = require("path");

const bundle_utils_1 = require("../../share/bundle-utils");

const { transI18nName } = require("../../share/utils");

const BundleConfigGroup = __importStar(require("./bundle-config-group"));
const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel = null;
let vm;

const vueTemplate = readFileSync(
  join(__dirname, "../../../static/contributions/bundle-config.html"),
  "utf8"
);

const ProjectPanelVM = Vue.extend({
  name: "ProjectPanelVM",
  components: { "config-group": BundleConfigGroup },
  data() {
    return {
      configID: "",
      renderConfigs: {},
      customConfigs: {},
      renameState: {},
      mousedownHandle(e) {},
      defaultConfig: JSON.parse(
        JSON.stringify(bundle_utils_1.DefaultBundleConfig)
      ),
    };
  },
  async mounted() {
    await this.initData();
    this.mousedownHandle = this.onMouseDown.bind(this);
    document.addEventListener("mousedown", this.mousedownHandle);

    if (this.configID) {
      Vue.nextTick(() => {
        this.jumpToConfig(this.configID);
      });
    }
  },
  destroyed() {
    document.removeEventListener("mousedown", this.mousedownHandle);
  },
  methods: {
    async initData() {
      var e = await Editor.Message.request("builder", "query-bundle-config");

      var e =
        ((this.renderConfigs = Object.freeze(e)),
        await Editor.Profile.getProject("builder", "bundleConfig.custom"));

      this.customConfigs = e;

      if (this.customConfigs.default) {
        this.defaultConfig = this.customConfigs.default;
      }
    },
    onRename(e, t, i) {
      i.displayName = e || i.displayName;
      this.$set(this.renameState, t, false);
      this.saveConfig();
    },
    configMenu(e, t, i) {
      Editor.Menu.popup({
        x: e.x,
        y: e.y,
        menu: [
          {
            label: "i18n:builder.copyConfig",
            click: () => {
              this.newConfig(i);
            },
          },
          {
            label: "i18n:builder.copyID",
            click: () => {
              Editor.Clipboard.write("text", t);
            },
          },
          {
            label: "i18n:builder.rename",
            enabled: t !== "default",
            click: () => {
              this.$set(this.renameState, t, true);

              this.$nextTick(() => {
                let e = this.$refs["renameInput" + t];

                if (e) {
                  (e = Array.isArray(e) ? e[0] : e).focus({
                    preventScroll: true,
                  });

                  e.$input.setSelectionRange(0, i.displayName.length);
                }
              });
            },
          },
          {
            label: "i18n:builder.delete",
            enabled: t !== "default",
            click: () => {
              this.deleteConfig(t);
            },
          },
        ],
      });
    },
    newConfig(e) {
      let t = (e = e || bundle_utils_1.DefaultBundleConfig).displayName;

      if (t.startsWith("i18n")) {
        t = transI18nName(t);
      }

      const i = Editor.Utils.UUID.generate();

      this.$set(this.customConfigs, i, {
        ...JSON.parse(JSON.stringify(e)),
        displayName: t + " Copy",
      });

      this.saveConfig();

      Vue.nextTick(() => {
        this.jumpToConfig(i);
      });
    },
    saveDefaultConfig() {
      this.$set(this.customConfigs, "default", this.defaultConfig);
      this.saveConfig();
    },
    saveConfig() {
      Editor.Profile.setProject(
        "builder",
        "bundleConfig.custom",
        this.customConfigs
      );
    },
    deleteConfig(e) {
      this.$set(this.customConfigs, e, null);
      delete this.customConfigs[e];
      this.saveConfig();
    },
    async importConfig() {
      var t;

      var i = (
        await Editor.Dialog.select({
          title: Editor.I18n.t("builder.asset_bundle.importConfig"),
          path: Editor.Project.path,
          filters: [{ name: "JSON", extensions: ["json"] }],
        })
      ).filePaths[0];

      if (i) {
        let e = true;

        if (this.customConfigs) {
          t = await Editor.Dialog.warn(
            Editor.I18n.t(
              "builder.project.texture_compress.import_config_options"
            ),
            {
              buttons: [
                Editor.I18n.t("builder.asset_bundle.overwrite"),
                Editor.I18n.t("builder.asset_bundle.merge"),
              ],
              default: 1,
            }
          );

          e = t.response === 1;
        }

        try {
          var n = readJSONSync(i);
          if (e) {
            for (const o of Object.keys(n)) {
              this.$set(this.customConfigs, o, n[o]);
            }
          } else {
            this.customConfigs = n;
          }

          if (this.customConfigs.default) {
            this.defaultConfig = this.customConfigs.default;
          }

          this.saveConfig();
        } catch (e) {
          console.error(e);
        }
      }
    },
    async exportConfig() {
      var e = await Editor.Dialog.save({
        title: Editor.I18n.t("builder.asset_bundle.exportConfig"),
        path: join(Editor.Project.path, "bundle-config.json"),
        filters: [{ name: "JSON", extensions: ["json"] }],
      });

      if (e.filePath) {
        await outputFile(
          e.filePath,
          JSON.stringify(this.customConfigs, null, 2)
        );

        console.log(
          `Texture compress config has export in {link(${e.filePath})}.`
        );
      }
    },
    onMouseDown() {
      this.renameState = {};
    },
    jumpToConfig(e) {
      const t = Array.isArray(this.$refs[e]) ? this.$refs[e][0] : this.$refs[e];

      if (t) {
        t.scrollIntoView();
        t.setAttribute("twinkle", "shake");

        setTimeout(() => {
          t.setAttribute("twinkle", "");
        }, 900);
      }
    },
  },
  template: vueTemplate,
});

function ready(e) {
  panel = this;
  vm?.$destroy();

  (vm = new ProjectPanelVM({ data: { configID: e } })).$mount(
    panel.$.container
  );
}
function exportConfig() {
  if (vm) {
    return { bundleConfig: vm.customConfigs };
  }
}
function importConfig(e) {
  if (vm) {
    vm.customConfigs = e.bundleConfig;
  }
}
function close() {
  vm?.$destroy();
  vm = null;
  panel = null;
}

exports.style = readFileSync(
  join(__dirname, "../../../dist/bundle-config.css"),
  "utf8"
);

exports.template = `
<div class="container"></div>
`;

exports.$ = { container: ".container" };
