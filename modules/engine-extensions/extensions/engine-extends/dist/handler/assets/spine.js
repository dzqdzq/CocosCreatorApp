var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, a = r) => {
        var s = Object.getOwnPropertyDescriptor(t, r);

        if (
          !s ||
          (!("get" in s) ? !s.writable && !s.configurable : t.__esModule)
        ) {
          s = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, a, s);
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
    var s = (e) =>
      (s =
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
        for (var r = s(e), a = 0; a < r.length; a++) {
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
exports.SpineHandler = undefined;

const { queryAsset, queryUUID } = require("@editor/asset-db");

const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const fse = __importStar(require("fs-extra"));
const ATLAS_EXTS = [".atlas", ".txt", ".atlas.txt", ""];
const cc_1 = require("cc");

const { getDependUUIDList } = require("../utils");

function searchAtlas(s, n) {
  var e = path.extname(s);
  s = s.substr(0, s.length - e.length);

  (function t(r) {
    var e = ATLAS_EXTS[r];
    const a = s + e;
    fs.exists(a, (e) => {
      if (e) {
        return n(null, a);
      }

      if (r + 1 < ATLAS_EXTS.length) {
        t(r + 1);
      } else {
        n(null, undefined);
      }
    });
  })(0);
}
function loadAtlasText(t, a) {
  searchAtlas(t.source, (e, r) => {
    if (e) {
      return a(e, null);
    }

    if (r) {
      fs.readFile(r, { encoding: "utf8" }, (e, t) => {
        a(e, { path: r, content: t });
      });
    } else {
      a(
        new Error(
          `The atlas with the same name is not found. Select the {asset[${t.basename}${t.extname}](${t.uuid})} asset and add it manually in the attribute inspector.`
        ),
        null
      );
    }
  });
}
class TextureParser {
  asset;
  atlasPath;
  texturesUUID;
  textureNames;
  constructor(e, t) {
    this.atlasPath = t;
    this.texturesUUID = [];
    this.textureNames = [];
    this.asset = e;
    this.asset.depend(t);
  }
  load(e) {
    var t = path.basename(e);
    var r = path.dirname(this.atlasPath);
    var r = path.resolve(r, t);
    var t = queryAsset(r);

    if (t) {
      t = t.uuid + "@6c48a";
      this.asset.depend(t);
      console.log(`UUID is initialized for ${r}.`);
      this.texturesUUID.push(t);
      this.textureNames.push(e);
    } else if (fs.existsSync(r)) {
      console.warn(`WARN: UUID not yet initialized for "${r}".`);
    } else {
      console.error(
        `Can not find texture "${e}" for atlas "${this.atlasPath}"`
      );
    }

    return null;
  }
}
const scale = 1;
function parserAtlas(e, t) {
  var r = new TextureParser(e, t.path);
  var a = t.content.split("\n");
  if (!a || a.length < 1) {
    throw new Error(`Failed to load atlas file: "${t.path}"`);
  }
  let s = null;
  for (let e = 0; e < a.length; e++) {
    var n = a[e].trim();

    if (n.length === 0) {
      s = null;
    } else if (!s) {
      s = n;
      r.load(s);
    }
  }
  return {
    textures: r.texturesUUID.map((e) =>
      EditorExtends.serialize.asAsset(e, cc_1.Texture2D)
    ),
    textureNames: r.textureNames,
    atlasText: t.content,
    atlasUuid: queryUUID(t.path),
  };
}
function saveToLibrary(t, e, r, a, s) {
  if (r) {
    try {
      var n = parserAtlas(t, r);
      e.textures = n.textures;
      e.textureNames = n.textureNames;
      e.atlasText = n.atlasText;
      t.userData.atlasUuid = n.atlasUuid;
    } catch (e) {
      s(e);
    }
  }
  const i = EditorExtends.serialize(e);
  t.saveToLibrary(".json", i).then(() => {
    var e = getDependUUIDList(i);
    t.setData("depends", e);
    a(true);
  }, s);
}
function initTexture(n, i) {
  return new Promise((r, a) => {
    var n_userData = n.userData;
    if (n_userData.atlasUuid) {
      const s = queryAsset(n_userData.atlasUuid);

      if (s) {
        fs.readFile(s.source, { encoding: "utf8" }, (e, t) => {
          t = { path: s.source, content: t };
          saveToLibrary(n, i, t, r, a);
        });
      } else {
        a(
          new Error(
            "Failed to load atlas file by uuid: " + n_userData.atlasUuid
          )
        );
      }
    } else {
      loadAtlasText(n, (e, t) => {
        if (e) {
          return a(e);
        }
        saveToLibrary(n, i, t, r, a);
      });
    }
  });
}
async function importJson(e) {
  var e_source = e.source;
  var e_source = await fse.readFile(e_source, { encoding: "utf8" });
  let r;
  try {
    r = JSON.parse(e_source);
  } catch (e) {
    console.error(e);
    return false;
  }
  e_source = new cc_1.sp.SkeletonData();
  e_source.name = e.basename || "";
  e_source.skeletonJson = r;
  e_source.scale = scale;
  return initTexture(e, e_source);
}
async function importBinary(e) {
  await e.copyToLibrary(".bin", e.source);
  e.source;
  var t = new cc_1.sp.SkeletonData();
  t.name = e.basename || "";
  t._setRawAsset(".bin");
  t.scale = scale;
  return initTexture(e, t);
}

exports.SpineHandler = {
  name: "spine-data",
  assetType: "sp.SkeletonData",
  async validate(e) {
    e = e.source;
    if (e.endsWith(".skel")) {
      return true;
    }
    let t;
    var e = fs.readFileSync(e, "utf8");
    var r = e.slice(0, 30);
    if (
      r.indexOf("slots") > 0 ||
      r.indexOf("skins") > 0 ||
      r.indexOf("events") > 0 ||
      r.indexOf("animations") > 0 ||
      r.indexOf("bones") > 0 ||
      r.indexOf("skeleton") > 0 ||
      r.indexOf('"ik"') > 0
    ) {
      try {
        t = JSON.parse(e);
      } catch (e) {
        return false;
      }
      return Array.isArray(t.bones);
    }
    return false;
  },
  importer: {
    version: "1.2.7",
    async import(e) {
      return (e.source.endsWith(".skel") ? importBinary : importJson)(e);
    },
  },
};

exports.default = exports.SpineHandler;
