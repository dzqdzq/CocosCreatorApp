var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, o = r) => {
        var n = Object.getOwnPropertyDescriptor(t, r);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, o, n);
      }
    : (e, t, r, o) => {
        e[(o = o === undefined ? r : o)] = t[r];
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
    var n = (e) =>
      (n =
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
        for (var r = n(e), o = 0; o < r.length; o++) {
          if (r[o] !== "default") {
            __createBinding(t, e, r[o]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });

exports.watch = undefined;
exports.methods = undefined;
exports.prop = undefined;
exports.style = undefined;
exports.template = undefined;
exports.components = undefined;

exports.data = data;
exports.created = created;

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const phone_1 = require("../../utils/phone");
const main = __importStar(require("./main"));
const console = __importStar(require("./console"));
const cPhone = __importStar(require("./phone"));
const info = __importStar(require("./info"));
const name = "huawei-runtime";
function data() {
  return {
    width: 0,
    loading: false,
    platform: (phone_1.phone.options && phone_1.phone.options.platform) || name,
  };
}
async function created() {}

exports.components = {
  pMain: main,
  console,
  phone: cPhone,
  info,
};

exports.template = readFileSync(
  join(__dirname, "../../../static/template/home.html"),
  "utf-8"
);

exports.style = readFileSync(join(__dirname, "../../style/index.css"), "utf8");

exports.prop = [];

exports.methods = {
  t(e) {
    return Editor.I18n.t(e);
  },
};

exports.watch = {};
