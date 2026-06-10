var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.openWorkerDevTool = openWorkerDevTool;
exports.openPanelDevTools = openPanelDevTools;
exports.openDocs = openDocs;
exports.clearProjectAssetsCache = clearProjectAssetsCache;
exports.clearEngineCache = clearEngineCache;
exports.clearAllCache = clearAllCache;

const {
  existsSync,
  readdirSync,
  statSync,
  removeSync,
  mkdirsSync,
  emptyDir,
} = require("fs-extra");

const fast_glob_1 = __importDefault(require("fast-glob"));

const { join, extname } = require("path");

const common_variables_1 = require("../share/common-variables");
const worker_1 = require("./worker");
const BUILD_ASSET_CACHE_VERSION = "1.0.1";
function openWorkerDevTool() {
  worker_1.workerManager.debug(true);
}
function openPanelDevTools() {
  Editor.Panel._openDevTools("builder");
}
function openDocs() {
  Editor.Message.send(
    "program",
    "open-url",
    Editor.Utils.Url.getDocUrl("editor/publish/build-panel.html")
  );
}
function clearProjectBuilderCache(r) {
  return new Promise((e, a) => {
    !(function r(o) {
      try {
        if (existsSync(o)) {
          readdirSync(o).forEach((e) => {
            e = join(o, e);

            if (statSync(e).isDirectory()) {
              r(e);
            } else if (extname(e) !== ".log") {
              removeSync(e);
            }
          });
        } else {
          mkdirsSync(o);
        }
      } catch (e) {
        a(e);
      }
    })(r);

    e();
  });
}
async function clearProjectAssetsCache() {
  var e = await (0, fast_glob_1.default)(
    "asset-db/*/*/*/build" + BUILD_ASSET_CACHE_VERSION,
    { onlyDirectories: true, cwd: Editor.Project.tmpDir, absolute: true }
  );
  try {
    await Promise.all(e.map((e) => emptyDir(e)));

    await clearProjectBuilderCache(common_variables_1.LOCAL_CACHE_DIR);

    console.log(
      Editor.I18n.t("builder.clear_cache.clear_cache_success", {
        position: Editor.I18n.t("builder.clear_cache.clear_assets_cache"),
      })
    );
  } catch (e) {
    console.error(e);
  }
}
async function clearEngineCache() {
  try {
    await emptyDir(common_variables_1.GLOBAL_CACHE_DIR);

    console.log(
      Editor.I18n.t("builder.clear_cache.clear_cache_success", {
        position: Editor.I18n.t("builder.clear_cache.clear_engine_cache"),
      }) + `: {link(${common_variables_1.GLOBAL_CACHE_DIR})}`
    );
  } catch (e) {
    console.error(e);
  }
}
async function clearAllCache() {
  await clearProjectAssetsCache();
  await clearEngineCache();
}
