Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultGltfAssetFinder = undefined;
const load_asset_sync_1 = require("./load-asset-sync");
class DefaultGltfAssetFinder {
  constructor(s = {}) {
    this._assetDetails = s;
  }
  serialize() {
    return this._assetDetails;
  }
  set(s, e) {
    this._assetDetails[s] = e;
  }
  find(s, e, t) {
    var s = this._assetDetails[s];
    return (
      (s !== undefined &&
        null !== (s = s[e]) &&
        load_asset_sync_1.loadAssetSync(s, t)) ||
      null
    );
  }
}
exports.DefaultGltfAssetFinder = DefaultGltfAssetFinder;
