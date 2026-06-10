var AxisName;

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");

const { v3 } = cc_1;

const defines_1 = require("./defines");
const external_1 = __importDefault(require("./external"));
const controller_shape_1 = __importDefault(require("./controller-shape"));
const controller_shape_collider_1 = require("./controller-shape-collider");
const engine_1 = __importDefault(require("./engine"));
const NodeUtils = external_1.default.NodeUtils;

const {
  CullMode,
  create3DNode,
  addMeshToNode,
  setMeshColor,
  setNodeOpacity,
  createMesh,
  createDynamicMesh,
  updateDynamicMesh,
} = engine_1.default;

const EditorMath = external_1.default.EditorMath;
!((e) => {
  e.x = "x";
  e.y = "y";
  e.z = "z";
  e.neg_x = "neg_x";
  e.neg_y = "neg_y";
  e.neg_z = "neg_z";
})((AxisName = AxisName || {}));
class ControllerUtils {
  static AxisName = AxisName;
  static axisDirectionMap = {
    x: new cc_1.Vec3(1, 0, 0),
    y: new cc_1.Vec3(0, 1, 0),
    z: new cc_1.Vec3(0, 0, 1),
    neg_x: new cc_1.Vec3(-1, 0, 0),
    neg_y: new cc_1.Vec3(0, -1, 0),
    neg_z: new cc_1.Vec3(0, 0, -1),
  };
  static arrow(e, t, a, r, c = {}) {
    var n = create3DNode("arrow");
    let o = 5;

    if (c.bodyBBSize !== undefined && c.bodyBBSize !== null) {
      o = c.bodyBBSize;
    }

    var l = { noDepthTestForLines: true };

    Object.assign(l, c);

    var i = controller_shape_1.default.calcLineData(
      new cc_1.Vec3(0, 0, 0),
      new cc_1.Vec3(0, a, 0)
    );

    var i = this.createShapeByData(i, r, l);
    i.name = "ArrowLine";
    i.parent = n;
    setMeshColor(i, r);

    if (o > 0) {
      i = controller_shape_1.default.calcCylinderData(o, o, a, l);
      i = this.createShapeByData(i, r, l);
      i.name = "ArrowBody";
      i.parent = n;
      setNodeOpacity(i, 0);
      i.setPosition(new cc_1.Vec3(0, a / 2, 0));
      const s = i.addComponent(
        controller_shape_collider_1.ControllerShapeCollider
      );
      s.isDetectMesh = true;
      s.isRender = false;
    }

    l = { cullMode: CullMode.BACK };
    Object.assign(l, c);
    i = controller_shape_1.default.calcConeData(t, e);
    c = this.createShapeByData(i, r, l);
    c.parent = n;
    c.name = "ArrowHead";
    c.setPosition(new cc_1.Vec3(0, a + e / 2, 0));
    const s = c.addComponent(
      controller_shape_collider_1.ControllerShapeCollider
    );
    s.isDetectMesh = false;
    return n;
  }
  static quad(e, t, a, r = new cc_1.Vec3(0, 0, 1), c = cc_1.Color.RED, n = {}) {
    e = controller_shape_1.default.calcQuadData(e, t, a, r, n.needBoundingBox);

    t = this.createShapeByData(e, c, n);
    t.name = "Quad";
    return t;
  }
  static borderPlane(e, t, a, r) {
    var c = e / 2;
    var n = t / 2;
    const o = create3DNode("borderPlane");
    e = controller_shape_1.default.calcQuadData(new cc_1.Vec3(), e, t);
    e = this.createShapeByData(e, a, { unlit: true });
    e.name = "Plane";
    setNodeOpacity(e, r);
    e.parent = o;
    e.addComponent(
      controller_shape_collider_1.ControllerShapeCollider
    ).isDetectMesh = false;
    r = (e, t, a) => {
      e = controller_shape_1.default.calcLineData(e, t);

      t = this.createShapeByData(e, a, {
        alpha: 200,
        noDepthTestForLines: true,
      });

      t.name = "BorderLine";
      t.parent = o;
      return t;
    };
    r(new cc_1.Vec3(0, t / 2, 0), new cc_1.Vec3(c, t / 2, 0), a);
    r(new cc_1.Vec3(c, n, 0), new cc_1.Vec3(c, 0, 0), a);
    return o;
  }
  static circle(e, t, a, r) {
    e = controller_shape_1.default.calcCircleData(e, t, a);
    t = this.createShapeByData(e, r);
    t.name = "Circle";
    return t;
  }
  static torus(e, t, a, r) {
    e = controller_shape_1.default.torus(e, t, a);
    t = { cullMode: CullMode.BACK };
    a = this.createShapeByData(e, r, t);
    a.name = "Torus";
    e = a.addComponent(controller_shape_collider_1.ControllerShapeCollider);
    e.isDetectMesh = true;
    e.isRender = false;
    return a;
  }
  static cube(e, t, a, r, c, n = {}) {
    e = controller_shape_1.default.calcCubeData(e, t, a, c);
    n.cullMode ??= CullMode.BACK;
    t = this.createShapeByData(e, r, n);
    t.name = "Cube";

    t.addComponent(
      controller_shape_collider_1.ControllerShapeCollider
    ).isDetectMesh = false;

    return t;
  }
  static scaleSlider(e, t, a, r = {}) {
    var c = create3DNode("scaleSlider");
    var n = this.cube(e, e, e, a, undefined, r);

    var n =
      ((n.name = "ScaleSliderHead"),
      (n.parent = c),
      n.setPosition(0, t + e / 2, 0),
      { noDepthTestForLines: true });

    Object.assign(n, r);
    var e = controller_shape_1.default.lineWithBoundingBox(t);

    var r = this.createShapeByData(e, a, n);
    r.name = "ScaleSliderBody";
    r.parent = c;
    r.eulerAngles = new cc_1.Vec3(0, 0, 90);

    r.addComponent(
      controller_shape_collider_1.ControllerShapeCollider
    ).isDetectMesh = false;

    return c;
  }
  static getCameraDistanceFactor(e, t) {
    t = NodeUtils.getWorldPosition3D(t);
    return cc_1.Vec3.distance(e, t);
  }
  static lineTo(e, t, a = cc_1.Color.RED, r = {}) {
    e = controller_shape_1.default.calcLineData(e, t);
    t = this.createShapeByData(e, a, r);
    t.name = r.name ?? "Line";
    return t;
  }
  static createLine(e, t, a, r = cc_1.Color.RED, c = {}) {
    t = ControllerUtils.lineTo(t, a, r, c);
    t.parent = e;
    t.name = c.name ?? "Line";
    return t.getComponent(cc_1.MeshRenderer);
  }
  static disc(e, t, a, r = cc_1.Color.RED, c = {}) {
    e = controller_shape_1.default.calcDiscData(e, t, a);
    t = this.createShapeByData(e, r, c);
    t.name = "Disc";
    return t;
  }
  static sector(e, t, a, r, c, n = cc_1.Color.RED, o = {}) {
    e = controller_shape_1.default.calcSectorData(e, t, a, r, c, 60);
    t = this.createShapeByData(e, n, o);
    t.name = "Sector";
    return t;
  }
  static arc(e, t, a, r, c, n = cc_1.Color.RED, o = {}) {
    e = controller_shape_1.default.calcArcData(e, t, a, r, c);
    t = this.createShapeByData(e, n, o);
    t.name = "Arc";
    return t;
  }
  static arcDirectionLine(e, t, a, r, c, n, o, l = cc_1.Color.RED) {
    e = controller_shape_1.default.arcDirectionLine(e, t, a, r, c, n, o);
    t = this.createShapeByData(e, l);
    t.name = "ArcDirectionLine";
    return t;
  }
  static lines(e, t, a = cc_1.Color.RED, r = {}) {
    e = controller_shape_1.default.calcLinesData(e, t);
    t = this.createShapeByData(e, a, r);
    t.name = "Lines";
    return t;
  }
  static wireframeBox(e, t, a, r = {}) {
    e = controller_shape_1.default.wireframeBox(e, t);
    t = this.createShapeByData(e, a, r);
    t.name = "WireFrameBox";
    return t;
  }
  static frustum(e, t, a, r, c, n, o, l = {}) {
    e = controller_shape_1.default.calcFrustum(e, t, a, r, c, n, true);
    t = this.createShapeByData(e, o, l);
    t.name = "Frustum";
    return t;
  }
  static rectangle(e, t, a, r, c = {}) {
    e = controller_shape_1.default.calcRectangleData(e, t, a);
    t = this.createShapeByData(e, r, c);
    t.name = "Rectangle";
    return t;
  }
  static angle(e, t) {
    var a = Math.sqrt(cc_1.Vec3.lengthSqr(e) * cc_1.Vec3.lengthSqr(t));
    return a < EditorMath.EPSILON
      ? 0
      : ((e = EditorMath.clamp(cc_1.Vec3.dot(e, t) / a, -1, 1)),
        Math.acos(e) * EditorMath.R2D);
  }
  static sphere(e, t, a, r = {}, c) {
    e = controller_shape_1.default.calcSphereData(e, t, r);
    t = this.createShapeByData(e, a, r, c);
    t.name = "SphereShape";
    return t;
  }
  static octahedron(e, t, a, r, c = 0.2, n, o = {}) {
    e = controller_shape_1.default.calcOctahedronData(e, t, a, r, c);
    t = this.createShapeByData(e, n, o);
    t.name = "OctahedronShape";
    return t;
  }
  static createShapeByData(e, t, a = {}, r) {
    var c = create3DNode(a.name);
    addMeshToNode(c, createMesh(e, a), a, r);
    setMeshColor(c, t);
    return c;
  }
  static create3DNode(e) {
    return create3DNode(e);
  }
  static drawLines(e, t, a, r = cc_1.Color.RED) {
    t = controller_shape_1.default.calcLinesData(t, a);
    let c = e.getComponent(cc_1.MeshRenderer);

    if (c) {
      updateDynamicMesh(c, 0, new defines_1.DynamicMeshPrimitive(t));
    } else {
      addMeshToNode(
        e,
        createDynamicMesh(new defines_1.DynamicMeshPrimitive(t), {
          maxSubMeshes: 1,
          maxSubMeshVertices: 1024000 /* 1024e3 */,
          maxSubMeshIndices: 1024000 /* 1024e3 */,
        }),
        { depthTestForTriangles: true, priority: 127 }
      );

      c = e.getComponent(cc_1.MeshRenderer);
    }

    c?.onGeometryChanged();
    setMeshColor(e, r);
  }
  static findMinPosition(e) {
    return v3(
      Math.min(...e.map((e) => e.x)),
      Math.min(...e.map((e) => e.y)),
      Math.min(...e.map((e) => e.z))
    );
  }
  static findMaxPosition(e) {
    return v3(
      Math.max(...e.map((e) => e.x)),
      Math.max(...e.map((e) => e.y)),
      Math.max(...e.map((e) => e.z))
    );
  }
}
exports.default = ControllerUtils;
const flat = (e, t) => e.map(t).reduce((e, t) => e.concat(t), []);
