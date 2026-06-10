Object.defineProperty(exports, "__esModule", { value: true });
exports.InspectorMap = undefined;
exports.register = register;
exports.queryVirtualElement = queryVirtualElement;
exports.emitVirtualEvent = emitVirtualEvent;
const cc_1 = require("cc");
const element_1 = require("../element");

const { serialize } = element_1;

const map = new WeakMap();
function register(e, t) {
  exports.InspectorMap[e] = exports.InspectorMap[e] || [];
  exports.InspectorMap[e].push(t);
}
function queryVirtualElement(r) {
  var e = cc_1.js.getClassName(r) || "";
  if (exports.InspectorMap[e]) {
    e = exports.InspectorMap[e];
    const s = new element_1.VirtualElement("inspector-root");
    const p = map.get(r) || [];

    e.forEach((e, t) => {
      e = e.decode(r, p[t]);
      p[t] = e;
      s.appendChild(e);
    });

    map.set(r, p);
    return serialize(s);
  }
}
function emitVirtualEvent(e, t, r, s) {
  var p = map.get(e);
  if (p) {
    for (const o of p) {
      var n = o.queryChildByID(t);

      if (n) {
        n.attrs = JSON.parse(JSON.stringify(s));
        n.dispatch(r, e, n);
      }
    }
  }
}
exports.InspectorMap = {};
