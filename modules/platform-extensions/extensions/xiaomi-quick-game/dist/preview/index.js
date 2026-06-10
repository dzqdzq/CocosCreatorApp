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

const preview_cli_1 = require("./preview-cli");
const fixPath = require("fix-path");
let panel = null;
let vm;
const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;
Vue.config.devtools = false;
const qrcode = require("qrcode");

async function ready() {
  panel = this;
  fixPath();

  vm = new Vue({
    el: panel.$.preview,
    data: { previewIp: "", rpkPath: "", pid: null, error: "" },
    computed: {
      tips() {
        var e = this;
        return e.error
          ? Editor.I18n.t("xiaomi-quick-game.start_server_error") +
              ":" +
              e.error
          : e.rpkPath
          ? e.previewIp
            ? "i18n:xiaomi-quick-game.debug_scan_qr_code"
            : "i18n:xiaomi-quick-game.qr_code_generating"
          : "i18n:xiaomi-quick-game.buildBeforePreview";
      },
    },
    methods: {
      async updateRpkPath(e) {
        var r = this;

        if (e !== r.rpkPath) {
          console.debug(`rpkPath({link(${e})}).`);
          preview_cli_1.previewManager.exist();
          r.rpkPath = e;
          await r.getPreviewIp(e);
          await r.updateAddress();
        }
      },
      async getPreviewIp(e) {
        const a = this;
        a.error = "";

        preview_cli_1.previewManager.port = await Editor.Network.getFreePort(
          preview_cli_1.previewManager.port
        );

        if (
          await new Promise((i, t) => {
            preview_cli_1.previewManager.run(e, (e, r) => {
              if (r) {
                a.error = r.message;
                t(r);
              } else {
                i(e);
              }
            });
          })
        ) {
          a.previewIp = await preview_cli_1.previewManager.getPreviewIp();
        }

        a.pid = preview_cli_1.previewManager.lastPid;

        console.log(
          `xiaomi preview IP: {link(${a.previewIp})},pid:` +
            preview_cli_1.previewManager.lastPid
        );
      },
      async updateAddress() {
        qrcode.toCanvas(this.$refs.preview, this.previewIp, {
          errorCorrectionLevel: "H",
          maskPattern: 2,
          margin: 1,
        });
      },
    },
  });
}
function beforeClose() {
  preview_cli_1.previewManager.exist();
}
async function close() {}

exports.style = readFileSync(join(__dirname, "../../dist/preview.css"), "utf8");

exports.template = readFileSync(
  join(__dirname, "../../static/preview.html"),
  "utf8"
);

exports.$ = { preview: ".preview" };

exports.methods = {
  "update-rpk-path"(e) {
    vm.updateRpkPath(e);
  },
};
