Object.defineProperty(exports, "__esModule", { value: true });
exports.RTSpriteFrameHandler = undefined;
const cc_1 = require("cc");

const { getDependUUIDList } = require("../../utils");

exports.RTSpriteFrameHandler = {
  name: "rt-sprite-frame",
  assetType: "cc.SpriteFrame",
  importer: {
    version: "1.0.0",
    async import(e) {
      var r;
      return (
        !!e.parent &&
        (((r = new cc_1.SpriteFrame())._texture =
          EditorExtends.serialize.asAsset(
            e.userData.imageUuidOrDatabaseUri,
            cc.Texture2D
          )),
        (r.rect.width = r.originalSize.width = e.userData.width || 1),
        (r.rect.height = r.originalSize.height = e.userData.height || 1),
        (r = EditorExtends.serialize(r)),
        await e.saveToLibrary(".json", r),
        (r = getDependUUIDList(r)),
        e.setData("depends", r),
        true)
      );
    },
  },
};

exports.default = exports.RTSpriteFrameHandler;
