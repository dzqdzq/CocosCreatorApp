var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, i = r) => {
        var s = Object.getOwnPropertyDescriptor(t, r);

        if (
          !s ||
          (!("get" in s) ? !s.writable && !s.configurable : t.__esModule)
        ) {
          s = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, i, s);
      }
    : (e, t, r, i) => {
        e[(i = i === undefined ? r : i)] = t[r];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var s = (e) =>
      (s =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = s(e), i = 0; i < r.length; i++) {
          if (r[i] !== "default") {
            __createBinding(t, e, r[i]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptManager = undefined;
const executor_1 = require("@editor/lib-programming/dist/executor");
const cc_1 = require("cc");
const events_1 = require("events");
const loader_1 = require("@cocos/creator-programming-quick-pack/lib/loader");

const { pathToFileURL } = require("url");

const { getGlobal } = require("@electron/remote");

const remoteEditor = getGlobal("Editor");
class AsyncIterationConcurrency1 {
  _iterate;
  _executionPromise = null;
  _pendingPromise = null;
  constructor(e) {
    this._iterate = e;
  }
  nextIteration() {
    if (this._executionPromise) {
      if (!this._pendingPromise) {
        return (this._pendingPromise = this._executionPromise.finally(() => {
          this._pendingPromise = null;
          return this.nextIteration();
        }));
      }
    }

    return (this._executionPromise = Promise.resolve(this._iterate()).finally(
      () => {
        this._executionPromise = null;
      }
    ));
  }
}
const importExceptionLogTag = "::SceneExecutorImportExceptionHandler::";
const importExceptionLogRegex = new RegExp(importExceptionLogTag);
class GlobalEnv {
  async record(i) {
    this.clear();

    this._queue.push(async () => {
      var e = Object.keys(globalThis);
      await i();
      var t = Object.keys(globalThis);
      for (const r of t) {
        if (!e.includes(r)) {
          this._incrementalKeys.add(r);
        }
      }
      console.debug("Incremental keys: " + Array.from(this._incrementalKeys));
    });

    await this.processQueue();
  }
  clear() {
    this._queue.push(async () => {
      for (const e of this._incrementalKeys) {
        delete globalThis[e];
      }
      this._incrementalKeys.clear();
    });
  }
  async processQueue() {
    while (this._queue.length > 0) {
      var e = this._queue.shift();

      if (e) {
        await e();
      }
    }
  }
  _incrementalKeys = new Set();
  _queue = [];
}
const globalEnv = new GlobalEnv();
class ScriptManager extends events_1.EventEmitter {
  EXECUTION_FINISHED = "execution-finished";
  _executor;
  _suspendPromise = null;
  _syncPluginScripts;
  _reloadScripts;
  customComponents = new Set();
  constructor() {
    super();

    this._reloadScripts = new AsyncIterationConcurrency1(() => this._execute());

    this._syncPluginScripts = new AsyncIterationConcurrency1(() =>
      this._syncPluginScriptList()
    );
  }
  suspend(e) {
    this._suspendPromise = e;
  }
  async init() {
    const i = require("cc");
    EditorExtends.on("class-registered", (e, t, r) => {
      if (t && i.js.isChildClassOf(e, cc_1.Component)) {
        this.customComponents.add(e);
        EditorExtends.Component.addMenu(e, "i18n:menu.custom_script/" + r, -1);
      }
    });

    var e = await Editor.Message.request(
      "programming",
      "packer-driver/get-loader-context",
      "editor"
    );

    var e = loader_1.QuickPackLoaderContext.deserialize(e);
    const t = (
      await Promise.resolve().then(() => __importStar(require("cc/preload")))
    ).loadDynamic;
    var r = await Editor.Message.request(
      "programming",
      "packer-driver/query-cc-editor-module-map"
    );

    this._executor = await executor_1.Executor.create({
      importEngineMod: async (e) => t(e),
      quickPackLoaderContext: e,
      beforeUnregisterClass: (e) => {
        this.customComponents.delete(e);
        EditorExtends.Component.removeMenu(e);
      },
      logger: {
        loadException: (e, t, r) => {},
        possibleCircularReference: (e, t, r, i) => {
          console.warn(
            Editor.I18n.t("scene.scripting.crReport", {
              source: t,
              imported: e,
              importer:
                ((t = r.url),
                (e = "project:///"),
                t.startsWith(e)
                  ? `{asset(db://${t.substr(e.length).replace(".js", ".ts")})}`
                  : t),
            }),
            i?.error?.stack
          );
        },
      },
      importExceptionHandler: (...e) => this._handleImportException(...e),
      cceModuleMap: r,
    });

    this._executor.addPolyfillFile(
      require.resolve("@editor/build-polyfills/prebuilt/editor/bundle")
    );

    await this._syncPluginScripts.nextIteration();
    await this._reloadScripts.nextIteration();

    Editor.Module.__protected__.setImportProjectModuleDelegate(async (e) => {
      var t = await Editor.Message.request("asset-db", "query-path", e);
      if (t) {
        t = pathToFileURL(t);
        return this._executor.import(t.href);
      }
      throw new Error(e + " is not a valid database URL.");
    });
  }
  async investigatePackerDriver() {
    this._executeAsync();
  }
  async queryScriptName(e) {
    var e = Editor.Utils.UUID.compressUUID(e, false);
    var e = this._executor.queryClassesInModule(e);
    return (e = e && e.find((e) => cc_1.js.isChildClassOf(e, cc_1.Component)))
      ? cc_1.js.getClassName(e)
      : null;
  }
  async queryScriptCid(e) {
    var e = Editor.Utils.UUID.compressUUID(e, false);
    var e = this._executor.queryClassesInModule(e);
    return (e = e && e.find((e) => cc_1.js.isChildClassOf(e, cc_1.Component)))
      ? cc_1.js.getClassId(e)
      : null;
  }
  isCustomComponent(e) {
    return this.customComponents.has(e);
  }
  async _loadScripts() {}
  async loadScript(e) {
    this._syncPluginScriptListAsync();
  }
  async removeScript(e) {
    this._syncPluginScriptListAsync();
  }
  async scriptChange(e) {
    this._syncPluginScriptListAsync();
  }
  _executeAsync() {
    this._reloadScripts.nextIteration();
  }
  async _execute() {
    return Promise.resolve(this._suspendPromise ?? undefined)
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        this._suspendPromise = null;
        remoteEditor.Logger.clear(importExceptionLogRegex);

        return globalEnv.record(() =>
          this._executor.reload().finally(() => {
            this.emit(this.EXECUTION_FINISHED);
          })
        );
      });
  }
  _syncPluginScriptListAsync() {
    this._syncPluginScripts.nextIteration();
  }
  async _syncPluginScriptList() {
    return Promise.resolve(
      Editor.Message.request("programming", "query-sorted-plugins", {
        loadPluginInEditor: true,
      })
    )
      .then((e) => {
        this._executor.setPluginScripts(e);
      })
      .catch((e) => {
        console.error(e);
      });
  }
  _handleImportException(e) {
    console.error(`{hidden(${importExceptionLogTag})}`, e);
  }
}
exports.ScriptManager = ScriptManager;
exports.default = new ScriptManager();
