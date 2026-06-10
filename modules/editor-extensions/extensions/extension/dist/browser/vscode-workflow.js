var __importDefault =
  (this && this.__importDefault) ||
  ((o) => (o && o.__esModule ? o : { default: o }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.vscodeWorkflowLog = vscodeWorkflowLog;
exports.vscodeWorkflowWarn = vscodeWorkflowWarn;
exports.vscodeWorkflowError = vscodeWorkflowError;
exports.addChromeDebugSetting = addChromeDebugSetting;
exports.addCompileTask = addCompileTask;

const { readFile, ensureDirSync, writeFile } = require("fs-extra");

const json5_1 = __importDefault(require("json5"));
const path_1 = __importDefault(require("path"));
function vscodeWorkflowLog(o) {
  console.log("[vscode-workflow]: " + o);
}
function vscodeWorkflowWarn(o) {
  console.warn("[vscode-workflow]: " + o);
}
function vscodeWorkflowError(o) {
  console.error("[vscode-workflow]: " + o);
}
async function addChromeDebugSetting() {
  var o = Editor.Project.path;
  var e = path_1.default.join(o, ".vscode");
  var r = path_1.default.join(e, "launch.json");

  var t =
    "http://localhost:" +
    (await Editor.Message.request("server", "query-port"));

  const s = "Cocos Creator Launch Chrome against localhost";
  var a = {
    version: "0.2.0",
    configurations: [
      {
        type: "chrome",
        request: "launch",
        name: s,
        url: t,
        webRoot: "${workspaceFolder}",
      },
    ],
  };
  let n;
  try {
    var i = await readFile(r, "utf-8");
    n = json5_1.default.parse(i);
  } catch (o) {
    n = a;
  }
  ensureDirSync(e);
  n.configurations = n.configurations || [];
  i = n.configurations.find((o) => o.name === s);

  if (i) {
    i.url = t;
  } else {
    n.configurations.push(...a.configurations);
  }

  await writeFile(r, JSON.stringify(n, null, 4), "utf-8");

  vscodeWorkflowLog(
    String.raw`Chrome debug setting has been updated to ${o}\.vscode\launch.json,` +
      " please install Debugger for Chrome VS Code extension to debug your project."
  );

  return null;
}
async function addCompileTask() {
  var o = Editor.Project.path;
  var e = path_1.default.join(o, ".vscode");
  var r = path_1.default.join(e, "tasks.json");
  var t = await Editor.Message.request("server", "query-port");
  const s = "Cocos Creator compile";
  var t = [`http://localhost:${t}/asset-db/refresh`];

  var a = {
    version: "2.0.0",
    tasks: [
      {
        label: s,
        command: "curl",
        args: t,
        type: "shell",
        isBackground: true,
        group: "build",
        presentation: { reveal: "always" },
      },
    ],
  };

  let n;
  try {
    var i = await readFile(r, "utf-8");
    n = json5_1.default.parse(i);
  } catch (o) {
    n = a;
  }
  ensureDirSync(e);
  n.tasks = n.tasks || [];
  i = n.tasks.find((o) => o.label === s);

  if (i) {
    i.args = t;
  } else {
    n.tasks.push(...a.tasks);
  }

  await writeFile(r, JSON.stringify(n, null, 4), "utf-8");

  vscodeWorkflowLog(
    String.raw`Cocos Creator Compiling task has been added to ${o}\.vscode\tasks.json, please run "${s}" task in VS Code to trigger compile in Cocos Creator.`
  );
}
