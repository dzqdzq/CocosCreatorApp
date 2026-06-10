Object.defineProperty(exports, "__esModule", { value: true });
const ipc = (isSceneNative ? require("./native/ipc") : require("./web/ipc"))
  .default;
exports.default = ipc;
