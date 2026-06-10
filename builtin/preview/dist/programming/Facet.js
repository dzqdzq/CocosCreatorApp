var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, i = r) => {
        var a = Object.getOwnPropertyDescriptor(t, r);

        if (
          !a ||
          (!("get" in a) ? !a.writable && !a.configurable : t.__esModule)
        ) {
          a = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, i, a);
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
    var a = (e) =>
      (a =
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
        for (var r = a(e), i = 0; i < r.length; i++) {
          if (r[i] !== "default") {
            __createBinding(t, e, r[i]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgrammingFacet = undefined;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const ccbuild_1 = require("@cocos/ccbuild");
const moduleSystem = __importStar(require("@cocos/module-system"));
class AsyncIterationConcurrency {
  _iterate;
  _executionPromise = null;
  _pendingPromise = null;
  constructor(e) {
    this._iterate = e;
  }
  nextIteration() {
    if (this._executionPromise) {
      if (this._pendingPromise) {
        console.debug("[Facet] There is a pending promise task, waiting ...");

        return this._pendingPromise;
      }

      return (this._pendingPromise = this._executionPromise.finally(() => {
        this._pendingPromise = null;
        return this.nextIteration();
      }));
    }

    return (this._executionPromise = Promise.resolve(this._iterate()).finally(
      () => {
        this._executionPromise = null;
      }
    ));
  }
}
class ProgrammingFacet {
  _packerDriverUpdateCount = 0;
  _asyncIteration;
  static async create({ engine }) {
    var t = new ProgrammingFacet(engine.root, engine.distRoot);
    await t._initialize({ engine: engine });
    return t;
  }
  get engineRoot() {
    return this._engineRoot;
  }
  get engineDistRoot() {
    return this._engineDistRoot;
  }
  get systemJsHomeDir() {
    return this._systemJsHomeDir;
  }
  get systemJsIndexFile() {
    return this._systemJsBundleFileName;
  }
  get packImportMapURL() {
    return this._quickPackLoader.importMapURL;
  }
  get packResolutionDetailMapURL() {
    return this._quickPackLoader.resolutionDetailMapURL;
  }
  async loadPackResource(e) {
    return this._getQuickPackLoader().loadAny(e);
  }
  async getGlobalImportMap() {
    return this._staticImportMap;
  }
  async reload() {
    var t = ++this._packerDriverUpdateCount;

    console.debug("[[Facet.reload]], before lock, count: " + t);
    var e = this._getQuickPackLoader();

    let r;
    try {
      r = await e.lock();
    } catch (e) {
      console.error(
        `[[Facet.reload]] lock failed: ${e}, stack: ${e.stack}, count: ` + t
      );
    }
    console.debug("[[Facet.reload]], after lock, count: " + t);
    try {
      await e.reload();
    } catch (e) {
      console.error(`[[Facet.reload]], failed: ${e}, ${e.stack}, count: ` + t);

      throw e;
    } finally {
      console.debug("[[Facet.reload]], before unlock, count: " + t);
      try {
        if (r) {
          await r();
        }
      } catch (e) {
        console.error(
          `[[Facet.reload]] unlock failed: ${e}, stack: ${e.stack}, count: ` + t
        );
      }
      console.debug("[[Facet.reload]], after unlock, count: " + t);
    }
  }
  async notifyPackDriverUpdated() {
    return this._asyncIteration.nextIteration();
  }
  _staticImportMap = { imports: {} };
  _engineRoot;
  _engineDistRoot;
  _systemJsHomeDir = path_1.default.join(
    Editor.Project.tmpDir,
    "programming",
    "preview",
    "systemjs"
  );
  _systemJsBundleFileName = "system.js";
  _quickPackLoader;
  constructor(e, t) {
    this._engineRoot = e;
    this._engineDistRoot = t;

    this._asyncIteration = new AsyncIterationConcurrency(async () =>
      this.reload()
    );
  }
  _getQuickPackLoader() {
    if (this._quickPackLoader) {
      return this._quickPackLoader;
    }
    throw new Error("Loader has not been created.");
  }
  async _initialize({ engine }) {
    this._engineStatsQuery = await ccbuild_1.StatsQuery.create(engine.root);
    engine = this._staticImportMap.imports;
    engine.cc = "cce:/internal/x/cc";
    engine["cc/env"] = "cc/editor/populate-internal-constants";
    engine["cce.env"] = engine["cc/env"];
    engine["cc/userland/macro"] = "./userland/macro";

    console.debug(
      "Preview import map: " +
        JSON.stringify(this._staticImportMap, undefined, 2)
    );

    await this._buildSystemJs();
    await this._resetQuickPackLoader();
  }
  async _buildSystemJs() {
    var e = path_1.default.join(
      this._systemJsHomeDir,
      this._systemJsBundleFileName
    );
    await fs_extra_1.default.ensureDir(path_1.default.dirname(e));

    await moduleSystem.build({
      out: e,
      minify: false,
      sourceMap: true,
      platform: "web-mobile",
      editor: true,
    });
  }
  async _resetQuickPackLoader() {
    var e = await Editor.Message.request(
      "programming",
      "packer-driver/get-loader-context",
      "preview"
    );

    var t = (
      await Promise.resolve().then(() =>
        __importStar(
          require("@cocos/creator-programming-quick-pack/lib/loader")
        )
      )
    ).QuickPackLoader;

    var t = new t(e);
    this._quickPackLoader = t;
  }
}
exports.ProgrammingFacet = ProgrammingFacet;
