var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneSelection = undefined;
const cc_1 = require("cc");
const selection_1 = __importDefault(require("../../public/selection"));
const event_emitter_1 = require("../../utils/event-emitter");
const operation_1 = __importDefault(require("./operation"));
const scene_facade_state_interface_1 = require("../facade/scene-facade-state-interface");
function checkToSetAnimState(e) {
  const t = [];

  e.forEach((e) => {
    e = cce.Node.query(e);

    if (e) {
      t.push(e);
    }
  });

  cce.Engine.checkToSetAnimState(t);
}
class SceneSelection extends event_emitter_1.EventEmitter {
  _hover = undefined;
  _isMouseDown = false;
  onMouseDown(e) {
    return (this._isMouseDown = true);
  }
  onMouseUp(e) {
    return !(this._isMouseDown = false);
  }
  onKeyDown(e) {
    if (!this._isMouseDown && e.keyCode === cc_1.KeyCode.ESCAPE) {
      this.clear();
    }

    return true;
  }
  init() {
    selection_1.default.on("select", (e, t) => {
      var o = cce.Node.query(e);

      if (o && o._components) {
        o.components.forEach((e) => {
          if (e && e.onFocusInEditor) {
            try {
              e.onFocusInEditor();
            } catch (e) {
              console.error(e);
            }
          }
        });

        this.emit("select", e, t);
        checkToSetAnimState(selection_1.default.query());
      }
    });

    selection_1.default.on("unselect", (e, t) => {
      var o = cce.Node.query(e);

      if (o && o._components) {
        o.components.forEach((e) => {
          if (e && e.onLostFocusInEditor) {
            try {
              if (
                cce.SceneFacadeManager.getCurrentFacade().modeName !==
                scene_facade_state_interface_1.SceneModeType.Animation
              ) {
                e.onLostFocusInEditor();
              }
            } catch (e) {
              console.error(e);
            }
          }
        });

        this.emit("unselect", e, t);

        0 <= (t = (o = selection_1.default.query()).indexOf(e)) &&
          o.splice(t, 1);

        checkToSetAnimState(o);
      }
    });

    operation_1.default.on("mousedown", this.onMouseDown.bind(this));
    operation_1.default.on("mouseup", this.onMouseUp.bind(this));
    operation_1.default.on("keydown", this.onKeyDown.bind(this));
  }
  isSelect(e) {
    return selection_1.default.isSelect(e);
  }
  query() {
    return selection_1.default.query();
  }
  select(e) {
    selection_1.default.select(e);
  }
  unselect(e) {
    selection_1.default.unselect(e);
  }
  clear() {
    selection_1.default.clear();
  }
  reset() {
    selection_1.default.clear();
  }
  notice() {
    selection_1.default.notice();
  }
  _select(e) {
    selection_1.default._select(e);
  }
  _unselect(e) {
    selection_1.default._unselect(e);
  }
}
exports.SceneSelection = SceneSelection;
exports.default = new SceneSelection();
