var __awaiter =
  (this && this.__awaiter) ||
  ((e, p, n, v) =>
    new (n = n || Promise)((t, i) => {
      function o(e) {
        try {
          a(v.next(e));
        } catch (e) {
          i(e);
        }
      }
      function r(e) {
        try {
          a(v.throw(e));
        } catch (e) {
          i(e);
        }
      }
      function a(e) {
        var i;

        if (e.done) {
          t(e.value);
        } else {
          ((i = e.value) instanceof n
            ? i
            : new n((e) => {
                e(i);
              })
          ).then(o, r);
        }
      }
      a((v = v.apply(e, p || [])).next());
    }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.beforeClose = undefined;
exports.mounted = undefined;
exports.methods = undefined;
exports.data = undefined;
exports.props = undefined;
exports.template = undefined;

const vivo_preview_cli_1 = require("./vivo-preview-cli");
const fixPath = require("fix-path");
function data() {
  return {
    previewIp: "",
    tips: "",
    packTools: vivo_preview_cli_1.previewManager.packToolDir,
    rpkPath: "",
  };
}
async function mounted() {
  fixPath();
}
async function beforeClose() {
  this.stop();
}

exports.template = `
<div class="vivo-preview">
    <ui-prop>
        <ui-label slot="label" value="i18n:vivo-mini-game.debug_tools.custom_rpk_path"></ui-label>
        <ui-file :value="rpkPath" slot="content"></ui-file>
    </ui-prop>
    <ui-prop>
        <ui-label slot="label" value="i18n:vivo-mini-game.debug_tools.pack_tool_path"></ui-label>
        <ui-file readonly :value="packTools" slot="content"></ui-file>
    </ui-prop>
</div>

`;

exports.props = ["args", "root"];
exports.data = data;

exports.methods = {
  handleCommand(i) {
    return __awaiter(this, undefined, undefined, function* () {
      var e = this;
      return !(
        e.previewIp ||
        i !== "run" ||
        !e.rpkPath ||
        (console.debug("rpkPath", `{link(${e.rpkPath})}`),
        yield Editor.Panel.open("vivo-mini-game.preview", e.rpkPath),
        Editor.Message.send("vivo-mini-game", "update-rpk-path", e.rpkPath),
        0)
      );
    });
  },
  getPreviewIp() {
    return __awaiter(this, undefined, undefined, function* () {
      const e = this;
      e.tips = "i18n:vivo-mini-game.debug_tools.waiting_to_run_server";

      e.previewIp = yield new Promise((t, o) => {
        vivo_preview_cli_1.previewManager.run(e.rpkPath, (e, i) => {
          if (e) {
            o(e);
          } else {
            t(i);
          }
        });
      });

      e.tips = Editor.I18n.t("vivo-mini-game.debug_tools.start_run_server", {
        rpk: e.rpkPath,
      });

      console.debug("vivo preview IP:" + `{link(${e.previewIp})}`);
    });
  },
  stop() {
    if (vivo_preview_cli_1.previewManager.lastPid) {
      vivo_preview_cli_1.previewManager.kill(
        vivo_preview_cli_1.previewManager.lastPid
      );
    }

    this.previewIp = "";
    this.tips = "";
  },
};

exports.mounted = mounted;
exports.beforeClose = beforeClose;
