Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;

const { basename } = require("path");

const { executableNameOrDefault } = require("./utils");

exports.configs = {
  windows: {
    platformName: "Windows",
    platformType: "WINDOWS",
    doc: "editor/publish/windows/build-example-windows.html",
    commonOptions: {
      polyfills: { hidden: true },
      useBuiltinServer: { hidden: false },
      nativeCodeBundleMode: { default: "wasm" },
    },
    verifyRuleMap: {
      executableName: {
        func: (e) => /^[0-9a-zA-Z_-]*$/.test(e),
        message: "Invalid executable name specified",
      },
    },
    options: {
      executableName: {
        label: "i18n:windows.options.executable_name",
        default: "",
        render: {
          ui: "ui-input",
          attributes: {
            placeholder: executableNameOrDefault(basename(Editor.Project.name)),
          },
        },
        verifyRules: ["executableName"],
      },
      renderBackEnd: {
        label: "Render BackEnd",
        default: { vulkan: false, gles3: true, gles2: true },
      },
      targetPlatform: {
        label: "i18n:windows.options.targetPlatform",
        default: "x64",
        render: { ui: "ui-label" },
      },
    },
    hooks: "./hooks",
    panel: "./view",
  },
};
