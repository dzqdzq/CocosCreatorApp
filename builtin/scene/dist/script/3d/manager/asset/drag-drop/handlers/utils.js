var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustXY = adjustXY;
exports.screenPointToWorldPosition2D = screenPointToWorldPosition2D;
exports.screenPointToWorldPosition3D = screenPointToWorldPosition3D;
exports.setNodeEditorFlag = setNodeEditorFlag;
exports.findCanvas = findCanvas;
exports.setPositionInNode = setPositionInNode;
const cc_1 = require("cc");

const { getMainWindowSize } = require("../../../../../utils/window");

const camera_1 = __importDefault(require("../../../camera"));

const cmp = (e, o) => e.distance - o.distance;

const ray = cc_1.geometry.Ray.create();
const plane2D = cc_1.geometry.plane.create(0, 0, 1, 0);
const plane3D = cc_1.geometry.plane.create(0, 1, 0, 0);
const originPosition = new cc_1.Vec3();
const tempScenePoint = new cc_1.Vec3();
const tempPosition = new cc_1.Vec3();
const tempOffsetPosition = new cc_1.Vec3();
function adjustXY(e, o) {
  return { x: e, y: getMainWindowSize().height - o };
}
function screenPointToWorldPosition2D(e, o) {
  camera_1.default.getCamera().screenPointToRay(ray, e, o);
  e = cc_1.geometry.intersect.rayPlane(ray, plane2D);
  cc_1.Vec3.scaleAndAdd(tempPosition, ray.o, ray.d, e);
  tempPosition.z = 0;
  return tempPosition.clone();
}
function screenPointToWorldPosition3D(e, o, t, n) {
  var i = camera_1.default.getCamera();
  var n = n && n.getComponent(cc_1.MeshRenderer);
  var n = n && n.model && n.model.worldBounds;
  if (n) {
    var n_center = n.center;
    var n = n.halfExtents;
    var r = cc_1.geometry.AABB.create(
      n_center.x,
      n_center.y,
      n_center.z,
      n.x,
      n.y,
      n.z
    );
    i.screenPointToRay(ray, e, o);

    if ((r = cc_1.geometry.intersect.rayAABB(ray, r))) {
      cc_1.Vec3.scaleAndAdd(tempPosition, ray.o, ray.d, r);
      var r = 0.01;
      var c = n_center.x - n.x - r;
      var a = n_center.x + n.x + r;
      var d = n_center.y - n.y - r;
      var P = n_center.y + n.y + r;
      var l = n_center.z - n.z - r;
      var n_center = n_center.z + n.z + r;
      let e = t.worldScale.clone();
      n = t.getComponent(cc_1.MeshRenderer);
      r = n && n.model && n.model.worldBounds;

      if (n && r) {
        e = r.halfExtents.clone();
      }

      if (Math.abs(tempPosition.x - c) < 0.000001 /* 1e-6 */) {
        tempPosition.x = tempPosition.x - e.x;
      } else if (Math.abs(tempPosition.x - a) < 0.000001 /* 1e-6 */) {
        tempPosition.x = tempPosition.x + e.x;
      } else if (Math.abs(tempPosition.y - d) < 0.000001 /* 1e-6 */) {
        tempPosition.y = tempPosition.y - e.y;
      } else if (Math.abs(tempPosition.y - P) < 0.000001 /* 1e-6 */) {
        tempPosition.y = tempPosition.y + e.y;
      } else if (Math.abs(tempPosition.z - l) < 0.000001 /* 1e-6 */) {
        tempPosition.z = tempPosition.z - e.z;
      } else if (Math.abs(tempPosition.z - n_center) < 0.000001 /* 1e-6 */) {
        tempPosition.z = tempPosition.z + e.z;
      }
    }
  } else {
    i.screenPointToRay(ray, e, o);
    cc_1.Vec3.scaleAndAdd(tempPosition, ray.o, ray.d, 20);
  }
  return tempPosition.clone();
}
function setNodeEditorFlag(e) {
  if (e) {
    e.objFlags |=
      cc_1.CCObject.Flags.DontSave | cc_1.CCObject.Flags.HideInHierarchy;
  }
}
function findCanvas() {
  var e = cc_1.director.getScene();
  if (e) {
    for (const o of e.getComponentsInChildren(cc_1.Canvas)) {
      if (o.node.hideFlags === 0) {
        return o.node;
      }
    }
  }
  return null;
}
function setPositionInNode(e, o, t, n, i) {
  i = i || findCanvas();
  for (const a of t) {
    tempOffsetPosition.set(0, 0, 0);
    var s = a.position.clone();
    var r = a.getComponent(cc_1.UITransform);

    var c = !!r
      ? screenPointToWorldPosition2D(e, o)
      : screenPointToWorldPosition3D(e, o, a, n);

    if (i && r) {
      tempOffsetPosition.x = i.worldPosition.x;
      tempOffsetPosition.y = i.worldPosition.y;
      tempOffsetPosition.z = i.worldPosition.z;
    }

    cc_1.Vec3.subtract(s, c, tempOffsetPosition);
    a.position = s;
  }
}
