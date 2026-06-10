Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementInspectorComponent = undefined;
const element_1 = require("../../element");
class ElementInspectorComponent {
  render(e) {
    return [this.createElement("label", { value: "" }, {})];
  }
  createElement(e, t, n, r) {
    const o = new element_1.VirtualElement(e);
    o.attrs = JSON.parse(JSON.stringify(t));
    for (const l in n) {
      o.addEventListener(l, n[l]);
    }

    r?.forEach((e) => o.appendChild(e));

    return o;
  }
  decode(e, t) {
    const n = new element_1.VirtualElement("inspector-root");

    this.render(e).forEach((e) => n.appendChild(e));

    if (t) {
      t.apply(n);
    } else {
      t = n;
    }

    return t;
  }
}
exports.ElementInspectorComponent = ElementInspectorComponent;
