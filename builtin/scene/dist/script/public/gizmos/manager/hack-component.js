var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.editorTransformWeakMap = undefined;
exports._EditorHackTransformComponent_ = undefined;
exports.editorSceneWeakMap = undefined;
exports._EditorHackSceneComponent_ = undefined;

exports.walkNodeComponent = walkNodeComponent;
const cc_1 = require("cc");
const node_1 = __importDefault(require("../../../utils/node"));
class _EditorHackSceneComponent_ extends cc_1.Component {}
exports._EditorHackSceneComponent_ = _EditorHackSceneComponent_;
exports.editorSceneWeakMap = new WeakMap();
class _EditorHackTransformComponent_ extends cc_1.Component {}
function walkNodeComponent(o, t) {
  if (o && !node_1.default.isEditorNode(o)) {
    if (o instanceof cc_1.Scene) {
      let e = exports.editorSceneWeakMap.get(o);

      if (!e) {
        e = new _EditorHackSceneComponent_();
        e.node = o;
        exports.editorTransformWeakMap.set(o, e);
      }

      t(e);
    }
    let e = exports.editorTransformWeakMap.get(o);

    if (!e) {
      e = new _EditorHackTransformComponent_();
      e.node = o;
      exports.editorTransformWeakMap.set(o, e);
    }

    t(e);

    o.components.forEach((e) => {
      t(e);
    });
  }
}
exports._EditorHackTransformComponent_ = _EditorHackTransformComponent_;
exports.editorTransformWeakMap = new WeakMap();
