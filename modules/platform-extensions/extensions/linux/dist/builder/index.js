Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;

exports.configs = {
  linux: {
    platformName: "Linux",
    platformType: "LINUX",
    hooks: "./hook",
    options: {
      renderBackEnd: {
        label: "Render BackEnd",
        default: { vulkan: false, gles3: true, gles2: true },
      },
    },
    commonOptions: { nativeCodeBundleMode: { default: "wasm" } },
  },
};
