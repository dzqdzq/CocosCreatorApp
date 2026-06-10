var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, n = r) => {
        var a = Object.getOwnPropertyDescriptor(t, r);

        if (
          !a ||
          (!("get" in a) ? !a.writable && !a.configurable : t.__esModule)
        ) {
          a = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, n, a);
      }
    : (e, t, r, n) => {
        e[(n = n === undefined ? r : n)] = t[r];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var a = (e) =>
      (a =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = a(e), n = 0; n < r.length; n++) {
          if (r[n] !== "default") {
            __createBinding(t, e, r[n]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.GltfPrefabHandler = undefined;
const cc = __importStar(require("cc"));
const path_1 = __importDefault(require("path"));
const asset_finder_1 = require("./asset-finder");

const { loadAssetSync } = require("../utils/load-asset-sync");

const reader_manager_1 = require("./reader-manager");
const uuidV5 = require("uuid").v5;

const { getDependUUIDList } = require("../../utils");

const nodePathMap = new Map();
const GLTF_PREFAB_NAMESPACE = "8fa06a75-f07a-44d4-82cf-d08c3c986599";
function changeMaterialsInJSON(e, t) {
  var r;

  var n = t.find(
    (e) =>
      e.__type__ === "cc.SkinnedMeshRenderer" ||
      e.__type__ === "cc.MeshRenderer"
  );

  for (const a of Object.keys(e)) {
    if (n._materials[a]) {
      if ((r = e[a])) {
        n._materials[a].__uuid__ = r;
      } else {
        console.error("overwriteMaterial uuid is empty, index: " + a);
      }
    }
  }
}
function getCompressedUuid(e) {
  e = uuidV5(e, GLTF_PREFAB_NAMESPACE);
  return EditorExtends.UuidUtils.compressUuid(e, true);
}
function getNodePath(e) {
  if (nodePathMap.has(e)) {
    return nodePathMap.get(e);
  }
  var t;
  var r = [];
  let n = e;

  while (n) {
    var a = n.getSiblingIndex();
    r.push(n.name + a);
    n = n.parent;
  }

  t = r.reverse().join("/");
  nodePathMap.set(e, t);
  return t;
}
function nodeFileIdGenerator(e) {
  return getCompressedUuid(getNodePath(e));
}
function compFileIdGenerator(e, t) {
  return getCompressedUuid(getNodePath(e.node) + "/comp" + t);
}
function getDumpableNode(e, t) {
  nodePathMap.clear();

  EditorExtends.PrefabUtils.addPrefabInfo(e, e, t, {
    nodeFileIdGenerator,
    compFileIdGenerator,
  });

  EditorExtends.PrefabUtils.checkAndStripNode(e);
  return e;
}
function generatePrefab(e) {
  var t = new cc.Prefab();
  var e = getDumpableNode(e, t);
  t.data = e;
  return t;
}

exports.GltfPrefabHandler = {
  name: "gltf-scene",
  assetType: "cc.Prefab",
  importer: {
    version: "1.0.14",
    async import(t) {
      if (!t.parent) {
        return false;
      }
      var e = await reader_manager_1.glTfReaderManager.getOrCreate(t.parent);
      var r = t.parent.userData;
      var n = new asset_finder_1.DefaultGltfAssetFinder(r.assetFinder);
      const a = e.createScene(t.userData.gltfIndex, n);
      var o = [];
      for (const v of Object.keys(t.parent.subAssets)) {
        var i = t.parent.subAssets[v];

        if (i.meta.importer === "gltf-animation") {
          o.push(i.uuid);
        }
      }
      var s = r.mountAllAnimationsOnPrefab ?? true;
      let d = null;

      if (a.getComponentInChildren(cc.SkinnedMeshRenderer)) {
        d = a.addComponent(cc.SkeletalAnimation);
        d._sockets = e.createSockets(a);
      } else if (o.length !== 0) {
        d = a.addComponent(cc.Animation);
      }

      if (s && d) {
        var s = o.map((e) => loadAssetSync(e, cc.AnimationClip) || null);
        for (const D of (d._clips = s)) {
          if (D) {
            d._defaultClip = D;
            break;
          }
        }
      }

      if (r.lods && !r.lods.hasBuiltinLOD && r.lods.enable) {
        var c = t.parent.subAssets;
        const M = {};
        const P = {};
        for (const A in c) {
          var l = c[A];

          if (l.meta.importer === "gltf-mesh") {
            if (l.userData.lodOptions) {
              M[l.uuid] = l.userData;
            } else {
              P[l.uuid] = l.userData;
            }
          }
        }
        const y = new Array(Object.keys(P).length);
        a.children.forEach((e) => {
          var t = e.getComponentsInChildren(cc.MeshRenderer);
          for (const r in P) {
            t.forEach((e) => {
              if (e?.mesh?.uuid && r === e.mesh.uuid) {
                e.node.name = e.node.name + "_LOD0";
                y[P[r].gltfIndex] = e.node;
              }
            });
          }
        });
        for (const C in M) {
          var u;
          var f;
          var p;
          var _ = r.assetFinder?.meshes?.indexOf(C) || -1;

          if (-1 !== _ && (_ = n.find("meshes", _, cc.Mesh))) {
            p = M[C];

            p = (u = y[p.gltfIndex]).name.replace(
              /(_LOD0)+$/,
              "_LOD" + p.lodLevel
            );

            f = cc.instantiate(u);
            f.name = p;
            (p = f.getComponent(cc.MeshRenderer)) && (p.mesh = _);
            u.parent.addChild(f);
          }
        }
      }
      const h = [];
      let m = a.getComponent(cc.LODGroup);

      a.children.forEach((e) => {
        var t = /_LOD(\d+)$/i.exec(e.name);
        if (t && t.length > 1) {
          if (!m) {
            try {
              m = a.addComponent(cc.LODGroup);
            } catch (e) {
              console.error("Add LODGroup component failed!");
            }
          }
          t = parseInt(t[1], 10);
          let r = m?.LODs[t];

          if (!(r = r !== undefined ? r : h[t])) {
            r = new cc.LOD();
            h[t] = r;
          }

          const n = (e) => {
            var t = e.getComponents(cc.MeshRenderer);

            if (t && t.length > 0) {
              t.forEach((e) => {
                r?.insertRenderer(-1, e);
              });
            }

            if (e.children && e.children.length > 0) {
              e.children.forEach((e) => {
                n(e);
              });
            }
          };
          n(e);
        }
      });

      if (m) {
        let t = 0.25;
        var h_length = h.length;
        for (let e = 0; e < h_length - 1; e++) {
          var b = h[e];
          t = r.lods?.options[e]?.screenRatio || t;
          m.insertLOD(e, t, b);
          t /= 2;
        }

        if (r.lods?.options[h_length - 1]?.screenRatio) {
          m.insertLOD(
            h_length - 1,
            r.lods.options[h_length - 1].screenRatio,
            h[h_length - 1]
          );
        } else if (t < 0.01) {
          m.insertLOD(h_length - 1, t, h[h_length - 1]);
        } else {
          m.insertLOD(h_length - 1, 0.01, h[h_length - 1]);
        }
      }

      if (e.gltf.scenes.length === 1) {
        s = t.parent.basename;
        a.name = path_1.default.basename(s, path_1.default.extname(s));
      }

      e = generatePrefab(a);
      let O = EditorExtends.serialize(e);
      if (r.redirectMaterialMap) {
        s = JSON.parse(O);
        try {
          await changeMaterialsInJSON(r.redirectMaterialMap, s);
        } catch (e) {
          console.error(e);
          console.error(`changeMaterialsInJSON in asset ${t.url} failed!`);
        }
        O = JSON.stringify(s, undefined, 2);
      }
      await t.saveToLibrary(".json", O);
      e = getDependUUIDList(O);
      t.setData("depends", e);
      nodePathMap.clear();
      return true;
    },
  },
};

exports.default = exports.GltfPrefabHandler;
