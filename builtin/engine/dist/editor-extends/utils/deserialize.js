Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializeFull = deserializeFull;
const cc_1 = require("cc");

const { deserialize } = cc_1;

async function deserializeFull(e) {
  var i = new cc_1.deserialize.Details();
  i.reset();
  var e = deserialize(e, i);
  var i_uuidList = i.uuidList;
  if (i_uuidList) {
    if (i_uuidList.some((e) => typeof e == "number")) {
      throw new Error("Don't know how to handle numeric UUID in " + i_uuidList);
    }
    const n = {};

    await Promise.all(
      i_uuidList.map(
        (a) =>
          new Promise((r, s) => {
            cc_1.assetManager.loadAny(a, (e, i) => {
              if (e) {
                s(e);
              } else {
                n[a] = i;
                r();
              }
            });
          })
      )
    );

    i.assignAssetsBy((e, i) => {
      if (!(e in n)) {
        throw new Error(
          `Deserialized object is referencing ${e} which was not appeared in deserialize details.`
        );
      }
      var r = n[e];
      if (r instanceof cc_1.Asset) {
        return r;
      }
      throw new Error(
        `Deserialized object is referencing ${e} which was appeared in deserialize details but isn't an asset.`
      );
    });
  }
  return e;
}
