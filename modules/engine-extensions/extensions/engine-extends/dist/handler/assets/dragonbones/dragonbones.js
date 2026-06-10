var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, n = r) => {
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

        Object.defineProperty(e, n, a);
      }
    : (e, t, r, n) => {
        e[(n = n === undefined ? r : n)] = t[r];
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
        for (var r = a(e), n = 0; n < r.length; n++) {
          if (r[n] !== "default") {
            __createBinding(t, e, r[n]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.DragonBonesHandler = undefined;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const fse = __importStar(require("fs-extra"));
const cc_1 = require("cc");

const { getDependUUIDList } = require("../../utils");

const DRAGONBONES_ENCODING = { encoding: "utf8" };
function basenameNoExt(e) {
  var t = path.basename(e);
  var e = path.extname(e);
  return t.substring(0, t.length - e.length);
}

exports.DragonBonesHandler = {
  name: "dragonbones",
  assetType: "dragonBones.DragonBonesAsset",
  async validate(e) {
    let t;
    e = e.source;
    if (e.endsWith(".json")) {
      var r = fs.readFileSync(e, "utf8");
      try {
        t = JSON.parse(r);
      } catch (e) {
        return false;
      }
    } else {
      r = fs.readFileSync(e);
      try {
        var n = r.buffer.slice(r.byteOffset, r.byteOffset + r.byteLength);
        t =
          cc_1.dragonBones.BinaryDataParser.getInstance().parseDragonBonesData(
            n
          );
      } catch (e) {
        return false;
      }
    }
    return !!t && (Array.isArray(t.armature) || !!t.armatures);
  },
  importer: {
    version: "1.0.2",
    async import(e) {
      var e_source = e.source;
      var r = await fse.readFile(e_source, DRAGONBONES_ENCODING);
      var n = new cc_1.dragonBones.DragonBonesAsset();

      var r =
        ((n.name = basenameNoExt(e_source)),
        e_source.endsWith(".json")
          ? (n.dragonBonesJson = r)
          : (await e.copyToLibrary(".dbbin", e_source),
            n._setRawAsset(".dbbin")),
        EditorExtends.serialize(n));

      await e.saveToLibrary(".json", r);
      var e_source = getDependUUIDList(r);

      e.setData("depends", e_source);
      return true;
    },
  },
};

exports.default = exports.DragonBonesHandler;
