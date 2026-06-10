var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, a, r = a) => {
        var s = Object.getOwnPropertyDescriptor(t, a);

        if (
          !s ||
          (!("get" in s) ? !s.writable && !s.configurable : t.__esModule)
        ) {
          s = {
            enumerable: true,
            get() {
              return t[a];
            },
          };
        }

        Object.defineProperty(e, r, s);
      }
    : (e, t, a, r) => {
        e[(r = r === undefined ? a : r)] = t[a];
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
    var s = (e) =>
      (s =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var a = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              a[a.length] = t;
            }
          }
          return a;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var a = s(e), r = 0; r < a.length; r++) {
          if (a[r] !== "default") {
            __createBinding(t, e, a[r]);
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
exports.GltfMaterialHandler = undefined;
exports.dumpMaterial = dumpMaterial;

const { queryUUID, queryPath, queryUrl } = require("@editor/asset-db");

const cc = __importStar(require("cc"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const asset_finder_1 = require("./asset-finder");

const { loadAssetSync } = require("../utils/load-asset-sync");

const reader_manager_1 = require("./reader-manager");

const { getDependUUIDList } = require("../../utils");

const { parse } = require("url");

function createMaterial(e, t, a, r) {
  return t.createMaterial(
    e,
    a,
    (e) => {
      e = queryUUID(e);
      return loadAssetSync(e, cc.EffectAsset);
    },
    {
      useVertexColors: r.useVertexColors,
      depthWriteInAlphaModeBlend: r.depthWriteInAlphaModeBlend,
      smartMaterialEnabled: r.fbx?.smartMaterialEnabled ?? false,
    }
  );
}
async function dumpMaterial(e, t, a, r, s) {
  var e_userData = e.userData;
  let n = null;

  if (
    e_userData.materialDumpDir &&
    !(n = queryPath(e_userData.materialDumpDir))
  ) {
    console.warn(
      "The specified dump directory of materials is not valid. Default directory is used."
    );
  }

  if (!n) {
    n = path_1.default.join(
      path_1.default.dirname(e.source),
      "Materials_" + e.basename
    );

    e_userData.materialDumpDir = await queryUrl(n);
  }

  fs_extra_1.default.ensureDirSync(n);
  s = path_1.default.join(n, s.replace(/[\/:*?"<>|]/g, "-"));

  if (!fs_extra_1.default.existsSync(s)) {
    r = createMaterial(r, a, t, e_userData);
    a = EditorExtends.serialize(r);
    fs_extra_1.default.writeFileSync(s, a);
  }

  (findAssetDB(e_userData.materialDumpDir) || e._assetDB).refresh(s);
  t = queryUrl(s);
  if (t) {
    r = queryUUID(t);
    if (r && typeof r == "string") {
      return r;
    }
  }
  e.depend(s);
  return null;
}
function findAssetDB(e) {
  return e && (e = parse(e)).host
    ? Manager.assetDBManager.assetDBMap[e.host]
    : null;
}

exports.GltfMaterialHandler = {
  name: "gltf-material",
  assetType: "cc.Material",
  instantiation: ".material",
  importer: {
    version: "1.0.14",
    async import(e) {
      if (!e.parent) {
        return false;
      }
      if (e.parent.meta?.userData?.materials) {
        var t = e.parent.meta.userData.materials[e.uuid];
        if (t) {
          console.log(
            "importer: Reuse previously edited material data. " + e.uuid
          );
          const r = JSON.stringify(t);

          await e.saveToLibrary(".json", r);
          const s = getDependUUIDList(r);

          e.setData("depends", s);
          return true;
        }
      }
      var t = await reader_manager_1.glTfReaderManager.getOrCreate(e.parent);
      var a = e.parent.userData;

      var t = createMaterial(
        e.userData.gltfIndex,
        t,
        new asset_finder_1.DefaultGltfAssetFinder(a.assetFinder),
        a
      );

      const r = EditorExtends.serialize(t);

      await e.saveToLibrary(".json", r);
      const s = getDependUUIDList(r);

      e.setData("depends", s);
      return true;
    },
  },
  createInfo: {
    async save(t, e) {
      var t = t.uuid;
      var [a] = t.split("@");
      if (!e || Buffer.isBuffer(e)) {
        throw new Error(
          "" + Editor.I18n.t("asset-db.saveAssetMeta.fail.content")
        );
      }
      var r = Manager.assetManager.queryAssetMeta(a);

      if (!r.userData.materials || typeof r.userData.materials != "object") {
        r.userData.materials = {};
      }

      try {
        r.userData.materials[t] = typeof e == "string" ? JSON.parse(e) : e;
        await Manager.assetManager.saveAssetMeta(a, r);
      } catch (e) {
        console.error(
          `Save materials({asset(${t})} data to fbx {asset(${a})} failed!`
        );

        console.error(e);
        return false;
      }
      return true;
    },
  },
};

exports.default = exports.GltfMaterialHandler;
