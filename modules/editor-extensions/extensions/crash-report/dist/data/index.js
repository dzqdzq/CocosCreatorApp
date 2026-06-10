var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.validValue = validValue;
exports.createCrashReport = createCrashReport;
const os_1 = __importDefault(require("os"));

const { getClientID, getPackages } = require("../utils");

const { join } = require("path");

function validValue(e) {
  return e === undefined ? "unknow" : e;
}
async function createCrashReport(e) {
  var t = validValue((await Editor.User.getData())?.cocos_uid);
  return {
    zipName: `${validValue(e?.param?.msgID)}-${t}-${validValue(
      e?.time?.getTime()
    )}.zip`,
    process: validValue(e?.process),
    details: validValue(e?.details),
    version: Editor.App.version,
    userAgent: Editor.App.userAgent,
    cid: await getClientID(),
    uid: t,
    time: validValue(e?.time?.toString()),
    editorLog: join(Editor.Project.path, "./temp/logs/project.log"),
    buildLog: join(Editor.Project.path, "temp", "builder", "log"),
    dbLog: join(Editor.Project.path, "temp", "asset-db", "log"),
    crashLog: join(
      Editor.Project.path,
      "temp",
      "crash",
      process.platform === "win32" ? "reports" : "pending"
    ),
    projectJSON: join(Editor.Project.path, "package.json"),
    arch: os_1.default.arch(),
    osVersion: os_1.default.version(),
    platform: os_1.default.platform(),
    totalmem: os_1.default.totalmem(),
    freemem: os_1.default.freemem(),
    uptime: os_1.default.uptime(),
    packages: getPackages(),
    cpus: os_1.default.cpus(),
  };
}
