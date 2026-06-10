Object.defineProperty(exports, "__esModule", { value: true });

exports.close = undefined;
exports.beforeClose = undefined;
exports.ready = undefined;
exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;

const fs_1 = require("fs");
const path_1 = require("path");
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
    data: { previewIp: "", rpkPath: "", pid: null },
    computed: {
      tips() {
        return this.rpkPath
          ? this.previewIp
            ? "打开快应用调试器的扫描安装，即可调试"
            : "正在生成二维码，请稍等"
          : "请重新在构建页面处点击运行";
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
        var r = this;

        if (
          await new Promise((i, t) => {
            preview_cli_1.previewManager.run(e, (e, r) => {
              if (r) {
                t(r);
              } else {
                i(e);
              }
            });
          })
        ) {
          r.previewIp = await preview_cli_1.previewManager.getPreviewIp();
        }

        r.pid = preview_cli_1.previewManager.lastPid;

        console.log(
          `xiaomi preview IP: {link(${r.previewIp})},pid:` +
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
async function beforeClose() {
  preview_cli_1.previewManager.exist();
}
async function close() {}

exports.style = fs_1.readFileSync(
  path_1.join(__dirname, "../../dist/preview.css"),
  "utf8"
);

exports.template = fs_1.readFileSync(
  path_1.join(__dirname, "../../static/preview.html"),
  "utf8"
);

exports.$ = { preview: ".preview" };

exports.methods = {
  "update-rpk-path"(e) {
    vm.updateRpkPath(e);
  },
};

exports.ready = ready;
exports.beforeClose = beforeClose;
exports.close = close;
