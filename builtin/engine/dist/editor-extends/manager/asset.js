Object.defineProperty(exports, "__esModule", { value: true });
class AssetManager {
  queryAssetInfo(s, t) {
    Editor.Message.request("asset-db", "query-asset-info", s)
      .then((e) => {
        if (!e) {
          return t(
            new Error(
              'Can not get asset url by uuid "' +
                s +
                '", the asset may be deleted.'
            )
          );
        }
        t(null, e);
      })
      .catch((e) => {
        console.warn(
          new Error(
            'Can not get asset url by uuid "' +
              s +
              '", the asset may be deleted.'
          )
        );

        t(e, null);
      });
  }
  getAssetInfoFromUrl(e) {
    let s;

    if (globalThis.Manager && globalThis.Manager.AssetWorker) {
      info = globalThis.Manager.Utils.queryAssets({ pattern: e });
    } else {
      s = pkg.execSync("asset-db", "queryAssets", { pattern: e });
    }

    return s[0];
  }
}
exports.default = AssetManager;
