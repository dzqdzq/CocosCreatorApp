var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.workerManager = undefined;
const tasks_1 = require("./tasks");
const plugin_1 = require("./plugin");
const electron_worker_1 = __importDefault(require("@base/electron-worker"));
class WorkerManager {
  worker = null;
  hasInit = false;
  _debug = false;
  crashNum = 0;
  listenerMap = {};
  async create() {
    return (
      this.worker ||
      ((this.worker = electron_worker_1.default.query("Assets")),
      this.worker) ||
      void console.error(new Error("Can not get [Assets] worker"))
    );
  }
  async init() {
    await this.create();

    if (!this.hasInit) {
      await Editor.Message.request("asset-db", "execute-script", {
        name: "builder",
        method: "initWorkerMessage",
      });

      tasks_1.manager.initWorker(this.worker);

      this.listenerMap.register = (e, r) => {
        this.worker?.send(
          "build-worker:build-plugin-changed",
          "register",
          r,
          plugin_1.pluginManager.platformConfig
        );
      };

      this.listenerMap.unregister = (e, r) => {
        this.worker?.send(
          "build-worker:build-plugin-changed",
          "unregister",
          r,
          plugin_1.pluginManager.platformConfig
        );
      };

      this.worker &&
        this.worker.on("render-process-gone", (e, r) => {
          Editor.Message.broadcast("crash-reporter:report", {
            process: "AssetDB&Build",
            value: { "A100000_AssetDB_&_Build": 1 },
            details: r,
            time: new Date(),
          });

          this.crashNum++;
          tasks_1.manager.onProcessGone(e, r);

          if (this.crashNum <= 3) {
            setTimeout(() => {
              if (this.worker.win) {
                this.worker.win.reload();
              }
            }, 0);
          }
        });

      plugin_1.pluginManager.on("register", this.listenerMap.register);
      plugin_1.pluginManager.on("unregister", this.listenerMap.unregister);

      await this.worker?.send(
        "build-worker:init",
        plugin_1.pluginManager.getAllWorkerPluginInfos(),
        plugin_1.pluginManager.platformConfig,
        plugin_1.pluginManager.buildTemplateConfigMap,
        !!Editor.App.args.build
      );

      this.hasInit = true;
      tasks_1.manager.workerReady = true;
      Editor.Message.broadcast("build-worker:ready");
    }
  }
  async destroy() {
    if (this.hasInit) {
      this.hasInit = false;
      this.crashNum = 0;

      plugin_1.pluginManager.removeListener(
        "register",
        this.listenerMap.register
      );

      plugin_1.pluginManager.removeListener(
        "unregister",
        this.listenerMap.unregister
      );

      delete this.listenerMap.register;
      delete this.listenerMap.unregister;
    }
  }
  async send(e, ...r) {
    if (this.hasInit) {
      return this.worker?.send(e, ...r);
    }
  }
  debug(e) {
    this._debug = e;

    if (this.worker) {
      this.worker.debug(e);
    }
  }
  reset() {
    tasks_1.manager.dbReady = false;
    tasks_1.manager.workerReady = false;
    this.destroy();
  }
}
exports.workerManager = new WorkerManager();
