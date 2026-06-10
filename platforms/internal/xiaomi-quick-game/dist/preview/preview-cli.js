Object.defineProperty(exports, "__esModule", { value: true });
exports.previewManager = undefined;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const killPort = require("./killPort");
class PreviewManager {
  constructor() {
    this.lastPid = null;
    this.lastPreviewIp = "";
    this.port = "4000";
    this.child = null;
  }
  run(e, r) {
    var s;
    var o;

    if (isInstallNodeJs()) {
      if (fs_1.existsSync(e)) {
        s = path_1.join(Editor.App.path, "../tools", "xiaomi-pack-tools");

        fs_1.existsSync(path_1.join(s, "node_modules"))
          ? ((o = process.platform === "win32" ? "npm.cmd" : "npm"),
            (o = child_process_1.spawn(
              o,
              ["run", "server", "--", "--port", this.port],
              { cwd: s }
            )),
            (this.lastPid = o.pid),
            o.stdout.on("data", (e) => {
              if (e.includes("生成HTTP服务器的二维码")) {
                console.log(e);
                r(true);
              }
            }),
            o.stderr.on("data", (e) => {
              console.error(e.toString());
              r(false, e);
            }),
            o.on("exit", (e, r) => {
              console.log("=======child process exit ,exit:" + e);
              this.lastPid = null;
            }),
            o.on("close", (e, r) => {
              console.log("=======child process close ,exit:" + e);
              this.lastPid = null;
            }))
          : console.error(`Please install in (${s}) first!`);
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
    child_process_1.exec("node -v", {}, (e) => {
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
