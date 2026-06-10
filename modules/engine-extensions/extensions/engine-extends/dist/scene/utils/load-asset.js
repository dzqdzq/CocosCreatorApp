Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAsset = loadAsset;
exports.loadAssetUncached = loadAssetUncached;
const cc_1 = require("cc");
async function loadAsset(e) {
  return new Promise((a, t) => {
    cc_1.assetManager.loadAny(e, (e, s) => {
      if (e) {
        t(e);
      } else {
        a(s);
      }
    });
  });
}
async function loadAssetUncached(e) {
  cc_1.assetManager.releaseAsset(cc_1.assetManager.assets.get(e));
  return loadAsset(e);
}
