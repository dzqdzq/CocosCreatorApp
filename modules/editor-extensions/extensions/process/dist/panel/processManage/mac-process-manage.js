Object.defineProperty(exports, "__esModule", { value: true });
exports.macProcess = undefined;
exports.MacProcessManage = undefined;

const { join } = require("path");

const electron_1 = require("electron");

const MAC_ARM_PATH = join(
  Editor.App.path,
  "../tools/process-info/mac_arm.node"
);

const MAC_X64_PATH = join(
  Editor.App.path,
  "../tools/process-info/mac_x64.node"
);

class MacProcessManage {
  macProcessInstance = null;
  windowPanelCollect = {};
  factor = 1;
  async init() {
    try {
      this.macProcessInstance =
        process.arch === "arm64"
          ? await require(MAC_ARM_PATH)
          : await require(MAC_X64_PATH);

      await this.macProcessInstance.initializeSystem();
      var e = this.macProcessInstance.getCpuBrand();
      var s = e && e.length < 2 ? e.length : 1;
      var t = !(!e || !e[0]) && /Apple/i.test(e[0]);
      this.factor = process.arch !== "arm64" && t ? 0.025 : s;
    } catch (e) {
      console.error(e);
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
  async getProcessList(e) {
    if (!this.macProcessInstance) {
      await this.init();
    }

    this.windowPanelCollect = this.parseWindowInfo();

    return this.macProcessInstance.getProcessInfo().map((e) => ({
      name: this.windowPanelCollect[e.pid]
        ? this.windowPanelCollect[e.pid][0]
        : e.name,

      pid: e.pid,
      ppid: e.ppid,
      memory: Math.ceil(Number(e.memory) / 1024 / 1024),
      cmd: e.command,
      cpu: (Number(e.cpuUsage) / this.factor).toFixed(2) || 0,

      panel:
        !!this.windowPanelCollect[e.pid] && this.windowPanelCollect[e.pid][1],
    }));
  }
}
exports.MacProcessManage = MacProcessManage;
exports.macProcess = new MacProcessManage();
