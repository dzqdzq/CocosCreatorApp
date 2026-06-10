Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;

exports.configs = {
  windows: {
    platformName: "Windows",
    options: {
      renderBackEnd: {
        label: "Render BackEnd",
        default: { vulkan: false, gles3: true, gles2: true },
      },
      targetPlatform: {
        label: "i18n:windows.targetPlatform",
        default: "x64",
        render: {
          ui: "ui-select",
          items: [
            { label: "win32", value: "win32" },
            { label: "x64", value: "x64" },
          ],
        },
      },
    },
    hooks: "./hooks",
    panel: "./view",
    assetBundleConfig: {
      supportedCompressionTypes: ["none", "merge_dep", "merge_all_json"],
    },
  },
};
