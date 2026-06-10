Object.defineProperty(exports, "__esModule", { value: true });
exports.AlphaImageHandler = undefined;
const utils_1 = require("./utils");

const {
  isCapableToFixAlphaTransparencyArtifacts,
  handleImageUserData,
  saveImageAsset,
  importWithType,
} = utils_1;

exports.AlphaImageHandler = {
  name: "alpha-image",
  assetType: "cc.ImageAsset",
  iconInfo: {
    default: utils_1.defaultIconConfig,
    generateThumbnail(a) {
      return { type: "image", value: a.library + ".png" };
    },
  },
  importer: {
    version: "1.0.1",
    async import(a) {
      var e;
      var t;
      return (
        !!a.parent &&
        ((e = a.parent),
        (t = Editor.UI.__protected__.File.resolveToRaw(e.userData.alpha)),
        Object.assign(a.userData, e.userData),
        delete a.userData.type,
        delete a.userData.alpha,
        (a.userData.isRGBE = false),
        a.userData.fixAlphaTransparencyArtifacts === undefined &&
          (a.userData.fixAlphaTransparencyArtifacts =
            isCapableToFixAlphaTransparencyArtifacts(
              a,
              e.userData.type,
              e.extname
            )),
        (t = await handleImageUserData(a, t, ".png")),
        await saveImageAsset(a, t, ".png", "alpha"),
        await importWithType(a, e.userData.type, "alpha", e.extname),
        true)
      );
    },
  },
};

exports.default = exports.AlphaImageHandler;
