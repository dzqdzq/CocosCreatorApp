var CameraMoveMode;

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.CameraUtils = undefined;
exports.CameraMoveMode = undefined;
const cc_1 = require("cc");

const editor_camera_components_1 = __importDefault(
  require("./editor-camera-components")
);

const htmls_1 = require("./htmls");

const { showCameraShortcutTip, hideCameraShortcutTip } = htmls_1;

const _maxTicks = 100;
const vbMap = new Map();
const ibMap = new Map();
class Utils {
  showSnapTip() {
    showCameraShortcutTip({
      type: htmls_1.CameraShortcutUIType.Snap,
      duration: 5000 /* 5e3 */,
    });
  }
  hideSnapTip() {
    hideCameraShortcutTip(htmls_1.CameraShortcutUIType.Snap);
  }
  showCameraMoveTip() {
    showCameraShortcutTip({
      type: htmls_1.CameraShortcutUIType.WanderShortcut,
      duration: 5000 /* 5e3 */,
    });
  }
  hideCameraMoveTip() {
    hideCameraShortcutTip(htmls_1.CameraShortcutUIType.WanderShortcut);
  }
  showCameraWanderSpeed(e, t) {
    Editor.UI.toast({
      id: "camera-wander-speed",
      message: `${e.toFixed(2)}x (${t.toFixed(2)})`,
      duration: 500,
      customStyle: {
        background: "rgba(0, 0, 0, 0.3)",
        width: "200px",
        height: "100px",
        fontSize: "26px",
        top: "60%",
        color: "rgba(255, 255, 255, 0.9)",
        borderRadius: "10px",
        border: "0px",
      },
    });
  }
  updateVBAttr(r, a, s) {
    r = r && r.model && r.model.subModels[0];
    if (r && r.inputAssembler && r.subMesh) {
      var { inputAssembler: r, subMesh } = r;
      var c = vbMap.get(subMesh);
      if (c) {
        let e = 0;
        let t = cc_1.gfx.Format.UNKNOWN;
        for (const i of r.attributes) {
          if (i.name === a) {
            t = i.format;
            break;
          }
          e += cc_1.gfx.FormatInfos[i.format].size;
        }
        r = r.vertexBuffers[0];

        if (
          t &&
          r &&
          (cc_1.utils.writeBuffer(new DataView(c), s, t, e, r.stride),
          r.update(c, r.stride * r.count),
          subMesh.geometricInfo)
        ) {
          subMesh.geometricInfo.positions.set(s);
        }
      } else {
        console.error(subMesh, c);
      }
    }
  }
  updateIB(e, t) {
    var r;
    var a;
    var s;
    var o;
    var e = e && e.model && e.model.subModels[0];

    if (e && e.inputAssembler && e.subMesh) {
      ({ inputAssembler: e, subMesh: r } = e);

      (a = ibMap.get(r))
        ? ((o = e.indexCount),
          (s = e.indexBuffer),
          o &&
            s &&
            ((o = cc_1.gfx.Format[`R${8 * s.stride}UI`]),
            cc_1.utils.writeBuffer(new DataView(a), t, o),
            s.update(a, s.stride * s.count),
            (e.indexCount = t.length)))
        : console.error(r, a);
    }
  }
  grid(e, t, r, a) {
    const o = [];
    const c = [];
    const i = [];
    var s = 0.5 * e;
    var n = 0.5 * t;
    var u = e / r;
    var d = t / a;
    var e = cc.v3(-s, -0.1, -n);
    var r = cc.v3(s, 0.1, n);
    function m(e, t, r, a) {
      var s = o.length / 3;

      if (e === r) {
        o.push(e + 0.01, 0, t);
        c.push(1, 0);
        o.push(e - 0.01, 0, t);
        c.push(0, 0);
        o.push(e + 0.01, 0, a);
        c.push(1, 0);
        o.push(e - 0.01, 0, a);
        c.push(0, 0);
      } else {
        o.push(e, 0, t - 0.01);
        c.push(0, 1);
        o.push(e, 0, t + 0.01);
        c.push(1, 1);
        o.push(r, 0, t - 0.01);
        c.push(0, 1);
        o.push(r, 0, t + 0.01);
        c.push(1, 1);
      }

      i.push(s, 1 + s, 2 + s, 2 + s, 1 + s, 3 + s);
    }
    for (let e = -s; e <= s; e += u) {
      m(e, -n, e, n);
    }
    for (let e = -n; e <= n; e += d) {
      m(-s, e, s, e);
    }
    return { positions: o, uvs: c, indices: i, minPos: e, maxPos: r };
  }
  createStrokeGrid(e, t) {
    var r = new cc.Node("Editor Grid");

    var r =
      ((r.layer = cc.Layers.Enum.EDITOR | cc.Layers.Enum.IGNORE_RAYCAST),
      (r.parent = cce.backgroundNode),
      r.addComponent(cc_1.MeshRenderer));

    r.mesh = cc_1.utils.createMesh(this.grid(e, t, e, t));
    const a = r.onEnable.bind(r);
    r.onEnable = () => {
      a();
    };
    e = new cc.Material();
    e.initialize({ effectName: "internal/editor/grid-stroke" });
    r.material = e;
    return r;
  }
  createGrid(e) {
    var t = new cc.Node(e);

    var t =
      ((t.layer = cc.Layers.Enum.EDITOR | cc.Layers.Enum.IGNORE_RAYCAST),
      (t.parent = cce.backgroundNode),
      t.setWorldPosition(cc.v3(0, 0, 0)),
      t.addComponent(cc_1.MeshRenderer));

    const r = t.onEnable.bind(t);
    t.onEnable = () => {
      r();
    };
    var a = [];
    var s = [];
    var o = [];
    for (let e = 0; e < _maxTicks * _maxTicks; e++) {
      a.push(0, 0);
      s.push(1, 1, 1, 1);
    }
    for (let e = 0; e < a.length; e += 2) {
      o.push(e / 2);
    }
    var c = cc_1.gfx.PrimitiveMode.LINE_LIST;

    var i = [
      {
        name: cc_1.gfx.AttributeName.ATTR_POSITION,
        format: cc_1.gfx.Format.RG32F,
      },
    ];

    var i = cc.utils.createMesh({
      positions: a,
      indices: o,
      colors: s,
      primitiveMode: c,
      attributes: i,
    });

    var n = i.renderingSubMeshes[0];
    var u = i.struct.vertexBundles[0].view;
    var u = i.data.buffer.slice(u.offset, u.offset + u.length);
    var u = (vbMap.set(n, u), i.struct.primitives[0].indexView);
    var u = i.data.buffer.slice(u.offset, u.offset + u.length);
    var n = (ibMap.set(n, u), (t.mesh = i), new cc.Material());
    n.initialize({ effectName: e, states: { primitive: c } });
    t.material = n;
    return t;
  }
  createCamera(e) {
    var t = new cc.Node("Editor Camera");

    var t =
      ((t.layer = cc.Layers.Enum.EDITOR),
      (t.parent = cce.backgroundNode),
      t.addComponent(editor_camera_components_1.default));

    t.clearFlags = cc_1.Camera.ClearFlag.SKYBOX | cc_1.gfx.ClearFlagBit.COLOR;
    t.clearColor = e;

    t.visibility = cc_1.Layers.makeMaskExclude([
      cc_1.Layers.BitMask.PROFILER,
      cc_1.Layers.Enum.GIZMOS,
      cc_1.Layers.Enum.SCENE_GIZMO,
    ]);

    t.far = 100000 /* 1e5 */;
    t.near = 0.1;
    return t;
  }
  queryLightNodes(t) {
    const r = [];

    cce.Node.queryUuids().forEach((e) => {
      e = cce.Node.query(e);

      if (e && !t.includes(e) && e.getComponent(cc_1.Light)) {
        r.push(e);
      }
    });

    return r;
  }
  isSceneHasActiveLight(t) {
    let r = false;
    const a = [];

    t.forEach((e) => {
      var t;

      if (e.active) {
        if ((t = e.getComponent(cc_1.Light))) {
          if (t.enabled === true) {
            r = true;
          }
        } else {
          a.push(e);
        }
      }
    });

    a.forEach((e) => {
      e = t.indexOf(e);
      t.splice(e, 1);
    });

    return r;
  }
  queryComponent(t) {
    const r = [];

    cce.Node.queryUuids().forEach((e) => {
      var e = cce.Node.query(e);

      if (e && (e = e.getComponent(t))) {
        r.push(e);
      }
    });

    return r;
  }
}
!((e) => {
  e[(e.IDLE = 0)] = "IDLE";
  e[(e.ORBIT = 1)] = "ORBIT";
  e[(e.PAN = 2)] = "PAN";
  e[(e.ZOOM = 3)] = "ZOOM";
  e[(e.WANDER = 4)] = "WANDER";
})(CameraMoveMode || (exports.CameraMoveMode = CameraMoveMode = {}));
const CameraUtils = new Utils();
exports.CameraUtils = CameraUtils;
