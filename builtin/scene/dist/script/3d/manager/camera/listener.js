var __importDefault =
  (this && this.__importDefault) ||
  ((o) => (o && o.__esModule ? o : { default: o }));
Object.defineProperty(exports, "__esModule", { value: true });
const operation_1 = require("../../../public/operation");
const operation_2 = __importDefault(require("../operation"));
function bind(e) {
  operation_2.default.on(
    "dblclick",
    (o) => e.onMouseDBlDown(o),
    operation_1.OperationPriority.Camera
  );

  operation_2.default.on(
    "mousedown",
    (o) => e.onMouseDown(o),
    operation_1.OperationPriority.Camera
  );

  operation_2.default.on(
    "mousemove",
    (o) => e.onMouseMove(o),
    operation_1.OperationPriority.Camera
  );

  operation_2.default.on(
    "mouseup",
    (o) => e.onMouseUp(o),
    operation_1.OperationPriority.Camera
  );

  operation_2.default.on(
    "mousewheel",
    (o) => e.onMouseWheel(o),
    operation_1.OperationPriority.Camera
  );

  operation_2.default.on(
    "keydown",
    (o) => e.onKeyDown(o),
    operation_1.OperationPriority.Camera
  );

  operation_2.default.on(
    "keyup",
    (o) => e.onKeyUp(o),
    operation_1.OperationPriority.Camera
  );
}
exports.default = bind;
