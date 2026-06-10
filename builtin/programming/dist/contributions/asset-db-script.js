var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, r, t, i = t) => {
        var a = Object.getOwnPropertyDescriptor(r, t);

        if (
          !a ||
          (!("get" in a) ? !a.writable && !a.configurable : r.__esModule)
        ) {
          a = {
            enumerable: true,
            get() {
              return r[t];
            },
          };
        }

        Object.defineProperty(e, i, a);
      }
    : (e, r, t, i) => {
        e[(i = i === undefined ? t : i)] = r[t];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, r) => {
        Object.defineProperty(e, "default", { enumerable: true, value: r });
      }
    : (e, r) => {
        e.default = r;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var a = (e) =>
      (a =
        Object.getOwnPropertyNames ||
        ((e) => {
          var r;
          var t = [];
          for (r in e) {
            if (Object.prototype.hasOwnProperty.call(e, r)) {
              t[t.length] = r;
            }
          }
          return t;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var r = {};
      if (e != null) {
        for (var t = a(e), i = 0; i < t.length; i++) {
          if (t[i] !== "default") {
            __createBinding(r, e, t[i]);
          }
        }
      }
      __setModuleDefault(r, e);
      return r;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.afterPreStart = afterPreStart;
const loader_1 = require("@cocos/creator-programming-quick-pack/lib/loader");
const executor_1 = require("@editor/lib-programming/dist/executor");

const { queryPath } = require("@editor/asset-db");

const { pathToFileURL } = require("url");

function beforePreStart(e) {
  Object.values(e).forEach((e) => {
    e.preImportExtList = e.preImportExtList || [];
    e.preImportExtList.push(".ts");
  });
}
async function afterPreStart(e) {
  console.debug("starting packer-driver...");
  await Editor.Message.request("programming", "packer-driver/start");
  await initializeAssetDBScriptingEnvironment();
}
async function initializeAssetDBScriptingEnvironment() {
  console.debug("initialize scripting environment...");

  var e = await Editor.Message.request(
    "programming",
    "packer-driver/get-loader-context",
    "editor"
  );

  var e = loader_1.QuickPackLoaderContext.deserialize(e);
  const r = (
    await Promise.resolve().then(() => __importStar(require("cc/preload")))
  ).loadDynamic;
  var t = await Editor.Message.request(
    "programming",
    "packer-driver/query-cc-editor-module-map"
  );
  const i = await executor_1.Executor.create({
    importEngineMod: async (e) => r(e),
    quickPackLoaderContext: e,
    cceModuleMap: t,
  });
  await i.prepare();

  Editor.Module.__protected__.setImportProjectModuleDelegate(async (e) => {
    var r = queryPath(e);
    if (r) {
      r = pathToFileURL(r);
      return i.import(r.href);
    }
    throw new Error(e + " is not a valid database URL.");
  });
}
exports.methods = {
  afterPreStart,
  beforePreStart,
};
