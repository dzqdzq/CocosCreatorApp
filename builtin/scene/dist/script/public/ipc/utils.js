Object.defineProperty(exports, "__esModule", { value: true });
exports.DataStorage = undefined;
exports.encodeArgs = encodeArgs;
exports.decodeArgs = decodeArgs;
class DataStorage {
  _id = 0;
  _map = {};
  add(n) {
    var r = this._id++;
    this._map[r] = n;
    return r;
  }
  remove(n) {
    delete this._map[n];
  }
  get(n) {
    return (n !== undefined && this._map[n]) || null;
  }
}
function encodeArgs(n) {
  return n instanceof Buffer ||
    n === undefined ||
    n instanceof Float32Array ||
    n instanceof Float64Array ||
    n instanceof Int8Array ||
    n instanceof Int16Array ||
    n instanceof Int32Array ||
    n instanceof Uint8ClampedArray ||
    n instanceof Uint16Array ||
    n instanceof Uint8Array ||
    n instanceof Uint32Array
    ? n
    : JSON.stringify(n);
}
function decodeArgs(n) {
  return n instanceof Buffer ||
    n === undefined ||
    n instanceof Float32Array ||
    n instanceof Float64Array ||
    n instanceof Int8Array ||
    n instanceof Int16Array ||
    n instanceof Int32Array ||
    n instanceof Uint8ClampedArray ||
    n instanceof Uint8Array ||
    n instanceof Uint16Array ||
    n instanceof Uint32Array
    ? n
    : JSON.parse(n);
}
exports.DataStorage = DataStorage;
