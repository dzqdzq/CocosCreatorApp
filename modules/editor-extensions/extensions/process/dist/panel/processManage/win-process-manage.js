Object.defineProperty(exports, "__esModule", { value: true });
exports.windowProcess = undefined;
exports.WinProcessManage = undefined;

const { join } = require("path");

const electron_1 = require("electron");
const MOD_PATH = join(Editor.App.path, "../tools/windows-process-tree");
const UTILITY_NETWORK_HINT_REG = /--utility-sub-type=network/;
const TYPE_REG = /--type=([a-zA-Z-]+)/;
const JS_REG = /[a-zA-Z-]+\.js/g;
class WinProcessManage {
  windowProcessInstance = null;
  windowPanelCollect = {};
  async init() {
    try {
      this.windowProcessInstance = await require(MOD_PATH);
    } catch (e) {
      console.error(e);
    }
  }
  cleanUNCPrefix(e) {
    switch (true) {
      case e.startsWith("\\\\?\\"):
      case e.startsWith("\\??\\"): {
        return e.slice(4);
      }
      case e.startsWith('"\\\\?\\'):
      case e.startsWith('"\\??\\'): {
        return e.slice(5);
      }
      default: {
        return e;
      }
    }
  }
  parseWindowInfo() {
    var e = electron_1.webContents.getAllWebContents();
    var s = electron_1.BrowserWindow.getAllWindows();
    const t = e.reduce((e, s) => {
      e[s.getOSProcessId()] = [s.getTitle(), false];
      return e;
    }, {});

    s.forEach((e) => {
      e = e.webContents.getOSProcessId();

      if (t[e]) {
        t[e][1] = true;
      }
    });

    return t;
  }
  getProcessName(e, s) {
    if (this.windowPanelCollect[e]) {
      return this.windowPanelCollect[e][0];
    }
    let t = TYPE_REG.exec(s);
    if (t && t.length === 2) {
      return "renderer" === (e = t[1])
        ? "window"
        : e === "utility" && UTILITY_NETWORK_HINT_REG.exec(s)
        ? "utility-network-service"
        : e;
    }
    let n = "";

    while (((t = JS_REG.exec(s)) && (n += t + " "), t)) {}

    return n && !s.includes("node ") && !s.includes("node.exe")
      ? "electron_node " + n
      : s;
  }
  getProcessList(e) {
    return new Promise(async (s) => {
      if (!this.windowProcessInstance) {
        await this.init();
      }

      this.windowPanelCollect = this.parseWindowInfo();

      this.windowProcessInstance.getProcessList(
        e,
        (e) => {
          this.windowProcessInstance.getProcessCpuUsage(e, (e) => {
            e = e.reduce((e, s) => {
              var t = this.cleanUNCPrefix(s.commandLine || "");

              e.push({
                name: this.getProcessName(s.pid, t),
                pid: s.pid,
                ppid: s.ppid,
                cmd: t,
                cpu: Number(s.cpu.toFixed(2)) || 0,
                memory: Math.ceil(s.memory / 1024 / 1024) || 0,
                panel:
                  !!this.windowPanelCollect[s.pid] &&
                  this.windowPanelCollect[s.pid][1],
              });

              return e;
            }, []);
            s(e);
          });
        },
        this.windowProcessInstance.ProcessDataFlag.CommandLine |
          this.windowProcessInstance.ProcessDataFlag.Memory
      );
    });
  }
}
exports.WinProcessManage = WinProcessManage;
exports.windowProcess = new WinProcessManage();
