async function load() {
  if (!(await Editor.Profile.getConfig("utils", "features.linux"))) {
    exports.configs.linux = {};
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;
exports.load = undefined;
exports.load = load;

exports.configs = {
  linux: {
    platformName: "Linux",
    options: {
      renderBackEnd: {
        label: "Render BackEnd",
        default: { vulkan: false, gles3: true, gles2: true },
      },
    },
    assetBundleConfig: {
      supportedCompressionTypes: ["none", "merge_dep", "merge_all_json"],
    },
  },
};
