var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.migratePrefabInstanceRoots = migratePrefabInstanceRoots;
exports.migratePrefabInstanceRootsByJson = migratePrefabInstanceRootsByJson;
const fs_extra_1 = __importDefault(require("fs-extra"));

const { walkNode } = require("./utils");

async function migratePrefabInstanceRoots(e) {
  migratePrefabInstanceRootsByJson(
    e.getSwapSpace().json || (await fs_extra_1.default.readJSON(e.source))
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

    const r = t._prefab ? a[t._prefab.__id__] : null;
    if (t && r && t._children) {
      const s = [];
      t._children.forEach((e) => {
        walkNode(a, e, (e, t) => {
          if (e && e._prefab && a[e._prefab.__id__].instance) {
            s.push(t);
          }
        });

        if (s.length > 0) {
          r.nestedPrefabInstanceRoots = s;
        } else {
          r.nestedPrefabInstanceRoots = undefined;
        }
      });
    }
  } else {
    console.warn("can't find root node");
  }
}
