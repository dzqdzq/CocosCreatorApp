Object.defineProperty(exports, "__esModule", { value: true });
exports.types = undefined;
exports.getTypeId = getTypeId;
exports.getInheritanceChain = getInheritanceChain;
exports.getDefault = getDefault;
const cc_1 = require("cc");

const types = {
  "cc.Vec2": { properties: ["x", "y"] },
  "cc.Vec3": { properties: ["x", "y", "z"] },
  "cc.Size": { properties: ["width", "height"] },
  "cc.Color": { properties: ["r", "g", "b", "a"] },
};

function getTypeId(e) {
  if (typeof e == "object") {
    e = e.constructor;
  }

  return cc_1.js.getClassId(e);
}
function getInheritanceChain(e) {
  return cc_1.CCClass.getInheritanceChain(e)
    .map((e) => getTypeId(e))
    .filter((e) => !!e);
}
function getDefault(e) {
  if (typeof e == "function") {
    try {
      return e();
    } catch (e) {
      return void cc._throw(e);
    }
  }
  return e;
}
exports.types = types;
