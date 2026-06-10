Object.defineProperty(exports, "__esModule", { value: true });
exports.TextureCubeFaceHandler = undefined;

const { getDependUUIDList } = require("../utils");

const utils_2 = require("./image/utils");

exports.TextureCubeFaceHandler = {
  name: "texture-cube-face",
  assetType: "cc.ImageAsset",
  iconInfo: {
    default: utils_2.defaultIconConfig,
    generateThumbnail(e) {
      var t = e.parent.parent;
      return t.invalid
        ? utils_2.defaultIconConfig
        : ((t = t.meta.files.find((e) => e !== ".json") || ".png"),
          { type: "image", value: e.library + t });
    },
  },
  importer: {
    version: "1.0.0",
    async import(e) {
      var t;
      var a;
      var r;
      return (
        !!e.parent &&
        !!(a = e.parent.getSwapSpace()) &&
        (t = e._name) in a &&
        ((r = e.parent.parent.meta.files.find((e) => e !== ".json") || ".png"),
        (a = a[t]),
        await e.saveToLibrary(r, a),
        (t = new cc.ImageAsset())._setRawAsset(r),
        (a = EditorExtends.serialize(t)),
        await e.saveToLibrary(".json", a),
        (r = getDependUUIDList(a)),
        e.setData("depends", r),
        true)
      );
    },
  },
};

exports.default = exports.TextureCubeFaceHandler;
