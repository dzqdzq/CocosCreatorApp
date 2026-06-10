var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, s, r = s) => {
        Object.defineProperty(e, r, {
          enumerable: true,
          get() {
            return t[s];
          },
        });
      }
    : (e, t, s, r) => {
        e[(r = r === undefined ? s : r)] = t[s];
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
      for (var s in e) {
        if (s !== "default" && Object.prototype.hasOwnProperty.call(e, s)) {
          __createBinding(t, e, s);
        }
      }
    }
    __setModuleDefault(t, e);
    return t;
  });

Object.defineProperty(exports, "__esModule", { value: true });
exports.SpineImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const fse = __importStar(require("fs-extra"));
const ATLAS_EXTS = [".atlas", ".txt", ".atlas.txt", ""];
const cc_1 = require("cc");
const utils_1 = require("../utils");
function basenameNoExt(e) {
  var t = path.basename(e);
  var e = path.extname(e);
  return t.substring(0, t.length - e.length);
}
function searchAtlas(a, n) {
  var e = path.extname(a);
  a = a.substr(0, a.length - e.length);

  (function t(s) {
    var e = ATLAS_EXTS[s];
    const r = a + e;
    fs.exists(r, (e) => {
      if (e) {
        return n(null, r);
      }

      if (s + 1 < ATLAS_EXTS.length) {
        t(s + 1);
      } else {
        n(new Error("Can not find " + (a + ATLAS_EXTS[0])));
      }
    });
  })(0);
}
function loadAtlasText(e, r) {
  searchAtlas(e, (e, s) => {
    if (e) {
      return r(e);
    }
    fs.readFile(s, { encoding: "utf8" }, (e, t) => {
      r(e, { data: t, atlasPath: s });
    });
  });
}
class TextureParser {
  constructor(e, t) {
    this.atlasPath = t;
    this.texturesUUID = [];
    this.textureNames = [];
    this.asset = e;
    this.asset.depend(t);
  }
  load(e) {
    var t = path.basename(e);
    var s = path.dirname(this.atlasPath);
    var s = path.resolve(s, t);
    var t = asset_db_1.queryAsset(s);
    return t
      ? ((t = t.uuid + "@6c48a"),
        this.asset.depend(t),
        console.log('UUID is initialized for "%s".', s),
        this.texturesUUID.push(t),
        this.textureNames.push(e),
        ((t = new cc_1.sp.spine.Texture({})).setFilters = () => {}),
        (t.setWraps = () => {}),
        t)
      : (fs.existsSync(s)
          ? console.warn('WARN: UUID not yet initialized for "%s".', path)
          : console.error(
              'Can not find texture "%s" for atlas "%s"',
              e,
              this.atlasPath
            ),
        null);
  }
}
class SpineImporter extends asset_db_1.Importer {
  constructor(...args) {
    super(...args);
    this.scale = 1;
    this.textures = [];
  }
  get version() {
    return "1.2.6";
  }
  get name() {
    return "spine-data";
  }
  get assetType() {
    return "sp.SkeletonData";
  }
  async validate(e) {
    e = e.source;
    if (e.endsWith(".skel")) {
      return true;
    }
    let t;
    var e = fs.readFileSync(e, "utf8");
    var s = e.slice(0, 30);
    if (
      s.indexOf("slots") > 0 ||
      s.indexOf("skins") > 0 ||
      s.indexOf("events") > 0 ||
      s.indexOf("animations") > 0 ||
      s.indexOf("bones") > 0 ||
      s.indexOf("skeleton") > 0 ||
      s.indexOf('"ik"') > 0
    ) {
      try {
        t = JSON.parse(e);
      } catch (e) {
        return false;
      }
      return Array.isArray(t.bones);
    }
    return false;
  }
  async _initTexture(i, o, e) {
    return new Promise((a, n) => {
      loadAtlasText(e, (e, t) => {
        if (e) {
          return n(e);
        }
        var s = new TextureParser(i, t.atlasPath);
        try {
          new cc_1.sp.spine.TextureAtlas(t.data, s.load.bind(s));
        } catch (e) {
          return n(
            new Error(
              `Failed to load atlas file: "${t.atlasPath}". ` + (e.stack || e)
            )
          );
        }
        this.textures = s.texturesUUID;

        o.textures = s.texturesUUID.map((e) =>
          EditorExtends.serialize.asAsset(e, cc_1.Texture2D)
        );

        o.textureNames = s.textureNames;
        o.atlasText = t.data;
        const r = EditorExtends.serialize(o);
        i.saveToLibrary(".json", r).then(() => {
          var e = utils_1.getDependUUIDList(r);
          i.setData("depends", e);
          a(true);
        }, n);
      });
    });
  }
  async _importJson(e) {
    var e_source = e.source;
    var s = await fse.readFile(e_source, { encoding: "utf8" });
    let r;
    try {
      r = JSON.parse(s);
    } catch (e) {
      console.error(e);
      return false;
    }
    s = new cc_1.sp.SkeletonData();
    s.name = e.basename || "";
    s.skeletonJson = r;
    s.scale = this.scale;
    return this._initTexture(e, s, e_source);
  }
  async _importBinary(e) {
    await e.copyToLibrary(".bin", e.source);
    var e_source = e.source;
    var s = new cc_1.sp.SkeletonData();
    s.name = e.basename || "";
    s._setRawAsset(".bin");
    s.scale = this.scale;
    return this._initTexture(e, s, e_source);
  }
  async import(e) {
    return e.source.endsWith(".skel")
      ? this._importBinary(e)
      : this._importJson(e);
  }
}
exports.SpineImporter = SpineImporter;
