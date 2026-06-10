var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, a, s, t = s) => {
        var r = Object.getOwnPropertyDescriptor(a, s);

        if (
          !r ||
          (!("get" in r) ? !r.writable && !r.configurable : a.__esModule)
        ) {
          r = {
            enumerable: true,
            get() {
              return a[s];
            },
          };
        }

        Object.defineProperty(e, t, r);
      }
    : (e, a, s, t) => {
        e[(t = t === undefined ? s : t)] = a[s];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, a) => {
        Object.defineProperty(e, "default", { enumerable: true, value: a });
      }
    : (e, a) => {
        e.default = a;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var r = (e) =>
      (r =
        Object.getOwnPropertyNames ||
        ((e) => {
          var a;
          var s = [];
          for (a in e) {
            if (Object.prototype.hasOwnProperty.call(e, a)) {
              s[s.length] = a;
            }
          }
          return s;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var a = {};
      if (e != null) {
        for (var s = r(e), t = 0; t < s.length; t++) {
          if (s[t] !== "default") {
            __createBinding(a, e, s[t]);
          }
        }
      }
      __setModuleDefault(a, e);
      return a;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageMap = undefined;
const asset_db_manager_1 = require("../asset-db-manager");
const plugin_1 = __importDefault(require("../manager/plugin"));
const console_1 = require("../console");
const asset_manager_1 = require("../manager/asset-manager");
const UtilsModule = __importStar(require("../utils"));
const mask_sync_1 = require("../mask-sync");
let hasWarningRequestAnimationFrame = false;

let hasErrorDialog = !(exports.MessageMap = {
  init: async (e) => {
    try {
      console_1.newConsole.initLogFiles();
      console_1.newConsole.record();
      Editor.Metrics.trackTimeStart("asset-db:worker-init");

      mask_sync_1.assetDBMask.update("import-asset", "Init Asset Worker...");

      console_1.newConsole.trackMemoryStart("asset-db:worker-init");
      const a = {
        ...UtilsModule,
        path2url: asset_db_manager_1.assetDBManager.path2url.bind(
          asset_db_manager_1.assetDBManager
        ),
      };

      defineProperties(
        a,
        [
          "queryAssetUsers",
          "queryAssets",
          "queryAsset",
          "queryAssetProperty",
          "queryAssetInfo",
          "queryAssetMeta",
          "queryAssetMtime",
          "queryAssetDependencies",
          "encodeAsset",
        ],
        (e) => {
          console.log(
            Editor.I18n.t("asset-db.deprecatedTip", {
              oldName: "Manager.Utils." + e,
              newName: "Manager.assetManager." + e,
              version: "3.8.3",
            })
          );

          return asset_manager_1.assetManager[e].bind(
            asset_manager_1.assetManager
          );
        }
      );

      Object.defineProperties(window, {
        Manager: {
          set() {
            console.error(
              Editor.I18n.t("asset-db.globalReadonlyTip", {
                name: "Manager",
              })
            );
          },
          get() {
            return {
              assetDBManager: asset_db_manager_1.assetDBManager,
              assetManager: asset_manager_1.assetManager,
              pluginManager: plugin_1.default,
              AssetInfo: e,
              get AssetWorker() {
                console.log(
                  Editor.I18n.t("asset-db.deprecatedTip", {
                    oldName: "Manager.AssetWorker",
                    newName: "Manager.assetDBManager.assetDBMap",
                    version: "3.8.0",
                  })
                );

                return asset_db_manager_1.assetDBManager.assetDBMap;
              },
              Utils: a,
            };
          },
        },
      });

      window.requestAnimationFrame = (e) => {
        if (!hasWarningRequestAnimationFrame) {
          hasWarningRequestAnimationFrame = true;

          console.debug(
            "requestAnimationFrame is disabled in editor worker process, will use setTimeout instead."
          );
        }

        setTimeout(e, 0);
      };

      window.addEventListener("unhandledrejection", (e) => {
        console.error(e.reason);
        console.debug(e);

        if (!asset_db_manager_1.assetDBManager.ready) {
          initAssetWorkerFailed(e.reason || "unhandledrejection");
        }
      });

      await asset_manager_1.assetManager.init();
      await asset_db_manager_1.assetDBManager.init(e);
      console_1.newConsole.trackMemoryEnd("asset-db:worker-init");
      Editor.Metrics.trackTimeEnd("asset-db:worker-init", { output: true });
      await asset_db_manager_1.assetDBManager.start();
    } catch (e) {
      console.error("Init asset worker failed!");
      console.error(e);
      initAssetWorkerFailed(e);
      throw e;
    }
  },
  start: async () => asset_db_manager_1.assetDBManager.start(),
  "query-database-busy": () => asset_db_manager_1.assetDBManager.isBusy(),
  "pause-database": async (e) => asset_db_manager_1.assetDBManager.pause(e),
  "stop-database": async (e) => asset_db_manager_1.assetDBManager.removeDB(e),
  "start-database": async (e) => asset_db_manager_1.assetDBManager.addDB(e),
  "resume-database": async () => asset_db_manager_1.assetDBManager.resume(),
  "refresh-all-database": async () => {
    await asset_db_manager_1.assetDBManager.refresh();
    return true;
  },
});

async function initAssetWorkerFailed(e) {
  if (hasErrorDialog || asset_db_manager_1.assetDBManager.ready) {
    console.error(e);
  } else {
    hasErrorDialog = true;
    e = ((e && e.stack) || e.reason || e).toString();
    switch (
      (
        await Editor.Dialog.error(e, {
          title: Editor.I18n.t("asset-db.assetDBInitError"),
          buttons: [
            Editor.I18n.t("asset-db.debug-mode"),
            Editor.I18n.t("asset-db.operate.dialogQuestion"),
            Editor.I18n.t("asset-db.operate.stillOpen"),
          ],
          default: 1,
        })
      ).response
    ) {
      case 0: {
        Editor.Message.send("asset-db", "open-devtools");
        break;
      }
      case 2: {
        mask_sync_1.assetDBMask.remove("import-asset");
      }
    }
  }
}
function defineProperties(e, a, s) {
  const t = {};

  a.forEach((e) => {
    t[e] = {
      get() {
        return s(e);
      },
    };
  });

  Object.defineProperties(e, t);
}
