Object.defineProperty(exports, "__esModule", { value: true });
exports._parseRect = undefined;
exports._parseFloat2 = undefined;
const asset_db_1 = require("@editor/asset-db");
const cc_1 = require("cc");
const BRACE_REGEX = /[\{\}]/g;
function _parseFloat2(e, t) {
  e = e.slice(1, -1).split(",");
  return new t(parseFloat(e[0]), parseFloat(e[1]));
}
function _parseRect(e) {
  e = (e = e.replace(BRACE_REGEX, "")).split(",");
  return new cc_1.Rect(
    parseFloat(e[0] || "0"),
    parseFloat(e[1] || "0"),
    parseFloat(e[2] || "0"),
    parseFloat(e[3] || "0")
  );
}
exports._parseFloat2 = _parseFloat2;
exports._parseRect = _parseRect;
class SpriteAtlasImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.0";
  }
  get name() {
    return "sprite-atlas";
  }
  get assetType() {
    return "cc.SpriteAtlas";
  }
  async import(e) {
    return true;
  }
}
exports.default = SpriteAtlasImporter;
