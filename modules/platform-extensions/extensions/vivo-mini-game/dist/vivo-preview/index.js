Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.beforeClose = beforeClose;
exports.close = close;

const { readFileSync } = require("fs");

const { join } = require("path");

const vivo_preview_cli_1 = require("./vivo-preview-cli");
const fixPath = require("fix-path");
let panel = null;
let vm;
const Vue = require("vue/dist/vue.js");
async function ready(e) {
  panel = this;
  fixPath();

  vm = new Vue({
    el: panel.$["vivo-preview"],
    data: { previewIp: "", rpkPath: e },
    computed: {
      tips() {
        var e = this;
        return e.rpkPath
          ? e.previewIp
            ? Editor.I18n.t("vivo-mini-game.debug_tools.start_run_server", {
                rpk: e.rpkPath,
              })
            : Editor.I18n.t("vivo-mini-game.debug_tools.waiting_to_run_server")
          : "请重新在构建页面处点击运行";
      },
    },
    methods: {
      async updateRpkPath(e) {
        var i = this;

        if (e !== i.rpkPath || !i.previewIp) {
          console.debug("rpkPath", `{link(${e})}`);

          vivo_preview_cli_1.previewManager.lastPid &&
            vivo_preview_cli_1.previewManager.kill(
              vivo_preview_cli_1.previewManager.lastPid
            );

          i.rpkPath = e;
          await i.getPreviewIp(e);
        }
      },
      async getPreviewIp(e) {
        this.previewIp = await new Promise((r, t) => {
          vivo_preview_cli_1.previewManager.run(e, (e, i) => {
            if (e) {
              t(e);
            } else {
              r(i);
            }
          });
        });

        console.log("vivo preview IP:" + `{link(${this.previewIp})}`);
      },
    },
  });
}
async function beforeClose() {
  if (vivo_preview_cli_1.previewManager.lastPid) {
    vivo_preview_cli_1.previewManager.kill(
      vivo_preview_cli_1.previewManager.lastPid
    );
  }
}
async function close() {}
Vue.config.productionTip = false;
Vue.config.devtools = false;

exports.style = readFileSync(
  join(__dirname, "../../dist/vivo-preview.css"),
  "utf8"
);

exports.template = readFileSync(
  join(__dirname, "../../static/vivo-preview.html"),
  "utf8"
);

exports.$ = { "vivo-preview": ".vivo-preview", preview: ".preview" };

exports.methods = {
  "update-rpk-path"(e) {
    vm.updateRpkPath(e);
  },
};
