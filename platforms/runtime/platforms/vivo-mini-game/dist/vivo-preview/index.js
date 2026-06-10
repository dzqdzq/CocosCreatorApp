var __awaiter =
  (this && this.__awaiter) ||
  ((e, a, p, n) => new (p = p || Promise)((r, i) => {
    function t(e) {
      try {
        v(n.next(e));
      } catch (e) {
        i(e);
      }
    }
    function o(e) {
      try {
        v(n.throw(e));
      } catch (e) {
        i(e);
      }
    }
    function v(e) {
      var i;

      if (e.done) {
        r(e.value);
      } else {
        ((i = e.value) instanceof p
              ? i
              : new p(e => {
                  e(i);
                })
            ).then(t, o);
      }
    }
    v((n = n.apply(e, a || [])).next());
  }));
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
const vivo_preview_cli_1 = require("./vivo-preview-cli");
const fixPath = require("fix-path");
let panel = null;
let vm;
const Vue = require("vue/dist/vue.js");
function ready(e) {
  return __awaiter(this, undefined, undefined, function* () {
    (panel = this);
    fixPath();

    (vm = new Vue({
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
                : Editor.I18n.t(
                    "vivo-mini-game.debug_tools.waiting_to_run_server"
                  )
              : "请重新在构建页面处点击运行";
          },
        },
        methods: {
          updateRpkPath(i) {
            return __awaiter(this, undefined, undefined, function* () {
              var e = this;

              if (i !== e.rpkPath || !e.previewIp) {
                console.debug("rpkPath", `{link(${i})}`);

                vivo_preview_cli_1.previewManager.lastPid &&
                  vivo_preview_cli_1.previewManager.kill(
                    vivo_preview_cli_1.previewManager.lastPid
                  );

                (e.rpkPath = i);
                yield e.getPreviewIp(i);
              }
            });
          },
          getPreviewIp(e) {
            return __awaiter(this, undefined, undefined, function* () {
              (this.previewIp = yield new Promise((r, t) => {
                vivo_preview_cli_1.previewManager.run(e, (e, i) => {
                  if (e) {
                    t(e);
                  } else {
                    r(i);
                  }
                });
              }));

              console.log("vivo preview IP:" + `{link(${this.previewIp})}`);
            });
          },
        },
      }));
  });
}
function beforeClose() {
  return __awaiter(this, undefined, undefined, function* () {
    if (vivo_preview_cli_1.previewManager.lastPid) {
      vivo_preview_cli_1.previewManager.kill(
        vivo_preview_cli_1.previewManager.lastPid
      );
    }
  });
}
function close() {
  return __awaiter(this, undefined, undefined, function* () {});
}
(Vue.config.productionTip = false);
(Vue.config.devtools = false);

(exports.style = fs_1.readFileSync(
    path_1.join(__dirname, "../../dist/vivo-preview.css"),
    "utf8"
  ));

(exports.template = fs_1.readFileSync(
    path_1.join(__dirname, "../../static/vivo-preview.html"),
    "utf8"
  ));

(exports.$ = { "vivo-preview": ".vivo-preview", preview: ".preview" });

(exports.methods = {
    "update-rpk-path"(e) {
      vm.updateRpkPath(e);
    },
  });

(exports.ready = ready);
(exports.beforeClose = beforeClose);
(exports.close = close);
