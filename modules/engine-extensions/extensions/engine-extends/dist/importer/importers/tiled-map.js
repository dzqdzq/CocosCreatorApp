var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, a, r = a) => {
        Object.defineProperty(e, r, {
          enumerable: true,
          get() {
            return t[a];
          },
        });
      }
    : (e, t, a, r) => {
        e[(r = r === undefined ? a : r)] = t[a];
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
      for (var a in e) {
        if (a !== "default" && Object.prototype.hasOwnProperty.call(e, a)) {
          __createBinding(t, e, a);
        }
      }
    }
    __setModuleDefault(t, e);
    return t;
  });

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.TiledMapImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const xmldom_1 = require("xmldom");
const sharp_1 = __importDefault(require("sharp"));
const cc_1 = require("cc");
const image_utils_1 = require("./utils/image-utils");
const utils_1 = require("../utils");
async function searchDependFiles(a, r, t_documentElement) {
  var t = new xmldom_1.DOMParser().parseFromString(t_documentElement);
  if (!t) {
    console.error("failed to parse " + t_documentElement);
    throw new Error("TiledMap import failed: failed to parser " + r);
  }
  let s = [];
  var i = [];
  let n = [];
  let l = [];
  var t_documentElement = t.documentElement;
  var m = t_documentElement.getElementsByTagName("tileset");
  for (
    let t_documentElement = 0;
    t_documentElement < m.length;
    t_documentElement++
  ) {
    var u = m[t_documentElement];
    var o = u.getAttribute("source");
    if (o) {
      o = path.join(path.dirname(r), o);
      a.depend(o);

      if (!fs.existsSync(o)) {
        console.warn("cannot find " + o);
        return null;
      }

      i.push(o);
      var p = fs.readFileSync(o, "utf-8");
      var p = new xmldom_1.DOMParser().parseFromString(p);
      if (p) {
        p = await parseTilesetImages(a, p, o);
        if (!p) {
          return null;
        }
        s = s.concat(p.imageFullPath);
        n = n.concat(p.imageBaseName);
        l = l.concat(p.imageSizes);
      } else {
        console.warn("Parse %s failed.", o);
      }
    }
    p = await parseTilesetImages(a, u, r);
    if (!p) {
      return null;
    }
    s = s.concat(p.imageFullPath);
    n = n.concat(p.imageBaseName);
    l = l.concat(p.imageSizes);
  }
  var c = [];
  var d = [];
  var f = t_documentElement.getElementsByTagName("imagelayer");
  for (
    let t_documentElement = 0, t = f.length;
    t_documentElement < t;
    t_documentElement++
  ) {
    var g = f[t_documentElement].getElementsByTagName("image");
    if (g && g.length > 0) {
      g = g[0].getAttribute("source");
      g = path.join(path.dirname(r), g);
      a.depend(g);

      if (fs.existsSync(g)) {
        c.push(g);
        let t_documentElement = path.relative(path.dirname(r), g);
        t_documentElement = t_documentElement.replace(/\\/g, "/");
        d.push(t_documentElement);
      } else {
        console.warn("cannot find " + g);
      }
    }
  }
  return {
    imgFullPaths: s,
    tsxFiles: i,
    imgBaseNames: n,
    imageLayerTextures: c,
    imageLayerTextureNames: d,
    imgSizes: l,
  };
}
async function parseTilesetImages(t, e, a) {
  var r = e.getElementsByTagName("image");
  var s = [];
  var i = [];
  var n = [];
  for (let e = 0; e < r.length; e++) {
    var l = r[e].getAttribute("source");
    if (l) {
      l = path.join(path.dirname(a), l);
      t.depend(l);

      if (!fs.existsSync(l)) {
        throw new Error("Image does not exist: " + l);
      }

      var m = await sharp_1.default(l).metadata();

      var m =
        (n.push(new cc_1.Size(m.width, m.height)), s.push(l), path.basename(l));

      i.push(m);
    }
  }
  return { imageFullPath: s, imageBaseName: i, imageSizes: n };
}
class TiledMapImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.2";
  }
  get name() {
    return "tiled-map";
  }
  get assetType() {
    return "cc.TiledMapAsset";
  }
  async validate(e) {
    return true;
  }
  async import(e) {
    await e.copyToLibrary(e.extname, e.source);
    var t = new cc_1.TiledMapAsset();
    var a = fs.readFileSync(e.source, { encoding: "utf8" });
    t.name = path.basename(e.source, e.extname);
    var r = new cc_1.TextAsset();

    var r =
      ((r.name = t.name),
      (r.text = a),
      (t.tmxXmlStr = a),
      await searchDependFiles(e, e.source, a));

    if (!r) {
      return false;
    }

    t.spriteFrames = r.imgFullPaths.map((e) => {
      e = asset_db_1.queryAsset(e);
      if (e) {
        image_utils_1.changeImageDefaultType(e, "sprite-frame");
        return EditorExtends.serialize.asAsset(
          e.uuid + "@f9941",
          cc_1.SpriteFrame
        );
      }
    });

    t.spriteFrameNames = r.imgBaseNames;

    t.tsxFiles = r.tsxFiles.map((e) => {
      e = asset_db_1.queryAsset(e);
      if (e) {
        return EditorExtends.serialize.asAsset(e.uuid, cc_1.TextAsset);
      }
    });

    t.tsxFileNames = r.tsxFiles.map((e) => path.basename(e));

    t.imageLayerSpriteFrame = r.imageLayerTextures.map((e) => {
      e = asset_db_1.queryAsset(e);
      return EditorExtends.serialize.asAsset(
        e.uuid + "@f9941",
        cc_1.SpriteFrame
      );
    });

    t.imageLayerSpriteFrameNames = r.imageLayerTextureNames.map((e) =>
      path.basename(e)
    );

    t.spriteFrameSizes = r.imgSizes;
    a = EditorExtends.serialize(t);
    await e.saveToLibrary(".json", a);
    r = utils_1.getDependUUIDList(a);
    e.setData("depends", r);
    return true;
  }
}
exports.TiledMapImporter = TiledMapImporter;
