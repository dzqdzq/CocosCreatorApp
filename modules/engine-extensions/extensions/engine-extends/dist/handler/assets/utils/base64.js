function decodeBase64ToArrayBuffer(e) {
  return Uint8Array.from(atob(e), (e) => e.charCodeAt(0)).buffer;
}
function encodeArrayBufferToBase64(e) {
  return btoa(String.fromCharCode.apply(null, e));
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeBase64ToArrayBuffer = decodeBase64ToArrayBuffer;
exports.encodeArrayBufferToBase64 = encodeArrayBufferToBase64;
