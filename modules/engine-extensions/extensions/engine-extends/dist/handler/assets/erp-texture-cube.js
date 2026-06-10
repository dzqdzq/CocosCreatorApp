var MipmapMode;

var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, a, r = a) => {
        var i = Object.getOwnPropertyDescriptor(t, a);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[a];
            },
          };
        }

        Object.defineProperty(e, r, i);
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
    var i = (e) =>
      (i =
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
        for (var a = i(e), r = 0; r < a.length; r++) {
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
exports.ERPTextureCubeHandler = undefined;
exports.MipmapMode = undefined;
exports.checkSize = checkSize;

const { queryAsset } = require("@editor/asset-db");

const { applyTextureBaseAssetUserData } = require("./texture-base");

const {
  nearestPowerOfTwo,
  equirectToCubemapFaces,
} = require("./utils/equirect-cubemap-faces");

const cc = __importStar(require("cc"));

const { matchSimpleLayout } = require("./utils/cube-map-simple-layout");

const migratesNameToId = __importStar(require("./migrates/name2id"));
const sharp_1 = __importDefault(require("sharp"));

const { readFile, existsSync, copyFileSync } = require("fs-extra");

const { dirname, basename, join } = require("path");

const { ensureDirSync } = require("fs-extra");

const { getDependUUIDList } = require("../utils");

const { makeDefaultTextureCubeAssetUserData } = require("./image/utils");

const verticalCount = 2;
async function _getFacesInSimpleLayout(a, r) {
  const i = {};
  var e = Object.getOwnPropertyNames(r);
  for (const t of e) {
    i[t] = undefined;
  }

  await Promise.all(
    e.map(async (e) => {
      var t = r[e];

      var t = await (0, sharp_1.default)(a)
        .extract({ left: t.x, top: t.y, width: t.width, height: t.height })
        .toFormat(sharp_1.default.format.png)
        .toBuffer();

      i[e] = t;
    })
  );

  return i;
}
async function _getFacesInEquirectangularProjected(e, t, a) {
  var e = await readFile(e);
  var e = await (0, sharp_1.default)(e);
  var r = await e.metadata();

  t = t || 0 | nearestPowerOfTwo((r.width || 0) / 4);

  var e = await equirectToCubemapFaces(e, t, {
    isRGBE: a,
  });

  if (e.length !== 6) {
    throw new Error("Failed to resolve equirectangular projection image.");
  }
  return {
    right: await (0, sharp_1.default)(Buffer.from(e[0].data), {
      raw: { width: t, height: t, channels: 4 },
    })
      .toFormat(r.format || "png")
      .toBuffer(),
    left: await (0, sharp_1.default)(Buffer.from(e[1].data), {
      raw: { width: t, height: t, channels: 4 },
    })
      .toFormat(r.format || "png")
      .toBuffer(),
    top: await (0, sharp_1.default)(Buffer.from(e[2].data), {
      raw: { width: t, height: t, channels: 4 },
    })
      .toFormat(r.format || "png")
      .toBuffer(),
    bottom: await (0, sharp_1.default)(Buffer.from(e[3].data), {
      raw: { width: t, height: t, channels: 4 },
    })
      .toFormat(r.format || "png")
      .toBuffer(),
    front: await (0, sharp_1.default)(Buffer.from(e[4].data), {
      raw: { width: t, height: t, channels: 4 },
    })
      .toFormat(r.format || "png")
      .toBuffer(),
    back: await (0, sharp_1.default)(Buffer.from(e[5].data), {
      raw: { width: t, height: t, channels: 4 },
    })
      .toFormat(r.format || "png")
      .toBuffer(),
  };
}
function getTop(e, t) {
  return e != 0 && t.length > 0 ? t[0].height : 0;
}
function getLeft(t, a) {
  if (t < verticalCount) {
    return 0;
  }
  let r = 0;
  for (let e = verticalCount - 1; e < a.length && !(e >= t); e++) {
    r += a[e].width;
  }
  return r;
}
function getMipmapLayout(e) {
  var t = [];
  let a = 0;

  while (e) {
    t.push({
      left: getLeft(a, t),
      top: getTop(a, t),
      width: e,
      height: e,
      level: a++,
    });

    e >>= 1;
  }

  return t;
}
function getDirOfMipmaps(e, t) {
  var a = dirname(e);
  var e = basename(e, t);
  return join(a, e + "_convolution");
}
function isNeedConvolution(t) {
  if (!existsSync(t)) {
    return true;
  }
  for (let e = 0; e < 6; e++) {
    var a = join(t, "mipmap_" + e.toString() + ".png");
    if (!existsSync(a)) {
      return true;
    }
  }
  return false;
}
function saveMipmaps(e, t) {
  if (!existsSync(t)) {
    ensureDirSync(t);
  }

  copyFileSync(e, join(t, basename(e)));
}
function checkSize(e, t) {
  return (
    4 * e == 3 * t ||
    3 * e == 4 * t ||
    6 * e === t ||
    e === 6 * t ||
    e === 2 * t
  );
}

!((e) => {
  e[(e.NONE = 0)] = "NONE";
  e[(e.AUTO = 1)] = "AUTO";
  e[(e.BAKED_CONVOLUTION_MAP = 2)] = "BAKED_CONVOLUTION_MAP";
})(MipmapMode || (exports.MipmapMode = MipmapMode = {}));

exports.ERPTextureCubeHandler = {
  name: "erp-texture-cube",
  assetType: "cc.TextureCube",
  importer: {
    version: "1.0.10",
    migrations: [{ version: "1.0.9", migrate: migratesNameToId.migrate }],
    async import(a) {
      if (Object.getOwnPropertyNames(a.userData).length === 0) {
        a.assignUserData(makeDefaultTextureCubeAssetUserData(), true);
      }

      var a_userData = a.userData;
      var e = queryAsset(a_userData.imageDatabaseUri);
      if (!e) {
        return false;
      }
      let t;
      var i = a.parent.extname?.toLowerCase();
      t =
        [".tga", ".hdr", ".bmp", ".psd", ".tif", ".tiff", ".exr"].includes(i) ||
        !i
          ? e.library + ".png"
          : e.source;
      var s = await (0, sharp_1.default)(t).metadata();
      const s_width = s.width;
      s = s.height;
      if (a.userData.mipBakeMode === MipmapMode.BAKED_CONVOLUTION_MAP) {
        var u = a.parent.source;
        let t = join(a.temp, "mipmap");
        var n = getDirOfMipmaps(e.source, i);

        if (isNeedConvolution(n)) {
          e = [
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
            a_userData.isRGBE ? "png,rgbm,facelist" : "png,bgra8,facelist",
            "--input",
            u,
            "--output0",
            t,
          ];

          a_userData.isRGBE &&
            ![".hdr", ".exr"].includes(i) &&
            e.splice(0, 0, "--rgbm");

          ensureDirSync(a.temp);

          console.log(`Start to bake asset {asset[${a.uuid}](${a.uuid})}`);

          u =
            join(Editor.App.path, "../tools/cmft/cmftRelease64") +
            (process.platform === "win32" ? ".exe" : "");

          await Editor.Utils.Process.quickSpawn(u, e, {
            stdio: "inherit",
          });
        } else {
          t = join(n, "mipmap");
        }

        var p = ["right", "left", "top", "bottom", "front", "back"];

        var c = {};
        var f = [];
        var l = a.getSwapSpace();
        for (let e = 0; e < p.length; e++) {
          var _ = `${t}_${e}.png`;
          var _ = (saveMipmaps(_, n), (0, sharp_1.default)(_));
          const s_width = (await _.metadata()).width;
          f[e] = getMipmapLayout(s_width);
          var m = p[e];
          var _ = await _.toFormat(sharp_1.default.format.png).toBuffer();
          var _ = ((l[m] = _), await a.createSubAsset(m, "texture-cube-face"));
          c[m] = EditorExtends.serialize.asAsset(_.uuid, cc.ImageAsset);
        }
        const w = new cc.TextureCube();

        applyTextureBaseAssetUserData(a_userData, w);
        w.isRGBE = a_userData.isRGBE;
        w._mipmapMode = MipmapMode.BAKED_CONVOLUTION_MAP;
        w._mipmapAtlas = { atlas: c, layout: f[0] };
        const b = EditorExtends.serialize(w);
        await a.saveToLibrary(".json", b);
        const x = getDependUUIDList(b);

        a.setData("depends", x);
      } else {
        let e;
        var i = matchSimpleLayout(s_width, s);

        e = i
          ? await _getFacesInSimpleLayout(t, i)
          : await _getFacesInEquirectangularProjected(
              t,
              a_userData.faceSize === 0 ? undefined : a_userData.faceSize,
              a_userData.isRGBE
            );

        var d = {};

        var h = a.getSwapSpace();
        for (const v of Object.getOwnPropertyNames(e)) {
          var g = e[v];
          var g = ((h[v] = g), await a.createSubAsset(v, "texture-cube-face"));
          d[v] = EditorExtends.serialize.asAsset(g.uuid, cc.ImageAsset);
        }
        const w = new cc.TextureCube();

        applyTextureBaseAssetUserData(a_userData, w);
        w.isRGBE = a_userData.isRGBE;
        w._mipmaps = [d];
        const b = EditorExtends.serialize(w);
        await a.saveToLibrary(".json", b);
        const x = getDependUUIDList(b);

        a.setData("depends", x);
      }
      return true;
    },
  },
};

exports.default = exports.ERPTextureCubeHandler;
