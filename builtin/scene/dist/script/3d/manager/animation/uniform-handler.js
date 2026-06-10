var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, r, t, a = t) => {
        var n = Object.getOwnPropertyDescriptor(r, t);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : r.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return r[t];
            },
          };
        }

        Object.defineProperty(e, a, n);
      }
    : (e, r, t, a) => {
        e[(a = a === undefined ? t : a)] = r[t];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, r) => {
        Object.defineProperty(e, "default", { enumerable: true, value: r });
      }
    : (e, r) => {
        e.default = r;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var n = (e) =>
      (n =
        Object.getOwnPropertyNames ||
        ((e) => {
          var r;
          var t = [];
          for (r in e) {
            if (Object.prototype.hasOwnProperty.call(e, r)) {
              t[t.length] = r;
            }
          }
          return t;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var r = {};
      if (e != null) {
        for (var t = n(e), a = 0; a < t.length; a++) {
          if (t[a] !== "default") {
            __createBinding(r, e, t[a]);
          }
        }
      }
      __setModuleDefault(r, e);
      return r;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.uniformHandler = undefined;
const cc_1 = require("cc");
const dumpUtil = __importStar(require("../../../export/dump/utils"));
const math_1 = __importDefault(require("../../../utils/math"));
const asset_1 = __importDefault(require("../../../export/dump/asset"));

const { promisify } = require("util");

const ValuePartToArrayIndexMap = {
  "cc.Vec2": { x: 0, y: 1 },
  "cc.Vec3": { x: 0, y: 1, z: 2 },
  "cc.Vec4": { x: 0, y: 1, z: 2, w: 3 },
  "cc.Color": { r: 0, g: 1, b: 2, a: 3 },
};

const ArrayIndexToValuePartMap = {
  "cc.Vec2": { 0: "x", 1: "y" },
  "cc.Vec3": { 0: "x", 1: "y", 2: "z" },
  "cc.Vec4": { 0: "x", 1: "y", 2: "z", 3: "w" },
  "cc.Color": { 0: "r", 1: "g", 2: "b", 3: "a" },
};

class UniformHandler {
  isUniformCurve(e) {
    return e instanceof cc_1.animation.UniformProxyFactory;
  }
  getValueToArrayIndexMapByType(e) {
    return e ? ValuePartToArrayIndexMap[e] : null;
  }
  getArrayIndexToValuePartMapByType(e) {
    return e ? ArrayIndexToValuePartMap[e] : null;
  }
  getUniformNameData(e, r) {
    return { key: `pass.${e}.` + r, displayName: `pass[${e}].` + r };
  }
  getDumpTypeOfUniform(e, r) {
    var t = { value: "" };
    var a = e.getHandle(r);
    var a = cc_1.renderer.Pass.getTypeFromHandle(a);
    let n = asset_1.default.GFXToValueTypeMap[a];
    a = e.properties[r];

    if (a && a.editor && a.editor.type === "color") {
      n = "cc.Color";
    }

    t.value = n;
    e = cc_1.js.getClassByName(n);

    if (e) {
      t.extends = dumpUtil.getTypeInheritanceChain(e);
    }

    return t;
  }
  getUniformDumpData(e, r) {
    var { passIndex: r, uniformName } = r;
    var a = this.getUniformNameData(r, uniformName);
    let n;

    if (e && e.passes && r >= 0 && r < e.passes.length) {
      e = e.passes[r];
      n = uniformHandler.getDumpTypeOfUniform(e, uniformName);
    }

    return { displayName: a.displayName, key: a.key, type: n };
  }
  getAnimablePropsFromMaterial(e) {
    if (!e) {
      return null;
    }
    const o = [];

    e.passes.forEach((a, n) => {
      var a_properties = a.properties;
      Object.keys(a_properties).forEach((e) => {
        var r = new cc_1.animation.UniformProxyFactory();

        r.passIndex = n;
        r.uniformName = e;
        var t = this.getDumpTypeOfUniform(a, e);

        var e = { name: e, passIndex: n, type: t, uniformAdapter: r };
        o.push(e);
      });
    });

    return o;
  }
  getDefaultValue(e) {
    let r = null;
    var t = cc_1.js.getClassByName(e);
    if (t) {
      r = new t();
    } else {
      switch (e) {
        case "Boolean": {
          r = false;
          break;
        }
        case "Number": {
          r = 0;
          break;
        }
        case "String": {
          r = "";
        }
      }
    }
    return r;
  }
  async getCurrentValue(e, r, t) {
    let a;
    var n;
    var o;
    var u;

    if (
      e &&
      e.passes &&
      ((n = e.passes[r.passIndex]), (o = t.type?.value), n)
    ) {
      if (r.channelIndex !== undefined) {
        if (
          (u = n.getHandle(
            r.uniformName,
            r.channelIndex,
            cc_1.gfx.Type.FLOAT
          )) &&
          ((a = n.getUniform(u, 0)), t.combinedType?.value === "cc.Color")
        ) {
          a = math_1.default.clamp(Math.round(255 * a), 0, 255);
        }
      } else if ((u = n.getHandle(r.uniformName)) && o) {
        if (cc_1.renderer.Pass.getTypeFromHandle(u) < cc_1.gfx.Type.SAMPLER1D) {
          a = this.getDefaultValue(o);
          n.getUniform(u, a);
        } else if ((t = e.getProperty(r.uniformName)) && t._uuid) {
          a = await promisify(cc_1.assetManager.loadAny)(t._uuid);
        }
      }
    }

    return a;
  }
  colorFloatToInt(e) {
    let r = e.concat();
    return (r = r.map((e) =>
      math_1.default.clamp(Math.round(255 * e), 0, 255)
    ));
  }
}
const uniformHandler = new UniformHandler();
exports.uniformHandler = uniformHandler;
