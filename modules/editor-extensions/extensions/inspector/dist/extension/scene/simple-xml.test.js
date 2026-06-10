Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleXMLLabelInspectorComponent = undefined;
const adapter_1 = require("../adapter");
class SimpleXMLLabelInspectorComponent extends adapter_1.SimpleXMLInspectorComponent {
  render(e) {
    return `
<vbox>
    <line></line>
    <label text="SimpleJSON Pasrser"></label>
    <prop properties.visible="${
      e.string !== "test"
    }" bind="customMaterial"></prop>
    <prop properties.readonly="${e.string === "test"}" bind="color"></prop>
    <prop bind="string"></prop>
    <prop bind="horizontalAlign"></prop>
    <prop bind="overflow"></prop>
    <prop label="Test Button">
        <button label="Test" click="onTestButtonClick"></button>
    </prop>
</vbox>
        `;
  }
  onTestButtonClick(e, o) {
    console.log("SimpleXML Test Click");
  }
}
exports.SimpleXMLLabelInspectorComponent = SimpleXMLLabelInspectorComponent;
