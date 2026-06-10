Object.defineProperty(exports, "__esModule", { value: true });
exports.previewManager = undefined;
const path_1 = require("path");
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const cli_1 = require("../utils/cli");
const fs_extra_1 = require("fs-extra");
const killPort = require("./killPort");
class PreviewManager {
  constructor() {
    this.lastPid = null;
    this.lastRpkPath = "";
    this.lastPreviewIp = "";
    this.port = null;

    this.packToolDir = path_1.join(
      Editor.App.path,
      "../tools",
      "vivo-pack-tools"
    );
  }
  run(e, s) {
    var t;

    if (cli_1.isInstallNodeJs()) {
      if (fs_1.existsSync(e)) {
        this.lastRpkPath = e;

        fs_extra_1.copySync(
          path_1.dirname(e),
          path_1.join(this.packToolDir, "dist")
        );

        fs_1.existsSync(path_1.join(this.packToolDir, "node_modules"))
          ? ((t = process.platform === "win32" ? "npm.cmd" : "npm"),
            (t = child_process_1.spawn(t, ["run", "server"], {
              cwd: this.packToolDir,
            })),
            (this.lastPid = t.pid),
            path_1.dirname(path_1.dirname(e)),
            t.stdout.on("data", (e) => {
              var t;
              var r;

              if (e && e.includes("地址 http:")) {
                t = e.toString().replace(/[\n\r]/g, "");

                this.lastPreviewIp = t.match((r = /http:\/\/[^\s]*:(\d*)/))[0];

                this.port = Number(t.match(r)[1]);
                s(null, this.lastPreviewIp);
              } else {
                console.debug(e.toString());
              }
            }),
            t.stderr.on("data", (e) => {
              console.error(e.toString());
              s(e);
            }),
            t.on("exit", (e, t) => {
              console.debug("=======vivo preview process exit, exit:" + e);
            }),
            t.on("close", (e, t) => {
              console.debug("=======vivo preview process close, exit:" + e);
            }))
          : console.error("Please install in (vivo-pack-tools) first!");
      } else {
        console.error(
          `vivo rpk (${e}) does not exist, please build before preview!`
        );
      }
    } else {
      console.error("Please install nodeJs in global first!");
    }
  }
  kill(e) {
    killPort(e, this.port);
  }
}
exports.previewManager = new PreviewManager();
