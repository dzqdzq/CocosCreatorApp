var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.glTfReaderManager = undefined;
const utils_1 = require("../../utils");
const gltf_converter_1 = require("../utils/gltf-converter");
const validation_1 = require("./validation");
const fs_extra_1 = __importDefault(require("fs-extra"));
class GlTfReaderManager {
  constructor() {
    this._map = new Map();
  }
  async getOrCreate(e, r = false) {
    let t = this._map.get(e.uuid);
    if (!t) {
      var { converter, referencedBufferFiles } = await createGlTfReader(e);
      t = converter;
      this._map.set(e.uuid, t);

      if (r) {
        for (const n of referencedBufferFiles) {
          e.depend(n);
        }
      }
    }
    return t;
  }
  delete(e) {
    this._map.delete(e.uuid);
  }
}
async function createGlTfReader(o) {
  var e = o._assetDB.importerManager.name2importer[o.meta.importer];
  if (!e) {
    throw new Error("Importer is not found for asset " + o.source);
  }
  var e = await e.getGltfFilePath(o);
  const r = e !== o.source;
  var o_userData = o.userData;

  if (o_userData.skipValidation !== undefined && !o_userData.skipValidation) {
    await validation_1.validateGlTf(e, o.source);
  }

  const { glTF, buffers } = await gltf_converter_1.readGltf(e);
  const n = [];
  var o_userData = await Promise.all(
    buffers.map(async (e) =>
      Buffer.isBuffer(e) ? e : (r || n.push(e), fs_extra_1.default.readFile(e))
    )
  );
  function l(r, t) {
    if (Array.isArray(glTF[r])) {
      let e;
      switch (r) {
        case "meshes": {
          e = "asset-db.importers.glTF.glTF_asset_group_mesh";
          break;
        }
        case "animations": {
          e = "asset-db.importers.glTF.glTF_asset_group_animation";
          break;
        }
        case "nodes": {
          e = "asset-db.importers.glTF.glTF_asset_group_node";
          break;
        }
        case "skins": {
          e = "asset-db.importers.glTF.glTF_asset_group_skin";
          break;
        }
        case "samplers": {
          e = "asset-db.importers.glTF.glTF_asset_group_sampler";
          break;
        }
        default: {
          e = r;
        }
      }
      var a = glTF[r][t];
      return typeof a.name == "string" && a.name
        ? utils_1.i18nTranslate("asset-db.importers.glTF.glTF_asset", {
            group: utils_1.i18nTranslate(e),
            name: a.name,
            index: t,
          })
        : utils_1.i18nTranslate("asset-db.importers.glTF.glTF_asset_no_name", {
            group: utils_1.i18nTranslate(e),
            index: t,
          });
    }
    return "";
  }
  return {
    converter: new gltf_converter_1.GltfConverter(glTF, o_userData, e, {
      logger: (e, r, t) => {
        let a;
        switch (r) {
          case gltf_converter_1.GltfConverter.ConverterError
            .UnsupportedAlphaMode: {
            var s = t;
            a = utils_1.i18nTranslate(
              "asset-db.importers.glTF.unsupported_alpha_mode",
              { material: l("materials", s.material), mode: s.mode }
            );
            break;
          }
          case gltf_converter_1.GltfConverter.ConverterError
            .UnsupportedTextureParameter: {
            s = t;
            a = utils_1.i18nTranslate(
              "asset-db.importers.glTF.unsupported_texture_parameter",
              {
                sampler: "",
                texture: l("textures", s.texture),
                type: utils_1.i18nTranslate(
                  s.type === "minFilter"
                    ? "asset-db.importers.glTF.min_filter"
                    : s.type === "magFilter"
                    ? "asset-db.importers.glTF.mag_filter"
                    : "asset-db.importers.glTF.wrapMode"
                ),
                value: "",
              }
            );
            break;
          }
          case gltf_converter_1.GltfConverter.ConverterError
            .UnsupportedChannelPath: {
            s = t;
            a = utils_1.i18nTranslate(
              "asset-db.importers.glTF.unsupported_channel_path",
              {
                animation: l("animations", s.animation),
                channel: s.channel,
                path: s.path,
              }
            );
            break;
          }
          case gltf_converter_1.GltfConverter.ConverterError
            .ReferenceSkinInDifferentScene: {
            s = t;
            a = utils_1.i18nTranslate(
              "asset-db.importers.glTF.reference_skin_in_different_scene",
              { node: l("nodes", s.node), skin: l("skins", s.skin) }
            );
            break;
          }
          case gltf_converter_1.GltfConverter.ConverterError
            .DisallowCubicSplineChannelSplit: {
            s = t;
            a = utils_1.i18nTranslate(
              "asset-db.importers.glTF.disallow_cubic_spline_channel_split",
              { animation: l("animations", s.animation), channel: s.channel }
            );
            break;
          }
          case gltf_converter_1.GltfConverter.ConverterError
            .FailedToCalculateTangents: {
            s = t;
            a = utils_1.i18nTranslate(
              s.reason === "normal"
                ? "asset-db.importers.glTF.failed_to_calculate_tangents_due_to_lack_of_normals"
                : "asset-db.importers.glTF.failed_to_calculate_tangents_due_to_lack_of_uvs",
              { mesh: l("meshes", s.mesh), primitive: s.primitive }
            );
            break;
          }
          case gltf_converter_1.GltfConverter.ConverterError.EmptyMorph: {
            s = t;
            a = utils_1.i18nTranslate("asset-db.importers.glTF.empty_morph", {
              mesh: l("meshes", s.mesh),
              primitive: s.primitive,
            });
            break;
          }
          case gltf_converter_1.GltfConverter.ConverterError
            .UnsupportedExtension: {
            s = t;
            a = utils_1.i18nTranslate(
              "asset-db.importers.glTF.unsupported_extension",
              { name: s.name }
            );
          }
        }
        var n = utils_1.linkToAssetTarget(o.uuid);
        switch (e) {
          case gltf_converter_1.GltfConverter.LogLevel.Info:
          default: {
            console.log(a, n);
            break;
          }
          case gltf_converter_1.GltfConverter.LogLevel.Warning: {
            console.warn(a, n);
            break;
          }
          case gltf_converter_1.GltfConverter.LogLevel.Error: {
            console.error(a, n);
            break;
          }
          case gltf_converter_1.GltfConverter.LogLevel.Debug: {
            console.debug(a, n);
          }
        }
      },
      userData: o.userData,
      promoteSingleRootNode:
        null !=
          (e =
            null == (o_userData = o.userData)
              ? undefined
              : o_userData.promoteSingleRootNode) && e,
    }),
    referencedBufferFiles: n,
  };
}
exports.glTfReaderManager = new GlTfReaderManager();
