Object.defineProperty(exports, "__esModule", { value: true });

exports.migratePrefabInstanceRootsByJson = undefined;
exports.migratePrefabInstanceRoots = undefined;

const fs_extra_1 = require("fs-extra");
const utils_1 = require("./utils");
async function migratePrefabInstanceRoots(e) {
  migratePrefabInstanceRootsByJson(
    e.getSwapSpace().json || (await fs_extra_1.readJSON(e.source))
  );
}
function migratePrefabInstanceRootsByJson(a) {
  var e;
  var [, t] = a;
  if (t) {
    if (!t._prefab) {
      e = { __type__: "cc.PrefabInfo", fileId: t._id };
      e = a.push(e) - 1;
      t._prefab = { __id__: e };
    }

    const s = t._prefab ? a[t._prefab.__id__] : null;
    if (t && s && t._children) {
      const n = [];
      t._children.forEach((e) => {
        utils_1.walkNode(a, e, (e, t) => {
          if (e && e._prefab && a[e._prefab.__id__].instance) {
            n.push(t);
          }
        });

        if (n.length > 0) {
          s.nestedPrefabInstanceRoots = n;
        } else {
          s.nestedPrefabInstanceRoots = undefined;
        }
      });
    }
  } else {
    console.warn("can't find root node");
  }
}
exports.migratePrefabInstanceRoots = migratePrefabInstanceRoots;
exports.migratePrefabInstanceRootsByJson = migratePrefabInstanceRootsByJson;
