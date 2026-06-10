var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, s = r) => {
        var o = Object.getOwnPropertyDescriptor(t, r);

        if (
          !o ||
          (!("get" in o) ? !o.writable && !o.configurable : t.__esModule)
        ) {
          o = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, s, o);
      }
    : (e, t, r, s) => {
        e[(s = s === undefined ? r : s)] = t[r];
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
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = o(e), s = 0; s < r.length; s++) {
          if (r[s] !== "default") {
            __createBinding(t, e, r[s]);
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
exports.close = close;
const fs_extra_1 = require("fs-extra");

const { readFileSync } = fs_extra_1;

const { join } = require("path");

const compressPresets = __importStar(require("./page/compress-presets"));
const compressFormat = __importStar(require("./page/compress-format"));
const event_bus_1 = require("./event-bus");
const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;

const vueTemplate = ((Vue.config.devtools = false), fs_extra_1.readFileSync)(
  join(__dirname, "../../../static/contributions/texture-compress.html"),
  "utf8"
);

function ready() {
  var e;
  var t = this;

  if (!t.vm) {
    (e = new Vue({
      components: {
        "compress-presets": compressPresets,
        "compress-format": compressFormat,
      },
      data() {
        return {
          tab: "presets",
          tabList: {
            presets: {
              label: "i18n:builder.project.texture_compress.compress_preset",
              comp: "compress-presets",
            },
            format: {
              label: "i18n:builder.project.texture_compress.custom_format",
              comp: "compress-format",
            },
          },
          textureCompressConfig: null,
          configDirty: false,
          customConfigs: null,
          overwriteFormats: {},
          genMipmaps: true,
        };
      },
      created() {
        document.addEventListener("click", onBlankClick);
      },
      destroyed() {
        document.removeEventListener("click", onBlankClick);
      },
      methods: {
        t(e) {
          return Editor.I18n.t("builder.project.texture_compress." + e);
        },
        async refresh() {
          var e;
          var t;

          var r = await Editor.Message.request(
            "builder",
            "query-compress-config"
          );

          if (r) {
            e =
              (await Editor.Profile.getProject(
                "builder",
                "textureCompressConfig.genMipmaps"
              )) ?? true;

            t =
              (await Editor.Profile.getProject(
                "builder",
                "textureCompressConfig.customConfigs"
              )) || {};

            this.genMipmaps = e;
            this.customConfigs = t;
            this.textureCompressConfig = r;
            this.calcOverwriteFormats();
          }
        },
        calcOverwriteFormats() {
          const r = this.customConfigs;
          if (r) {
            var e = Object.values(r);
            if (Array.isArray(e)) {
              const s = {};

              e.forEach((e) => {
                var t;

                if (e.overwrite) {
                  (t = s[e.format]) &&
                    (t = r[t]) &&
                    ((t.overwrite = false),
                    console.debug(
                      `conflic format config ${e.format}(${
                        s[e.format]
                      } is invalid.)`
                    ));

                  s[e.format] = e.id;
                }
              });

              this.overwriteFormats = s;
            }
          }
        },
        async onChangeTab(t, r) {
          this.tab = t;

          if (this.configDirty) {
            await this.refresh();
          }

          if (r) {
            process.nextTick(() => {
              var e = this.tabList[t];

              if (e && ((e = e.comp), (e = this.$refs[e]))) {
                e.jumpToConfig(r);
              }
            });
          }
        },
        onConfigChange() {
          this.configDirty = true;
        },
        updateMipmapConfig(e) {
          e = e.target;
          this.genMipmaps = e.value === "on";

          Editor.Profile.setProject(
            "builder",
            "textureCompressConfig.genMipmaps",
            this.genMipmaps
          );
        },
      },
      template: vueTemplate,
    })).$mount(t.$.container);

    t.vm = e;
  }

  t.vm.refresh();
}
function onBlankClick(e) {
  event_bus_1.EventBus.$emit("blank-click", e);
}
function close() {
  this.vm?.$destroy();
  this.vm = null;
}

exports.style = readFileSync(join(__dirname, "./texture-compress.css"), "utf8");

exports.template = '<div class="container"></div>';
exports.$ = { container: ".container" };
