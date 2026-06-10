var __importDefault =
  (this && this.__importDefault) ||
  ((r) => (r && r.__esModule ? r : { default: r }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;

const { assertsNonNullable, asserts } = require("../utils/asserts");

const path_1 = __importDefault(require("path"));
const worker_message_define_1 = require("../worker-message-define");
const electron_worker_1 = __importDefault(require("@base/electron-worker"));
class ProgrammingWorker {
  static async create() {
    var r = new ProgrammingWorker();
    await r._initialize();
    return r;
  }
  shutdown() {}
  async request(r, ...e) {
    return await this._worker.send(r, ...e);
  }
  openDevTools() {
    this._worker.debug(true);
  }
  constructor() {
    this._worker = electron_worker_1.default.create("Programming");

    this._worker.on("render-process-gone", (r, e) => {
      Editor.Message.broadcast("crash-reporter:report", {
        process: "Programming",
        value: { A100000_Programming: 1 },
        details: e,
        time: new Date(),
      });
    });
  }
  _worker;
  static _WORKER_INDEX_MODULE_PATH = path_1.default.join(
    __dirname,
    "./worker-index"
  );
  async _initialize() {
    var r = require("@editor/creator").getPreloadFilePath();
    await this._worker.init({ preload: r });
    this._worker.require(ProgrammingWorker._WORKER_INDEX_MODULE_PATH);
    this._worker.debug(process.argv.includes("--open-programming-dev-tools"));
    let e = true;
    this._worker.win.webContents.on("did-finish-load", () => {
      if (e) {
        e = false;
      } else {
        this._worker.require(ProgrammingWorker._WORKER_INDEX_MODULE_PATH);
        this._worker.send("packer-driver/start");
      }
    });
  }
}
let programmingWorker = null;
function assertsLoaded(r) {
  assertsNonNullable(r, "Programming worker has not been created.");
}
async function load() {
  asserts(!programmingWorker, "Programming worker has already been created.");

  programmingWorker = await ProgrammingWorker.create();

  if (Editor.App.args.debugScript) {
    programmingWorker.openDevTools();
  }
}
async function unload() {
  assertsLoaded(programmingWorker);
  programmingWorker.shutdown();
}

exports.methods = worker_message_define_1.workerMessageNames.reduce((r, e) => {
  r[e] = async (...r) => {
    assertsNonNullable(programmingWorker);
    return programmingWorker.request(e, ...r);
  };

  return r;
}, {});

exports.methods["open-dev-tools"] = () => {
  if (programmingWorker) {
    programmingWorker.openDevTools();
  } else {
    console.error("Programming worker has not been ready.");
  }
};
