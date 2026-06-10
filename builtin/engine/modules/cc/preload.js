var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDynamic = undefined;
const module_1 = __importDefault(require("module"));
const path_1 = __importDefault(require("path"));
let hasPreload = false;
let loader = null;
async function preload(e) {
  var r;
  var o;
  function n(e) {
    return (
      e === "cc" ||
      (e.startsWith("cc/") && !e.startsWith("cc/preload")) ||
      e.startsWith("cce:/internal/")
    );
  }
  try {
    if (hasPreload) {
      throw new Error("You can only preload engine once.");
    }
    hasPreload = true;
    var t;
    var { requiredModules, editorExtensions = true, editorPath } = e;

    var s =
      null != (r = e.root)
        ? r
        : await require("@base/electron-base-ipc").sendSync(
            "packages-engine:query-engine-info"
          ).path;

    var c =
      null != (o = e.dist)
        ? o
        : path_1.default.join(s, "bin", ".cache", "dev", "editor");

    globalThis.CC_EDITOR = true;

    if (editorExtensions) {
      t = require("@base/electron-base-ipc").sendSync(
        "packages-engine:query-engine-info"
      );

      globalThis.EditorExtends = require(path_1.default.join(
        t.editor,
        "./builtin/engine/dist/editor-extends"
      ));
    }

    const p = {};
    var d = require(path_1.default.resolve(c, "loader"));
    loader = d.default;
    for (const g of requiredModules) {
      p[g] = await loader.import(g);
    }
    var module_1_default = module_1.default;

    const { _resolveFilename, _load } = module_1_default;

    module_1_default._resolveFilename = function (e) {
      return n(e) ? e : _resolveFilename.apply(this, arguments);
    };

    module_1_default._load = function (e) {
      if (n(e)) {
        var r = p[e];
        if (r) {
          return r;
        }
        throw new Error(
          `Can not load engine module: ${e}. Valid engine modules are: ` +
            Object.keys(p).join(",")
        );
      }
      return _load.apply(this, arguments);
    };

    if (requiredModules.includes("cc")) {
      postProcess(editorPath);
    }
  } catch (e) {
    let r = "preload engine failed!";
    console.error(r);
    console.error(e);

    if (e instanceof Error) {
      r += (e.stack, e.stack);
    }

    Editor.Message.send("engine", "import-engine-error", r);
    throw e;
  }
}
async function loadDynamic(e) {
  if (loader) {
    return loader.import(e);
  }
  throw new Error(
    `Failed to load engine module ${e}. ` +
      "Loader has not been initialized. You should call preload() first."
  );
}
function postProcess(e) {
  let r;
  r = e
    ? { editor: e }
    : require("@base/electron-base-ipc").sendSync(
        "packages-engine:query-engine-info"
      );
  var o;
  var e = require("v-stacks");

  var e =
    ("__MAIN__" in window &&
      (((o = new Error(
        "Try not to run the engine in the window process."
      )).stack = e.ignoreStack(o.stack, 1)),
      console.warn(o)),
    "Import engine");

  console.time(e);
  let n;
  try {
    n = require("cc");
  } catch (e) {
    let r = "require cc failed!";

    if (e instanceof Error) {
      r += (e.stack, e.stack);
    }

    Editor.Message.send("engine", "import-engine-error", r);
    throw e;
  }
  console.timeEnd(e);
  window.ccm = n;
  require("./polyfill/engine");
  globalThis.EditorExtends.init();
  require("./overwrite")(n, r);
}
exports.default = preload;
exports.loadDynamic = loadDynamic;
