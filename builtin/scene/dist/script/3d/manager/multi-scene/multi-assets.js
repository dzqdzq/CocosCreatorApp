Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiAssets = undefined;
class MultiAssets {
  async queryAssetsInfo(e) {
    return (await Promise.all(e.map((e) => this.queryAssetInfo(e)))).filter(
      (e) => e !== null
    );
  }
  async queryAssetInfo(e) {
    e = await Editor.Message.request("asset-db", "query-asset-info", e);
    return e
      ? {
          uuid: e.uuid,
          name: e.name,
          dirty: false,
          type: this._getType(e),
          url: e.url,
        }
      : null;
  }
  _getType(e) {
    return e.type === "cc.SceneAsset" ? "scene" : "prefab";
  }
}
exports.MultiAssets = MultiAssets;
