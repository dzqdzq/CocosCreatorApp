var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, i = r) => {
        Object.defineProperty(e, i, {
          enumerable: true,
          get() {
            return t[r];
          },
        });
      }
    : (e, t, r, i) => {
        e[(i = i === undefined ? r : i)] = t[r];
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
      for (var r in e) {
        if (r !== "default" && Object.prototype.hasOwnProperty.call(e, r)) {
          __createBinding(t, e, r);
        }
      }
    }
    __setModuleDefault(t, e);
    return t;
  });

Object.defineProperty(exports, "__esModule", { value: true });

exports.SpriteFrameImporter = undefined;
exports.makeDefaultSpriteFrameAssetUserDataFromImageUuid = undefined;
exports.makeDefaultSpriteFrameAssetUserData = undefined;

const asset_db_1 = require("@editor/asset-db");
const utils_1 = require("../utils");
const texture_base_1 = require("./texture-base");
const cc = __importStar(require("cc"));
const utils_2 = require("../utils");
try {
  require("sharp");
} catch (e) {
  console.error(e);
  console.error(Editor.I18n.t("engine-extends.importers.sharpError"));
}
const Sharp = require("sharp");
function makeDefaultSpriteFrameAssetUserData() {
  return texture_base_1.makeDefaultSpriteFrameBaseAssetUserData();
}
function makeDefaultSpriteFrameAssetUserDataFromImageUuid(e, t) {
  return Object.assign(
    texture_base_1.makeDefaultSpriteFrameBaseAssetUserData(),
    { isUuid: true, imageUuidOrDatabaseUri: e, atlasUuid: t }
  );
}
Sharp.cache(false);
exports.makeDefaultSpriteFrameAssetUserData =
  makeDefaultSpriteFrameAssetUserData;
exports.makeDefaultSpriteFrameAssetUserDataFromImageUuid =
  makeDefaultSpriteFrameAssetUserDataFromImageUuid;
class SpriteFrameImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.11";
  }
  get name() {
    return "sprite-frame";
  }
  get assetType() {
    return "cc.SpriteFrame";
  }
  async import(t) {
    if (!t.parent) {
      return false;
    }
    if (t.parent.meta.importer === "image") {
      var t_userData = t.userData;
      let e;
      e = [".tga", ".hdr", ".bmp"].includes(t.parent.extname.toLowerCase())
        ? t.parent.library + ".png"
        : t.parent.source;
      var i = await Sharp(e).raw().toBuffer({ resolveWithObject: true });
      if (!i) {
        return false;
      }

      if (t_userData.trimThreshold === undefined) {
        t_userData.trimThreshold = 1;
      }

      t_userData.rotated = !!t_userData.rotated;
      t_userData.packable =
        t_userData.packable === undefined || t_userData.packable;
      t_userData.rawHeight = i.info.height;
      t_userData.rawWidth = i.info.width;

      if (t_userData.trimType === "auto") {
        if (i.info.channels !== 4) {
          t_userData.width = i.info.width;
          t_userData.height = i.info.height;
          t_userData.trimX = 0;
          t_userData.trimY = 0;
        } else {
          a = utils_1.getTrimRect(
            Buffer.from(i.data),
            t_userData.rawWidth,
            t_userData.rawHeight,
            t_userData.trimThreshold
          );

          t_userData.width = Math.max(a[2], 1);
          t_userData.height = Math.max(a[3], 1);
          t_userData.trimX = utils_1.clamp(
            a[0],
            0,
            t_userData.rawWidth - t_userData.width
          );
          t_userData.trimY = utils_1.clamp(
            a[1],
            0,
            t_userData.rawHeight - t_userData.height
          );
        }
      } else if (t_userData.trimType === "none") {
        t_userData.trimX = 0;
        t_userData.trimY = 0;
        t_userData.width = i.info.width;
        t_userData.height = i.info.height;
      } else {
        t_userData.trimX = utils_1.clamp(
          t_userData.trimX,
          0,
          t_userData.rawWidth - 1
        );
        t_userData.trimY = utils_1.clamp(
          t_userData.trimY,
          0,
          t_userData.rawHeight - 1
        );

        t_userData.width = utils_1.clamp(
          -1 === t_userData.width ? t_userData.rawWidth : t_userData.width,
          1,
          t_userData.rawWidth - t_userData.trimX
        );

        t_userData.height = utils_1.clamp(
          -1 === t_userData.height ? t_userData.rawHeight : t_userData.height,
          1,
          t_userData.rawHeight - t_userData.trimY
        );
      }

      t_userData.offsetX =
        t_userData.trimX + t_userData.width / 2 - t_userData.rawWidth / 2;
      t_userData.offsetY = -(
        t_userData.trimY +
        t_userData.height / 2 -
        t_userData.rawHeight / 2
      );
      t_userData.borderLeft = utils_1.clamp(
        t_userData.borderLeft,
        0,
        t_userData.width
      );

      t_userData.borderRight = utils_1.clamp(
        t_userData.borderRight,
        0,
        t_userData.width - t_userData.borderLeft
      );

      t_userData.borderTop = utils_1.clamp(
        t_userData.borderTop,
        0,
        t_userData.height
      );

      t_userData.borderBottom = utils_1.clamp(
        t_userData.borderBottom,
        0,
        t_userData.height - t_userData.borderTop
      );

      this.initVerticesData(t_userData);
    }
    var a = this.createSpriteFrame(t);

    if (t.parent instanceof asset_db_1.Asset) {
      a.name = a.name || t.parent.basename || "";
    }

    this.getTexture(t, a);
    var i = EditorExtends.serialize(a);
    await t.saveToLibrary(".json", i);
    var t_userData = utils_2.getDependUUIDList(i);
    t.setData("depends", t_userData);
    return true;
  }
  createSpriteFrame(e) {
    var e_userData = e.userData;
    var r = new cc.SpriteFrame();
    r.name = e.displayName || e._name;
    r.atlasUuid = e_userData.atlasUuid;
    r._rect = cc.rect(
      e_userData.trimX,
      e_userData.trimY,
      e_userData.width,
      e_userData.height
    );
    r._originalSize = cc.size(e_userData.rawWidth, e_userData.rawHeight);
    r._offset = cc.v2(e_userData.offsetX, e_userData.offsetY);

    r._capInsets = [
      e_userData.borderLeft,
      e_userData.borderTop,
      e_userData.borderRight,
      e_userData.borderBottom,
    ];

    r._rotated = e_userData.rotated;
    r._packable = e_userData.packable;
    r._pixelsToUnit = e_userData.pixelsToUnit;
    r._pivot = cc.v2(e_userData.pivotX, e_userData.pivotY);
    r._meshType = e_userData.meshType;
    this.initVertices(r, e_userData);
    return r;
  }
  getTexture(t, r) {
    var t = t.userData;
    var t_imageUuidOrDatabaseUri = t.imageUuidOrDatabaseUri;
    if (t_imageUuidOrDatabaseUri) {
      let e = null;

      if (t.isUuid) {
        e = t_imageUuidOrDatabaseUri;
      } else if (!(e = asset_db_1.queryUUID(t_imageUuidOrDatabaseUri))) {
        console.warn(
          `Cannot find image ${
            asset_db_1.queryPath(t_imageUuidOrDatabaseUri) || ""
          }.`
        );
      }

      if (e !== null) {
        r._texture = EditorExtends.serialize.asAsset(e, cc.Texture2D);
      }
    }
  }
  initVerticesData(e) {
    if (e.vertices === undefined) {
      e.vertices = {
        rawPosition: [],
        indexes: [],
        uv: [],
        nuv: [],
        minPos: [],
        maxPos: [],
      };
    }

    var t;
    var r;
    var i;
    var a;
    var s;
    var o;
    var n;
    var m;
    var u;
    var e_vertices = e.vertices;
    e_vertices.rawPosition.length = 0;

    if (e.meshType !== cc.SpriteFrame.MeshType.POLYGON) {
      t = e.width;
      r = e.height;
      n = e.rawWidth;
      u = e.rawHeight;
      s = e.trimX;
      e = u - e.trimY - r;
      o = n === 0 ? 0 : s / n;
      n = n === 0 ? 1 : (s + t) / n;
      m = u === 0 ? 1 : (e + r) / u;
      u = u === 0 ? 0 : e / u;

      e_vertices.rawPosition = [
        -(i = t / 2),
        -(a = r / 2),
        0,
        i,
        -a,
        0,
        -i,
        a,
        0,
        i,
        a,
        0,
      ];

      e_vertices.uv = [s, e + r, s + t, e + r, s, e, s + t, e];
      e_vertices.nuv = [o, u, n, u, o, m, n, m];
      e_vertices.indexes = [0, 1, 2, 2, 1, 3];
      e_vertices.minPos = [-i, -a, 0];
      e_vertices.maxPos = [i, a, 0];
    }
  }
  initVertices(e, t) {
    var t = t.vertices;

    e.vertices = {
      rawPosition: [],
      positions: [],
      indexes: t.indexes,
      uv: t.uv,
      nuv: t.nuv,
      minPos: cc.v3(t.minPos[0], t.minPos[1], t.minPos[2]),
      maxPos: cc.v3(t.maxPos[0], t.maxPos[1], t.maxPos[2]),
    };

    var e_vertices = e.vertices;

    var t_rawPosition = t.rawPosition;
    var a = cc.v3();
    for (let e = 0; e < t_rawPosition.length; e += 3) {
      a.set(t_rawPosition[e], t_rawPosition[e + 1], t_rawPosition[e + 2]);
      e_vertices.rawPosition.push(a.clone());
    }
  }
}
exports.SpriteFrameImporter = SpriteFrameImporter;
