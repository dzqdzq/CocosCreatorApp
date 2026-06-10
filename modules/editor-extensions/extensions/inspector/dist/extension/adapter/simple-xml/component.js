Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleXMLInspectorComponent = undefined;
const element_1 = require("../../element");

const { decode } = require("./parser");

class SimpleXMLInspectorComponent {
  render(e) {
    return "<vbox></vbox>";
  }
  decode(s, e) {
    var t = this.render(s);
    e = e || new element_1.VirtualElement("inspector-root");
    var r = new WeakMap();
    decode(t, e, r);
    const i = s.node.components.indexOf(s);

    const c = (e) => {
      if (e.tag === "inspector-prop" && e.attrs.bind) {
        var t = cc.Class.attr(s, e.attrs.bind);
        if (e.attrs.properties) {
          var r = JSON.parse(e.attrs.properties);
          for (const o in r) {
            t[o] = r[o];
          }
        }
        var n = cce.Dump.encode.encodeObject(
          s[e.attrs.bind],
          t,
          s,
          e.attrs.bind
        );
        n.name = e.attrs.bind;
        n.path = `__comps__.${i}.` + e.attrs.bind;
        n.nodeUUID = s.node.uuid;
        e.setAttribute("dump", JSON.stringify(n));
      }

      if (e.tag === "ui-button" && e.attrs.click) {
        e.addEventListener("click", this[e.attrs.click]);
        delete e.attrs.click;
      }

      e.children.forEach(c);
    };

    c(e);
    return e;
  }
}
function isMethod(e, t) {
  return e in t;
}
exports.SimpleXMLInspectorComponent = SimpleXMLInspectorComponent;
