Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
const drag_asset_onto_node_handler_registry_1 = require("./drag-asset-onto-node-handler-registry");

const { loadAssetUncached } = require("./utils/load-asset");

exports.methods = {
  async createComponentFromAsset(e, t) {
    var r = cce.Node.query(e);
    if (r) {
      let o = false;
      for (const a of t) {
        let e;
        try {
          e = await loadAssetUncached(a);
        } catch (e) {
          console.error("Can not load asset " + a);
          continue;
        }
        var e_constructor = e.constructor;

        var e_constructor =
          drag_asset_onto_node_handler_registry_1.dragAssetOntoNodeHandlerRegistry.get(
            e_constructor
          );

        if (e_constructor) {
          o = o || (await e_constructor.call(e, r));
        }
      }

      if (o) {
        cce.Node.emit("change", r);
      }
    } else {
      console.error("Can not find node " + e);
    }
  },
};
