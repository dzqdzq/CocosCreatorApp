var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, a = r) => {
        var n = Object.getOwnPropertyDescriptor(t, r);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, a, n);
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
    var n = (e) =>
      (n =
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
        for (var r = n(e), a = 0; a < r.length; a++) {
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
exports.DragonBonesAtlasHandler = undefined;

const { queryAsset } = require("@editor/asset-db");

const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const fse = __importStar(require("fs-extra"));
const cc_1 = require("cc");

const { i18nTranslate, getDependUUIDList } = require("../../utils");

function basenameNoExt(e) {
  var t = path.basename(e);
  var e = path.extname(e);
  return t.substring(0, t.length - e.length);
}

exports.DragonBonesAtlasHandler = {
  name: "dragonbones-atlas",
  assetType: "dragonBones.DragonBonesAtlasAsset",
  async validate(e) {
    e = e.source;
    let t;
    e = fs.readFileSync(e, "utf8");
    try {
      t = JSON.parse(e);
    } catch (e) {
      return false;
    }
    return typeof t.imagePath == "string" && Array.isArray(t.SubTexture);
  },
  importer: {
    version: "1.0.2",
    async import(e) {
      var e_source = e.source;
      var r = fse.readFileSync(e_source, { encoding: "utf8" });
      var a = JSON.parse(r);
      var n = path.resolve(path.dirname(e_source), a.imagePath);
      e.depend(n);
      var s = queryAsset(n);

      if (s && !s.init) {
        e._assetDB.taskManager.pause(e.task);
        await s.waitInit();
        e._assetDB.taskManager.resume(e.task);
      }

      if (!s || !s.imported) {
        console.warn(
          i18nTranslate(
            "engine-extends.importers.dragonbones_atlas.texture_not_imported",
            { texture: n }
          ) + ` {asset(${e.uuid})}`
        );

        return false;
      }

      if (fs.existsSync(n)) {
        n = new cc_1.dragonBones.DragonBonesAtlasAsset();
        n.name = basenameNoExt(e_source);
        n.atlasJson = r;

        n.texture = EditorExtends.serialize.asAsset(
          s.uuid + "@6c48a",
          cc_1.Texture2D
        );

        r = EditorExtends.serialize(n);
        await e.saveToLibrary(".json", r);
        s = getDependUUIDList(r);
        e.setData("depends", s);
        return true;
      }
      throw new Error(
        i18nTranslate(
          "engine-extends.importers.dragonbones_atlas.texture_not_found",
          { atlas: e_source, texture: a.imagePath }
        ) + ` {asset(${e.uuid})}`
      );
    },
  },
};

exports.default = exports.DragonBonesAtlasHandler;
