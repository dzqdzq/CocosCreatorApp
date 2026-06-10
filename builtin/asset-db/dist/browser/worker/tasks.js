var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.depend = undefined;
exports.autoRefresh = undefined;
exports.getWorker = getWorker;
exports.isReady = isReady;
exports.refreshAllDatabase = refreshAllDatabase;
exports.setAutoRefresh = setAutoRefresh;

const { join } = require("path");

const electron_worker_1 = __importDefault(require("@base/electron-worker"));
const electron_windows_1 = __importDefault(require("@base/electron-windows"));
const vDependence = require("v-dependence");
let ready = false;
function getWorker() {
  return databaseWorker;
}
function isReady() {
  return ready;
}
exports.autoRefresh = true;
exports.depend = vDependence.create();
let databaseWorker = null;
let engineInfo;

exports.depend.add("editor-init", {
  depends: [],
  async handle() {},
  async reset() {},
});

exports.depend.add("engine-info", {
  depends: [],
  async handle() {
    engineInfo = await Editor.Message.request("engine", "query-engine-info");

    exports.depend.finish("engine-info");
  },
  async reset() {},
});

exports.depend.add("worker-init", {
  depends: [],
  async handle() {
    Editor.Metrics.trackTimeStart("asset-db:ready");

    exports.autoRefresh = await Editor.Profile.getConfig(
      "asset-db",
      "autoScan"
    );

    const e = electron_worker_1.default.create("Assets");
    setTimeout(() => {
      if (Editor.App.args.debugAssets) {
        e.debug(true);
      }
    });
    var r = require("@editor/creator").getPreloadFilePath();
    await e.init({ preload: r });
    e.require(join(__dirname, "../../worker/index"));

    e.on("refresh", () => {
      exports.depend.reset("worker-init");
    });

    e.on("closed", () => {
      exports.depend.reset("worker-init");
    });

    e.ipc.on("asset-worker:startup", () => {
      databaseWorker = e;
      exports.depend.finish("worker-init");
    });
  },
  async reset() {
    databaseWorker = null;
  },
});

exports.depend.add("asset-worker-init", {
  depends: ["engine-info", "worker-init"],
  async handle() {
    await databaseWorker.send("asset-worker:init", {
      engine: engineInfo.typescript.path,
      type: Editor.Project.__protected__.type,
      dist: join(__dirname, "../../../dist"),
    });

    exports.depend.finish("asset-worker-init");
  },
  async reset() {},
});

let hasBindEvent = false;

exports.depend.add("asset-db-ready", {
  depends: ["asset-worker-init"],
  async handle() {
    ready = true;
    Editor.Logger.__protected__.record("asset-db is ready!");
    console.debug("asset-db is ready!");

    if (hasBindEvent === false) {
      hasBindEvent = true;
      electron_windows_1.default.on("blur", () => {});

      electron_windows_1.default.on("focus", () => {
        if (exports.autoRefresh) {
          refreshAllDatabase();
        }
      });
    }
  },
  async reset() {
    ready = false;
    Editor.Message.broadcast("asset-db:close");
  },
});

let refreshALlDatabaseTimer = null;

function refreshAllDatabase() {
  if (refreshALlDatabaseTimer) {
    clearTimeout(refreshALlDatabaseTimer);
  }

  refreshALlDatabaseTimer = setTimeout(() => {
    if (databaseWorker) {
      databaseWorker.send("asset-worker:refresh-all-database").then(() => {});
    }
  }, 100);
}
function setAutoRefresh(e) {
  exports.autoRefresh = e;
}
