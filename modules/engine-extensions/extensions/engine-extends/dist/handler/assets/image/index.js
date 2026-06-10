var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageHandler = undefined;

const { existsSync, readFile } = require("fs-extra");

const { checkSize } = require("../erp-texture-cube");

const {
  convertHDR,
  convertHDROrEXR,
  convertTGA,
  convertPSD,
  convertTIFF,
} = require("./image-mics");

const migrations_1 = require("./migrations");
const sharp_1 = __importDefault(require("sharp"));

const { join } = require("path");

const utils_1 = require("./utils");

const {
  isCapableToFixAlphaTransparencyArtifacts,
  handleImageUserData,
  saveImageAsset,
  importWithType,
} = utils_1;

exports.ImageHandler = {
  displayName: "i18n:ENGINE.assets.image.label",
  description: "i18n:ENGINE.assets.image.description",
  name: "image",
  assetType: "cc.ImageAsset",
  open: utils_1.openImageAsset,
  iconInfo: {
    default: utils_1.defaultIconConfig,
    generateThumbnail(e) {
      var a = e.meta.files.find((e) => e !== ".json") || ".png";
      return { type: "image", value: e.library + a };
    },
  },
  importer: {
    version: "1.0.27",
    migrations: migrations_1.migrations,
    async force(e) {
      return false;
    },
    async import(e) {
      let a = e.extname.toLocaleLowerCase();
      let e_source = e.source;
      var r = e.meta.userData;
      if (a === ".bmp") {
        var i = await convertHDR(e.source, e.uuid, e.temp);
        if (i instanceof Error || !i) {
          console.error("Failed to convert bmp image.");
          return false;
        }
        a = i.extName;
        e_source = i.source;
        r.isRGBE = true;
        r.fixAlphaTransparencyArtifacts ||= false;
      } else if (a === ".znt") {
        i = e.source;
        i = await convertHDR(i, e.uuid, e.temp);
        if (i instanceof Error || !i) {
          console.error(`Failed to convert asset {asset(${e.uuid})}.`);
          return false;
        }
        a = i.extName;
        e_source = i.source;
        r.fixAlphaTransparencyArtifacts = false;
        r.isRGBE = true;
      } else if (a === ".hdr" || a === ".exr") {
        i = e.source;
        i = await convertHDROrEXR(a, i, e.uuid, e.temp);
        if (i instanceof Error || !i) {
          console.error(`Failed to convert asset {asset(${e.uuid})}.`);
          return false;
        }
        a = i.extName;
        e_source = i.source;
        r.fixAlphaTransparencyArtifacts = false;
        r.isRGBE = true;
        var s = await (await (0, sharp_1.default)(e_source)).metadata();

        var s =
          (!r.type && checkSize(s.width, s.height) && (r.type = "texture cube"),
          join(i.source.replace(".png", "_sign.png")));

        var s =
          (existsSync(s) &&
            (r.sign = Editor.UI.__protected__.File.resolveToUrl(s, "project")),
          join(i.source.replace(".png", "_alpha.png")));

        if (existsSync(s)) {
          r.alpha = Editor.UI.__protected__.File.resolveToUrl(s, "project");
        }
      } else if (a === ".tga") {
        i = await convertTGA(await readFile(e.source));
        if (i instanceof Error || !i) {
          console.error("Failed to convert tga image.");
          return false;
        }
        a = i.extName;
        e_source = i.data;
      } else if (a === ".psd") {
        s = await convertPSD(await readFile(e.source));
        a = s.extName;
        e_source = s.data;
      } else if (a === ".tif" || a === ".tiff") {
        i = await convertTIFF(e.source);
        if (i instanceof Error || !i) {
          console.error(`Failed to convert ${a} image.`);
          return false;
        }
        a = i.extName;
        e_source = i.data;
      }

      if (r.fixAlphaTransparencyArtifacts === undefined) {
        r.fixAlphaTransparencyArtifacts =
          isCapableToFixAlphaTransparencyArtifacts(e, r.type, e.extname);
      }

      e_source = await handleImageUserData(e, e_source, a);
      await saveImageAsset(e, e_source, a, e.basename);
      await importWithType(e, r.type, e.basename, e.extname);

      if (r.sign) {
        await e.createSubAsset("sign", "sign-image", {
          displayName: "sign",
        });
      }

      if (r.alpha) {
        await e.createSubAsset("alpha", "alpha-image", {
          displayName: "alpha",
        });
      }

      return true;
    },
  },
  userDataConfig: {
    default: {
      type: {
        label: "i18n:ENGINE.assets.image.type",
        default: "texture",
        render: {
          ui: "ui-select",
          items: [
            { label: "raw", value: "raw" },
            { label: "texture", value: "texture" },
            { label: "normal map", value: "normal map" },
            { label: "sprite-frame", value: "sprite-frame" },
            { label: "texture cube", value: "texture cube" },
          ],
        },
      },
      flipVertical: {
        label: "i18n:ENGINE.assets.image.flipVertical",
        render: { ui: "ui-checkbox" },
      },
    },
  },
  async validate(e) {
    return !(await e.isDirectory());
  },
};

exports.default = exports.ImageHandler;
