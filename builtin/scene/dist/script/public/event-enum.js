var NodeEventType;
var NodeOperationType;
var EventSourceType;
Object.defineProperty(exports, "__esModule", { value: true });

exports.EventSourceType = undefined;
exports.NodeOperationType = undefined;
exports.NodeEventType = undefined;

((e) => {
  e.TRANSFORM_CHANGED = "transform-changed";
  e.SIZE_CHANGED = "size-changed";
  e.ANCHOR_CHANGED = "anchor-changed";
  e.CHILD_ADDED = "child-added";
  e.CHILD_REMOVED = "child-removed";
  e.PARENT_CHANGED = "parent-changed";
  e.CHILD_CHANGED = "child-changed";
  e.COMPONENT_CHANGED = "component-changed";
  e.ACTIVE_IN_HIERARCHY_CHANGE = "active-in-hierarchy-changed";
  e.NOTIFY_NODE_CHANGED = "notify-node-changed";
  e.PREFAB_INFO_CHANGED = "prefab-info-changed";
  e.LIGHT_PROBE_CHANGED = "light-probe-changed";
})(NodeEventType || (exports.NodeEventType = NodeEventType = {}));

((e) => {
  e.SET_PROPERTY = "set-property";
  e.MOVE_ARRAY_ELEMENT = "move-array-element";
  e.REMOVE_ARRAY_ELEMENT = "remove-array-element";
  e.CREATE_COMPONENT = "create-component";
  e.RESET_COMPONENT = "reset-component";
})(NodeOperationType || (exports.NodeOperationType = NodeOperationType = {}));

((e) => {
  e.EDITOR = "editor";
  e.UNDO = "undo";
  e.ENGINE = "engine";
})(EventSourceType || (exports.EventSourceType = EventSourceType = {}));
