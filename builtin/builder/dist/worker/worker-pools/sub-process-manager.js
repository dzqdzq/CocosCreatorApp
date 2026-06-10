Object.defineProperty(exports, "__esModule", { value: true });
exports.workerManager = undefined;
exports.WorkerManager = undefined;

const { fork, spawn } = require("child_process");

const { join, dirname } = require("path");

const workerPath = join(__dirname, "../../../static/sub-process-index");
class ProcessPool {
  pool = new Set();
  runningPool = new Set();
  add(e) {
    this.pool.add(e);
  }
  running(e) {
    this.runningPool.add(e);
  }
  notRunning(e) {
    this.runningPool.delete(e);
  }
  delete(e) {
    this.notRunning(e);
    this.pool.delete(e);
  }
  killAll() {
    this.pool.forEach((e) => {
      e.kill();
    });

    this.pool.clear();
  }
  kill(e) {
    e.kill();
    this.notRunning(e);
    this.delete(e);
  }
  killRunning() {
    this.runningPool.forEach((e) => {
      e.kill();
      this.delete(e);
    });

    this.runningPool.clear();
  }
  killFree() {
    this.pool.forEach((e) => {
      if (!this.runningPool.has(e)) {
        e.kill();
        this.pool.delete(e);
      }
    });
  }
}
const processPool = new ProcessPool();
class WorkerTask {
  path;
  lazy = false;
  busy = false;
  _name;
  _method;
  get name() {
    return this._method || this._name;
  }
  _hasResolve = false;
  _hasReject = false;
  _resolve;
  _reject;
  setResolve = (e) => {
    this._hasResolve = false;
    this._resolve = e;
  };
  setReject = (e) => {
    this._hasReject = false;
    this._reject = e;
  };
  resolve = (e) => {
    if (!this._hasResolve && this._method && this._resolve) {
      console.debug(
        `execute-script-end with ${this.name} ${Date.now() - this.startTime}ms`
      );

      this._hasResolve = true;
      delete this._method;
      this._resolve(e);
    }
  };
  reject = (e) => {
    if (!this._hasReject && this._method && this._reject) {
      console.error(e);
      this._hasReject = true;
      delete this._method;
      this._reject(e);
    } else if (e) {
      console.debug(e);
    }
  };
  startTime = Date.now();
  _handleProcess;
  constructor(e) {
    this._name = e.name;
    this.path = e.path;
    this.lazy = e.lazy || false;
  }
  async execute(s, o) {
    const t = await this.getWorkerProcess();
    if (t) {
      return new Promise((e, r) => {
        this._method = s;
        this.setResolve(e);
        this.setReject(r);
        this.startTime = Date.now();

        t.send({
          type: "execute-script",
          path: this.path,
          method: s,
          args: o,
        });

        processPool.running(t);
      });
    }
    throw new Error("No worker " + this.name);
  }
  async getWorkerProcess() {
    if (!this._handleProcess) {
      this._handleProcess = await this.createWorkerProcess();
    }

    return this._handleProcess;
  }
  async createWorkerProcess() {
    const r = fork(workerPath, [], {
      execArgv: WorkerManager.defaultArgv || [],
      stdio: ["ipc", "pipe", "pipe", "pipe"],
      cwd: dirname(process.resourcesPath),
    });

    r.on("message", (e) => {
      if (e && e.type === "execute-script-end") {
        processPool.notRunning(r);

        e.code === 0
          ? this.resolve(e.data)
          : this.reject(
              new Error(`execute-task ${this.name} failed with code ${e.code}!`)
            );
      }
    });

    r.on("error", (e) => {
      this.reject(e);
      this.close();
    });

    r.on("exit", (e, r) => {
      if (e !== 0) {
        this.reject(
          new Error(
            `Exit process with code:${e}, signal:${r} in task ` + this.name
          )
        );
      } else {
        this.resolve();
      }

      this.close();
    });

    r.stdout?.on("data", (e) => {
      console.log(`[${this.name}]` + e.toString());
    });

    r.stderr?.on("data", (e) => {
      e = e.toString();

      if (
        !e ||
        e.includes("Debugger") ||
        e.includes("For help, see") ||
        e.includes("Starting inspector on")
      ) {
        console.debug(e);
      } else if (e.includes("[warning]")) {
        console.warn(`[${this.name}]` + e.replace("[warning]", ""));
      } else {
        console.error(`[${this.name}]` + e);
      }
    });

    processPool.add(r);
    return r;
  }
  close() {
    this.busy = false;
    delete this._method;

    if (this._handleProcess) {
      processPool.kill(this._handleProcess);
      delete this._handleProcess;
    }
  }
}
class WorkerManager {
  taskMap = {};
  _clearFreeChildTimer;
  static defaultArgv = [];
  static async init() {
    WorkerManager.defaultArgv =
      (await Editor.Profile.getConfig("builder", "workerManagerDefaultArgv")) ||
      [];
  }
  static toggleDebug() {
    if (WorkerManager.defaultArgv.includes("--inspect")) {
      WorkerManager.defaultArgv = WorkerManager.defaultArgv.filter(
        (e) => e !== "--inspect"
      );
    } else {
      WorkerManager.defaultArgv.push("--inspect");
    }
  }
  constructor(e) {
    if (e) {
      e.forEach((e) => this.registerTask(e));
    }
  }
  async registerTask(e) {
    if (!this.taskMap[e.name]) {
      this.taskMap[e.name] = new WorkerTask(e);
    }
  }
  async runTask(e, r, s) {
    this.resetClearTimer();
    var o = this.taskMap[e];
    if (o) {
      return o.execute(r, s);
    }
    throw new Error("No worker " + e);
  }
  kill(e) {
    e = this.taskMap[e];

    if (e) {
      e.close();
    }
  }
  killRunningChilds = processPool.killRunning.bind(processPool);
  killFreeChilds = processPool.killFree.bind(processPool);
  resetClearTimer() {
    if (this._clearFreeChildTimer) {
      clearTimeout(this._clearFreeChildTimer);
    }

    this._clearFreeChildTimer = setTimeout(() => {
      this.killFreeChilds();
    }, 1200000 /* 12e5 */);
  }
  quickSpawn(t, i, n = { downGradeLog: true, prefix: "" }) {
    if (t === "npm") {
      t = process.platform === "win32" ? "npm.cmd" : "npm";
    }

    n.prefix = n.prefix || "";

    return new Promise((r, s) => {
      const o = spawn(t, i, {
        cwd: n?.cwd || undefined,
        env: n?.env,
        shell: !!n?.shell,
      });
      processPool.add(o);
      processPool.running(o);

      if (!n.ignoreLog) {
        o.stdout.on("data", (e) => {
          e = e.toString();

          if (n?.downGradeLog) {
            console.debug(n.prefix + e.toString());
          } else {
            console.log(n.prefix + e.toString());
          }
        });
      }

      o.stderr.on("data", (r) => {
        r = r.toString();
        if (
          r &&
          r !== "\n" &&
          !/^(?=.*native-pack-tool)(?=.*No repository field)/gi.test(r)
        ) {
          r = n.prefix + r;
          let e = "error";

          if (/warn/gi.test(r)) {
            e = "warn";
            n?.downGradeWaring && (e = "log");
          } else if (n?.downGradeError) {
            e = "log";
          }

          console[e](r);
        }
      });

      o.on("close", (e) => {
        processPool.delete(o);

        if (e !== 0) {
          s(
            n.prefix +
              (`Child process exit width code ${e}:${t} ` + i.toString())
          );
        } else {
          r(true);

          console.debug(n.prefix + "Child process exit width code " + e);
        }
      });

      o.on("error", (e) => {
        processPool.delete(o);

        console.error(n.prefix + (`child process error: ${t} ` + i.toString()));

        s(e);
      });

      o.on("exit", (e) => {
        processPool.delete(o);

        if (e !== 0) {
          s(
            n.prefix +
              (`Child process exit width code ${e}:${t} ` + i.toString())
          );
        } else {
          r(true);

          console.debug(n.prefix + "Child process exit width code " + e);
        }
      });
    });
  }
}
exports.WorkerManager = WorkerManager;
exports.workerManager = new WorkerManager();
