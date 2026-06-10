Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAssetUncached = loadAssetUncached;
const cc_1 = require("cc");

const { promisify } = require("util");

async function loadAssetUncached(e, s) {
  var t = cc_1.assetManager.assets.get(e);

  var t =
    (t && cc_1.assetManager.releaseAsset(t),
    await promisify(cc_1.assetManager.loadAny)(e));

  if (!s || t instanceof s) {
    return t;
  }
  throw new Error(`Expect asset ${e} to be of type ` + s);
}
