var __awaiter =
  (this && this.__awaiter) ||
  ((e, a, s, u) =>
    new (s = s || Promise)((i, t) => {
      function r(e) {
        try {
          n(u.next(e));
        } catch (e) {
          t(e);
        }
      }
      function o(e) {
        try {
          n(u.throw(e));
        } catch (e) {
          t(e);
        }
      }
      function n(e) {
        var t;

        if (e.done) {
          i(e.value);
        } else {
          ((t = e.value) instanceof s
            ? t
            : new s((e) => {
                e(t);
              })
          ).then(r, o);
        }
      }
      n((u = u.apply(e, a || [])).next());
    }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.buttonConfig = undefined;
exports.ready = undefined;
exports.update = undefined;
exports.$ = undefined;
exports.data = undefined;
exports.template = undefined;

const fs_1 = require("fs");
const path_1 = require("path");
const qrcode = require("qrcode");
async function getPreviewUrl(t) {
  var e = await Editor.Message.request("server", "query-port");
  return `http://${await Editor.Message.request(
    "preview",
    "get-preview-ip"
  )}:${e}/web-mobile/${t}/index.html`;
}
let panel;
exports.template = fs_1.readFileSync(
  path_1.join(__dirname, "../../static/view.html"),
  "utf8"
);
const component = {
  data() {
    return { preview_url: "" };
  },
  methods: {
    t(e, t = "") {
      return Editor.I18n.t("web-mobile." + t + e);
    },
    preview() {
      return __awaiter(this, undefined, undefined, function* () {
        var panel_options = panel.options;
        var t = Editor.UI.File.resolveToRaw(panel_options.buildPath);
        var t = path_1.join(t, panel_options.outputName);
        return yield Editor.Message.request("web-mobile", "preview", t);
      });
    },
    init() {
      return __awaiter(this, undefined, undefined, function* () {
        this.preview_url = yield getPreviewUrl(panel.options.outputName);

        qrcode.toCanvas(this.$refs.canvas, this.preview_url, {
          errorCorrectionLevel: "H",
          maskPattern: 2,
          margin: 1,
        });
      });
    },
  },
  mounted() {
    this.init();
  },
};
function update(e, t) {
  panel = this;

  if (
    e.buildPath !== panel.options.buildPath ||
    e.outputName !== panel.options.outputName
  ) {
    panel.options = e;
    panel.vm.init();
  }
}
function ready(e) {
  panel = this;
  var t = require("vue/dist/vue.js");
  panel.options = e;
  panel.vm = new t(Object.assign({ el: panel.$.root }, component));
}
exports.data = { vm: null, options: {} };
exports.$ = { root: ".web-mobile" };
exports.update = update;
exports.ready = ready;

exports.buttonConfig = {
  configs: {
    run: {
      label: "i18n:web-mobile.run.label",
      click(e, t) {
        return __awaiter(this, undefined, undefined, function* () {
          t.buildPath = Editor.UI.File.resolveToRaw(t.buildPath);
          var e = path_1.join(t.buildPath, t.outputName);
          yield Editor.Message.request("web-mobile", "preview", e);
        });
      },
    },
  },
};
