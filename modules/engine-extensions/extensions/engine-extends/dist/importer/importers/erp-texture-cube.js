var MipmapMode;

var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, a, r = a) => {
        Object.defineProperty(e, r, {
          enumerable: true,
          get() {
            return t[a];
          },
        });
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
  ((e) => {
    if (e && e.__esModule) {
      return e;
    }
    var t = {};
    if (e != null) {
      for (var a in e) {
        if (a !== "default" && Object.prototype.hasOwnProperty.call(e, a)) {
          __createBinding(t, e, a);
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

exports.TextureCubeFaceImporter = undefined;
exports.ERPTextureCubeImporter = undefined;
exports.MipmapMode = undefined;
exports.makeDefaultTextureCubeAssetUserData = undefined;

const asset_db_1 = require("@editor/asset-db");
const texture_base_1 = require("./texture-base");
const equirect_cubemap_faces_1 = require("./utils/equirect-cubemap-faces");
const cc = __importStar(require("cc"));
const cube_map_simple_layout_1 = require("./utils/cube-map-simple-layout");
const migratesNameToId = __importStar(require("./migrates/name2id"));
const sharp_1 = __importDefault(require("sharp"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const child_process_1 = require("child_process");
const fs_extra_2 = require("fs-extra");
const utils_1 = require("../utils");
function makeDefaultTextureCubeAssetUserData() {
  var e = texture_base_1.makeDefaultTextureBaseAssetUserData();
  e.isRGBE = false;
  e.mipfilter = "linear";
  return e;
}
exports.makeDefaultTextureCubeAssetUserData =
  makeDefaultTextureCubeAssetUserData;
const verticalCount = 2;
!((e) => {
  e[(e.NONE = 0)] = "NONE";
  e[(e.AUTO = 1)] = "AUTO";
  e[(e.BAKED_CONVOLUTION_MAP = 2)] = "BAKED_CONVOLUTION_MAP";
})((MipmapMode = exports.MipmapMode || (exports.MipmapMode = {})));
class ERPTextureCubeImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.10";
  }
  get name() {
    return "erp-texture-cube";
  }
  get assetType() {
    return "cc.TextureCube";
  }
  get migrations() {
    return [{ version: "1.0.9", migrate: migratesNameToId.migrate }];
  }
  getTop(e, t) {
    return e != 0 && t.length > 0 ? t[0].height : 0;
  }
  getLeft(t, a) {
    if (t < verticalCount) {
      return 0;
    }
    let r = 0;
    for (let e = verticalCount - 1; e < a.length && !(e >= t); e++) {
      r += a[e].width;
    }
    return r;
  }
  getMipmapLayout(e) {
    var t = [];
    let a = 0;

    while (e) {
      t.push({
        left: this.getLeft(a, t),
        top: this.getTop(a, t),
        width: e,
        height: e,
        level: a++,
      });

      e >>= 1;
    }

    return t;
  }
  async import(t) {
    if (Object.getOwnPropertyNames(t.userData).length === 0) {
      t.assignUserData(makeDefaultTextureCubeAssetUserData(), true);
    }

    var t_userData = t.userData;
    var r = asset_db_1.queryAsset(t_userData.imageDatabaseUri);
    if (!r) {
      return false;
    }
    let s;
    var i = t.parent.extname.toLowerCase();

    var r =
      ((s = [".tga", ".hdr", ".bmp", ".psd", ".tif", ".tiff"].includes(i)
        ? r.library + ".png"
        : r.source),
      sharp_1.default(s));

    var o = await r.metadata();
    const o_width = o.width;
    o = o.height;
    if (t.userData.mipBakeMode === MipmapMode.BAKED_CONVOLUTION_MAP) {
      var n = t.parent.source;
      var p = path_1.join(t.temp, "mipmap");

      var n = [
        "--srcFaceSize",
        "768",
        "--mipatlas",
        "--filter",
        "radiance",
        "--lightingModel",
        "ggx",
        "--excludeBase",
        "true",
        "--output0params",
        t_userData.isRGBE ? "png,rgbm,facelist" : "png,bgra8,facelist",
        "--input",
        n,
        "--output0",
        p,
      ];

      var i =
        (t_userData.isRGBE && i !== ".hdr" && n.splice(0, 0, "--rgbm"),
        { stdio: "inherit" });

      fs_extra_2.ensureDirSync(t.temp);
      console.log(`Start to bake asset {asset[${t.uuid}](${t.uuid})}`);
      let e;

      e =
        process.platform === "darwin"
          ? child_process_1.spawn(
              path_1.join(Editor.App.path, "../tools/cmft/cmftRelease64"),
              n,
              i
            )
          : child_process_1.spawn(
              path_1.join(Editor.App.path, "../tools/cmft/cmftRelease64.exe"),
              n,
              i
            );

      await new Promise((t, a) => {
        e.on("exit", (e) => {
          (e !== 0
            ? (console.error("Bake asset failed."), console.error(e), a)
            : (console.log("Bake asset success."), t))(e);
        });
      });

      var c = ["right", "left", "top", "bottom", "front", "back"];
      var f = {};
      var l = [];
      var m = t.getSwapSpace();
      for (let e = 0; e < c.length; e++) {
        var d = `${p}_${e}.png`;
        var d = sharp_1.default(d);
        const o_width = (await d.metadata()).width;
        l[e] = this.getMipmapLayout(o_width);
        var _ = c[e];
        var d = await d.toFormat(sharp_1.default.format.png).toBuffer();
        var d = ((m[_] = d), await t.createSubAsset(_, "texture-cube-face"));
        f[_] = EditorExtends.serialize.asAsset(d.uuid, cc.ImageAsset);
      }
      const w = new cc.TextureCube();

      texture_base_1.applyTextureBaseAssetUserData(t_userData, w);
      w.isRGBE = t_userData.isRGBE;
      w._mipmapMode = MipmapMode.BAKED_CONVOLUTION_MAP;
      w._mipmapAtlas = { atlas: f, layout: l[0] };
      const x = EditorExtends.serialize(w);
      await t.saveToLibrary(".json", x);
      const D = utils_1.getDependUUIDList(x);
      t.setData("depends", D);
    } else {
      let e;
      var n = cube_map_simple_layout_1.matchSimpleLayout(o_width, o);

      e = n
        ? await this._getFacesInSimpleLayout(r, n)
        : await this._getFacesInEquirectangularProjected(
            s,
            t_userData.faceSize === 0 ? undefined : t_userData.faceSize,
            t_userData.isRGBE
          );

      var h = {};

      var g = t.getSwapSpace();
      for (const v of Object.getOwnPropertyNames(e)) {
        var b = e[v];
        var b = ((g[v] = b), await t.createSubAsset(v, "texture-cube-face"));
        h[v] = EditorExtends.serialize.asAsset(b.uuid, cc.ImageAsset);
      }
      const w = new cc.TextureCube();

      texture_base_1.applyTextureBaseAssetUserData(t_userData, w);
      w.isRGBE = t_userData.isRGBE;
      w._mipmaps = [h];
      const x = EditorExtends.serialize(w);
      await t.saveToLibrary(".json", x);
      const D = utils_1.getDependUUIDList(x);
      t.setData("depends", D);
    }
    return true;
  }
  async _getFacesInSimpleLayout(a, r) {
    const s = {};
    var e = Object.getOwnPropertyNames(r);
    for (const t of e) {
      s[t] = undefined;
    }

    await Promise.all(
      e.map(async (e) => {
        var t = r[e];

        var t = await a
          .extract({
            left: t.x,
            top: t.y,
            width: t.width,
            height: t.height,
          })
          .toFormat(sharp_1.default.format.png)
          .toBuffer();

        s[e] = t;
      })
    );

    return s;
  }
  async _getFacesInEquirectangularProjected(e, t, a) {
    var e = await fs_extra_1.readFile(e);
    var e = await sharp_1.default(e);
    var r = await e.metadata();

    t = t || 0 | equirect_cubemap_faces_1.nearestPowerOfTwo((r.width || 0) / 4);

    var e = await equirect_cubemap_faces_1.equirectToCubemapFaces(e, t, {
      isRGBE: a,
    });

    if (e.length !== 6) {
      throw new Error("Failed to resolve equirectangular projection image.");
    }
    return {
      right: await sharp_1
        .default(Buffer.from(e[0].data), {
          raw: { width: t, height: t, channels: 4 },
        })
        .toFormat(r.format || "png")
        .toBuffer(),
      left: await sharp_1
        .default(Buffer.from(e[1].data), {
          raw: { width: t, height: t, channels: 4 },
        })
        .toFormat(r.format || "png")
        .toBuffer(),
      top: await sharp_1
        .default(Buffer.from(e[2].data), {
          raw: { width: t, height: t, channels: 4 },
        })
        .toFormat(r.format || "png")
        .toBuffer(),
      bottom: await sharp_1
        .default(Buffer.from(e[3].data), {
          raw: { width: t, height: t, channels: 4 },
        })
        .toFormat(r.format || "png")
        .toBuffer(),
      front: await sharp_1
        .default(Buffer.from(e[4].data), {
          raw: { width: t, height: t, channels: 4 },
        })
        .toFormat(r.format || "png")
        .toBuffer(),
      back: await sharp_1
        .default(Buffer.from(e[5].data), {
          raw: { width: t, height: t, channels: 4 },
        })
        .toFormat(r.format || "png")
        .toBuffer(),
    };
  }
}
exports.ERPTextureCubeImporter = ERPTextureCubeImporter;
class TextureCubeFaceImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.0";
  }
  get name() {
    return "texture-cube-face";
  }
  get assetType() {
    return "cc.ImageAsset";
  }
  async import(e) {
    if (!e.parent) {
      return false;
    }
    var t = e.parent.getSwapSpace();
    if (!t) {
      return false;
    }
    var e_name = e._name;
    if (!(e_name in t)) {
      return false;
    }
    let r = ".png";

    if (
      e.parent &&
      e.parent.parent &&
      [".webp", ".jpg"].includes(e.parent.parent.extname)
    ) {
      r = e.parent.parent.extname;
    }

    t = t[e_name];
    await e.saveToLibrary(r, t);
    e_name = new cc.ImageAsset();
    e_name._setRawAsset(r);
    t = EditorExtends.serialize(e_name);
    await e.saveToLibrary(".json", t);
    e_name = utils_1.getDependUUIDList(t);
    e.setData("depends", e_name);
    return true;
  }
}
exports.TextureCubeFaceImporter = TextureCubeFaceImporter;
