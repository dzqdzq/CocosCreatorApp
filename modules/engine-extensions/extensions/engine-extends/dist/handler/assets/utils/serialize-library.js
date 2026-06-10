Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeForLibrary = serializeForLibrary;
const cc_1 = require("cc");
const serialization_1 = require("cc/editor/serialization");

const { encodeCCONBinary } = serialization_1;

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
    ? { data: encodeCCONBinary(e), extension: ".bin" }
    : { data: e, extension: ".json" };
}
function isDirectInstanceOf(e, i) {
  return e && Object.getPrototypeOf(e) === i.prototype;
}
