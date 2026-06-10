Object.defineProperty(exports, "__esModule", { value: true });
exports.SignImageHandler = undefined;
const utils_1 = require("./utils");

const {
  isCapableToFixAlphaTransparencyArtifacts,
  handleImageUserData,
  saveImageAsset,
  importWithType,
} = utils_1;

exports.SignImageHandler = {
  name: "sign-image",
  assetType: "cc.ImageAsset",
  iconInfo: {
    default: utils_1.defaultIconConfig,
    generateThumbnail(e) {
      return { type: "image", value: e.library + ".png" };
    },
  },
  importer: {
    version: "1.0.1",
    async import(e) {
      var a;
      var t;
      return (
        !!e.parent &&
        ((a = e.parent),
        (t = Editor.UI.__protected__.File.resolveToRaw(a.userData.sign)),
        Object.assign(e.userData, a.userData),
        delete e.userData.type,
        delete e.userData.sign,
        (e.userData.isRGBE = false),
        e.userData.fixAlphaTransparencyArtifacts === undefined &&
          (e.userData.fixAlphaTransparencyArtifacts =
            isCapableToFixAlphaTransparencyArtifacts(
              e,
              a.userData.type,
              a.extname
            )),
        (t = await handleImageUserData(e, t, ".png")),
        await saveImageAsset(e, t, ".png", "sign"),
        await importWithType(e, a.userData.type, "sign", a.extname),
        true)
      );
    },
  },
};

exports.default = exports.SignImageHandler;
