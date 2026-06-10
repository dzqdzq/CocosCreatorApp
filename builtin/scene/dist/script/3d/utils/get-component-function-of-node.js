Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");

const excludeFunctionNames = [
  "constructor",
  "null",
  "onLoad",
  "start",
  "onEnable",
  "onDisable",
  "onDestroy",
  "update",
  "lateUpdate",
  "onFocusInEditor",
  "onLostFocusInEditor",
  "resetInEditor",
  "onRestore",
  "isRunning",
  "realDestroyInEditor",
  "getComponent",
  "getComponentInChildren",
  "getComponents",
  "getComponentsInChildren",
];

const getPropertyNames = (e) => {
  let t = [];
  let n = e;

  if (e && typeof e == "object") {
    t = Object.getOwnPropertyNames(e);
    n = e.constructor;
  }

  e = [n].concat(cc_1.CCClass.getInheritanceChain(n)).reduce((e, t) => {
    t = Object.getOwnPropertyNames(t.prototype);
    return e.concat(t);
  }, []);
  return [...new Set(t.concat(e))];
};

function getFunctions(o) {
  return getPropertyNames(o.constructor).filter((e) => {
    var t = e.startsWith("_");
    var n = excludeFunctionNames.includes(e);
    var e = !!cc_1.js.getPropertyDescriptor(o, e)?.get;
    return !(t || n || e);
  });
}
exports.default = (e) =>
  e.components.reduce((e, t) => {
    e[cc.js.getClassName(t)] = getFunctions(t);
    return e;
  }, {});
