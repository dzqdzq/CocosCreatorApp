Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = migrate;

const { nameToId } = require("@editor/asset-db/libs/utils");

function migrate(i) {
  Object.keys(i.subAssets).forEach((e) => {
    var s = nameToId(e);
    var t = i.subAssets[e];
    t.meta.uuid = t.uuid.replace(e, s);
  });
}
