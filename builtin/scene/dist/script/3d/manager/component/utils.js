var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const physics_2d_1 = __importDefault(require("../physics-2d"));
function getBoundingBox(e) {
  e = e.getComponent(cc_1.MeshRenderer);
  return e && e.mesh
    ? { minPosition: e.mesh.minPosition, maxPosition: e.mesh.maxPosition }
    : { minPosition: cc_1.Vec3.ZERO, maxPosition: cc_1.Vec3.ZERO };
}
function getSize(e) {
  var t = new cc_1.Vec3();
  cc_1.Vec3.subtract(t, e.maxPosition, e.minPosition);
  return t;
}
function getCenter(e) {
  var t = getSize(e);
  var c = new cc_1.Vec3();
  cc_1.Vec3.scaleAndAdd(c, e.minPosition, t, 0.5);
  return c;
}
function maxComponent(e) {
  return Math.max(e.x, Math.max(e.y, e.z));
}
class ComponentUtils {
  addComponentMap = {
    SphereCollider(e, t) {
      var c;

      if (
        !t._prefab &&
        !((c = getSize((t = getBoundingBox(t)))),
        cc_1.Vec3.strictEquals(c, cc_1.Vec3.ZERO))
      ) {
        e.radius = maxComponent(c) / 2;
        e.center = getCenter(t);
      }
    },
    BoxCollider(e, t) {
      var c;

      if (
        !t._prefab &&
        !((c = getSize((t = getBoundingBox(t)))),
        cc_1.Vec3.strictEquals(c, cc_1.Vec3.ZERO))
      ) {
        c.x = c.x === 0 ? 0.001 : c.x;
        c.y = c.y === 0 ? 0.001 : c.y;
        c.z = c.z === 0 ? 0.001 : c.z;
        e.size = c;
        e.center = getCenter(t);
      }
    },
    ConeCollider(e, t) {
      var c;
      var r;

      if (
        !t._prefab &&
        !((r = getSize((t = getBoundingBox(t)))),
        cc_1.Vec3.strictEquals(r, cc_1.Vec3.ZERO))
      ) {
        c = Math.max(r.x, r.z) / 2;
        r = r.y;
        c > 0 && (e.radius = c);
        r > 0 && (e.height = r);
        e.center = getCenter(t);
      }
    },
    CylinderCollider(e, t) {
      var c;
      var r;

      if (
        !t._prefab &&
        !((r = getSize((t = getBoundingBox(t)))),
        cc_1.Vec3.strictEquals(r, cc_1.Vec3.ZERO))
      ) {
        c = Math.max(r.x, r.z) / 2;
        r = r.y;
        c > 0 && (e.radius = c);
        r > 0 && (e.height = r);
        e.center = getCenter(t);
      }
    },
    CapsuleCollider(e, t) {
      var c;
      var r;

      if (
        !t._prefab &&
        !((r = getSize((t = getBoundingBox(t)))),
        cc_1.Vec3.strictEquals(r, cc_1.Vec3.ZERO))
      ) {
        c = Math.max(r.x, r.z) / 2;
        r = r.y - 2 * c;
        c > 0 && ((e.radius = c), (e.cylinderHeight = r > 0 ? r : 0));
        e.center = getCenter(t);
      }
    },
    MeshCollider(e, t) {
      if (!t._prefab) {
        if ((t = t.getComponent(cc_1.MeshRenderer)) && t.mesh) {
          e.mesh = t.mesh;
        }
      }
    },
    TerrainCollider(e, t) {
      if (!t._prefab) {
        if ((t = t.getComponent(cc_1.Terrain)) && t._asset) {
          e.terrain = t._asset;
        }
      }
    },
    BoxCollider2D(e, t) {
      var c;
      var r = e.getComponent(cc_1.UITransformComponent);

      if (r && (c = r.contentSize).width !== 0 && c.height !== 0) {
        e.size = cc.size(c);
        e.offset.x = (0.5 - r.anchorX) * c.width;
        e.offset.y = (0.5 - r.anchorY) * c.height;
      }
    },
    CircleCollider2D(e, t) {
      var c = e.getComponent(cc_1.UITransformComponent);

      if (
        c &&
        ((c = c.contentSize), 0 != (c = Math.max(c.width, c.height) / 2))
      ) {
        e.radius = c;
      }
    },
    PolygonCollider2D(e, t) {
      physics_2d_1.default.resetPoints(e);
    },
    Camera(e, t) {
      if (cce.SceneFacadeManager._projectType === "2d") {
        e.visibility = cc_1.Layers.makeMaskInclude([
          cc_1.Layers.Enum.UI_3D,
          cc_1.Layers.Enum.UI_2D,
        ]);

        e.projection = cc_1.Camera.ProjectionType.ORTHO;
        e.near = 0;
        e.clearFlags = cc_1.Camera.ClearFlag.DEPTH_ONLY;
      }

      if (cce.SceneFacadeManager._projectType === "3d") {
        e.visibility = cc_1.Layers.Enum.DEFAULT;
        e.projection = cc_1.Camera.ProjectionType.PERSPECTIVE;
        e.clearFlags = cc_1.Camera.ClearFlag.SKYBOX;
      }
    },
  };
}
exports.default = new ComponentUtils();
