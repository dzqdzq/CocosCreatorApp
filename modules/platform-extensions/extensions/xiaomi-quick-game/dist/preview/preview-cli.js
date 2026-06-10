Object.defineProperty(exports, "__esModule", { value: true });
exports.previewManager = undefined;

const { spawn, exec } = require("child_process");

const { existsSync } = require("fs");

const { copySync } = require("fs-extra");

const { join, dirname } = require("path");

const killPort = require("./killPort");
class PreviewManager {
  lastPid = null;
  lastPreviewIp = "";
  port = 4000 /* 4e3 */;
  child = null;
  run(e, t) {
    var r;
    var s;

    if (isInstallNodeJs()) {
      if (existsSync(e)) {
        r = join(Editor.App.path, "../tools", "xiaomi-pack-tools");
        copySync(dirname(e), join(r, "dist"));

        existsSync(join(r, "node_modules"))
          ? ((s = process.platform === "win32" ? "npm.cmd" : "npm"),
            (s = spawn(
              s,
              ["run", "server", "--", "--port", String(this.port)],
              { cwd: r, shell: true }
            )),
            (this.lastPid = s.pid || null),
            s.stdout.on("data", (e) => {
              if (e.includes("生成HTTP服务器的二维码")) {
                console.log(e);
                t(true);
              }
            }),
            s.stderr.on("data", (e) => {
              var r = e.toString();
              let s = "error";

              if (
                /Cannot read property 'ws' of undefined/gi.test(r) ||
                /Unhandled promise rejections are deprecated/gi.test(r)
              ) {
                s = "warn";
              }

              console[s](r);
              t(false, e);
            }),
            s.on("exit", (e, r) => {
              console.log("=======child process exit ,exit:" + e);
              this.lastPid = null;
            }),
            s.on("close", (e, r) => {
              console.log("=======child process close ,exit:" + e);
              this.lastPid = null;
            }))
          : console.error(`Please install in (${r}) first!`);
      } else {
        console.error(
          `xiaomi rpk (${e}) does not exist, please build before preview!`
        );
      }
    } else {
      console.error("Please install nodeJs in global first!");
    }
  }
  exist() {
    if (this.lastPid) {
      killPort(this.lastPid, this.port);
    }
  }
  async getPreviewIp() {
    return (
      `http://${await Editor.Message.request("preview", "get-preview-ip")}:` +
      this.port
    );
  }
}
function isInstallNodeJs() {
  return new Promise((r, s) => {
    exec("node -v", {}, (e) => {
      if (e) {
        process.platform === "win32"
          ? console.error(
              new Error(Editor.I18n.t("builder.window_default_npm_path_error"))
            )
          : console.error(
              new Error(Editor.I18n.t("builder.mac_default_npm_path_error"))
            );

        s(false);
      } else {
        r(true);
      }
    });
  });
}
exports.previewManager = new PreviewManager();
