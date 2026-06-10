Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = undefined;
const utils_1 = require("@editor/asset-db/libs/utils");
function migrate(i) {
  Object.keys(i.subAssets).forEach((e) => {
    var s = utils_1.nameToId(e);
    var t = i.subAssets[e];
    t.meta.uuid = t.uuid.replace(e, s);
  });
}
exports.migrate = migrate;
