var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, a, t, s = t) => {
        var r = Object.getOwnPropertyDescriptor(a, t);

        if (
          !r ||
          (!("get" in r) ? !r.writable && !r.configurable : a.__esModule)
        ) {
          r = {
            enumerable: true,
            get() {
              return a[t];
            },
          };
        }

        Object.defineProperty(e, s, r);
      }
    : (e, a, t, s) => {
        e[(s = s === undefined ? t : s)] = a[t];
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
          var t = [];
          for (a in e) {
            if (Object.prototype.hasOwnProperty.call(e, a)) {
              t[t.length] = a;
            }
          }
          return t;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var a = {};
      if (e != null) {
        for (var t = r(e), s = 0; s < t.length; s++) {
          if (t[s] !== "default") {
            __createBinding(a, e, t[s]);
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

const { forEach } = require("@editor/asset-db");

const plugin_1 = __importDefault(require("../manager/plugin"));
const asset_handler_manager_1 = require("../manager/asset-handler-manager");
const asset_manager_1 = require("../manager/asset-manager");
exports.MessageMap = {
  "save-asset-meta": async (e, a) => {
    if (!e || !a) {
      throw new Error(Editor.I18n.t("asset-db.saveAssetMeta.fail.content"));
    }
    var t = asset_manager_1.assetManager.queryAsset(e);
    if (!t) {
      return false;
    }
    try {
      var s = JSON.parse(a);
      await asset_manager_1.assetManager.saveAssetMeta(e, s, t);
      asset_manager_1.assetManager.reimportAsset(t.uuid);
      return true;
    } catch (e) {
      console.warn(e);
      return false;
    }
  },
  "reimport-asset": async (e) => asset_manager_1.assetManager.reimportAsset(e),
  "query-all-importer": async () =>
    asset_handler_manager_1.assetHandlerManager.queryAllImporter(),
  "query-all-asset-types": async () =>
    asset_handler_manager_1.assetHandlerManager.queryAllAssetTypes(),
  "refresh-asset": async (e) => asset_manager_1.assetManager.refreshAsset(e),
  "refresh-all-effect": async () => {
    forEach((e) => {
      e.path2asset.forEach((e) => {
        if (e && e.meta.importer === "effect") {
          e._assetDB.reimport(e.uuid);
        }
      });
    });
  },
  "execute-script": async (e) => {
    Editor.Metrics.trackTimeStart("programming:execute-script");
    e = await plugin_1.default.executeScript(e);
    Editor.Metrics.trackTimeEnd("programming:execute-script", { output: true });
    return e;
  },
  "change-high-quality": async (e) => {
    var a = (await Promise.resolve().then(() => __importStar(require("cc"))))
      .settings;
    a.overrideSettings("rendering", "highQualityMode", e);
  },
  "refresh-default-user-data": () =>
    asset_handler_manager_1.assetHandlerManager.refreshDefaultUserData(),
  "update-default-user-data": (e, a, t) =>
    asset_handler_manager_1.assetHandlerManager.updateDefaultUserData(e, a, t),
  "remove-asset": async (e) => asset_manager_1.assetManager.removeAsset(e),
  "rename-asset": async (e, a, t) =>
    asset_manager_1.assetManager.renameAsset(e, a, t),
  "move-asset": async (e, a, t) =>
    asset_manager_1.assetManager.moveAsset(e, a, t),
  "create-asset": async (e) => asset_manager_1.assetManager.createAsset(e),
  "create-asset-template": async (e, a) =>
    asset_handler_manager_1.assetHandlerManager.createAssetTemplate(e, a),
  "save-asset": async (e, a) => asset_manager_1.assetManager.saveAsset(e, a),
  "create-asset-dialog": async (e) =>
    asset_manager_1.assetManager.createAssetDialog(e),
  "execute-custom-operation": async (e, a, ...t) =>
    asset_handler_manager_1.assetHandlerManager.executeCustomOperation(
      e,
      a,
      ...t
    ),
  "open-asset": async (e) => {
    var a = asset_manager_1.assetManager.queryAsset(e);
    if (a) {
      return asset_handler_manager_1.assetHandlerManager.openAsset(a);
    }
    throw new Error(Editor.I18n.t("asset-db.openAsset.fail.noAsset") + " " + e);
  },
};
