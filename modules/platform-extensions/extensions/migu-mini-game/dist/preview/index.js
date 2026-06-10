Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.beforeClose = beforeClose;
exports.close = close;

const { existsSync, readFileSync } = require("fs");

const { join } = require("path");

const migu_preview_cli_1 = require("./migu-preview-cli");
const fixPath = require("fix-path");
let panel = null;
let vm;
const Vue = require("vue/dist/vue.js");
async function ready(e) {
  panel = this;
  fixPath();

  vm = new Vue({
    el: panel.$["migu-preview"],
    data: { previewUrl: "", rpkPath: e },
    computed: {
      tips() {
        if (this.rpkPath) {
          if (this.previewUrl) {
            return Editor.I18n.t("migu-mini-game.debug_tools.start_run_server");
          }

          return Editor.I18n.t(
            "migu-mini-game.debug_tools.waiting_to_run_server"
          );
        }

        return Editor.I18n.t("migu-mini-game.debug_tools.please_rebuild");
      },
    },
    methods: {
      async updateRpkPath(e) {
        var i = this;

        if (!existsSync(e) && i.previewUrl) {
          i.msg = Editor.I18n.t("migu-mini-game.debug_tools.please_rebuild");
        } else {
          i.previewUrl = await new Promise((t, r) => {
            migu_preview_cli_1.previewManager.run(e, (e, i) => {
              if (e) {
                r(e);
              } else {
                t(i);
              }
            });
          });
        }
      },
    },
  });
}
async function beforeClose() {}
async function close() {
  migu_preview_cli_1.previewManager.kill();
}
Vue.config.productionTip = false;
Vue.config.devtools = false;

exports.style = readFileSync(
  join(__dirname, "../../dist/migu-preview.css"),
  "utf8"
);

exports.template = readFileSync(
  join(__dirname, "../../static/migu-preview.html"),
  "utf8"
);

exports.$ = { "migu-preview": ".migu-preview", preview: ".preview" };

exports.methods = {
  "update-rpk-path"(e) {
    vm.updateRpkPath(e);
  },
};
