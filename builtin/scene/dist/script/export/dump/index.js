var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");

const { parsingPath } = require("./utils");

const asset_1 = __importDefault(require("./asset"));
const decode_1 = require("./decode");

const { decodePatch, resetProperty, updatePropertyFromNull } = decode_1;

const encode_1 = require("./encode");

const { encodeObject, encodeComponent } = encode_1;

const { get, set } = require("lodash");
class DumpUtil {
  dumpProperty(e, t) {
    return t === ""
      ? this.dumpNode(e)
      : ((t = parsingPath(t, e)),
        parsingPath(t.search, e),
        (t = t.search ? get(e, t.search) : e),
        (e = cc_1.CCClass.Attr.getClassAttrs(t.constructor)),
        encodeObject(t, e));
  }
  dumpNode(e) {
    return e
      ? (e instanceof cc_1.Scene
          ? (0, encode_1.encodeScene)
          : (0, encode_1.encodeNode))(e)
      : null;
  }
  dumpComponent(e) {
    return e ? encodeComponent(e) : null;
  }
  async restoreProperty(e, t, r) {
    if (!/^__comps__\.\d+$/.test(t)) {
      return decodePatch(t, r, e);
    }
    if (typeof r.value == "object") {
      for (const o in r.value) {
        await decodePatch(t + "." + o, r.value[o], e);
      }
    }
  }
  resetProperty(e, t) {
    return resetProperty(e, t);
  }
  updatePropertyFromNull(e, t) {
    return updatePropertyFromNull(e, t);
  }
  async restoreNode(e, t) {
    return (
      t && t.isScene ? (0, decode_1.decodeScene) : (0, decode_1.decodeNode)
    )(t, e);
  }
  parsingPath(e, t) {
    return parsingPath(e, t);
  }
  generatePath(e, t) {}
  encodeObject(e, t, r = null, o, c) {
    return encodeObject(e, t, r, o, c);
  }
  getDefaultValue(e) {
    if (!e) {
      return null;
    }
    let t = asset_1.default.getDefaultValue(e, null);

    if (!t) {
      e = cc_1.js.getClassByName(e);
      t = e ? new e() : null;
    }

    return t;
  }
}
exports.default = new DumpUtil();
