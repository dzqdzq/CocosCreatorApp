var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, a = r) => {
        var i = Object.getOwnPropertyDescriptor(t, r);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, a, i);
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
  (() => {
    var i = (e) =>
      (i =
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
        for (var r = i(e), a = 0; a < r.length; a++) {
          if (r[a] !== "default") {
            __createBinding(t, e, r[a]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.FbxHandler = undefined;
exports.getGltfFilePath = getGltfFilePath;
const gltf_1 = __importStar(require("./gltf"));

const { fbxToGlTf } = require("./gltf/fbx-to-gltf");

const { createFbxConverter } = require("./utils/fbx-converter");

const { modelConvertRoutine } = require("./utils/model-convert-routine");

async function getGltfFilePath(e) {
  var e_userData = e.userData;

  if (e_userData.fbx?.smartMaterialEnabled === undefined) {
    (e_userData.fbx ??= {}).smartMaterialEnabled =
      await Editor.Profile.getProject("project", "fbx.material.smart");
  }

  let r;
  if (e_userData.legacyFbxImporter) {
    r = await fbxToGlTf(e, e._assetDB, exports.FbxHandler.importer.version);
  } else {
    var a = {};

    var a =
      ((a.unitConversion = e_userData.fbx?.unitConversion),
      (a.animationBakeRate = e_userData.fbx?.animationBakeRate),
      (a.preferLocalTimeSpan = e_userData.fbx?.preferLocalTimeSpan),
      (a.smartMaterialEnabled = e_userData.fbx?.smartMaterialEnabled ?? false),
      (a.matchMeshNames = e_userData.fbx?.matchMeshNames ?? true),
      createFbxConverter(a));

    var a = await modelConvertRoutine(
      "fbx.FBX-glTF-conv",
      e,
      e._assetDB,
      exports.FbxHandler.importer.version,
      a
    );

    if (!a) {
      throw new Error("Failed to import " + e.source);
    }
    r = a;
  }
  return e_userData.meshSimplify && e_userData.meshSimplify.enable
    ? (0, gltf_1.getOptimizerPath)(e, r, e_userData.meshSimplify)
    : r;
}
exports.FbxHandler = { ...gltf_1.default, name: "fbx" };
exports.default = exports.FbxHandler;
