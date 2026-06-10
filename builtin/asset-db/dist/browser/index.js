var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;

const {
  setAutoRefresh,
  refreshAllDatabase,
  isReady,
} = require("./worker/tasks");

const {
  importAsset,
  copyAsset,
  moveAsset,
  renameAsset,
  deleteAsset,
  reimportAsset,
  refreshAsset,
  refreshAllEffect,
  generateAvailableURL,
  initAsset,
  queryAllImporter,
  queryAllAssetTypes,
} = require("./operation");

const { init, forwarding, reload, debug } = require("./worker/index");

const electron_worker_1 = __importDefault(require("@base/electron-worker"));

const { formatCreateMenu } = require("../share/utils");

const electron_1 = require("electron");
const asset_config_1 = require("../share/asset-config");
const mask_sync_1 = require("../worker/mask-sync");
let noticeDate = 0;
async function load() {
  mask_sync_1.assetDBMask.add(
    "import-asset",
    Editor.I18n.t("asset-db.mask.loading")
  );

  init();
}
async function unload() {
  electron_worker_1.default.close("Assets");
  Editor.Message.broadcast("asset-db:close");
}
exports.methods = {
  noticeReloadEditor() {
    var e = Date.now();

    if (e - noticeDate >= 30000) {
      noticeDate = e;

      Editor.Task.addNotice({
        title: Editor.I18n.t("asset-db.preferences.ignore_changed"),
        message: Editor.I18n.t("asset-db.preferences.notice_reload_editor"),
        source: Editor.I18n.t("asset-db.title"),
        type: "warn",
      });
    }
  },
  noticeConfigChanged(...e) {
    if (e.includes("prefabPreviewEnabled")) {
      Editor.Message.broadcast("notice-reload-inspector");
    }
  },
  updateConfig(e, r) {
    if (e === "autoScan") {
      setAutoRefresh(!!r);

      r ||
        Editor.Task.addNotice({
          title: Editor.I18n.t("asset-db.preferences.auto_scan"),
          message: Editor.I18n.t("asset-db.preferences.auto_scan_info"),
          source: Editor.I18n.t("asset-db.title"),
          type: "log",
        });
    }
  },
  refreshAllDatabase() {
    refreshAllDatabase();
  },
  refreshDefaultUserDataConfig() {
    return forwarding("asset-worker:refresh-default-user-data") || null;
  },
  async updateDefaultUserData(e, r, s) {
    return (
      (await forwarding("asset-worker:update-default-user-data", e, r, s)) ||
      null
    );
  },
  ready() {
    mask_sync_1.assetDBMask.remove("import-asset");
  },
  close() {
    mask_sync_1.assetDBMask.add(
      "import-asset",
      Editor.I18n.t("asset-db.mask.loading")
    );
  },
  async stopDatabase(e) {
    return (await forwarding("asset-worker:stop-database", e)) || null;
  },
  async startDatabase(e) {
    return (await forwarding("asset-worker:start-database", e)) || null;
  },
  async createAsset(e, r, s) {
    return exports.methods.newAsset({
      content: r,
      target: e,
      overwrite: s?.overwrite,
      rename: s?.rename,
    });
  },
  async importAsset(e, r, s) {
    return importAsset(e, r, s);
  },
  async copyAsset(e, r, s) {
    return copyAsset(e, r, s);
  },
  async moveAsset(e, r, s) {
    return moveAsset(e, r, s);
  },
  async renameAsset(e, r, s) {
    return renameAsset(e, r, s);
  },
  async deleteAsset(e) {
    return deleteAsset(e);
  },
  async openAsset(e) {
    return forwarding("asset-worker:open-asset", e);
  },
  async saveAsset(e, r) {
    return (await forwarding("asset-worker:save-asset", e, r)) || null;
  },
  async saveAssetMeta(e, r) {
    return (await forwarding("asset-worker:save-asset-meta", e, r)) || null;
  },
  async reimportAsset(e) {
    return reimportAsset(e);
  },
  async refreshAsset(e) {
    e = await refreshAsset(e);

    await new Promise((e) => {
      setTimeout(e, 500);
    });

    return e;
  },
  async refreshAllEffect() {
    return refreshAllEffect();
  },
  async queryPath(e) {
    return (await forwarding("asset-worker:query-path", e)) || null;
  },
  async queryUrl(e) {
    return (await forwarding("asset-worker:query-url", e)) || null;
  },
  async queryUUID(e) {
    return forwarding("asset-worker:query-uuid", e);
  },
  async queryAssets(e, r) {
    return forwarding("asset-worker:query-assets", e, r);
  },
  async queryAssetInfo(e, r) {
    return forwarding("asset-worker:query-asset-info", e, r);
  },
  async queryAssetMeta(e) {
    return forwarding("asset-worker:query-asset-meta", e);
  },
  async queryMissingAssetInfo(e) {
    return forwarding("asset-worker:query-missing-asset-info", e);
  },
  async queryAssetMtime(e) {
    return forwarding("asset-worker:query-asset-mtime", e);
  },
  async queryAssetDependencies(e, r = "asset") {
    return forwarding("asset-worker:query-asset-dependencies", e, r);
  },
  async queryAssetUsers(e, r = "asset") {
    return forwarding("asset-worker:query-asset-users", e, r);
  },
  async queryAssetDependenciesDeprecated(e, r = "asset") {
    console.log(
      Editor.I18n.t("asset-db.deprecatedTip", {
        oldName: "query-asset-dependinces",
        newName: "query-asset-dependencies",
        version: "3.8.3",
      })
    );

    return forwarding("asset-worker:query-asset-dependencies", e, r);
  },
  async queryAssetUsed(e, r = "asset") {
    console.log(
      Editor.I18n.t("asset-db.deprecatedTip", {
        oldName: "query-asset-used",
        newName: "query-asset-users",
        version: "3.8.3",
      })
    );

    return forwarding("asset-worker:query-asset-users", e, r);
  },
  async queryAssetData(e) {
    return forwarding("asset-worker:query-asset-data", e);
  },
  async isBusy() {
    return forwarding("asset-worker:query-database-busy");
  },
  async pause(e) {
    return forwarding("asset-worker:pause-database", e);
  },
  async resume() {
    return forwarding("asset-worker:resume-database");
  },
  async generateAvailableUrl(e) {
    return generateAvailableURL(e);
  },
  async "query-db-info"(e) {
    return forwarding("asset-worker:query-db-info", e);
  },
  async "query-db-infos"() {
    return forwarding("asset-worker:query-db-infos");
  },
  async "query-db-list"() {
    return forwarding("asset-worker:query-db-list");
  },
  async "query-global-internal-library"() {
    return forwarding("asset-worker:query-global-internal-library");
  },
  refresh() {
    reload();
  },
  "open-devtools"() {
    debug();
  },
  async queryReady() {
    return isReady();
  },
  async "create-asset-dialog"(e, r) {
    var s;
    return typeof e == "string"
      ? (((s = {}).url = r),
        asset_config_1.createAssetConfig[e]
          ? (s.handler = asset_config_1.createAssetConfig[e].handler)
          : (s.ccType = e),
        console.warn(
          "The parameters of create-asset-dialog have changed, please refer to the new interface definition for adaptation"
        ),
        (await forwarding("asset-worker:create-asset-dialog", s)).uuid)
      : forwarding("asset-worker:create-asset-dialog", e);
  },
  async "init-asset"(e, r) {
    return initAsset(e, r);
  },
  async "create-asset-template"(e, r) {
    return forwarding("asset-worker:create-asset-template", e, r);
  },
  async "query-all-importer"() {
    return queryAllImporter();
  },
  async "query-all-asset-types"() {
    return queryAllAssetTypes();
  },
  async executeScript(e) {
    return forwarding("asset-worker:execute-script", e);
  },
  async projectChangeHighQuality(e) {
    return forwarding("asset-worker:change-high-quality", e);
  },
  async queryCreateList() {
    return forwarding("asset-worker:query-create-list");
  },
  async queryIconConfigMap() {
    return forwarding("asset-worker:query-icon-config-map");
  },
  async queryAssetConfigMap() {
    return forwarding("asset-worker:query-asset-config-map");
  },
  async queryCreateMenuList() {
    var e = await forwarding("asset-worker:query-create-list");
    return formatCreateMenu(e);
  },
  async queryAssetThumbnail(e, r) {
    return forwarding("asset-worker:query-asset-thumbnail", e, r);
  },
  async queryAssetUserDataConfig(e) {
    return forwarding("asset-worker:query-asset-userData-config", e);
  },
  async batchMessageHandler(e, r = false) {
    return forwarding("asset-worker:batch-message-handler", e, r);
  },
  async newAsset(e) {
    return forwarding("asset-worker:create-asset", e);
  },
  async executeCustomOperation(e, r, ...s) {
    return forwarding("asset-worker:execute-custom-operation", e, r, ...s);
  },
  async showAssetTemplateDir(e) {
    return electron_1.shell.openPath(e);
  },
};
