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

exports.methods = undefined;
exports.props = undefined;
exports.data = undefined;
exports.components = undefined;
exports.template = undefined;

exports.created = created;
exports.beforeDestroy = beforeDestroy;

const { readFileSync } = require("fs");

const { join } = require("path");

const buildProp = __importStar(
  require("../../../panels/components/build-prop")
);
const event_bus_1 = require("../event-bus");

exports.template = readFileSync(
  join(__dirname, "../../../../static/contributions/config-items.html"),
  "utf8"
);

exports.components = { "build-prop": buildProp };

const data = () => ({
  selectInfos: [],
});

function created() {
  event_bus_1.EventBus.$on(
    "blank-click",
    (this.onBlankClickBind = this.onBlankClick.bind(this))
  );
}
function beforeDestroy() {
  event_bus_1.EventBus.$off("blank-click", this.onBlankClickBind);
}
exports.data = data;
exports.props = ["formatInfos", "readonly", "type", "platform"];

exports.methods = {
  onSelect(t) {
    var e = this.selectInfos.findIndex((e) => e === t);

    if (-1 === e) {
      this.selectInfos.push(t);
    } else {
      this.selectInfos.splice(e, 1);
    }
  },
  onBlankClick() {
    this.selectInfos = [];
  },
  addFormat(e) {
    var t = this;
    t.$emit("add", e, t.type, t.platform);
  },
  removeFormat() {
    this.selectInfos.forEach((e) => {
      this.$emit("remove", this.type, this.platform, e);
    });

    this.selectInfos = [];
  },
  onChangeQuality(e, t, r) {
    var o = this;

    if (r && t) {
      o.$emit("quality", o.type, o.platform, e, t, r);
    }
  },
};
