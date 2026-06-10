var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, i = r) => {
        var a = Object.getOwnPropertyDescriptor(t, r);

        if (
          !a ||
          (!("get" in a) ? !a.writable && !a.configurable : t.__esModule)
        ) {
          a = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, i, a);
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
  (() => {
    var a = (e) =>
      (a =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = a(e), i = 0; i < r.length; i++) {
          if (r[i] !== "default") {
            __createBinding(t, e, r[i]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.SpriteFrameHandler = undefined;
exports.trimImage = trimImage;
const asset_db_1 = require("@editor/asset-db");

const { queryUUID, queryPath, queryAsset } = asset_db_1;

const cc = __importStar(require("cc"));

const { getTrimRect, getDependUUIDList } = require("../utils");

const utils_2 = require("./image/utils");
try {
  require("sharp");
} catch (e) {
  console.error(e);
  console.error(Editor.I18n.t("engine-extends.importers.sharpError"));
}
const Sharp = require("sharp");
async function trimImage(e, t, r) {
  e = Sharp(e).extract({
    left: r.trimX,
    top: r.trimY,
    width: r.rotated ? r.height : r.width,
    height: r.rotated ? r.width : r.height,
  });

  if (r.rotated) {
    e.rotate(270);
  }

  return e.toFile(t);
}
function createSpriteFrame(e) {
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
  initVertices(r, e_userData);
  return r;
}
function getTexture(t, r) {
  var t = t.userData;
  var t_imageUuidOrDatabaseUri = t.imageUuidOrDatabaseUri;
  if (t_imageUuidOrDatabaseUri) {
    let e = null;

    if (t.isUuid) {
      e = t_imageUuidOrDatabaseUri;
    } else if (!(e = queryUUID(t_imageUuidOrDatabaseUri))) {
      console.warn(
        `Cannot find image ${queryPath(t_imageUuidOrDatabaseUri) || ""}.`
      );
    }

    if (e !== null) {
      r._texture = EditorExtends.serialize.asAsset(e, cc.Texture2D);
    }
  }
}
function initVerticesData(e) {
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
  var o;
  var n;
  var s;
  var c;
  var d;
  var e_vertices = e.vertices;
  e_vertices.rawPosition.length = 0;

  if (e.meshType !== cc.SpriteFrame.MeshType.POLYGON) {
    t = e.width;
    r = e.height;
    s = e.rawWidth;
    d = e.rawHeight;
    o = e.trimX;
    e = d - e.trimY - r;
    n = s === 0 ? 0 : o / s;
    s = s === 0 ? 1 : (o + t) / s;
    c = d === 0 ? 1 : (e + r) / d;
    d = d === 0 ? 0 : e / d;

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

    e_vertices.uv = [o, e + r, o + t, e + r, o, e, o + t, e];
    e_vertices.nuv = [n, d, s, d, n, c, s, c];
    e_vertices.indexes = [0, 1, 2, 2, 1, 3];
    e_vertices.minPos = [-i, -a, 0];
    e_vertices.maxPos = [i, a, 0];
  }
}
function initVertices(e, t) {
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
Sharp.cache(false);

exports.SpriteFrameHandler = {
  name: "sprite-frame",
  assetType: "cc.SpriteFrame",
  iconInfo: {
    default: utils_2.defaultIconConfig,
    async generateThumbnail(e) {
      let t = queryAsset(e.meta.userData.imageUuidOrDatabaseUri);
      if ((t = t.meta.importer !== "image" ? t.parent : t).invalid) {
        return utils_2.defaultIconConfig;
      }

      var r = t.meta.files.find((e) => e !== ".json") || ".png";

      var i = t.library + r;
      var r = e.library + "_sprite_trim_" + r;
      var e = e.userData;
      try {
        await trimImage(i, r, e);
      } catch (e) {
        console.warn(`trim image {file(${i})} to generate thumbnail failed~`);

        console.warn(e);
        return utils_2.defaultIconConfig;
      }
      return { type: "image", value: r };
    },
  },
  userDataConfig: {
    default: {
      trimType: {
        default: "auto",
        label: "i18n:ENGINE.assets.spriteFrame.trimType",
        render: {
          ui: "ui-select",
          items: [
            { label: "auto", value: "auto" },
            { label: "custom", value: "custom" },
            { label: "none", value: "none" },
          ],
        },
      },
    },
  },
  importer: {
    version: "1.0.12",
    async import(t) {
      if (!t.parent) {
        return false;
      }
      if (t.parent.meta.importer === "image") {
        var t_userData = t.userData;
        let e;
        e = [".tga", ".hdr", ".bmp", ".exr", ".znt", ".psd"].includes(
          t.parent.extname.toLowerCase()
        )
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
            a = getTrimRect(
              Buffer.from(i.data),
              t_userData.rawWidth,
              t_userData.rawHeight,
              t_userData.trimThreshold
            );
            t_userData.width = Math.max(a[2], 1);
            t_userData.height = Math.max(a[3], 1);
            t_userData.trimX = cc.clamp(
              a[0],
              0,
              t_userData.rawWidth - t_userData.width
            );
            t_userData.trimY = cc.clamp(
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
          t_userData.trimX = cc.clamp(
            t_userData.trimX,
            0,
            t_userData.rawWidth - 1
          );
          t_userData.trimY = cc.clamp(
            t_userData.trimY,
            0,
            t_userData.rawHeight - 1
          );

          t_userData.width = cc.clamp(
            -1 === t_userData.width ? t_userData.rawWidth : t_userData.width,
            1,
            t_userData.rawWidth - t_userData.trimX
          );

          t_userData.height = cc.clamp(
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
        t_userData.borderLeft = cc.clamp(
          t_userData.borderLeft,
          0,
          t_userData.width
        );

        t_userData.borderRight = cc.clamp(
          t_userData.borderRight,
          0,
          t_userData.width - t_userData.borderLeft
        );

        t_userData.borderTop = cc.clamp(
          t_userData.borderTop,
          0,
          t_userData.height
        );

        t_userData.borderBottom = cc.clamp(
          t_userData.borderBottom,
          0,
          t_userData.height - t_userData.borderTop
        );

        initVerticesData(t_userData);
      }
      var a = createSpriteFrame(t);

      if (t.parent instanceof asset_db_1.Asset) {
        a.name = a.name || t.parent.basename || "";
      }

      getTexture(t, a);
      var i = EditorExtends.serialize(a);
      await t.saveToLibrary(".json", i);
      var t_userData = getDependUUIDList(JSON.parse(i));

      t.setData("depends", t_userData);
      return true;
    },
  },
};

exports.default = exports.SpriteFrameHandler;
