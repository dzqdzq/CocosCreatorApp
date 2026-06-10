var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils3D = undefined;
const utils_interface_1 = __importDefault(require("./utils-interface"));
const operation_1 = __importDefault(require("../../operation"));
const selection_1 = __importDefault(require("../../selection"));
const message_1 = require("../../../3d/manager/message");
class Utils3D extends utils_interface_1.default {
  constructor() {
    super();
    this.baseDist = 600;
  }
  requestPointerLock() {
    operation_1.default.requestPointerLock();
  }
  exitPointerLock() {
    operation_1.default.exitPointerLock();
  }
  emitNodeMessage(e, ...t) {
    cce.Node.emit(e, ...t);
  }
  broadcastMessage(e, ...t) {
    message_1.messageManager.broadcast(e, ...t);
  }
  onNodeChanged(e, ...t) {
    cce.Node.emit("change", e, ...t);
  }
  repaintEngine() {
    cce.Engine?.repaintInEditMode();
  }
  recordChanges(e) {
    return cce.SceneFacadeManager.beginRecording(e);
  }
  commitChanges(e) {
    cce.SceneFacadeManager.endRecording(e);
  }
  select(e) {
    selection_1.default.clear();
    selection_1.default.select(e);
  }
  changePointer(e) {
    operation_1.default.changePointer(e);
  }
}
exports.Utils3D = Utils3D;
exports.default = new Utils3D();
