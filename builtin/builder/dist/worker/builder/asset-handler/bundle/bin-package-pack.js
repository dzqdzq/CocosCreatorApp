Object.defineProperty(exports, "__esModule", { value: true });
exports.binPackagePack = binPackagePack;
const PACK_BIN_TYPE = "BINP";
const VERSION = 2;
const UNIT_SIZE = 4;
const LITTLE_ENDIAN = true;
const FLOAT32_SIZE = 4;
function binPackagePack(e) {
  var t = genHeaderBin(e);
  var e = packBin(e);
  return packBin([t, e]);
}
function getPaddedSize(e) {
  return Math.ceil(e / FLOAT32_SIZE) * FLOAT32_SIZE;
}
function packBin(e) {
  var t = e.reduce((e, t) => e + getPaddedSize(t.byteLength), 0);
  const n = new Uint8Array(t);
  let a = 0;

  e.forEach((e) => {
    n.set(new Uint8Array(e), a);
    a += getPaddedSize(e.byteLength);
  });

  return n.buffer;
}
function genHeaderBin(e) {
  var e_length = e.length;
  var n = new ArrayBuffer(UNIT_SIZE * (3 + 2 * e_length));
  const a = new DataView(n);
  for (let e = 0; e < PACK_BIN_TYPE.length; e++) {
    a.setUint8(e, PACK_BIN_TYPE.charCodeAt(e));
  }
  a.setUint32(UNIT_SIZE, VERSION, LITTLE_ENDIAN);
  a.setUint32(2 * UNIT_SIZE, e_length, LITTLE_ENDIAN);
  let r = 0;

  e.forEach((e, t) => {
    a.setUint32(UNIT_SIZE * (3 + 2 * t), r, LITTLE_ENDIAN);
    r += getPaddedSize(e.byteLength);
    a.setUint32(UNIT_SIZE * (3 + 2 * t + 1), e.byteLength, LITTLE_ENDIAN);
  });

  return n;
}
