Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;

const { basename } = require("path");

const {
  checkPackageNameValidity,
  executableNameOrDefault,
} = require("./utils");

const astcTypes = [
  "astc_4x4",
  "astc_5x5",
  "astc_6x6",
  "astc_8x8",
  "astc_10x5",
  "astc_10x10",
  "astc_12x12",
];

exports.configs = {
  mac: {
    platformName: "Mac",
    platformType: "MAC",
    doc: "editor/publish/mac/build-example-mac.html",
    verifyRuleMap: {
      packageName: {
        func: (e) => !!checkPackageNameValidity(e),
        message: "i18n:mac.error.packageNameRuleMessage",
      },
      targetVersion: {
        func: (e) => !!/^\d+(\.\d+){1,2}$/.test(e),
        message: "i18n:mac.error.targetVersionError",
      },
      executableName: {
        func: (e) => /^[0-9a-zA-Z_-]*$/.test(e),
        message: "Invalid executable name specified",
      },
    },
    commonOptions: {
      polyfills: { hidden: true },
      useBuiltinServer: { hidden: false },
      nativeCodeBundleMode: { default: "wasm" },
    },
    options: {
      executableName: {
        label: "i18n:mac.options.executable_name",
        default: "",
        render: {
          ui: "ui-input",
          attributes: {
            placeholder: executableNameOrDefault(basename(Editor.Project.name)),
          },
        },
        verifyRules: ["executableName"],
      },
      packageName: {
        label: "i18n:mac.options.package_name",
        description: "i18n:mac.options.package_name_hint",
        render: {
          ui: "ui-input",
          attributes: { placeholder: "com.cocos.mac" },
        },
        verifyRules: ["packageName", "required"],
        default: "",
      },
      renderBackEnd: {
        label: "i18n:mac.options.render_back_end",
        type: "object",
        default: { metal: true },
      },
      targetVersion: {
        label: "i18n:mac.options.targetVersion",
        default: "10.14",
        render: {
          ui: "ui-input",
          attributes: { placeholder: "i18n:mac.options.targetVersionDefault" },
        },
        verifyRules: ["required", "targetVersion"],
      },
      supportM1: {
        label: "Support Apple Silicon",
        description: "Support Apple Silicon",
        default: false,
        render: { ui: "ui-checkbox" },
      },
      skipUpdateXcodeProject: {
        label: "i18n:mac.options.skipUpdateXcodeProject",
        default: false,
        render: { ui: "ui-checkbox" },
      },
    },
    hooks: "./hooks",
    panel: "./view",
  },
};
