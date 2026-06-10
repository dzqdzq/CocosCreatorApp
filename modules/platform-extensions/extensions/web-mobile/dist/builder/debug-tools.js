Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.watch = undefined;
exports.props = undefined;
exports.template = undefined;
exports.data = data;
exports.mounted = mounted;
const qrcode = require("qrcode");
function data() {
  return { previewUrl: "" };
}
async function mounted() {}

exports.template = `
<div>
    <ui-prop v-show="previewUrl">
        <ui-label slot="label" value="i18n:web-mobile.options.preview_url"></ui-label>
        <canvas slot="content" ref="canvas"></canvas>
    </ui-prop>
    <ui-prop v-show="previewUrl">
        <ui-label slot="label" value="i18n:web-mobile.options.preview_url"></ui-label>
        <div slot="content">
            <ui-link>{{previewUrl}}</ui-link>
        </div>
    </ui-prop>
</div>
`;

exports.props = ["args", "root"];

exports.watch = {
  root() {
    this.previewIp = "";
  },
};

exports.methods = {
  async handleCommand(e) {
    return !this.previewIp && e === "run" && (this.showPreviewQRCode(), true);
  },
  async showPreviewQRCode() {
    var e = this;

    e.previewUrl = await Editor.Message.request(
      "web-mobile",
      "set-preview-path",
      e.root
    );

    qrcode.toCanvas(e.$refs.canvas, e.previewUrl, {
      errorCorrectionLevel: "H",
      maskPattern: 2,
      margin: 1,
    });
  },
};
