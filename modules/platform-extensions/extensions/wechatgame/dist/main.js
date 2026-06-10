var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
const path_1 = require("path");

const { dirname, join, normalize } = path_1;

const { existsSync, statSync } = require("fs-extra");

const { spawn } = require("child_process");

const iconv_lite_1 = __importDefault(require("iconv-lite"));
exports.methods = {
  async run(t, e) {
    var o = t.match(
      /([`~!#$%^&*+=<>?"{}|,;'·~！#￥%……&*（）+={}|《》？：“”【】、；‘'，。、])/im
    );

    var o =
      (o &&
        console.warn(
          Editor.I18n.t("wechatgame.tips.build_path_contains_symbol", {
            symbol: o[1],
          })
        ),
      await Editor.Message.request(
        "program",
        "query-program-info",
        "wechatDevtools"
      ));

    let a = o ? o.path : "";
    if (!a || !existsSync(a)) {
      console.warn(
        "" +
          Editor.I18n.t("wechatgame.tips.wechatgame_app_path_empty", {
            wechatgamePath: a,
          })
      );

      if (
        (
          await Editor.Dialog.warn(
            Editor.I18n.t("wechatgame.tips.wechatgame_app_path_empty"),
            { buttons: ["Cancel", "Set Wechat DevTools"] }
          )
        ).response === 1
      ) {
        Editor.Message.send("preferences", "open-settings", "program");
      }

      return false;
    }

    if (!statSync(a).isDirectory() && process.platform === "win32") {
      a = dirname(a);
    }

    o = { stdio: "pipe" };
    let r;

    if (process.platform === "darwin") {
      r = join(a, "Contents/Resources/app.nw/bin/cli");

      existsSync(r) || (r = join(a, "Contents/MacOS/cli"));
    } else {
      r = join(a, "cli.bat");
      o.shell = true;
    }

    if (!existsSync(r)) {
      await Editor.Dialog.error(
        Editor.I18n.t("wechatgame.options.client_path_error")
      );

      return false;
    }

    let s = t;

    if (process.platform === "win32") {
      r = `"${normalize(r)}"`;
      s = path_1.win32.normalize(t);
    }

    t = ["-o", s, "-f", "cocos"];
    console.log("Run command : " + t.join(" "));
    t = spawn(r, t, o);

    if (t && t.stdout) {
      t.stdout.on("data", (t) => {
        console.log(
          "[WeChat Dev Tool] " +
            iconv_lite_1.default.decode(t, "utf8").toString()
        );
      });
    }

    if (t && t.stderr) {
      t.stderr.on("data", (t) => {
        console.warn(
          "[WeChat Dev Tool]" +
            iconv_lite_1.default.decode(t, "utf8").toString()
        );
      });
    }
  },
};
