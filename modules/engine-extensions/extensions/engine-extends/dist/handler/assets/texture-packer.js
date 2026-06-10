var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, a = r) => {
        var i = Object.getOwnPropertyDescriptor(t, r);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, a, i);
      }
    : (e, t, r, a) => {
        e[(a = a === undefined ? r : a)] = t[r];
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
        for (var r = i(e), a = 0; a < r.length; a++) {
          if (r[a] !== "default") {
            __createBinding(t, e, r[a]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.TexturePackerHandler = undefined;
exports._parseFloat2 = _parseFloat2;
exports._parseRect = _parseRect;

const { readFile, existsSync } = require("fs-extra");

const { basename, join, dirname } = require("path");

const migratesNameToId = __importStar(require("./migrates/name2id"));
const cc_1 = require("cc");

const { getDependUUIDList } = require("../utils");

const {
  makeDefaultSpriteFrameAssetUserDataFromImageUuid,
} = require("./image/utils");

const plist = require("plist");
function fillFrameData(e, t) {
  var t_format = t.format;

  var t = makeDefaultSpriteFrameAssetUserDataFromImageUuid(
    t.textureUuid,
    t.uuid
  );

  let a = false;
  let i = "";
  let s = "";
  let o = "";

  if (t_format === 1 || t_format === 2) {
    a = e.rotated;
    i = e.sourceSize;
    s = e.offset;
    o = e.frame;
  } else if (t_format === 3) {
    a = e.textureRotated;
    i = e.spriteSourceSize;
    s = e.spriteOffset;
    o = e.textureRect;
  }

  t.rotated = a;
  t_format = _parseFloat2(i, cc_1.Size);
  t.rawWidth = t_format.width;
  t.rawHeight = t_format.height;
  e = _parseRect(o);
  t.trimX = e.x;
  t.trimY = e.y;
  t.width = e.width;
  t.height = e.height;
  t_format = _parseFloat2(s, cc_1.Vec2);
  t.offsetX = t_format.x;
  t.offsetY = t_format.y;
  return t;
}

exports.TexturePackerHandler = {
  name: "sprite-atlas",
  assetType: "cc.SpriteAtlas",
  importer: {
    version: "1.0.8",
    migrations: [{ version: "1.0.4", migrate: migratesNameToId.migrate }],
    async import(e) {
      var e_userData = e.userData;
      var a_metadata = await readFile(e.source, "utf8");
      var a = plist.parse(a_metadata);
      var a_metadata = a.metadata;
      e_userData.atlasTextureName =
        a_metadata.realTextureFileName || a_metadata.textureFileName;
      e_userData.format = a_metadata.format;
      e_userData.uuid = e.uuid;

      if (e._assetDB) {
        a_metadata = basename(e_userData.atlasTextureName);
        a_metadata = join(dirname(e.source), a_metadata);

        a_metadata =
          (existsSync(a_metadata) ||
            console.warn(
              "Parse Error: Unable to find file Texture, the path: " +
                a_metadata
            ),
          e.depend(a_metadata),
          e._assetDB.pathToUuid(a_metadata));

        if (!a_metadata) {
          return false;
        }
        e_userData.textureUuid =
          a_metadata +
          "@" +
          require("@editor/asset-db/libs/utils").nameToId("texture");
      }

      if (e.userData.textureUuid && e._assetDB) {
        var i = /\.[^.]+$/;
        var a_metadata = Object.keys(a.frames);
        var s = new cc.SpriteAtlas();
        s.name = e.basename || "";
        for (const l of a_metadata) {
          var o = l.replace(i, "");
          var u = a.frames[l];
          var n = await e.createSubAsset(o, "sprite-frame");
          var u = fillFrameData(u, e_userData);
          u.borderBottom = u.borderBottom | n.userData.borderBottom;
          u.borderTop = u.borderTop | n.userData.borderTop;
          u.borderLeft = u.borderLeft | n.userData.borderLeft;
          u.borderRight = u.borderRight | n.userData.borderRight;

          if ("packable" in n.userData) {
            u.packable = n.userData.packable;
          }

          n.assignUserData(u, true);
          n.userData.imageUuidOrDatabaseUri = u.imageUuidOrDatabaseUri;

          s.spriteFrames[o] = EditorExtends.serialize.asAsset(
            n.uuid,
            cc_1.SpriteFrame
          );
        }
        a_metadata = EditorExtends.serialize(s);
        a_metadata =
          (await e.saveToLibrary(".json", a_metadata),
          getDependUUIDList(a_metadata));
        e.setData("depends", a_metadata);
      }
      return true;
    },
  },
  async validate(e) {
    try {
      var t = plist.parse(await readFile(e.source, "utf8"));
      return t.frames !== undefined && t.metadata !== undefined;
    } catch (e) {
      return false;
    }
  },
};

exports.default = exports.TexturePackerHandler;
const BRACE_REGEX = /[\{\}]/g;
function _parseFloat2(e, t) {
  e = e.slice(1, -1).split(",");
  return new t(parseFloat(e[0]), parseFloat(e[1]));
}
function _parseRect(e) {
  e = (e = e.replace(BRACE_REGEX, "")).split(",");
  return new cc_1.Rect(
    parseFloat(e[0] || "0"),
    parseFloat(e[1] || "0"),
    parseFloat(e[2] || "0"),
    parseFloat(e[3] || "0")
  );
}
