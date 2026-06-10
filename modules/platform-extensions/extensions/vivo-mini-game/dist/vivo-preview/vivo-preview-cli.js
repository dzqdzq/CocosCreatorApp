Object.defineProperty(exports, "__esModule", { value: true });
exports.previewManager = undefined;

const { join, dirname } = require("path");

const { existsSync } = require("fs");

const { spawn } = require("child_process");

const { isInstallNodeJs } = require("../utils/cli");

const { copySync } = require("fs-extra");

const killPort = require("./killPort");
class PreviewManager {
  lastPid = null;
  lastRpkPath = "";
  lastPreviewIp = "";
  port = null;
  packToolDir = join(Editor.App.path, "../tools", "vivo-pack-tools");
  run(e, o) {
    var r;

    if (isInstallNodeJs()) {
      if (existsSync(e)) {
        this.lastRpkPath = e;
        copySync(dirname(e), join(this.packToolDir, "dist"));

        existsSync(join(this.packToolDir, "node_modules"))
          ? ((r = process.platform === "win32" ? "npm.cmd" : "npm"),
            (r = spawn(r, ["run", "server"], {
              cwd: this.packToolDir,
              shell: true,
            })),
            (this.lastPid = r.pid || null),
            dirname(dirname(e)),
            r.stdout.on("data", (e) => {
              var r;
              var t;

              if (e && e.includes("地址 http:")) {
                r = e.toString().replace(/[\n\r]/g, "");

                this.lastPreviewIp = r.match((t = /http:\/\/[^\s]*:(\d*)/))[0];

                this.port = Number(r.match(t)[1]);
                o(null, this.lastPreviewIp);
              } else {
                console.debug(e.toString());
              }
            }),
            r.stderr.on("data", (e) => {
              console.error(e.toString());
              o(e);
            }),
            r.on("exit", (e, r) => {
              console.debug("=======vivo preview process exit, exit:" + e);
            }),
            r.on("close", (e, r) => {
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
