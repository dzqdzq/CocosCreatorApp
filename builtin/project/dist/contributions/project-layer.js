Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.exportConfig = exportConfig;
exports.importConfig = importConfig;
exports.ready = ready;
exports.close = close;
const fs_1 = require("fs");

const { join } = require("path");

const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;

const vueTemplate = ((Vue.config.devtools = false), fs_1.readFileSync)(
  join(__dirname, "../../static/contributions/general-layer.html"),
  "utf8"
);

const ProjectLayerVM = Vue.extend({
  name: "ProjectLayerVM",
  data() {
    return { layers: [], userLayers: [], builtinLayers: [] };
  },
  mounted() {
    this.refresh();
  },
  methods: {
    async refresh() {
      try {
        this.builtinLayers = await Editor.Message.request(
          "scene",
          "query-layer-builtin"
        );
      } catch (e) {
        console.error(e);
        this.builtinLayers = [];
      }
      let e = await Editor.Profile.getProject("project", "layer");

      if (!e || !Array.isArray(e)) {
        e = [];
      }

      if ((this.userLayers = e).length > 20) {
        this.userLayers = e.splice(0, 20);
        Editor.Profile.setProject("project", "layer", this.userLayers);
      }

      var t = this.userLayers.concat(this.builtinLayers);
      var a = [];
      for (let r = 0; r < 32; r++) {
        const i = 1 << r;
        let e = t.find((e) => e.value === i);
        e = e || { name: "", value: i };
        e.label = r >= 20 ? "Builtin Layer " + r : "User Layer " + r;
        a[r] = e;
      }
      this.layers = a;

      this.layers.sort((e, r) => e.index - r.index);
    },
    async _onSettingsConfirm(e, r) {
      if (!(r >= 20)) {
        const e_target = e.target;
        const i = e_target.value.trim();
        const s = 1 << r;
        e = this.userLayers.find((e) => e.value === s);
        if (i || e) {
          if (i && this.layers.find((e) => e.name === i)) {
            requestAnimationFrame(() => {
              e_target.value = this.layers[r].name;
            });

            console.warn(
              Editor.I18n.t("project.layers.warnInvalidName1", { name: i })
            );
          } else {
            var t = parseInt(i);
            if (typeof t == "number" && !isNaN(t)) {
              for (let e = 0; e < 32; e++) {
                if (t === 1 << e) {
                  requestAnimationFrame(() => {
                    e_target.value = this.layers[r].name;
                  });

                  return void console.warn(
                    Editor.I18n.t("project.layers.warnInvalidName2", {
                      name: t,
                    })
                  );
                }
              }
            }

            if (i) {
              if (e) {
                e.name = i;
              } else {
                this.userLayers.push({ name: i, value: s });
              }
            } else {
              e = this.userLayers.findIndex((e) => e.value === s);
              this.userLayers.splice(e, 1);
            }

            e = this.userLayers.map((e) => ({
              name: e.name,
              value: e.value,
            }));
            await Editor.Profile.setProject("project", "layer", e);
            await this.refresh();
            Editor.Message.broadcast("project:setting-change", "layers");
          }
        }
      }
    },
  },
  template: vueTemplate,
});

async function exportConfig() {
  var e = {};

  e.layer =
    (await Editor.Message.request(
      "project",
      "query-config",
      "project",
      "layer"
    )) || [];

  return e;
}
async function importConfig(e) {
  if (e.layer) {
    await Editor.Message.request(
      "project",
      "set-config",
      "project",
      "layer",
      e.layer
    );
  }
}
function ready() {
  var e = this;
  e.vm?.$destroy();
  e.vm = new ProjectLayerVM();
  e.vm.$mount(e.$.container);
}
function close() {
  this.vm?.$destroy();
  this.vm = null;
}

exports.style = `
.layer > .info { margin-bottom: 1em; }
.content > ui-prop { margin-bottom: 4px; padding-left: 24px; }
.content > ui-prop > ui-input { flex: 1; }
.content > ui-prop { padding: 2px 0; }
.layer { height: 100%; padding-bottom: 40px; box-sizing: border-box;display: flex; flex-direction: column;}
.content { overflow: auto; flex:1; }
`;

exports.template = '<div class="container"></div>';
exports.$ = { container: ".container" };
