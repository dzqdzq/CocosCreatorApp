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
exports.GltfImageImporter = undefined;
const DataURI = __importStar(require("@cocos/data-uri"));
const asset_db_1 = require("@editor/asset-db");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const urijs_1 = __importDefault(require("urijs"));
const url_1 = __importDefault(require("url"));
const image_mics_1 = require("../image/image-mics");
const uri_utils_1 = require("../utils/uri-utils");
const reader_manager_1 = require("./reader-manager");
const utils_1 = require("../../utils");
const match_image_type_pattern_1 = require("../utils/match-image-type-pattern");
const image_mime_type_to_ext_1 = require("../utils/image-mime-type-to-ext");
const base64_1 = require("../utils/base64");
const cc_1 = require("cc");
const utils_2 = require("../../utils");
class GltfImageImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.3";
  }
  get name() {
    return "gltf-embeded-image";
  }
  get assetType() {
    return "cc.ImageAsset";
  }
  async import(i) {
    if (!i.parent) {
      return false;
    }
    var r = i.userData.gltfIndex;
    var a = await reader_manager_1.glTfReaderManager.getOrCreate(i.parent);
    const s = a.gltf.images[r];
    let u;

    var r = async (t) => {
      try {
        var e = url_1.default.fileURLToPath(t);
        var r = await fs_extra_1.default.readFile(e);
        var a = match_image_type_pattern_1.matchImageTypePattern(r);
        u = { data: r, mimeType: a, extName: path_1.default.extname(e) };
      } catch (e) {
        console.error(
          utils_1.i18nTranslate(
            "asset-db.importers.glTF.failed_to_load_image",
            { url: t, reason: e }
          ),
          utils_1.linkToAssetTarget(i.uuid)
        );
      }
    };

    var o = i.getSwapSpace().resolved;
    if (o) {
      await r(url_1.default.pathToFileURL(o).href);
    } else if (s.bufferView !== undefined) {
      u = { data: a.readImageInBufferView(a.gltf.bufferViews[s.bufferView]) };
    } else if (s.uri !== undefined) {
      const u_data = a.path;
      o = (e) => {
        console.error(
          `The uri "${s.uri}" provided by model file${u_data} is not correct: ` +
            e
        );
      };
      if (s.uri.startsWith("data:")) {
        try {
          var a_path_1 = DataURI.parse(s.uri);
          if (!a_path_1) {
            throw new Error(`Unable to parse data uri "${s.uri}"`);
          }
          u = resolveImageDataURI(a_path_1);
        } catch (e) {
          o(e);
        }
      } else {
        var a_path_1 = a.path;
        let u_data;
        try {
          var _ = url_1.default.pathToFileURL(a_path_1).toString();
          let e = new urijs_1.default(s.uri);
          e = e.absoluteTo(_);
          uri_utils_1.convertsEncodedSeparatorsInURI(e);
          u_data = e.toString();
        } catch (e) {
          o(e);
        }

        if (u_data) {
          if (u_data.startsWith("file://")) {
            await r(u_data);
          } else {
            console.error(
              utils_1.i18nTranslate(
                "asset-db.importers.glTF.image_uri_should_be_file_url"
              ),
              utils_1.linkToAssetTarget(i.uuid)
            );
          }
        }
      }
    }
    a = new cc_1.ImageAsset();
    if (u) {
      let e;
      _ = null != (a_path_1 = s.mimeType) ? a_path_1 : u.mimeType;
      if (
        !(e =
          (e = _ ? image_mime_type_to_ext_1.imageMimeTypeToExt(_) : e) ||
          u.extName)
      ) {
        throw new Error("Unknown image type");
      }
      let u_data = u.data;
      if (e.toLowerCase() === ".tga") {
        o = await image_mics_1.convertTGA(u_data);
        if (o instanceof Error || !o) {
          console.error(
            utils_1.i18nTranslate(
              "asset-db.importers.glTF.failed_to_convert_tga"
            ),
            utils_1.linkToAssetTarget(i.uuid)
          );

          return false;
        }
        e = o.extName;
        u_data = o.data;
      } else {
        if (e.toLowerCase() === ".psd") {
          r = await image_mics_1.convertPSD(u_data);
          ({ extName: e, data: u_data } = r);
        }
      }
      a._setRawAsset(e);
      await i.saveToLibrary(e, u_data);
    }
    a_path_1 = EditorExtends.serialize(a);
    await i.saveToLibrary(".json", a_path_1);
    _ = utils_2.getDependUUIDList(a_path_1);
    i.setData("depends", _);
    return true;
  }
}
function resolveImageDataURI(e) {
  var t;
  if (e.base64 && e.mediaType && e.mediaType.type === "image") {
    t = base64_1.decodeBase64ToArrayBuffer(e.data);
    return { data: Buffer.from(t), mimeType: e.mediaType.value };
  }
  throw new Error(
    `Cannot understand data uri(base64: ${e.base64}, mediaType: ${e.mediaType}) for image.`
  );
}
exports.GltfImageImporter = GltfImageImporter;
