Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleJSONLabelInspectorComponent = undefined;
const adapter_1 = require("../adapter");
class SimpleJSONLabelInspectorComponent extends adapter_1.SimpleJSONInspectorComponent {
  render(e) {
    return {
      type: "vbox",
      children: [
        { type: "line" },
        { type: "label", label: "SimpleJSON Pasrser" },
        {
          type: "prop",
          bind: "customMaterial",
          properties: { visible: e.string !== "test" },
        },
        {
          type: "prop",
          bind: "color",
          properties: { readonly: e.string === "test" },
        },
        { type: "prop", bind: "string" },
        { type: "prop", bind: "horizontalAlign" },
        { type: "prop", bind: "overflow" },
        {
          type: "prop",
          label: "Test Button",
          children: [
            { type: "button", label: "Test", click: "onTestButtonClick" },
          ],
        },
      ],
    };
  }
  onTestButtonClick(e, t) {
    console.log("SimpleJSON Test Click");
  }
}
exports.SimpleJSONLabelInspectorComponent = SimpleJSONLabelInspectorComponent;
