Object.defineProperty(exports, "__esModule", { value: true });
exports.hasCCONFormatAssetInLibrary = hasCCONFormatAssetInLibrary;
exports.getCCONFormatAssetInLibrary = getCCONFormatAssetInLibrary;
exports.getDesiredCCONExtensionMap = getDesiredCCONExtensionMap;
exports.outputCCONFormat = outputCCONFormat;

const { encodeCCONBinary } = require("cc/editor/serialization");

const { outputFile } = require("fs-extra");

function hasCCONFormatAssetInLibrary(t) {
  t = t.meta.files;
  return t.length === 1 && t[0] === ".bin";
}
function getCCONFormatAssetInLibrary(t) {
  return hasCCONFormatAssetInLibrary(t) ? t.library + ".bin" : "";
}
function getDesiredCCONExtensionMap(t) {
  return ".cconb";
}
async function outputCCONFormat(t, e) {
  await outputFile(e + ".bin", encodeCCONBinary(t));
}
