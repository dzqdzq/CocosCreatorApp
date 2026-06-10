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
const MARGIN = 50;
const LINE_3D_MAXIMUM_LENGTH = 100000; /* 1e5 */

const axis = {
  x: {
    name: "x",
    start: new cc_1.Vec3(0, 0, 0),
    end: new cc_1.Vec3(0, 0, 0),
    color: cc_1.Color.RED,
  },
  y: {
    name: "y",
    start: new cc_1.Vec3(0, 0, 0),
    end: new cc_1.Vec3(0, 0, 0),
    color: cc_1.Color.GREEN,
  },
  z: {
    name: "z",
    start: new cc_1.Vec3(0, 0, 0),
    end: new cc_1.Vec3(0, 0, 0),
    color: cc_1.Color.BLUE,
  },
};

class OriginAxisController extends base_1.default {
  camera = null;
  xAxis = null;
  yAxis = null;
  zAxis = null;
  static changeCenterAxisVisible(e, i) {
    if (e) {
      e.setVisible(i.x_visible, i.y_visible, i.z_visible);
    }
  }
  constructor(e, i) {
    super(e);
    this.camera = i;
    this.initShape();
  }
  onCameraTransformChanged() {
    requestAnimationFrame(() => {
      this.updateTransform();
    });
  }
  onShow() {
    if (this.camera) {
      this.camera.node.on(
        "transform-changed",
        this.onCameraTransformChanged,
        this
      );
    }

    this.updateTransform();
  }
  onHide() {
    if (this.camera) {
      this.camera.node.off(
        "transform-changed",
        this.onCameraTransformChanged,
        this
      );
    }
  }
  appEditorLayer(e) {
    if (e) {
      e.node.layer = cc_1.Layers.Enum.EDITOR | cc_1.Layers.Enum.IGNORE_RAYCAST;
    }
  }
  initShape() {
    this.createShapeNode("Origin-Axis");

    this.xAxis = controller_utils_1.default.createLine(
      this.shape,
      axis.x.start,
      axis.x.end,
      axis.x.color,
      { name: axis.x.name }
    );

    this.appEditorLayer(this.xAxis);

    this.yAxis = controller_utils_1.default.createLine(
      this.shape,
      axis.y.start,
      axis.y.end,
      axis.y.color,
      { name: axis.y.name }
    );

    this.appEditorLayer(this.yAxis);

    this.zAxis = controller_utils_1.default.createLine(
      this.shape,
      axis.z.start,
      axis.z.end,
      axis.z.color,
      { name: axis.z.name }
    );

    this.appEditorLayer(this.zAxis);
    this.show();
  }
  updateAxisLineTransform() {
    var e;
    var i;
    var s;

    if (this.camera) {
      cce.Gizmo.is2D
        ? ((e = this.camera.node.worldPosition),
          (s = this.camera.orthoHeight / window.innerHeight),
          (i = (window.innerWidth + MARGIN) * s),
          (s = (window.innerHeight + MARGIN) * s),
          axis.x.start.set(-i + e.x, 0, 0),
          axis.x.end.set(i + e.x, 0, 0),
          axis.y.start.set(0, -s + e.y, 0),
          axis.y.end.set(0, s + e.y, 0),
          axis.z.start.set(0, 0, 0),
          axis.z.end.set(0, 0, 0))
        : (axis.x.start.set(-LINE_3D_MAXIMUM_LENGTH, 0, 0),
          axis.x.end.set(LINE_3D_MAXIMUM_LENGTH, 0, 0),
          axis.y.start.set(0, -LINE_3D_MAXIMUM_LENGTH, 0),
          axis.y.end.set(0, LINE_3D_MAXIMUM_LENGTH, 0),
          axis.z.start.set(0, 0, -LINE_3D_MAXIMUM_LENGTH),
          axis.z.end.set(0, 0, LINE_3D_MAXIMUM_LENGTH));

      this.updateLineTransform(this.xAxis, axis.x.start, axis.x.end);
      this.updateLineTransform(this.yAxis, axis.y.start, axis.y.end);
      this.updateLineTransform(this.zAxis, axis.z.start, axis.z.end);
      cce.Engine.repaintInEditMode();
    }
  }
  updateLineTransform(e, i, s) {
    if (e) {
      i = controller_shape_1.default.calcLineData(i, s);
      engine_1.default.updatePositions(e, i.positions);
      engine_1.default.updateBoundingBox(e, i.minPos, i.maxPos);
    }
  }
  onDimensionChanged() {
    super.onDimensionChanged();
    this.updateTransform();
  }
  setColor(e) {
    if (this.xAxis) {
      engine_1.default.setMeshColor(this.xAxis.node, e[0]);
    }

    if (this.yAxis) {
      engine_1.default.setMeshColor(this.yAxis.node, e[1]);
    }

    if (this.zAxis) {
      engine_1.default.setMeshColor(this.zAxis.node, e[2]);
    }
  }
  updateTransform(e) {
    var i = this.xAxis && this.xAxis.node.parent;

    if (i && e) {
      i.setWorldPosition(e.worldPosition);
    }

    this.updateAxisLineTransform();
  }
  setVisible(e, i, s) {
    if (this.xAxis) {
      this.xAxis.node.active = e;
    }

    if (this.yAxis) {
      this.yAxis.node.active = i;
    }

    if (this.zAxis) {
      this.zAxis.node.active = s;
    }

    this.updateAxisLineTransform();
    cce.Engine.repaintInEditMode();
  }
}
exports.default = OriginAxisController;
