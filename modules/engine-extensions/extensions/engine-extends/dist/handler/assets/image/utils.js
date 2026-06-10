var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultIconConfig = undefined;
exports.makeDefaultTextureCubeAssetUserData =
  makeDefaultTextureCubeAssetUserData;
exports.makeDefaultTexture2DAssetUserData = makeDefaultTexture2DAssetUserData;
exports.makeDefaultTexture2DAssetUserDataFromImagePath =
  makeDefaultTexture2DAssetUserDataFromImagePath;
exports.makeDefaultTexture2DAssetUserDataFromImageUuid =
  makeDefaultTexture2DAssetUserDataFromImageUuid;
exports.makeDefaultSpriteFrameAssetUserData =
  makeDefaultSpriteFrameAssetUserData;
exports.makeDefaultSpriteFrameAssetUserDataFromImageUuid =
  makeDefaultSpriteFrameAssetUserDataFromImageUuid;
exports.saveImageAsset = saveImageAsset;
exports.isCapableToFixAlphaTransparencyArtifacts =
  isCapableToFixAlphaTransparencyArtifacts;
exports.handleImageUserData = handleImageUserData;
exports.importWithType = importWithType;
exports.converImage = converImage;
exports.openImageAsset = openImageAsset;
const cc_1 = require("cc");

const { readFile } = require("fs-extra");

const sharp_1 = __importDefault(require("sharp"));

const { getDependUUIDList } = require("../../utils");

const { applyContourBleed } = require("../utils/algorithm/bleeding");

const {
  makeDefaultTextureBaseAssetUserData,
  makeDefaultSpriteFrameBaseAssetUserData,
} = require("../texture-base");

