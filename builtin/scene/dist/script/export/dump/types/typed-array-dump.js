Object.defineProperty(exports, "__esModule", { value: true });
exports.typedArrayDump = undefined;
class TypedArrayDump {
  encode(a, r, n) {
    if (a instanceof BigInt64Array) {
      r.value = new BigInt64Array(a);
    } else if (a instanceof BigUint64Array) {
      r.value = new BigUint64Array(a);
    } else if (a instanceof Float32Array) {
      r.value = new Float32Array(a);
    } else if (a instanceof Float64Array) {
      r.value = new Float64Array(a);
    } else if (a instanceof Int8Array) {
      r.value = new Int8Array(a);
    } else if (a instanceof Int16Array) {
      r.value = new Int16Array(a);
    } else if (a instanceof Int32Array) {
      r.value = new Int32Array(a);
    } else if (a instanceof Uint8Array) {
      r.value = new Uint8Array(a);
    } else if (a instanceof Uint8ClampedArray) {
      r.value = new Uint8ClampedArray(a);
    } else if (a instanceof Uint16Array) {
      r.value = new Uint16Array(a);
    } else if (a instanceof Uint32Array) {
      r.value = new Uint32Array(a);
    }
  }
  decode(a, r, n, e) {
    if (BigInt64Array && n.value instanceof BigInt64Array) {
      a[r.key] = new BigInt64Array(n.value);
    } else if (BigUint64Array && n.value instanceof BigUint64Array) {
      a[r.key] = new BigUint64Array(n.value);
    } else if (Float32Array && n.value instanceof Float32Array) {
      a[r.key] = new Float32Array(n.value);
    } else if (Float64Array && n.value instanceof Float64Array) {
      a[r.key] = new Float64Array(n.value);
    } else if (Int8Array && n.value instanceof Int8Array) {
      a[r.key] = new Int8Array(n.value);
    } else if (Int16Array && n.value instanceof Int16Array) {
      a[r.key] = new Int16Array(n.value);
    } else if (Int32Array && n.value instanceof Int32Array) {
      a[r.key] = new Int32Array(n.value);
    } else if (Uint8Array && n.value instanceof Uint8Array) {
      a[r.key] = new Uint8Array(n.value);
    } else if (Uint8ClampedArray && n.value instanceof Uint8ClampedArray) {
      a[r.key] = new Uint8ClampedArray(n.value);
    } else if (Uint16Array && n.value instanceof Uint16Array) {
      a[r.key] = new Uint16Array(n.value);
    } else if (Uint32Array && n.value instanceof Uint32Array) {
      a[r.key] = new Uint32Array(n.value);
    }
  }
}
exports.typedArrayDump = new TypedArrayDump();
