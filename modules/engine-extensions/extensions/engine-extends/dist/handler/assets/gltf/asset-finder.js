Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultGltfAssetFinder = undefined;

const { loadAssetSync } = require("../utils/load-asset-sync");

class DefaultGltfAssetFinder {
  _assetDetails;
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
      (s !== undefined && null !== (s = s[e]) && loadAssetSync(s, t)) || null
    );
  }
}
exports.DefaultGltfAssetFinder = DefaultGltfAssetFinder;
