Object.defineProperty(exports, "__esModule", { value: true });
exports.IPCChannel = undefined;
exports.DataStorage = undefined;
exports.encodeArgs = encodeArgs;
exports.decodeArgs = decodeArgs;
class DataStorage {
  _id = 0;
  _map = {};
  add(e) {
    var n = this._id++;
    this._map[n] = e;
    return n;
  }
  remove(e) {
    delete this._map[e];
  }
  get(e) {
    return (e !== undefined && this._map[e]) || null;
  }
}
function encodeArgs(e) {
  return e instanceof Buffer ||
    e === undefined ||
    e instanceof Float32Array ||
    e instanceof Float64Array ||
    e instanceof Int8Array ||
    e instanceof Int16Array ||
    e instanceof Int32Array ||
    e instanceof Uint8ClampedArray ||
    e instanceof Uint16Array ||
    e instanceof Uint8Array ||
    e instanceof Uint32Array
    ? e
    : JSON.stringify(e);
}
function decodeArgs(e) {
  return e instanceof Buffer ||
    e === undefined ||
    e instanceof Float32Array ||
    e instanceof Float64Array ||
    e instanceof Int8Array ||
    e instanceof Int16Array ||
    e instanceof Int32Array ||
    e instanceof Uint8ClampedArray ||
    e instanceof Uint8Array ||
    e instanceof Uint16Array ||
    e instanceof Uint32Array
    ? e
    : JSON.parse(e);
}
var IPCChannel;
exports.DataStorage = DataStorage;

((e) => {
  e.PreviewSend = "preview:send";
  e.PreviewReply = "preview:reply";
  e.SceneWebSend = "scene-web:send";
  e.SceneWebReply = "scene-web:reply";
  e.NativeSend = "native:send";
  e.NativeReply = "native:reply";
})(IPCChannel || (exports.IPCChannel = IPCChannel = {}));
