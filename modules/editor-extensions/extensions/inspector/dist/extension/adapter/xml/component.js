Object.defineProperty(exports, "__esModule", { value: true });
exports.XMLInspectorComponent = undefined;
const element_1 = require("../../element");

const { decode } = require("./parser");

class XMLInspectorComponent {
  render(e) {
    return "";
  }
  decode(e, t) {
    e = this.render(e);
    t = t || new element_1.VirtualElement("inspector-root");
    decode(e, t);
    const n = (e) => {
      for (const r in e.attrs) {
        var t;

        if (r.startsWith("@")) {
          t = r.substring(1);
          e.addEventListener(t, this[e.attrs[r]]);
          delete e.attrs[r];
        }
      }
      e.children.forEach(n);
    };
    n(t);
    return t;
  }
}
exports.XMLInspectorComponent = XMLInspectorComponent;
