Object.defineProperty(exports, "__esModule", { value: true });
exports.processNameMap = undefined;
exports.queryProcessTree = queryProcessTree;
exports.openPanelDevTool = openPanelDevTool;
exports.closeProcessByPid = closeProcessByPid;
const electron_1 = require("electron");
const processManage_1 = require("./processManage");
exports.processNameMap = {};
const EXE_REG = /^.*[\\\/]([^\\\/]+)\.exe.*$/i;

const formatProcessInfo = (e, o) => {
  if (!o[e.pid]) {
    o[e.pid] = [];
  }

  return {
    detail: {
      pid: e.pid,
      ppid: e.ppid,
      name: e.name,
      cmd: e.cmd,
      memory: e.memory,
      cpu: e.cpu,
      panel: e.panel,
    },
    showArrow: !!o[e.pid].length,
    children: o[e.pid],
  };
};

async function queryProcessTree(e) {
  var o = {};
  let s = null;
  for (const n of process.platform === "darwin"
    ? await processManage_1.macProcess.getProcessList(e)
    : await processManage_1.windowProcess.getProcessList(e)) {
    var r = formatProcessInfo(n, o);

    if (n.pid === e && ((s = r), EXE_REG.test(s.detail.name))) {
      s.detail.name = s.detail.name.replace(EXE_REG, "$1");
    }

    if (o[n.ppid]) {
      o[n.ppid].push(r);
    } else {
      o[n.ppid] = [r];
    }
  }
  return s;
}
async function openPanelDevTool(o) {
  var e = electron_1.BrowserWindow.getAllWindows().find(
    (e) => e.webContents.getOSProcessId() === o
  );

  if (e) {
    e.webContents.openDevTools();
  }
}
async function closeProcessByPid(o) {
  var e = electron_1.BrowserWindow.getAllWindows().find(
    (e) => e.webContents.getOSProcessId() === o
  );

  if (e) {
    e.close();
  }
}
