var __awaiter =
  (this && this.__awaiter) ||
  ((e, a, s, p) =>
    new (s = s || Promise)((r, t) => {
      function o(e) {
        try {
          n(p.next(e));
        } catch (e) {
          t(e);
        }
      }
      function i(e) {
        try {
          n(p.throw(e));
        } catch (e) {
          t(e);
        }
      }
      function n(e) {
        var t;

        if (e.done) {
          r(e.value);
        } else {
          ((t = e.value) instanceof s
            ? t
            : new s((e) => {
                e(t);
              })
          ).then(o, i);
        }
      }
      n((p = p.apply(e, a || [])).next());
    }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.mounted = undefined;
exports.methods = undefined;
exports.watch = undefined;
exports.data = undefined;
exports.props = undefined;
exports.template = undefined;

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
exports.data = data;

exports.watch = {
  root() {
    this.previewIp = "";
  },
};

exports.methods = {
  handleCommand(e) {
    return __awaiter(this, undefined, undefined, function* () {
      return !this.previewIp && e === "run" && (this.showPreviewQRCode(), true);
    });
  },
  showPreviewQRCode() {
    return __awaiter(this, undefined, undefined, function* () {
      var e = this;

      e.previewUrl = yield Editor.Message.request(
        "web-mobile",
        "set-preview-path",
        e.root
      );

      qrcode.toCanvas(e.$refs.canvas, e.previewUrl, {
        errorCorrectionLevel: "H",
        maskPattern: 2,
        margin: 1,
      });
    });
  },
};

exports.mounted = mounted;
