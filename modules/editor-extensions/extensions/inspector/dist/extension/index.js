Object.defineProperty(exports, "__esModule", { value: true });
exports.InspectorComponent = undefined;
const inspector_1 = require("./inspector");

Object.defineProperty(exports, "InspectorComponent", {
  enumerable: true,
  get() {
    return inspector_1.InspectorComponent;
  },
});

Editor.UI.register("inspector-component", inspector_1.InspectorComponent);
Editor.UI.register("inspector-prop", inspector_1.InspectorPropComponent);
