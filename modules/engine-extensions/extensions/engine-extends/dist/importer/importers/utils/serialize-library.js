Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeForLibrary = undefined;
const cc_1 = require("cc");
const serialization_1 = require("cc/editor/serialization");
function serializeForLibrary(e) {
  let i = false;
  var r = {};

  var e =
    (isDirectInstanceOf(e, cc_1.AnimationClip) === true &&
      ((i = false),
      (r._exporting = false),
      (r.dontStripDefault = false),
      (r.useCCON = true)),
    (i ? EditorExtends.serializeCompiled : EditorExtends.serialize)(e, r));

  return e instanceof serialization_1.CCON
    ? { data: serialization_1.encodeCCONBinary(e), extension: ".cconb" }
    : { data: e, extension: ".json" };
}
function isDirectInstanceOf(e, i) {
  return e && Object.getPrototypeOf(e) === i.prototype;
}
exports.serializeForLibrary = serializeForLibrary;
