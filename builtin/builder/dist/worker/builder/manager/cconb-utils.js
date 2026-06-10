Object.defineProperty(exports, "__esModule", { value: true });
exports.transformCCON = transformCCON;

const { decodeCCONBinary } = require("cc/editor/serialization");

const { readFile } = require("fs-extra");

async function transformCCON(e) {
  e = await readFile(e);
  e = new Uint8Array(e.buffer, e.byteOffset, e.byteLength);
  return decodeCCONBinary(e);
}
