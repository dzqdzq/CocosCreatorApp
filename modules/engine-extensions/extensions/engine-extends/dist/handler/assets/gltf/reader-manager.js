var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.glTfReaderManager = undefined;

const { i18nTranslate, linkToAssetTarget } = require("../../utils");

const gltf_converter_1 = require("../utils/gltf-converter");

const { readGltf } = gltf_converter_1;

const { validateGlTf } = require("./validation");

const fs_extra_1 = __importDefault(require("fs-extra"));
const gltf_1 = require("../gltf");
const fbx_1 = require("../fbx");
class GlTfReaderManager {
  _map = new Map();
  async getOrCreate(e, r = false) {
    let t = this._map.get(e.uuid);
    if (!t) {
      var { converter, referencedBufferFiles } = await createGlTfReader(e);
      t = converter;
      this._map.set(e.uuid, t);

      if (r) {
        for (const s of referencedBufferFiles) {
          e.depend(s);
        }
      }
    }
    return t;
  }
  delete(e) {
    this._map.delete(e.uuid);
  }
}
async function createGlTfReader(i) {
  let e;
  var r = await (e = (i.meta.importer === "fbx" ? fbx_1 : gltf_1)
    .getGltfFilePath)(i);
  const t = r !== i.source;
  var i_userData = i.userData;

  if (i_userData.skipValidation !== undefined && !i_userData.skipValidation) {
    await validateGlTf(r, i.source);
  }

  const { glTF, buffers } = await readGltf(r);
  const l = [];
  i_userData = await Promise.all(
    buffers.map(async (e) =>
      Buffer.isBuffer(e) ? e : (t || l.push(e), fs_extra_1.default.readFile(e))
    )
  );
  function o(r, t) {
    if (Array.isArray(glTF[r])) {
      let e;
      switch (r) {
        case "meshes": {
          e = "engine-extends.importers.glTF.glTF_asset_group_mesh";
          break;
        }
        case "animations": {
          e = "engine-extends.importers.glTF.glTF_asset_group_animation";
          break;
        }
        case "nodes": {
          e = "engine-extends.importers.glTF.glTF_asset_group_node";
          break;
        }
        case "skins": {
          e = "engine-extends.importers.glTF.glTF_asset_group_skin";
          break;
        }
        case "samplers": {
          e = "engine-extends.importers.glTF.glTF_asset_group_sampler";
          break;
        }
        default: {
          e = r;
        }
      }
      var n = glTF[r][t];
      return typeof n.name == "string" && n.name
        ? i18nTranslate("engine-extends.importers.glTF.glTF_asset", {
            group: i18nTranslate(e),
            name: n.name,
            index: t,
          })
        : i18nTranslate("engine-extends.importers.glTF.glTF_asset_no_name", {
            group: i18nTranslate(e),
            index: t,
          });
    }
    return "";
  }
  return {
    converter: new gltf_converter_1.GltfConverter(glTF, i_userData, r, {
      logger: (e, r, t) => {
        let n;
        switch (r) {
          case gltf_converter_1.GltfConverter.ConverterError
            .UnsupportedAlphaMode: {
            var a = t;
            n = i18nTranslate(
              "engine-extends.importers.glTF.unsupported_alpha_mode",
              { material: o("materials", a.material), mode: a.mode }
            );
            break;
          }
          case gltf_converter_1.GltfConverter.ConverterError
            .UnsupportedTextureParameter: {
            a = t;
            n = i18nTranslate(
              "engine-extends.importers.glTF.unsupported_texture_parameter",
              {
                sampler: "",
                texture: o("textures", a.texture),
                type: i18nTranslate(
                  a.type === "minFilter"
                    ? "engine-extends.importers.glTF.min_filter"
                    : a.type === "magFilter"
                    ? "engine-extends.importers.glTF.mag_filter"
                    : "engine-extends.importers.glTF.wrapMode"
                ),
                value: "",
              }
            );
            break;
          }
          case gltf_converter_1.GltfConverter.ConverterError
            .UnsupportedChannelPath: {
            a = t;
            n = i18nTranslate(
              "engine-extends.importers.glTF.unsupported_channel_path",
              {
                animation: o("animations", a.animation),
                channel: a.channel,
                path: a.path,
              }
            );
            break;
          }
          case gltf_converter_1.GltfConverter.ConverterError
            .ReferenceSkinInDifferentScene: {
            a = t;
            n = i18nTranslate(
              "engine-extends.importers.glTF.reference_skin_in_different_scene",
              { node: o("nodes", a.node), skin: o("skins", a.skin) }
            );
            break;
          }
          case gltf_converter_1.GltfConverter.ConverterError
            .DisallowCubicSplineChannelSplit: {
            a = t;
            n = i18nTranslate(
              "engine-extends.importers.glTF.disallow_cubic_spline_channel_split",
              { animation: o("animations", a.animation), channel: a.channel }
            );
            break;
          }
          case gltf_converter_1.GltfConverter.ConverterError
            .FailedToCalculateTangents: {
            a = t;
            n = i18nTranslate(
              a.reason === "normal"
                ? "engine-extends.importers.glTF.failed_to_calculate_tangents_due_to_lack_of_normals"
                : "engine-extends.importers.glTF.failed_to_calculate_tangents_due_to_lack_of_uvs",
              { mesh: o("meshes", a.mesh), primitive: a.primitive }
            );
            break;
          }
          case gltf_converter_1.GltfConverter.ConverterError.EmptyMorph: {
            a = t;
            n = i18nTranslate("engine-extends.importers.glTF.empty_morph", {
              mesh: o("meshes", a.mesh),
              primitive: a.primitive,
            });
            break;
          }
          case gltf_converter_1.GltfConverter.ConverterError
            .UnsupportedExtension: {
            a = t;
            n = i18nTranslate(
              "engine-extends.importers.glTF.unsupported_extension",
              { name: a.name }
            );
          }
        }
        var s = linkToAssetTarget(i.uuid);
        switch (e) {
          case gltf_converter_1.GltfConverter.LogLevel.Info:
          default: {
            console.log(n, s);
            break;
          }
          case gltf_converter_1.GltfConverter.LogLevel.Warning: {
            console.warn(n, s);
            break;
          }
          case gltf_converter_1.GltfConverter.LogLevel.Error: {
            console.error(n, s);
            break;
          }
          case gltf_converter_1.GltfConverter.LogLevel.Debug: {
            console.debug(n, s);
          }
        }
      },
      userData: i.userData,
      promoteSingleRootNode: i.userData?.promoteSingleRootNode ?? false,
      generateLightmapUVNode: i.userData?.generateLightmapUVNode ?? false,
    }),
    referencedBufferFiles: l,
  };
}
exports.glTfReaderManager = new GlTfReaderManager();
