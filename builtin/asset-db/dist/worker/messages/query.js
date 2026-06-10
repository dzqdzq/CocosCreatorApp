Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageMap = undefined;

const {
  queryPath,
  queryUrl,
  queryAsset,
  queryMissingInfo,
  forEach,
} = require("@editor/asset-db");

const { existsSync } = require("fs-extra");

const asset_db_manager_1 = require("../asset-db-manager");
const asset_handler_manager_1 = require("../manager/asset-handler-manager");

const { url2uuid } = require("../utils");

const asset_manager_1 = require("../manager/asset-manager");
exports.MessageMap = {
  "generate-available-url": (e) => {
    var a;
    return e && typeof e == "string"
      ? (a = queryPath(e))
        ? existsSync(a)
          ? ((a = Editor.Utils.File.getName(a)), queryUrl(a))
          : e
        : ""
      : null;
  },
  "query-path": (e) => {
    if (!e || typeof e != "string") {
      throw new Error("parameter error");
    }
    if (e.startsWith("db://")) {
      var a = e.substr(5);
      if (asset_db_manager_1.assetDBManager.assetDBMap[a]) {
        return asset_db_manager_1.assetDBManager.assetDBMap[a].options.target;
      }
      a = url2uuid(e);

      if (a && queryAsset(a)) {
        e = a;
      }
    }
    return queryPath(e);
  },
  "query-uuid": (e) => asset_manager_1.assetManager.queryAssetUUID(e),
  "query-url": (e) => asset_manager_1.assetManager.queryUrl(e),
  "query-db-info": (e = "") =>
    (typeof e == "string" &&
      e !== "" &&
      (e.startsWith("db://") && (e = e.split("/").filter(Boolean)[1]),
      asset_db_manager_1.assetDBManager.assetDBInfo[e])) ||
    null,
  "query-db-infos": () =>
    Object.values(asset_db_manager_1.assetDBManager.assetDBInfo),
  "query-db-list": () =>
    Object.keys(asset_db_manager_1.assetDBManager.assetDBMap),
  "query-missing-asset-info": (e) => queryMissingInfo(e),
  "query-assets": async (e, a) =>
    asset_manager_1.assetManager.queryAssetInfos(e, a),
  "query-asset-info": async (e, a) =>
    asset_manager_1.assetManager.queryAssetInfo(e, a),
  "query-asset-mtime": async (e) => {
    if (e.startsWith("db://")) {
      var a = e.substr(5);
      if (asset_db_manager_1.assetDBManager.assetDBMap[a]) {
        return asset_manager_1.assetManager.queryDBAssetInfo(a);
      }
      e = url2uuid(e);
    }
    return asset_manager_1.assetManager.queryAssetMtime(e);
  },
  "query-asset-meta": async (e) =>
    asset_manager_1.assetManager.queryAssetMeta(e),
  "query-asset-dependencies": async (e, a = "asset") =>
    asset_manager_1.assetManager.queryAssetDependencies(e, a),
  "query-asset-users": async (e, a = "asset") =>
    asset_manager_1.assetManager.queryAssetUsers(e, a),
  "query-asset-data": async (a) => {
    let s = null;

    forEach((e) => {
      if (e.dataManager.dataMap[a]) {
        s = e.dataManager.dataMap[a];
      }
    });

    return s;
  },
  "query-create-list": async () =>
    asset_handler_manager_1.assetHandlerManager.getCreateMap(),
  "query-icon-config-map": async () =>
    asset_handler_manager_1.assetHandlerManager.queryIconConfigMap(),
  "query-asset-config-map": async () =>
    asset_handler_manager_1.assetHandlerManager.queryAssetConfigMap(),
  "query-asset-thumbnail": async (e, a) => {
    var s = queryAsset(e);
    if (s) {
      return asset_handler_manager_1.assetHandlerManager.generateThumbnail(
        s,
        a
      );
    }
    throw new Error(`Can not find asset ${e}, please check your params`);
  },
  "query-asset-userData-config": async (e) => {
    if (Editor.Utils.UUID.isUUID(e)) {
      var a = queryAsset(e);
      if (a) {
        return asset_handler_manager_1.assetHandlerManager.queryUserDataConfig(
          a
        );
      }
      throw new Error(`Can not find asset ${e}, please check your params`);
    }
    return asset_handler_manager_1.assetHandlerManager.queryUserDataConfigDefault(
      e
    );
  },
  "query-global-internal-library"() {
    return asset_db_manager_1.assetDBManager.globalInternalLibrary;
  },
};