const remote_1 = require("@electron/remote");
const RGBChannels = 3;
const RGBAChannels = 4;
function makeDefaultTextureCubeAssetUserData() {
  var e = makeDefaultTextureBaseAssetUserData();
  e.isRGBE = false;
  e.mipfilter = "linear";
  return e;
}
function makeDefaultTexture2DAssetUserData() {
  return makeDefaultTextureBaseAssetUserData();
}
function makeDefaultTexture2DAssetUserDataFromImagePath(e) {
  return Object.assign(makeDefaultTextureBaseAssetUserData(), {
    isUuid: false,
    imageUuidOrDatabaseUri: e,
  });
}
function makeDefaultTexture2DAssetUserDataFromImageUuid(e, a) {
  var t = makeDefaultTextureBaseAssetUserData();

  if (a && [".exr", ".hdr", ".znt"].includes(a)) {
    t.mipfilter = "none";
    t.minfilter = "nearest";
    t.magfilter = "nearest";
  }

  return Object.assign(t, { isUuid: true, imageUuidOrDatabaseUri: e });
}
function makeDefaultSpriteFrameAssetUserData() {
  return makeDefaultSpriteFrameBaseAssetUserData();
}
function makeDefaultSpriteFrameAssetUserDataFromImageUuid(e, a) {
  return Object.assign(makeDefaultSpriteFrameBaseAssetUserData(), {
    isUuid: true,
    imageUuidOrDatabaseUri: e,
    atlasUuid: a,
  });
}
async function saveImageAsset(e, a, t, r) {
  if (typeof a == "string") {
    await e.copyToLibrary(t, a);
  } else {
    await e.saveToLibrary(t, a);
  }

  a = new cc_1.ImageAsset();
  a.name = r;
  a._setRawAsset(t);
  r = EditorExtends.serialize(a);
  await e.saveToLibrary(".json", r);
  t = getDependUUIDList(r);
  e.setData("depends", t);
}
function isCapableToFixAlphaTransparencyArtifacts(e, a, t) {
  return (
    !["normal map", "texture cube", "sprite-frame", "texture"].includes(a) &&
    ((a = t.toLocaleLowerCase().replace(".", "")),
    (t = e.userData),
    !["hdr", "exr"].includes(a)) &&
    !t.isRGBE
  );
}
async function handleImageUserData(e, t, a) {
  if (typeof t == "string") {
    t = await readFile(t);
  }

  e = e.userData;
  const r = (0, sharp_1.default)(t);
  var height = await r.metadata();
  e.hasAlpha = height.hasAlpha;
  e.type ||= "texture";
  var width = !!e.flipVertical;

  if (width) {
    t = await r.flip().toBuffer();
  }

  if (e.fixAlphaTransparencyArtifacts && height.hasAlpha) {
    e.fixAlphaTransparencyArtifacts = true;
    var u = await (0, sharp_1.default)(t).raw().toBuffer();
    let a = false;
    for (let e = 0; e < u.length; e += RGBAChannels) {
      if (u[e + 3] === 0) {
        a = true;
        break;
      }
    }
    if (a) {
      var width = Buffer.from(u);
      var n = [-1, 0, 1, -1, 1, -1, 0, 1];
      var m = [-1, -1, -1, 0, 0, 1, 1, 1];
      var l = [];
      var o = height.width * RGBAChannels;
      for (let e = 0; e < n.length; e++) {
        l[e] = n[e] * RGBAChannels + m[e] * o;
      }

      applyContourBleed(
        width,
        u,
        height.width,
        new cc_1.Rect(0, 0, height.width, height.height),
        n,
        m,
        l
      );

      t = await (0, sharp_1.default)(width, {
        raw: {
          channels: RGBAChannels,
          height: height.height,
          width: height.width,
        },
      })
        .toFormat("png")
        .toBuffer();
    }
  }

  if (e.flipGreenChannel) {
    const r = await (0, sharp_1.default)(t);
    var { width, height } = await r.metadata();
    var D = await r.raw().toBuffer();
    var p = D.length / width / height;
    for (let e = 1; e < D.length; e = p + e) {
      D[e] = 255 - D[e];
    }
    e = { raw: { width: width, height: height, channels: p } };
    t = await (0, sharp_1.default)(D, e).toFormat("png").toBuffer();
  }
  return t;
}
async function importWithType(e, a, t, r) {
  var e_userData = e.userData;
  switch (a) {
    case "texture": {
      var i = await e.createSubAsset("texture", "texture", { displayName: t });
      e_userData.redirect = i.uuid;

      i.assignUserData(
        makeDefaultTexture2DAssetUserDataFromImageUuid(e.uuid, r)
      );

      i.userData.imageUuidOrDatabaseUri = e.uuid;
      i.userData.visible = false;
      break;
    }
    case "normal map": {
      (
        await e.createSubAsset("normalMap", "texture", { displayName: t })
      ).assignUserData(makeDefaultTexture2DAssetUserDataFromImageUuid(e.uuid));
      break;
    }
    case "texture cube": {
      i = await e.createSubAsset("textureCube", "erp-texture-cube", {
        displayName: t,
      });
      i.assignUserData(makeDefaultTextureCubeAssetUserData());
      i.userData.imageDatabaseUri = e.uuid;
      i.userData.isRGBE = !!e_userData.isRGBE;
      break;
    }
    case "sprite-frame": {
      var i = await e.createSubAsset("texture", "texture", { displayName: t });

      i.userData.wrapModeS = i.userData.wrapModeS || "clamp-to-edge";
      i.userData.wrapModeT = i.userData.wrapModeT || "clamp-to-edge";
      e_userData.redirect = i.uuid;
      i.userData.imageUuidOrDatabaseUri = e.uuid;
      i.userData.isUuid = true;
      i.userData.visible = false;

      var u = await e.createSubAsset("spriteFrame", "sprite-frame", {
        displayName: t,
      });

      u.assignUserData(
        makeDefaultSpriteFrameAssetUserDataFromImageUuid(i.uuid, "")
      );

      u.userData.imageUuidOrDatabaseUri = i.uuid;
    }
  }
}
async function converImage() {}
async function openImageAsset(e) {
  var a = await Editor.Message.request(
    "program",
    "open-program",
    "pictureEditor",
    [e.source]
  );
  return a || (await remote_1.shell.openPath(e.source), true);
}
exports.defaultIconConfig = { type: "icon", value: "image" };
