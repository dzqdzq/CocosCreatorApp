var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, o = r) => {
        var i = Object.getOwnPropertyDescriptor(t, r);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, o, i);
      }
    : (e, t, r, o) => {
        e[(o = o === undefined ? r : o)] = t[r];
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
    var i = (e) =>
      (i =
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
        for (var r = i(e), o = 0; o < r.length; o++) {
          if (r[o] !== "default") {
            __createBinding(t, e, r[o]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.title = undefined;
exports.loadScript = loadScript;
const executor_1 = require("@editor/lib-programming/dist/executor");
const loader_1 = require("@cocos/creator-programming-quick-pack/lib/loader");
exports.title = "i18n:builder.tasks.load_script";
let executor = null;
class GlobalEnv {
  async record(o) {
    this.clear();

    this._queue.push(async () => {
      var e = Object.keys(globalThis);
      await o();
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
async function loadScript(e) {
  if (e.length) {
    console.debug("reload all scripts.");

    await globalEnv.record(async () => {
      if (!executor) {
        console.log("creating executor ...");

        var e = await Editor.Message.request(
          "programming",
          "packer-driver/get-loader-context",
          "editor"
        );

        var e = loader_1.QuickPackLoaderContext.deserialize(e);
        const r = (
          await Promise.resolve().then(() =>
            __importStar(require("cc/preload"))
          )
        ).loadDynamic;
        var t = await Editor.Message.request(
          "programming",
          "packer-driver/query-cc-editor-module-map"
        );
        (executor = await executor_1.Executor.create({
          importEngineMod: async (e) => r(e),
          quickPackLoaderContext: e,
          cceModuleMap: t,
        })).addPolyfillFile(
          require.resolve("@editor/build-polyfills/prebuilt/editor/bundle")
        );
      }

      if (executor) {
        e = await Editor.Message.request(
          "programming",
          "query-sorted-plugins",
          { loadPluginInEditor: true }
        );

        executor.setPluginScripts(e);
        await executor.reload();
      } else {
        console.error("Failed to init executor");
      }
    });
  } else {
    console.debug("No script need reload.");
  }
}
