var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, n = r) => {
        var o = Object.getOwnPropertyDescriptor(t, r);

        if (
          !o ||
          (!("get" in o) ? !o.writable && !o.configurable : t.__esModule)
        ) {
          o = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, n, o);
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
    var o = (e) =>
      (o =
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
        for (var r = o(e), n = 0; n < r.length; n++) {
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
exports.methods = undefined;

const { forEach } = require("@editor/asset-db");

const handler_1 = require("../handler");
const effect_1 = require("../handler/assets/effect");

const { recompileAllEffects } = effect_1;

const AssetDBHook = __importStar(require("./asset-db-hook"));
exports.methods = {
  async refreshAllEffect() {
    effect_1.autoGenEffectBinInfo.autoGenEffectBin = false;
    const t = [];

    forEach((e) => {
      e.path2asset.forEach((e) => {
        if (e && e.meta.importer === "effect") {
          t.push(e);
        }
      });
    });

    await Promise.all(t.map((e) => e._assetDB.reimport(e.uuid)));

    effect_1.autoGenEffectBinInfo.autoGenEffectBin = true;
    try {
      await recompileAllEffects(t);
    } catch (e) {
      console.error(e);
    }
  },
  ...AssetDBHook,
  ...handler_1.registerMap,
};
