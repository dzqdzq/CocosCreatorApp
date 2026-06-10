var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const base_1 = __importDefault(require("./base"));
const controller_utils_1 = __importDefault(
  require("../utils/controller-utils")
);
const controller_shape_1 = __importDefault(
  require("../utils/controller-shape")
);
const engine_1 = __importDefault(require("../utils/engine"));

const {
  AttributeName,
  getModel,
  updatePositions,
  updateIB,
  updateVBAttr,
  setMeshColor,
  setNodeOpacity,
} = engine_1.default;

class LinesController extends base_1.default {
  _linesNode = null;
  _linesMR = null;
  _dashed = false;
  constructor(e, t = {}) {
    super(e);
    this.initShape(t);
  }
  initShape(e = {}) {
    this.createShapeNode("LinesController");
    this._dashed = e.dashed ?? false;
    e = [new cc_1.Vec3(), new cc_1.Vec3()];
    e = controller_shape_1.default.calcLinesData(e, [0, 1], false);

    this._linesNode = controller_utils_1.default.createShapeByData(
      e,
      this._color,
      { unlit: true, dashed: this._dashed }
    );

    this._linesNode.name = "LinesNode";
    this._linesNode.parent = this.shape;
    this._linesMR = getModel(this._linesNode);
  }
  setColor(e) {
    this._color = e;
    setMeshColor(this._linesNode, e);
  }
  setOpacity(e) {
    setNodeOpacity(this._linesNode, e);
  }
  updateData(t, s) {
    var e = controller_shape_1.default.calcLinesData(t, s, false);
    if (this._dashed) {
      var i = [];
      if (t.length > 0 && s.length > 0) {
        var l = t[s[(i[0] = 0)]];
        for (let e = 1; e < s.length; e++) {
          var a = t[s[e]];
          i[e] = cc_1.Vec3.distance(a, l);
        }
      }
      updateVBAttr(this._linesMR, "a_lineDistance", i);
    }
    updatePositions(this._linesMR, e.positions);
    updateIB(this._linesMR, e.indices);
  }
  clearData() {
    updatePositions(this._linesMR, []);
    updateIB(this._linesMR, []);
  }
}
exports.default = LinesController;
