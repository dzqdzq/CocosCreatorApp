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
exports.JsonHandler = undefined;

const { readFile, readJSON } = require("fs-extra");

const JSON5 = __importStar(require("json5"));
const cc_1 = require("cc");

exports.JsonHandler = {
  name: "json",
  assetType: "cc.JsonAsset",
  importer: {
    version: "2.0.1",
    migrations: [
      {
        version: "1.0.0",
        migrate: (e) => {
          e.userData.json5 = false;
        },
      },
    ],
    async import(e) {
      var t = e.userData.json5 ?? true;
      let r;
      r = t
        ? ((t = await readFile(e.source, "utf8")), JSON5.parse(t))
        : await readJSON(e.source);
      t = new cc_1.JsonAsset();
      t.name = e.basename;
      t.json = r;
      t = EditorExtends.serialize(t);
      await e.saveToLibrary(".json", t);
      e.setData("depends", []);
      return true;
    },
  },
};

exports.default = exports.JsonHandler;
