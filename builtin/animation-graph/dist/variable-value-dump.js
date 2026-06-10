Object.defineProperty(exports, "__esModule", { value: true });
exports.dumpVariableValue = dumpVariableValue;
exports.applyVariableValueDumpPatch = applyVariableValueDumpPatch;

const { getVariableValueAttributes } = require("cc/editor/new-gen-anim");

function dumpVariableValue(e) {
  var a = getVariableValueAttributes(e);
  return cce.Dump.encode.encodeObject(e.value, a);
}
async function applyVariableValueDumpPatch(e, a) {
  await cce.Dump.decode.decodePatch("value", a, e);
}
