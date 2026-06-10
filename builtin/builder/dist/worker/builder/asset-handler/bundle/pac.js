Object.defineProperty(exports, "__esModule", { value: true });
exports.sortBundleInPac = sortBundleInPac;

const { statSync, copySync } = require("fs-extra");

const { join, extname } = require("path");

const bundle_utils_1 = require("../../../../share/bundle-utils");
const asset_library_1 = require("../../manager/asset-library");
function sortBundleInPac(e, s, t, u, i) {
  var {
    removeTextureInBundle,
    removeImageInBundle,
    removeSpriteAtlasInBundle,
  } = t.packOptions;
  let d = null;
  var n = [];

  var { imageUuid, textureUuid } = s;

  for (const h of e) {
    if (h.output) {
      var { atlasRes, assetsWithoutRedirect } = h;

      const T = new Set(assetsWithoutRedirect);
      if (T.has(t.uuid) || t.spriteFrames.find((e) => T.has(e._uuid))) {
        var _ = [];
        var c = t.path.startsWith(h.root + "/");

        if (c) {
          console.debug(`Asset {asset(${t.path})} is Bundle`);
        }

        for (const I of s.spriteFrameInfos) {
          if (!h.getRedirect(I.uuid)) {
            h.addAssetWithUuid(I.uuid);
            h.removeFromGroups(I.uuid);

            u[I.textureUuid] || (!removeTextureInBundle && c)
              ? u[I.textureUuid] &&
                !c &&
                console.warn(
                  Editor.I18n.t("builder.tips.use_texture_in_atlas", {
                    info: `{asset(${I.textureUuid})}`,
                    useInfo: `{asset(${u[I.textureUuid].toString()})}`,
                  })
                )
              : h.removeAsset(I.textureUuid);

            u[I.imageUuid] || (!removeImageInBundle && c) || u[I.textureUuid]
              ? u[I.imageUuid] &&
                !c &&
                console.warn(
                  Editor.I18n.t("builder.tips.use_image_in_atlas", {
                    info: `{asset(${I.imageUuid})}`,
                    useInfo: `{asset(${u[I.imageUuid].toString()})}`,
                  })
                )
              : (h.removeAsset(I.imageUuid), i && i.removeTask(I.imageUuid));

            _.push(I.uuid);
            atlasRes.assetsToImage[I.uuid] = imageUuid;
            atlasRes.assetsToImage[I.imageUuid] = imageUuid;
          }
        }
        if (d && d.priority !== h.priority) {
          h.addRedirect(textureUuid, d.name);
        } else {
          h.addAssetWithUuid(imageUuid);
          h.addAssetWithUuid(textureUuid);

          if (
            h.compressionType ===
            bundle_utils_1.BundleCompressionTypes.MERGE_ALL_JSON
          ) {
            if (h.groups[0]) {
              h.groups[0].uuids.push(imageUuid, textureUuid);
            } else {
              h.addGroup("NORMAL", [imageUuid, textureUuid]);
            }
          } else if (
            h.compressionType !== bundle_utils_1.BundleCompressionTypes.NONE
          ) {
            h.addToGroup("IMAGE", imageUuid);
            h.addToGroup("TEXTURE", textureUuid);
          }

          var assetsWithoutRedirect =
            asset_library_1.buildAssetLibrary.getAsset(t.uuid);
          let e = null;

          if (
            assetsWithoutRedirect.meta.userData.compressSettings &&
            i &&
            (e = i.genTaskInfoFromAssetInfo(assetsWithoutRedirect))
          ) {
            e.mtime = statSync(s.imagePath).mtime.getTime();

            h.compressTask[s.imageUuid] = i.addTask(s.imageUuid, {
              ...e,
              src: s.imagePath,
            });
          }

          if (!e) {
            assetsWithoutRedirect = join(
              h.dest,
              h.nativeBase,
              imageUuid.slice(0, 2),
              imageUuid + extname(s.imagePath)
            );
            copySync(s.imagePath, assetsWithoutRedirect);
          }

          if (d) {
            n.push(h.root);
          } else {
            d = h;
          }
        }
        assetsWithoutRedirect = [..._];

        if (T.has(t.uuid)) {
          if (u[t.uuid] || (c && !removeSpriteAtlasInBundle)) {
            if (u[t.uuid] || c) {
              assetsWithoutRedirect.push(t.uuid);
            }
          } else {
            h.removeAsset(t.uuid);
            console.debug(`remove spriteAtlas._uuid : {asset(${t.uuid})}`);
          }
        }

        if (
          h.compressionType ===
          bundle_utils_1.BundleCompressionTypes.MERGE_ALL_JSON
        ) {
          if (h.groups[0]) {
            h.groups[0].uuids.push(...assetsWithoutRedirect);
          } else {
            h.addGroup("NORMAL", assetsWithoutRedirect);
          }
        } else if (
          h.compressionType !== bundle_utils_1.BundleCompressionTypes.NONE
        ) {
          h.addGroup("NORMAL", assetsWithoutRedirect);
        }

        atlasRes.imageToAtlas[imageUuid] = t.uuid;
        atlasRes.assetsToImage[textureUuid] = imageUuid;

        if (!atlasRes.atlasToImages[t.uuid]) {
          atlasRes.atlasToImages[t.uuid] = [];
        }

        atlasRes.atlasToImages[t.uuid].push(imageUuid);
      }
    }
  }

  if (d && n.length) {
    console.warn(
      Editor.I18n.t("builder.warn.repeatAtlasInBundle", {
        Atlas: t.path,
        bundle1: d.root,
        bundle2: n.toString(),
      })
    );
  }
}
