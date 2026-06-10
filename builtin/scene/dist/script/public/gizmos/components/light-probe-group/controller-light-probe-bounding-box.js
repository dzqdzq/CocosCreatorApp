var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");

const { v3 } = cc_1;

const external_1 = __importDefault(require("../../utils/external"));
const box_1 = __importDefault(require("../../controller/box"));
const manager_1 = require("./manager");
const NodeUtils = external_1.default.NodeUtils;
class LightProbeBoundingBoxController extends box_1.default {
  gizmo;
  _editable = true;
  _boundingBoxScale = new cc_1.Vec3(1, 1, 1);
  _minPos = new cc_1.Vec3();
  _maxPos = new cc_1.Vec3();
  _startPos = new cc_1.Vec3();
  _editMode = false;
  get editMode() {
    return this._editMode;
  }
  _gizmoEventListenerIndex = "";
  _positionGizmo = null;
  set positionGizmo(i) {
    if (i && !i.controller) {
      i.init();
    }

    if (this.positionGizmo) {
      this.positionGizmo.removeMouseEventListener(
        this._gizmoEventListenerIndex
      );
    }

    if (i) {
      const o = [];
      const n = [];
      const s = [];

      manager_1.GizmoList.forEach((t) => {
        var e = t.boundingBoxController.getRoot();

        if (e && t.target) {
          n.push(e);
          s.push(t);
          o.push(t.target.uuid);
        }
      });

      i.nodes = n;
      const r = [];
      this._gizmoEventListenerIndex = i.addMouseEventListener(
        new (class {
          undoID = "";
          recording = false;
          onControlBegin() {
            if (!this.recording) {
              this.undoID = cce.SceneFacadeManager.beginRecording(o);
              this.recording = true;
            }
          }
          onControlEnd() {
            if (this.recording && this.undoID) {
              cce.SceneFacadeManager.endRecording(this.undoID);
              this.recording = false;
            }
          }
          onControllerMouseDown(t) {
            this.onControlBegin();
            for (let t = (r.length = 0); t < i.nodes.length; t++) {
              r.push(i.nodes[t].position.clone());
            }
          }
          onControllerMouseUp(t) {
            for (let t = 0; t < i.nodes.length; t++) {
              var e = i.nodes[t].position.subtract(r[t]);
              var o = s[t];

              if (o.target) {
                o.target.maxPos = o.target.maxPos.add(e);
                o.target.minPos = o.target.minPos.add(e);
                o.onComponentChanged(o.target.node);
              }
            }
            cce.Engine.repaintInEditMode();
            this.onControlEnd();
          }
        })()
      );
    }

    this._positionGizmo = i;
  }
  get positionGizmo() {
    return this._positionGizmo;
  }
  constructor(t, e) {
    super(t);
    this.gizmo = e;
    this.setColor(cc_1.Color.GREEN);
    this.edit = true;
  }
  show() {
    super.show();
    this.updateController();
  }
  recordStartPosition() {
    var t;

    if (this.gizmo.target) {
      this._boundingBoxScale = NodeUtils.getWorldScale3D(this._rootNode);
      t = this.getRoot();
      this._minPos.set(this.gizmo.target.minPos);
      this._maxPos.set(this.gizmo.target.maxPos);
      this._startPos.set(t.getWorldPosition());
    }
  }
  updateDataFromBBController(t) {
    var e;
    var o;

    if (this.gizmo.target && this.updated) {
      e = this.getDeltaSize().clone();
      o = this.getRoot();
      e.divide(this._boundingBoxScale);
      e.divide(v3(2, 2, 2));

      t.handleName.includes("neg")
        ? ((t = v3(this._minPos).subtract(e)), (this.gizmo.target.minPos = t))
        : ((t = v3(this._maxPos).add(e)), (this.gizmo.target.maxPos = t));

      e.divide(v3(2, 2, 2));
      o.position = this.getBoundingBoxCenter();

      this.updateSize(
        o.position,
        v3(this.gizmo.target.maxPos).subtract(this.gizmo.target.minPos)
      );

      this.positionGizmo?.onTargetUpdate();
    }
  }
  onShow() {
    var t;

    if (this.gizmo.target && (super.onShow(), (t = this.getRoot()))) {
      t.setWorldPosition(
        this.getBoundingBoxCenter().add(
          this.gizmo.target.node.getWorldPosition()
        )
      );

      this.positionGizmo?.onTargetUpdate();

      this.updateSize(
        v3(),
        v3(this.gizmo.target.maxPos).subtract(this.gizmo.target.minPos)
      );
    }
  }
  onHide() {
    super.onHide();
  }
  getBoundingBoxCenter() {
    return this.gizmo.target
      ? v3(this.gizmo.target.maxPos)
          .add(this.gizmo.target.minPos)
          .divide(v3(2, 2, 2))
      : new cc_1.Vec3();
  }
  setBoundingBoxCenter(t) {
    if (this.gizmo.target) {
      this.updateController();
    }
  }
  lightProbeEditModeChanged(t) {
    this.hide();
    cce.Engine.repaintInEditMode();
  }
  boundingBoxEditModeChanged(t) {
    if ((this._editMode = t)) {
      this.show();
    } else {
      this.hide();
    }

    cce.Engine.repaintInEditMode();
  }
}
exports.default = LightProbeBoundingBoxController;
