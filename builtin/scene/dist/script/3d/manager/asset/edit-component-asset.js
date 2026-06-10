var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, o, n = o) => {
        var r = Object.getOwnPropertyDescriptor(t, o);

        if (
          !r ||
          (!("get" in r) ? !r.writable && !r.configurable : t.__esModule)
        ) {
          r = {
            enumerable: true,
            get() {
              return t[o];
            },
          };
        }

        Object.defineProperty(e, n, r);
      }
    : (e, t, o, n) => {
        e[(n = n === undefined ? o : n)] = t[o];
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
    var r = (e) =>
      (r =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var o = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              o[o.length] = t;
            }
          }
          return o;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var o = r(e), n = 0; n < o.length; n++) {
          if (o[n] !== "default") {
            __createBinding(t, e, o[n]);
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
const encode_1 = __importDefault(require("../../../export/dump/encode"));
const dumpUtil = __importStar(require("../../../export/dump/utils"));

const { loadAssetUncached } = require("../../../utils/asset");

const asset_2 = __importDefault(require("../../../export/dump/asset"));
class EditComponentAsset {
  component = null;
  modifyProp(e, t) {
    e.name = t;

    if (e.value && typeof e.value == "object") {
      for (const o in e.value) {
        if (typeof e.value[o] == "object") {
          this.modifyProp(e.value[o], o);
        }
      }
    }
  }
  encodeComponent(n) {
    const n_constructor = n.constructor;
    if (!n_constructor.__props__) {
      return null;
    }
    const u = {};

    n_constructor.__props__.forEach((t) => {
      try {
        var e;
        var o;

        if (
          t in n &&
          ((e = cc.Class.attr(n_constructor, t)),
          (o = encode_1.default.encodeObject(n[t], e, n, t)).type !== "Unknown")
        ) {
          u[t] = o;
          this.modifyProp(u[t], t);
        }
      } catch (e) {
        console.warn(
          `Component property dump failed:
Component: ${n.constructor.name}
Property: ` + t
        );

        console.warn(e);
      }
    });

    return u;
  }
  cacheComponent(e) {
    this.component = e;
  }
  getComponent() {
    return this.component;
  }
  async updateComponent(e) {
    for (const t in e) {
      if (e[t].visible) {
        await (async function t(o, n, r) {
          if (!n) {
            return;
          }
          if (typeof n != "object") {
            return r === "uuid" && "_uuid" in o
              ? void (o._uuid = n)
              : void (o[r] = n);
          }
          if (n[r].isArray) {
            const e = cc.Class.attr(o.constructor, r);

            if (!Array.isArray(o[r])) {
              o[r] = dumpUtil.ccClassAttrPropertyDefaultValue(e);
            }

            if (Array.isArray(o[r])) {
              const u = o[r].length;
              const a = n[r].value.length;
              if (a > u) {
                for (let e = u; e < a; e++) {
                  if (n[r].value[e].type) {
                    const i = cc.js.getClassByName(n[r].value[e].type);

                    if (i) {
                      o[r][e] = new i();
                      await t(o[r], n[r].value, e.toString());
                    } else {
                      o[r][e] = asset_2.default.getDefaultValue(
                        n[r].value[e].type
                      );
                    }
                  } else {
                    o[r][e] = null;
                  }
                }
              } else if (a < u) {
                while (o[r].length > a) {
                  o[r].pop();
                }
              } else if (u) {
                const l = o[r].slice();
                o[r] = [];
                for (let e = 0; e < u; e++) {
                  if (n[r].value[e] !== undefined) {
                    o[r][e] = l[n[r].value[e].name];
                  }
                }
              }
              for (let e = 0; e < o[r].length; e++) {
                if (
                  n[r].value[e].type &&
                  n[r].value[e].type !== o[r][e].constructor.name
                ) {
                  const s = cc.js.getClassByName(n[r].value[e].type);

                  if (s) {
                    o[r][e] = new s();
                  }
                }
                await t(o[r], n[r].value, e.toString());
              }
            } else {
              delete o[r];
            }
          } else if (n[r].value === null || typeof n[r].value != "object") {
            o[r] = n[r].value;
          } else {
            const c = Object.keys(n[r].value);
            for (const p of c) {
              if (p === "uuid") {
                if (n[r].value[p]) {
                  if (
                    !o[r] ||
                    (o[r]._uuid !== undefined && o[r]._uuid !== n[r].value[p])
                  ) {
                    o[r] = await loadAssetUncached(n[r].value.uuid);
                  }
                } else {
                  o[r] = null;
                }
              } else {
                await t(o[r], n[r].value, p);
              }
            }
          }
        })(this.component, e, t);
      }
    }
    return this.encodeComponent(this.component);
  }
}
exports.default = EditComponentAsset;
