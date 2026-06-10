var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const assert_1 = require("assert");
const fs_extra_1 = require("fs-extra");
const erp_texture_cube_1 = require("../erp-texture-cube");
const sprite_frame_1 = require("../sprite-frame");
const texture_1 = require("../texture");
const image_mics_1 = require("./image-mics");
const migrations_1 = require("./migrations");
const cc_1 = require("cc");
const sharp_1 = __importDefault(require("sharp"));
const bleeding_1 = require("../utils/algorithm/bleeding");
const utils_1 = require("../../utils");
class ImageImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.25";
  }
  get name() {
    return "image";
  }
  get assetType() {
    return "cc.ImageAsset";
  }
  get migrations() {
    return migrations_1.migrations;
  }
  getDefaultFixAlphaTransparencyArtifactsOfType(e) {
    return !["normal map", "texture cube"].includes(e);
  }
  isCapableToFixAlphaTransparencyArtifacts(e) {
    var a = e.extname.toLocaleLowerCase().replace(".", "");
    var e = e.userData;
    return (
      !["hdr"].includes(a) && !["normal map"].includes(e.type) && !e.isRGBE
    );
  }
  async force(e) {
    return false;
  }
  async validate(e) {
    return !(await e.isDirectory());
  }
  async import(e) {
    let a = e.extname.toLocaleLowerCase();
    let e_source = e.source;
    var t = e.meta.userData;
    if (a === ".bmp") {
      var i = await image_mics_1.convertHDR(e.source, e.uuid, e.temp);
      if (i instanceof Error || !i) {
        console.error("Failed to convert bmp image.");
        return false;
      }
      a = i.extName;
      e_source = i.source;
      t.isRGBE = true;

      if (!t.fixAlphaTransparencyArtifacts) {
        t.fixAlphaTransparencyArtifacts = false;
      }
    } else if (a === ".hdr") {
      i = await image_mics_1.convertHDR(e.source, e.uuid, e.temp);
      if (i instanceof Error || !i) {
        console.error("Failed to convert hdr image.");
        return false;
      }
      a = i.extName;
      e_source = i.source;

      if (!t.type) {
        t.type = "texture cube";
      }

      if (!t.fixAlphaTransparencyArtifacts) {
        t.fixAlphaTransparencyArtifacts = false;
      }

      t.isRGBE = true;
    } else if (a === ".tga") {
      i = await image_mics_1.convertTGA(await fs_extra_1.readFile(e.source));
      if (i instanceof Error || !i) {
        console.error("Failed to convert tga image.");
        return false;
      }
      a = i.extName;
      e_source = i.data;
    } else if (a === ".psd") {
      i = await image_mics_1.convertPSD(await fs_extra_1.readFile(e.source));
      a = i.extName;
      e_source = i.data;
    } else if (a === ".tif" || a === ".tiff") {
      i = await image_mics_1.convertTIFF(e.source);
      if (i instanceof Error || !i) {
        console.error(`Failed to convert ${a} image.`);
        return false;
      }
      a = i.extName;
      e_source = i.data;
    }

    if (typeof e_source == "string") {
      e_source = await fs_extra_1.readFile(e_source);
    }

    if (!t.type) {
      t.type = "texture";
    }

    if (t.fixAlphaTransparencyArtifacts === undefined) {
      t.fixAlphaTransparencyArtifacts =
        this.getDefaultFixAlphaTransparencyArtifactsOfType(t.type);
    }

    var i = await sharp_1.default(e_source);
    var s = await i.metadata();
    t.hasAlpha = s.hasAlpha;
    var u = !!t.flipVertical;

    if (u) {
      e_source = await i.flip().toBuffer();
    }

    if (
      t.fixAlphaTransparencyArtifacts !== false &&
      s.hasAlpha &&
      this.isCapableToFixAlphaTransparencyArtifacts(e)
    ) {
      var n = await sharp_1.default(e_source).raw().toBuffer();
      let a = false;
      for (let e = 0; e < n.length; e += 4) {
        if (n[e + 3] === 0) {
          a = true;
          break;
        }
      }
      if (a) {
        var u = new cc_1.Rect(0, 0, s.width, s.height);
        var o = [-1, 0, 1, -1, 1, -1, 0, 1];
        var c = [-1, -1, -1, 0, 0, 1, 1, 1];
        var m = [];
        var p = 4 * u.width;
        for (let e = 0; e < o.length; e++) {
          m[e] = 4 * o[e] + c[e] * p;
        }
        bleeding_1.applyContourBleed(n, n, u.width, u, o, c, m);

        e_source = await sharp_1
          .default(n, {
            raw: { channels: s.channels, height: u.height, width: u.width },
          })
          .toFormat("png")
          .toBuffer();
      }
    }

    if (typeof e_source == "string") {
      await e.copyToLibrary(a, e_source);
    } else {
      await e.saveToLibrary(a, e_source);
    }

    var i = new cc_1.ImageAsset();

    i.name = e.basename || "";
    i._setRawAsset(a);
    var s = EditorExtends.serialize(i);
    await e.saveToLibrary(".json", s);
    var u = utils_1.getDependUUIDList(s);
    e.setData("depends", u);
    var l = asset_db_1.queryUrl(e.source);
    if (!l) {
      throw new assert_1.AssertionError({
        message: e.source + " is not found in asset-db.",
      });
    }
    switch (t.type) {
      case "raw": {
        delete t.redirect;
        break;
      }
      case "texture": {
        var d = await e.createSubAsset("texture", "texture", {
          displayName: e.basename,
        });
        t.redirect = d.uuid;

        d.assignUserData(
          texture_1.makeDefaultTexture2DAssetUserDataFromImageUuid(e.uuid)
        );

        d.userData.imageUuidOrDatabaseUri = e.uuid;
        d.userData.visible = true;
        break;
      }
      case "normal map": {
        d = await e.createSubAsset("normalMap", "texture", {
          displayName: e.basename,
        });
        t.redirect = d.uuid;

        d.assignUserData(
          texture_1.makeDefaultTexture2DAssetUserDataFromImageUuid(e.uuid)
        );

        break;
      }
      case "texture cube": {
        d = await e.createSubAsset("textureCube", "erp-texture-cube", {
          displayName: e.basename,
        });
        t.redirect = d.uuid;

        d.assignUserData(
          erp_texture_cube_1.makeDefaultTextureCubeAssetUserData()
        );

        d.userData.imageDatabaseUri = l;
        d.userData.isRGBE = !!t.isRGBE;
        break;
      }
      case "sprite-frame": {
        var d = await e.createSubAsset("texture", "texture", {
          displayName: e.basename,
        });

        d.userData.wrapModeS = d.userData.wrapModeS || "clamp-to-edge";
        d.userData.wrapModeT = d.userData.wrapModeT || "clamp-to-edge";
        t.redirect = d.uuid;
        d.userData.imageUuidOrDatabaseUri = e.uuid;
        d.userData.isUuid = true;
        d.userData.visible = false;

        var f = await e.createSubAsset("spriteFrame", "sprite-frame", {
          displayName: e.basename,
        });

        t.redirect = f.uuid;

        f.assignUserData(
          sprite_frame_1.makeDefaultSpriteFrameAssetUserDataFromImageUuid(
            d.uuid,
            ""
          )
        );

        f.userData.imageUuidOrDatabaseUri = d.uuid;
      }
    }
    return true;
  }
}
exports.ImageImporter = ImageImporter;
