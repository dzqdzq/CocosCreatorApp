Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;

const { queryAsset } = require("@editor/asset-db");

exports.methods = {
  async queryDepends(e) {
    let s = [];

    await Promise.all(
      e.map(async (e) => {
        e = await Manager.assetManager.queryAssetUsers(e, "all");
        s = s.concat(e);
      })
    );

    return (s = Array.from(new Set(s))).map((e) => {
      var s = queryAsset(e);
      return s ? s.url : e;
    });
  },
};
