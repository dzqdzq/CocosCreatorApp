Object.defineProperty(exports, "__esModule", { value: true });
exports.logMgr = undefined;
exports.LogMgr = undefined;

const { join } = require("path");

const { appendFile, outputFile } = require("fs-extra");

function getRealTime() {
  var t = new Date();
  return (t.toLocaleDateString().replace(/\//g, "-") +
  " " + t.toTimeString().slice(0, 8));
}
class LogMgr {
  static Name = "metrics.log";
  logFile = undefined;
  outputLog = false;
  debug = false;
  async init(t = false, e = false) {
    this.outputLog = t;
    this.debug = e;
    try {
      if (Editor.Project.tmpDir) {
        this.logFile = join(Editor.Project.tmpDir, "logs", LogMgr.Name);
      }

      if (this.outputLog && this.logFile) {
        if (this.debug) {
          await appendFile(
            this.logFile,
            "Cocos Creator v" + Editor.App.version + "\n"
          );
        } else {
          await outputFile(
            this.logFile,
            "Cocos Creator v" + Editor.App.version + "\n"
          );
        }
      }
    } catch (t) {
      console.debug(t);
    }
  }
  async collectToFile(t, e) {
    try {
      var o;

      if (typeof e != "string") {
        e = JSON.stringify(e);
      }

      if (this.debug) {
        console.debug(t, e);
      }

      if (this.outputLog && this.logFile) {
        o =
          "----------------------------------------------------------------\n" +
          getRealTime() +
          `: ${t}:${e}
`;

        await appendFile(this.logFile, o);
      }
    } catch (t) {
      console.debug(t);
    }
  }
}
exports.LogMgr = LogMgr;
exports.logMgr = new LogMgr();
