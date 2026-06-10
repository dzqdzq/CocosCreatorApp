Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;

const {
  getOriginalAnimationLibraryPath,
} = require("./handler/assets/gltf/original-animation");

exports.methods = {
  async inspectorDropScript(e, t) {
    var r = await Editor.Message.request("scene", "query-script-cid", e.value);
    if (r) {
      for (const s of t) {
        await Editor.Message.request("scene", "create-component", {
          uuid: s.uuid.value,
          component: r,
        });
      }
    }
  },
  async onInspectorDropAssetOntoNode(e, t) {
    var e_value = e.value;
    for (const a of t) {
      var s = a.uuid.value;
      await Editor.Message.request("scene", "execute-scene-script", {
        name: "engine-extends",
        method: "createComponentFromAsset",
        args: [s, [e_value]],
      });
    }
  },
  async refreshAllEffect() {
    await Editor.Message.request("asset-db", "execute-script", {
      name: "engine-extends",
      method: "refreshAllEffect",
    });
  },
  async getOriginalAnimationLibraryPath(e) {
    return getOriginalAnimationLibraryPath(e);
  },
};
