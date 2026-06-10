var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, n, t, r = t) => {
        var o = Object.getOwnPropertyDescriptor(n, t);

        if (
          !o ||
          (!("get" in o) ? !o.writable && !o.configurable : n.__esModule)
        ) {
          o = {
            enumerable: true,
            get() {
              return n[t];
            },
          };
        }

        Object.defineProperty(e, r, o);
      }
    : (e, n, t, r) => {
        e[(r = r === undefined ? t : r)] = n[t];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, n) => {
        Object.defineProperty(e, "default", { enumerable: true, value: n });
      }
    : (e, n) => {
        e.default = n;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var o = (e) =>
      (o =
        Object.getOwnPropertyNames ||
        ((e) => {
          var n;
          var t = [];
          for (n in e) {
            if (Object.prototype.hasOwnProperty.call(e, n)) {
              t[t.length] = n;
            }
          }
          return t;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var n = {};
      if (e != null) {
        for (var t = o(e), r = 0; r < t.length; r++) {
          if (t[r] !== "default") {
            __createBinding(n, e, t[r]);
          }
        }
      }
      __setModuleDefault(n, e);
      return n;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.walkNode = walkNode;
exports.visitObjTypeReferences = visitObjTypeReferences;
exports.addPrefabInfo = addPrefabInfo;
exports.checkAndStripNode = checkAndStripNode;
exports.addPrefabInstance = addPrefabInstance;
const cc_1 = require("cc");
const Uuid = __importStar(require("./uuid"));
const CompPrefabInfo = cc_1.Prefab._utils.CompPrefabInfo;
const PrefabInfo = cc_1.Prefab._utils.PrefabInfo;
const PrefabInstance = cc_1.Prefab._utils.PrefabInstance;
const DontClearIDComponentNames = ["TerrainRenderable"];
function walkNode(e, n, t = false) {
  t = n(e, !!t);
  if (!t) {
    var e_children = e.children;
    for (let e = e_children.length - 1; e >= 0; --e) {
      walkNode(e_children[e], n, true);
    }
  }
}
function visitObjTypeReferences(n, t) {
  for (let e = 0; e < n.components.length; ++e) {
    var r = n.components[e];
    var o =
      ((i = a = o = undefined), ((i = a = o) || r.constructor).__values__);
    for (let e = 0; e < o.length; e++) {
      var a = o[e];
      var i = r[a];
      if (i && typeof i == "object") {
        if (Array.isArray(i)) {
          for (let e = 0; e < i.length; e++) {
            if (cc.isValid(i)) {
              t(i, "" + e, i[e]);
            }
          }
        } else {
          if (cc.isValid(i)) {
            t(r, a, i);
          }
        }
      }
    }
  }
}
function initNodePrefabInfo(e, n, t) {
  if (!e._prefab) {
    e._prefab = new PrefabInfo();
  }

  e = e._prefab;
  return e ? ((e.root = n), (e.asset = t), e) : null;
}
function isPrefabRoot(e) {
  return !(!e._prefab || !e._prefab.instance);
}
function addPrefabInfo(e, o, a, i = {}) {
  if (o) {
    walkNode(e, (n, t) => {
      if (n && !(n.objFlags & cc.Object.Flags.HideInHierarchy)) {
        t = t && isPrefabRoot(n);
        let n_prefab = n._prefab;

        if (n_prefab) {
          t || ((n_prefab.asset = a), (n_prefab.root = o));
          o._prefab &&
            n_prefab.instance &&
            (n_prefab.instance.prefabRootNode = o);
        } else {
          n_prefab = initNodePrefabInfo(n, o, a);
        }

        if (n_prefab) {
          if (i.nodeFileIdGenerator) {
            n_prefab.fileId = i.nodeFileIdGenerator(n);
          } else {
            n_prefab.fileId = n_prefab.fileId || n.uuid;
          }

          if (n.components && n.components.length) {
            for (let n_prefab = 0; n_prefab < n.components.length; n_prefab++) {
              var r = n.components[n_prefab];

              if (!r.__prefab) {
                r.__prefab = new CompPrefabInfo();
              }

              if (r.__prefab) {
                if (i.compFileIdGenerator) {
                  r.__prefab.fileId = i.compFileIdGenerator(r, n_prefab);
                } else {
                  r.__prefab.fileId = r.__prefab.fileId || r.uuid;
                }
              }
            }
          }

          return !!t || undefined;
        }
      }
    });
  } else {
    console.error("addPrefabInfo without a rootNode");
  }
}
function checkAndStripNode(a, i = undefined) {
  const f = {};

  walkNode(a, (o) => {
    if (o.objFlags & cc.Object.Flags.HideInHierarchy) {
      if (!o.isPrivatePreview) {
        o._id = "";
        for (let e = 0; e < o.components.length; ++e) {
          var n = o.components[e];

          if (!DontClearIDComponentNames.includes(cc_1.js.getClassName(n))) {
            n._id = "";
          }
        }
      }
    } else {
      visitObjTypeReferences(o, (e, n, t) => {
        let r = false;

        if (t instanceof cc.Component.EventHandler) {
          t = t.target;
        } else if (t instanceof cc.Component) {
          t = t.node;
        }

        if ((r = t && t instanceof cc.Node && !t.isChildOf(a) ? true : r)) {
          e[n] instanceof cc.Component.EventHandler
            ? (e[n] = new cc.Component.EventHandler())
            : (o._prefab?.fileId &&
                e.__prefab?.fileId &&
                (f[o._prefab.fileId] = {
                  path: n,
                  component: e.__prefab.fileId,
                  value: e[n],
                }),
              (e[n] = null));

          i ||
            console.warn(
              'Reference "%s" of "%s" to external scene object "%s" can not be saved in prefab asset.',
              n,
              e.name || a.name,
              t.name
            );
        }
      });

      o._id = "";
      for (let e = 0; e < o.components.length; ++e) {
        o.components[e]._id = "";
      }
    }
  });

  return f;
}
function addPrefabInstance(e) {
  var n;
  var e = e._prefab;

  if (e && !e.instance) {
    n = new PrefabInstance();
    n.fileId = Uuid.uuid();
    e.instance = n;
  }
}
