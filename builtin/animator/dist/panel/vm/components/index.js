var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, r, t, o = t) => {
        var i = Object.getOwnPropertyDescriptor(r, t);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : r.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return r[t];
            },
          };
        }

        Object.defineProperty(e, o, i);
      }
    : (e, r, t, o) => {
        e[(o = o === undefined ? t : o)] = r[t];
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
    var i = (e) =>
      (i =
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
        for (var t = i(e), o = 0; o < t.length; o++) {
          if (t[o] !== "default") {
            __createBinding(r, e, t[o]);
          }
        }
      }
      __setModuleDefault(r, e);
      return r;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });

exports.PropertyCurve = undefined;
exports.PropertyTools = undefined;
exports.PropertyTree = undefined;
exports.AnimatorToolbar = undefined;
exports.AniMask = undefined;
exports.TipsMask = undefined;
exports.PreviewRow = undefined;
exports.PreviewRangeRow = undefined;
exports.NodeTree = undefined;
exports.EventsRow = undefined;
exports.EventEditor = undefined;
exports.CtrlStick = undefined;
exports.ControlTrackTree = undefined;
exports.ControlPointer = undefined;
exports.CurvePresets = undefined;
exports.AuxiliaryCurveFrames = undefined;
exports.AuxiliaryCurves = undefined;

var auxiliary_curve_list_1 = require("./auxiliary-curve-list");

Object.defineProperty(exports, "AuxiliaryCurves", {
  enumerable: true,
  get() {
    return auxiliary_curve_list_1.AuxiliaryCurves;
  },
});

var auxiliary_curves_1 = require("./auxiliary-curves");

Object.defineProperty(exports, "AuxiliaryCurveFrames", {
  enumerable: true,
  get() {
    return auxiliary_curves_1.AuxiliaryCurveFrames;
  },
});

var curve_presets_1 = require("./curve-presets");

Object.defineProperty(exports, "CurvePresets", {
  enumerable: true,
  get() {
    return curve_presets_1.CurvePresets;
  },
});

exports.ControlPointer = __importStar(require("./control-pointer"));
var control_track_tree_1 = require("./control-track-tree");

Object.defineProperty(exports, "ControlTrackTree", {
  enumerable: true,
  get() {
    return control_track_tree_1.ControlTrackTree;
  },
});

exports.CtrlStick = __importStar(require("./ctrl-stick"));
exports.EventEditor = __importStar(require("./event-editor"));
exports.EventsRow = __importStar(require("./events"));
exports.NodeTree = __importStar(require("./node-tree"));
var preview_range_row_1 = require("./preview-range-row");

Object.defineProperty(exports, "PreviewRangeRow", {
  enumerable: true,
  get() {
    return preview_range_row_1.PreviewRangeRow;
  },
});

exports.PreviewRow = __importStar(require("./preview-row"));
exports.TipsMask = __importStar(require("./tips-mask"));
exports.AniMask = __importStar(require("./mask"));
exports.AnimatorToolbar = __importStar(require("./toolbar"));
exports.PropertyTree = __importStar(require("./property-tree"));
exports.PropertyTools = __importStar(require("./property-tools"));
var property_curve_1 = require("./property-curve");

Object.defineProperty(exports, "PropertyCurve", {
  enumerable: true,
  get() {
    return property_curve_1.PropertyCurve;
  },
});
