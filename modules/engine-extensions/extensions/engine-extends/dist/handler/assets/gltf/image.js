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

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.GltfImageHandler = undefined;
const DataURI = __importStar(require("@cocos/data-uri"));
const fs_extra_1 = __importStar(require("fs-extra"));
const path_1 = __importStar(require("path"));
const urijs_1 = __importDefault(require("urijs"));
const url_1 = __importDefault(require("url"));

const {
  convertTGA,
  convertPSD,
  convertHDROrEXR,
} = require("../image/image-mics");

const { convertsEncodedSeparatorsInURI } = require("../utils/uri-utils");

const reader_manager_1 = require("./reader-manager");

const { i18nTranslate, linkToAssetTarget } = require("../../utils");

const { matchImageTypePattern } = require("../utils/match-image-type-pattern");

const { imageMimeTypeToExt } = require("../utils/image-mime-type-to-ext");

const { decodeBase64ToArrayBuffer } = require("../utils/base64");

const cc_1 = require("cc");

const { getDependUUIDList } = require("../../utils");

const utils_3 = require("../image/utils");

const { handleImageUserData } = utils_3;

function resolveImageDataURI(e) {
  var t;
  if (e.base64 && e.mediaType && e.mediaType.type === "image") {
    t = decodeBase64ToArrayBuffer(e.data);
    return { data: Buffer.from(t), mimeType: e.mediaType.value };
  }
  throw new Error(
    `Cannot understand data uri(base64: ${e.base64}, mediaType: ${e.mediaType}) for image.`
  );
}

exports.GltfImageHandler = {
  name: "gltf-embeded-image",
  assetType: "cc.ImageAsset",
  iconInfo: {
    default: utils_3.defaultIconConfig,
    generateThumbnail(e) {
      return { type: "image", value: e.library + e.getData("imageExtName") };
    },
  },
  importer: {
    version: "1.0.3",
    async import(i) {
      if (!i.parent) {
        return false;
      }
      var r = i.userData.gltfIndex;
      var a = await reader_manager_1.glTfReaderManager.getOrCreate(i.parent);
      const s = a.gltf.images[r];
      let n;

      var r = async (t) => {
        try {
          var e = url_1.default.fileURLToPath(t);
          var r = await fs_extra_1.default.readFile(e);
          var a = matchImageTypePattern(r);
          n = { data: r, mimeType: a, extName: path_1.default.extname(e) };
        } catch (e) {
          console.error(
            i18nTranslate(
              "engine-extends.importers.glTF.failed_to_load_image",
              { url: t, reason: e }
            ),
            linkToAssetTarget(i.uuid)
          );
        }
      };

      var u = i.getSwapSpace().resolved;
      if (u) {
        await r(url_1.default.pathToFileURL(u).href);
      } else if (s.bufferView !== undefined) {
        n = { data: a.readImageInBufferView(a.gltf.bufferViews[s.bufferView]) };
      } else if (s.uri !== undefined) {
        const n_data = a.path;
        u = (e) => {
          console.error(
            `The uri "${s.uri}" provided by model file${n_data} is not correct: ` +
              e
          );
        };
        if (s.uri.startsWith("data:")) {
          try {
            var o = DataURI.parse(s.uri);
            if (!o) {
              throw new Error(`Unable to parse data uri "${s.uri}"`);
            }
            n = resolveImageDataURI(o);
          } catch (e) {
            u(e);
          }
        } else {
          o = a.path;
          let n_data;
          try {
            var l = url_1.default.pathToFileURL(o).toString();
            let e = new urijs_1.default(s.uri);
            e = e.absoluteTo(l);
            convertsEncodedSeparatorsInURI(e);
            n_data = e.toString();
          } catch (e) {
            u(e);
          }

          if (n_data) {
            if (n_data.startsWith("file://")) {
              await r(n_data);
            } else {
              console.error(
                i18nTranslate(
                  "engine-extends.importers.glTF.image_uri_should_be_file_url"
                ),
                linkToAssetTarget(i.uuid)
              );
            }
          }
        }
      }
      a = new cc_1.ImageAsset();
      if (n) {
        let e;
        o = s.mimeType ?? n.mimeType;
        if (!(e = (e = o ? imageMimeTypeToExt(o) : e) || n.extName)) {
          throw new Error("Unknown image type");
        }
        let n_data = n.data;
        if (e.toLowerCase() === ".tga") {
          l = await convertTGA(n_data);
          if (l instanceof Error || !l) {
            console.error(
              i18nTranslate(
                "engine-extends.importers.glTF.failed_to_convert_tga"
              ),
              linkToAssetTarget(i.uuid)
            );

            return false;
          }
          e = l.extName;
          n_data = l.data;
        } else if (e.toLowerCase() === ".psd") {
          u = await convertPSD(n_data);
          ({ extName: e, data: n_data } = u);
        } else if (e.toLowerCase() === ".exr") {
          r = (0, path_1.join)(i.temp, "image" + e);
          o =
            (await (0, fs_extra_1.outputFile)(r, n_data),
            await convertHDROrEXR(e, r, i.uuid, i.temp));
          if (o instanceof Error || !o) {
            console.error(
              i18nTranslate(
                "engine-extends.importers.glTF.failed_to_convert_tga"
              ),
              linkToAssetTarget(i.uuid)
            );

            return false;
          }
          e = o.extName;
          n_data = o.source;
        }
        a._setRawAsset(e);
        i.userData.fixAlphaTransparencyArtifacts = true;
        n_data = await handleImageUserData(i, n_data, e);
        await i.saveToLibrary(e, n_data);
        i.setData("imageExtName", e);
      }
      l = EditorExtends.serialize(a);
      await i.saveToLibrary(".json", l);
      u = getDependUUIDList(l);
      i.setData("depends", u);
      return true;
    },
  },
};

exports.default = exports.GltfImageHandler;
