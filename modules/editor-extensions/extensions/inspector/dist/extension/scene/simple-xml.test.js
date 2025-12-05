"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.SimpleXMLLabelInspectorComponent=void 0;const adapter_1=require("../adapter");class SimpleXMLLabelInspectorComponent extends adapter_1.SimpleXMLInspectorComponent{render(e){return`
<vbox>
    <line></line>
    <label text="SimpleJSON Pasrser"></label>
    <prop properties.visible="${"test"!==e.string}" bind="customMaterial"></prop>
    <prop properties.readonly="${"test"===e.string}" bind="color"></prop>
    <prop bind="string"></prop>
    <prop bind="horizontalAlign"></prop>
    <prop bind="overflow"></prop>
    <prop label="Test Button">
        <button label="Test" click="onTestButtonClick"></button>
    </prop>
</vbox>
        `}onTestButtonClick(e,o){console.log("SimpleXML Test Click")}}exports.SimpleXMLLabelInspectorComponent=SimpleXMLLabelInspectorComponent;