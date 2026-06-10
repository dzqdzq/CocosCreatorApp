var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, i = r) => {
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

        Object.defineProperty(e, i, o);
      }
    : (e, t, r, i) => {
        e[(i = i === undefined ? r : i)] = t[r];
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
        for (var r = o(e), i = 0; i < r.length; i++) {
          if (r[i] !== "default") {
            __createBinding(t, e, r[i]);
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

exports.MissingReporter = undefined;
exports.walkProperties = undefined;
exports.serializeCompiled = undefined;
exports.serialize = undefined;
exports.PrefabUtils = undefined;
exports.GeometryUtils = undefined;
exports.UuidUtils = undefined;
exports.Dialog = undefined;
exports.Asset = undefined;
exports.Component = undefined;
exports.Node = undefined;
exports.Script = undefined;

exports.init = init;
exports.start = start;
exports.stop = stop;
exports.emit = emit;
exports.on = on;
exports.removeListener = removeListener;
const events_1 = require("events");
const script_1 = __importDefault(require("./manager/script"));
const node_1 = __importDefault(require("./manager/node"));
const component_1 = __importDefault(require("./manager/component"));
const asset_1 = __importDefault(require("./manager/asset"));
const dialog_1 = __importDefault(require("./manager/dialog"));

exports.Script = new script_1.default();
exports.Node = new node_1.default();
exports.Component = new component_1.default();
exports.Asset = new asset_1.default();
exports.Dialog = new dialog_1.default();
const Uuid = __importStar(require("./utils/uuid"));
exports.UuidUtils = Uuid;
const missing_class_reporter_1 = require("./missing-reporter/missing-class-reporter");

const missing_object_reporter_1 = require("./missing-reporter/missing-object-reporter");
var object_walker_1 = require("./missing-reporter/object-walker");
async function init() {
  var e = await Promise.resolve().then(() =>
    __importStar(require("./utils/geometry"))
  );

  var e =
    ((exports.GeometryUtils = e),
    await Promise.resolve().then(() =>
      __importStar(require("./utils/prefab"))
    ));

  var e =
    ((exports.PrefabUtils = e),
    await Promise.resolve().then(() =>
      __importStar(require("./utils/serialize/index"))
    ));

  exports.serialize = e.serialize;
  exports.serializeCompiled = e.serializeCompiled;
}
function start() {
  exports.Script.allow = true;
  exports.Node.allow = true;
  exports.Component.allow = true;
}
function stop() {
  exports.Script.allow = false;
  exports.Node.allow = false;
  exports.Component.allow = false;
}

Object.defineProperty(exports, "walkProperties", {
  enumerable: true,
  get() {
    return object_walker_1.walkProperties;
  },
});

exports.MissingReporter = {
  classInstance: missing_class_reporter_1.MissingClass,
  class: missing_class_reporter_1.MissingClassReporter,
  object: missing_object_reporter_1.MissingObjectReporter,
};

const event = new events_1.EventEmitter();
function emit(e, ...t) {
  event.emit(e, ...t);
}
function on(e, t) {
  event.on(e, t);
}
function removeListener(e, t) {
  event.removeListener(e, t);
}
