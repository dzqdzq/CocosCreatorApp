Object.defineProperty(exports, "__esModule", { value: true });

exports.SimpleXMLInspectorComponent = undefined;
exports.SimpleJSONInspectorComponent = undefined;
exports.ElementInspectorComponent = undefined;
exports.XMLInspectorComponent = undefined;

var component_1 = require("./xml/component");

Object.defineProperty(exports, "XMLInspectorComponent", {
  enumerable: true,
  get() {
    return component_1.XMLInspectorComponent;
  },
});

var component_2 = require("./element/component");

Object.defineProperty(exports, "ElementInspectorComponent", {
  enumerable: true,
  get() {
    return component_2.ElementInspectorComponent;
  },
});

var component_3 = require("./simple-json/component");

Object.defineProperty(exports, "SimpleJSONInspectorComponent", {
  enumerable: true,
  get() {
    return component_3.SimpleJSONInspectorComponent;
  },
});

var component_4 = require("./simple-xml/component");

Object.defineProperty(exports, "SimpleXMLInspectorComponent", {
  enumerable: true,
  get() {
    return component_4.SimpleXMLInspectorComponent;
  },
});
