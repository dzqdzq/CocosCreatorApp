Object.defineProperty(exports, "__esModule", { value: true });
exports.dragAssetOntoNodeHandlerRegistry = undefined;
const animation_graph_1 = require("./drag-asset-onto-node-handlers/animation-graph");
exports.dragAssetOntoNodeHandlerRegistry = new WeakMap();

[animation_graph_1.dragAnimationGraphOntoNodeHandlerEntry].forEach(([e, r]) => {
  exports.dragAssetOntoNodeHandlerRegistry.set(e, r);
});
