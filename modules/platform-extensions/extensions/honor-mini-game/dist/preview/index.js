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

const honor_preview_cli_1 = require("./honor-preview-cli");
const fixPath = require("fix-path");
let panel = null;
let vm;
const Vue = require("vue/dist/vue.js");
async function ready(e) {
  panel = this;
  fixPath();

  vm = new Vue({
    el: panel.$["honor-preview"],
    data: { previewUrl: "", rpkPath: e },
    computed: {
      tips() {
        if (this.rpkPath) {
          if (this.previewUrl) {
            return Editor.I18n.t(
              "honor-mini-game.debug_tools.start_run_server"
            );
          }

          return Editor.I18n.t(
            "honor-mini-game.debug_tools.waiting_to_run_server"
          );
        }

        return Editor.I18n.t("honor-mini-game.debug_tools.please_rebuild");
      },
    },
    methods: {
      async updateRpkPath(e) {
        var r = this;

        if (!existsSync(e) && r.previewUrl) {
          r.msg = Editor.I18n.t("honor-mini-game.debug_tools.please_rebuild");
        } else {
          r.previewUrl = await new Promise((o, t) => {
            honor_preview_cli_1.previewManager.run(e, (e, r) => {
              if (e) {
                t(e);
              } else {
                o(r);
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
  honor_preview_cli_1.previewManager.kill();
}
Vue.config.productionTip = false;
Vue.config.devtools = false;

exports.style = readFileSync(
  join(__dirname, "../../dist/honor-preview.css"),
  "utf8"
);

exports.template = readFileSync(
  join(__dirname, "../../static/honor-preview.html"),
  "utf8"
);

exports.$ = { "honor-preview": ".honor-preview", preview: ".preview" };

exports.methods = {
  "update-rpk-path"(e) {
    vm.updateRpkPath(e);
  },
};
