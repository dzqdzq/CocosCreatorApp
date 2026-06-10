var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, a = r) => {
        Object.defineProperty(e, a, {
          enumerable: true,
          get() {
            return t[r];
          },
        });
      }
    : (e, t, r, a) => {
        e[(a = a === undefined ? r : a)] = t[r];
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
  ((e) => {
    if (e && e.__esModule) {
      return e;
    }
    var t = {};
    if (e != null) {
      for (var r in e) {
        if (r !== "default" && Object.prototype.hasOwnProperty.call(e, r)) {
          __createBinding(t, e, r);
        }
      }
    }
    __setModuleDefault(t, e);
    return t;
  });

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.GltfPrefabImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const cc = __importStar(require("cc"));
const path_1 = __importDefault(require("path"));
const asset_finder_1 = require("./asset-finder");
const load_asset_sync_1 = require("./load-asset-sync");
const reader_manager_1 = require("./reader-manager");
const uuidV5 = require("uuid").v5;
const utils_1 = require("../../utils");
const GLTF_PREFAB_NAMESPACE = "8fa06a75-f07a-44d4-82cf-d08c3c986599";
class GltfPrefabImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.12";
  }
  get name() {
    return "gltf-scene";
  }
  get assetType() {
    return "cc.Prefab";
  }
  async import(e) {
    if (!e.parent) {
      return false;
    }
    var t = await reader_manager_1.glTfReaderManager.getOrCreate(e.parent);
    var r = e.parent.userData;

    var r = t.createScene(
      e.userData.gltfIndex,
      new asset_finder_1.DefaultGltfAssetFinder(r.assetFinder)
    );

    var a = [];
    for (const s of Object.keys(e.parent.subAssets)) {
      var n = e.parent.subAssets[s];

      if (n.meta.importer === "gltf-animation") {
        a.push(n.uuid);
      }
    }
    let i = null;

    if (r.getComponentInChildren(cc.SkinnedMeshRenderer)) {
      i = r.addComponent(cc.SkeletalAnimation);
      i._sockets = t.createSockets(r);
    } else if (a.length !== 0) {
      i = r.addComponent(cc.Animation);
    }

    if (i) {
      var o = a.map(
        (e) => load_asset_sync_1.loadAssetSync(e, cc.AnimationClip) || null
      );
      for (const d of (i._clips = o)) {
        if (d) {
          i._defaultClip = d;
          break;
        }
      }
    }

    if (t.gltf.scenes.length === 1) {
      o = e.parent.basename;
      r.name = path_1.default.basename(o, path_1.default.extname(o));
    }

    t = generatePrefab(r);
    o = EditorExtends.serialize(t);
    await e.saveToLibrary(".json", o);
    r = utils_1.getDependUUIDList(o);
    e.setData("depends", r);
    return true;
  }
}
function getCompressedUuid(e) {
  e = uuidV5(e, GLTF_PREFAB_NAMESPACE);
  return EditorExtends.UuidUtils.compressUuid(e, true);
}
exports.GltfPrefabImporter = GltfPrefabImporter;
const nodePathMap = new Map();
function getNodePath(e) {
  if (nodePathMap.has(e)) {
    return nodePathMap.get(e);
  }
  var t;
  var r = [];
  let a = e;

  while (a) {
    var n = a.getSiblingIndex();
    r.push(a.name + n);
    a = a.parent;
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
