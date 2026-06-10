var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, a, r = a) => {
        var i = Object.getOwnPropertyDescriptor(t, a);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[a];
            },
          };
        }

        Object.defineProperty(e, r, i);
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
  (() => {
    var i = (e) =>
      (i =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var a = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              a[a.length] = t;
            }
          }
          return a;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var a = i(e), r = 0; r < a.length; r++) {
          if (a[r] !== "default") {
            __createBinding(t, e, a[r]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.TiledMapHandler = undefined;

const { queryAsset } = require("@editor/asset-db");

const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const xmldom_1 = require("xmldom");
const sharp_1 = __importDefault(require("sharp"));
const cc_1 = require("cc");

const { changeImageDefaultType } = require("./utils/image-utils");

const { getDependUUIDList } = require("../utils");

async function searchDependFiles(a, r, t_documentElement) {
  var t = new xmldom_1.DOMParser().parseFromString(t_documentElement);
  if (!t) {
    console.error("failed to parse " + t_documentElement);
    throw new Error("TiledMap import failed: failed to parser " + r);
  }
  let i = [];
  var s = [];
  var n = [];
  let l = [];
  let u = [];
  var t_documentElement = t.documentElement;
  var o = t_documentElement.getElementsByTagName("tileset");
  for (
    let t_documentElement = 0;
    t_documentElement < o.length;
    t_documentElement++
  ) {
    var m = o[t_documentElement];
    var c = m.getAttribute("source");
    if (c) {
      n.push(c);
      c = path.join(path.dirname(r), c);
      a.depend(c);

      if (!fs.existsSync(c)) {
        console.warn("cannot find " + c);
        return null;
      }

      s.push(c);
      var d = fs.readFileSync(c, "utf-8");
      var d = new xmldom_1.DOMParser().parseFromString(d);
      if (d) {
        d = await parseTilesetImages(a, d, c);
        if (!d) {
          return null;
        }
        i = i.concat(d.imageFullPath);
        l = l.concat(d.imageBaseName);
        u = u.concat(d.imageSizes);
      } else {
        console.warn("Parse %s failed.", c);
      }
    }
    d = await parseTilesetImages(a, m, r);
    if (!d) {
      return null;
    }
    i = i.concat(d.imageFullPath);
    l = l.concat(d.imageBaseName);
    u = u.concat(d.imageSizes);
  }
  var p = [];
  var f = [];
  var g = t_documentElement.getElementsByTagName("imagelayer");
  for (
    let t_documentElement = 0, t = g.length;
    t_documentElement < t;
    t_documentElement++
  ) {
    var _ = g[t_documentElement].getElementsByTagName("image");
    if (_ && _.length > 0) {
      _ = _[0].getAttribute("source");
      _ = path.join(path.dirname(r), _);
      a.depend(_);

      if (fs.existsSync(_)) {
        p.push(_);
        let t_documentElement = path.relative(path.dirname(r), _);
        t_documentElement = t_documentElement.replace(/\\/g, "/");
        f.push(t_documentElement);
      } else {
        console.warn("cannot find " + _);
      }
    }
  }
  return {
    imgFullPaths: i,
    tsxFiles: s,
    tsxSources: n,
    imgBaseNames: l,
    imageLayerTextures: p,
    imageLayerTextureNames: f,
    imgSizes: u,
  };
}
async function parseTilesetImages(t, e, a) {
  var r = e.getElementsByTagName("image");
  var i = [];
  var s = [];
  var n = [];
  for (let e = 0; e < r.length; e++) {
    var l = r[e].getAttribute("source");
    if (l) {
      l = path.join(path.dirname(a), l);
      t.depend(l);

      if (!fs.existsSync(l)) {
        throw new Error("Image does not exist: " + l);
      }

      var u = await (0, sharp_1.default)(l).metadata();

      var u =
        (n.push(new cc_1.Size(u.width, u.height)), i.push(l), path.basename(l));

      s.push(u);
    }
  }
  return { imageFullPath: i, imageBaseName: s, imageSizes: n };
}

exports.TiledMapHandler = {
  name: "tiled-map",
  assetType: "cc.TiledMapAsset",
  async validate(e) {
    return true;
  },
  importer: {
    version: "1.0.2",
    versionCode: 1,
    async import(t) {
      await t.copyToLibrary(t.extname, t.source);
      var e = new cc_1.TiledMapAsset();
      var a = fs.readFileSync(t.source, { encoding: "utf8" });

      e.name = path.basename(t.source, t.extname);
      var r = new cc_1.TextAsset();

      var r =
        ((r.name = e.name),
        (r.text = a),
        (e.tmxXmlStr = a),
        await searchDependFiles(t, t.source, a));

      if (!r) {
        return false;
      }

      e.spriteFrames = r.imgFullPaths.map((e) => {
        t.depend(e);
        e = queryAsset(e);
        if (e) {
          changeImageDefaultType(e, "sprite-frame");
          return EditorExtends.serialize.asAsset(
            e.uuid + "@f9941",
            cc_1.SpriteFrame
          );
        }
      });

      e.spriteFrameNames = r.imgBaseNames;

      e.tsxFiles = r.tsxFiles.map((e) => {
        e = queryAsset(e);
        if (e) {
          return EditorExtends.serialize.asAsset(e.uuid, cc_1.TextAsset);
        }
      });

      e.tsxFileNames = r.tsxSources;

      e.imageLayerSpriteFrame = r.imageLayerTextures.map((e) => {
        e = queryAsset(e);
        return EditorExtends.serialize.asAsset(
          e.uuid + "@f9941",
          cc_1.SpriteFrame
        );
      });

      e.imageLayerSpriteFrameNames = r.imageLayerTextureNames.map((e) =>
        path.basename(e)
      );

      e.spriteFrameSizes = r.imgSizes;
      a = EditorExtends.serialize(e);
      await t.saveToLibrary(".json", a);
      r = getDependUUIDList(a);
      t.setData("depends", r);
      return true;
    },
  },
};

exports.default = exports.TiledMapHandler;
