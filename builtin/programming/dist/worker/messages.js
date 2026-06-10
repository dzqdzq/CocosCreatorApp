var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, r, a, t = a) => {
        var i = Object.getOwnPropertyDescriptor(r, a);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : r.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return r[a];
            },
          };
        }

        Object.defineProperty(e, t, i);
      }
    : (e, r, a, t) => {
        e[(t = t === undefined ? a : t)] = r[a];
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
    var i = (e) =>
      (i =
        Object.getOwnPropertyNames ||
        ((e) => {
          var r;
          var a = [];
          for (r in e) {
            if (Object.prototype.hasOwnProperty.call(e, r)) {
              a[a.length] = r;
            }
          }
          return a;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var r = {};
      if (e != null) {
        for (var a = i(e), t = 0; t < a.length; t++) {
          if (a[t] !== "default") {
            __createBinding(r, e, a[t]);
          }
        }
      }
      __setModuleDefault(r, e);
      return r;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.messages = undefined;

const { updateCustomMacro } = require("../intelligence");

const packer_driver_1 = require("../packer-driver/packer-driver");
const awaiter_1 = require("../utils/awaiter");
const globalPackerDriverAwaiter = new awaiter_1.Awaiter();
let globalPackerDriverAwaiterResolved = false;
let allDatabasesAreReady = false;
let hasInitDbListener = false;
async function onAssetDBFullReady() {
  (await globalPackerDriverAwaiter.wait()).pullAssetDb();
  allDatabasesAreReady = true;
}
async function onAssetDBFullClose() {
  var e = await globalPackerDriverAwaiter.wait();
  allDatabasesAreReady = false;
  await e.shutDown();
}
async function onSomeAssetDBReady(e, r) {
  console.debug(e + " opened.");
  e = await globalPackerDriverAwaiter.wait();

  if (allDatabasesAreReady) {
    await e.mountDatabase(r);
    await e.resetDatabases(true);
  }
}
async function onSomeAssetDBClose(e, r) {
  console.debug(e + " closed.");
  e = await globalPackerDriverAwaiter.wait();

  if (allDatabasesAreReady) {
    await e.unmountDatabase(r);
    await e.resetDatabases(true);
  }
}
const initializeAndBuild = (() => {
  let r = false;
  return async () => {
    Editor.Metrics.trackTimeStart("programming:worker-init");

    if (!r) {
      r = true;

      (async () => {
        var e = (
          await Promise.resolve().then(() =>
            __importStar(require("../packer-driver/packer-driver"))
          )
        ).PackerDriver;

        var e = await e.create();
        globalPackerDriverAwaiter.resolve(e);
        globalPackerDriverAwaiterResolved = true;
      })();
    }

    var e = await globalPackerDriverAwaiter.wait();
    await e.init();
    Editor.Metrics.trackTimeEnd("programming:worker-init", { output: true });

    if (!hasInitDbListener) {
      Editor.Message.__protected__.addBroadcastListener(
        "asset-db:ready",
        onAssetDBFullReady
      );

      Editor.Message.__protected__.addBroadcastListener(
        "asset-db:close",
        onAssetDBFullClose
      );

      Editor.Message.__protected__.addBroadcastListener(
        "asset-db:db-ready",
        onSomeAssetDBReady
      );

      Editor.Message.__protected__.addBroadcastListener(
        "asset-db:db-close",
        onSomeAssetDBClose
      );

      hasInitDbListener = true;
    }

    Editor.Metrics.trackTimeStart("programming:database-startup");
    await e.resetDatabases(false);
    packer_driver_1.PackerDriver.updateImportRestrictions();
    await e.pullAssetDb();

    Editor.Metrics.trackTimeEnd("programming:database-startup", {
      output: true,
    });
  };
})();
function sleep(r) {
  return new Promise((e) => {
    setTimeout(e, r);
  });
}
exports.messages = {
  async "packer-driver/start"() {
    allDatabasesAreReady = true;

    Editor.Task.__protected__.addSyncTask(
      "build-script",
      Editor.I18n.t("programming.startCompile")
    );

    try {
      console.debug("Starting packer driver...");
      Editor.Metrics.trackTimeStart("programming:worker-start");
      await initializeAndBuild();
      Editor.Metrics.trackTimeEnd("programming:worker-start", { output: true });
      console.debug("Packer driver started.");

      Editor.Task.__protected__.updateSyncTask(
        "build-script",
        "Packer driver started."
      );
    } catch (e) {
      console.error("Init packer-driver failed!");

      Editor.Task.__protected__.updateSyncTask(
        "build-script",
        "Init packer-driver failed! \n" + e.stack
      );

      console.error(e);

      if (
        (
          await Editor.Dialog.error(e && e.stack, {
            title: Editor.I18n.t("programming.initError"),
            buttons: [
              Editor.I18n.t("programming.openDevtools"),
              Editor.I18n.t("programming.confirm"),
            ],
            default: 1,
          })
        ).response === 0
      ) {
        Editor.Message.send("programming", "open-dev-tools");
      }
    }
    Editor.Task.__protected__.removeSyncTask("build-script");
  },
  async "packer-driver/get-loader-context"(e) {
    return (await globalPackerDriverAwaiter.wait())
      .getQuickPackLoaderContext(e)
      ?.serialize();
  },
  async "packer-driver/ready"(e) {
    return (
      !!globalPackerDriverAwaiterResolved &&
      (await globalPackerDriverAwaiter.wait()).isReady(e)
    );
  },
  async "packer-driver/query-script-deps"(e) {
    if (globalPackerDriverAwaiterResolved) {
      return (await globalPackerDriverAwaiter.wait()).queryScriptDeps(e);
    }
  },
  async "packer-driver/query-script-users"(e) {
    if (globalPackerDriverAwaiterResolved) {
      return (await globalPackerDriverAwaiter.wait()).queryScriptUsers(e);
    }
  },
  async "packer-driver/query-cc-editor-module-map"() {
    return packer_driver_1.PackerDriver.queryCCEModuleMap();
  },
  async "clear-code-cache"() {
    console.debug("Clearing code cache");
    await (await globalPackerDriverAwaiter.wait()).clearCache();
  },
  async "custom-macro-changed"() {
    await updateCustomMacro();
  },
  async "packer-driver/update-auto-update-import-config"(e, r) {
    if (e === "updateAutoUpdateImportConfig") {
      (
        await globalPackerDriverAwaiter.wait()
      ).languageService.autoUpdateFileImport = !!r;
    }
  },
};
