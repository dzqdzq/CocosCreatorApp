var LightEditMode;
var LightProbeManagerEvent;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LightProbeManagerEvent = undefined;
exports.LightEditMode = undefined;

((e) => {
  e.NONE = "none";
  e.VERTEX = "vertex";
  e.BOX = "box";
})(LightEditMode || (exports.LightEditMode = LightEditMode = {}));

(
  LightProbeManagerEvent ||
  (exports.LightProbeManagerEvent = LightProbeManagerEvent = {})
).MODE_CHANGED = "mode-changed";
