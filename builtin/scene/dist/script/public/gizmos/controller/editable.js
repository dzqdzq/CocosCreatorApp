var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const base_1 = __importDefault(require("./base"));
const controller_utils_1 = __importDefault(
  require("../utils/controller-utils")
);
const engine_1 = __importDefault(require("../utils/engine"));
const external_1 = __importDefault(require("../utils/external"));
const config_1 = __importDefault(require("../utils/config"));
const { create3DNode, setMeshColor } = engine_1.default;
const EditorCamera = external_1.default.EditorCamera;
const tempVec3 = new cc_1.Vec3();
const tempQuat_a = new cc_1.Quat();
class EditableController extends base_1.default {
  _editable = false;
  _edit = false;
  _editHandlesShape = null;
  _defaultEditHandleSize = 7;
  _hoverColor = cc_1.Color.GREEN;
  _editHandleScales = {};
  _editHandleColor = cc_1.Color.WHITE;
  _editHandleKeys = [];
  constructor(e) {
    super(e);

    EditorCamera.camera.node.on(
      cc_1.Node.EventType.TRANSFORM_CHANGED,
      this.onEditorCameraMoved,
      this
    );
  }
  get editable() {
    return this._editable;
  }
  set editable(e) {
    this._editable = e;
  }
  get edit() {
    return this._edit;
  }
  set edit(e) {
    if (this._editable) {
      this._edit = e;

      this._edit === true
        ? (this.initEditHandles(), this.showEditHandles())
        : this.hideEditHandles();
    }
  }
  get hoverColor() {
    return this._hoverColor;
  }
  set hoverColor(e) {
    this._hoverColor = e;
  }
  createEditHandleShape() {
    this._editHandlesShape = create3DNode("EditControllerShape");
    this._editHandlesShape.parent = this._rootNode;
    this._editHandlesShape.setPosition(this.getPosition());
    this._editHandlesShape.setRotation(this.getRotation());
    this.registerEvents();
  }
  setRoot(e) {
    super.setRoot(e);

    if (this._editHandlesShape) {
      this._editHandlesShape.parent = this._rootNode;
    }
  }
  setEditHandlesColor(i) {
    if (this.editable && this._editHandlesShape) {
      this._editHandleKeys.forEach((e) => {
        e = this._handleDataMap[e];
        if (e) {
          const t = [];

          e.rendererNodes.forEach((e) => {
            setMeshColor(e, i);
            t.push(i);
          });

          e.oriColors = t;
        }
      });
    }

    this._editHandleColor = i;
  }
  showEditHandles() {
    if (this._editHandlesShape) {
      this._editHandlesShape.active = true;
    }
  }
  hideEditHandles() {
    if (this._editHandlesShape) {
      this._editHandlesShape.active = false;
    }
  }
  createEditHandle(e, t) {
    var i = this._defaultEditHandleSize;

    var i = controller_utils_1.default.quad(
      new cc_1.Vec3(),
      i,
      i,
      new cc_1.Vec3(0, 0, 1),
      t,
      { unlit: true, priority: 255 }
    );

    i.name = e;
    i.parent = this._editHandlesShape;
    this._editHandleScales[e] = 1;
    var t = this.initHandle(i, e);

    return t;
  }
  initEditHandles() {
    if (!this._editHandlesShape) {
      this.createEditHandleShape();

      this._editHandleKeys.forEach((e) => {
        this.createEditHandle(e, this._editHandleColor);
        this._updateEditHandle(e);
      });

      this.onInitEditHandles?.();
    }
  }
  _updateEditHandle(e) {}
  updateEditHandles() {
    this._editHandleKeys.forEach((e) => {
      this._updateEditHandle(e);
    });
  }
  checkEdit() {
    if (this.editable && config_1.default.toolsVisibility3d) {
      this.edit = true;
    } else {
      this.hideEditHandles();
    }
  }
  onHoverIn(e) {
    this.setHandleColor(e.handleName, this.hoverColor);
  }
  onHoverOut(e) {
    this.resetHandleColor(e);
  }
  onEditorCameraMoved() {
    this.adjustEditHandlesSize();
  }
  adjustControllerSize() {
    super.adjustControllerSize();
    this.adjustEditHandlesSize();
  }
  adjustEditHandlesSize() {
    if (this.edit) {
      this._editHandleKeys.forEach((e) => {
        var t;
        var i = this._handleDataMap[e];

        if (i) {
          (i = i.topNode).getWorldPosition(tempVec3);
          t = this.getDistScalar(i);
          i.getPosition(tempVec3);
          this._editHandleScales[e] = t;
          i.setWorldScale(t, t, t);
          e = tempQuat_a;
          EditorCamera.camera.node.getWorldRotation(e);
          i.setWorldRotation(e);
        }
      });
    }
  }
  setPosition(e) {
    super.setPosition(e);

    if (this._editHandlesShape) {
      this._editHandlesShape.setPosition(e);
    }
  }
  setRotation(e) {
    super.setRotation(e);

    if (this._editHandlesShape) {
      this._editHandlesShape.setRotation(e);
    }
  }
  onShow() {
    if (this._editHandlesShape) {
      this.registerEvents();
      this._editHandlesShape.active = true;
    }
  }
  onHide() {
    this.unregisterEvents();

    if (this._editHandlesShape) {
      this._editHandlesShape.active = false;
    }
  }
}
exports.default = EditableController;
