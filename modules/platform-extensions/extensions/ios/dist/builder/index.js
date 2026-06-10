Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;

const {
  checkPackageNameValidity,
  executableNameOrDefault,
} = require("./utils");

const { basename } = require("path");

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
  ios: {
    platformName: "iOS",
    platformType: "IOS",
    doc: "editor/publish/ios/build-example-ios.html",
    verifyRuleMap: {
      packageName: {
        func: (e, t) => !!checkPackageNameValidity(e),
        message: "i18n:ios.tips.packageNameRuleMessage",
      },
      executableName: {
        func: (e) => /^[0-9a-zA-Z_-]*$/.test(e),
        message: "Invalid executable name specified",
      },
    },
    commonOptions: {
      polyfills: { hidden: true },
      useBuiltinServer: { hidden: false },
      useSplashScreen: { render: { ui: "", attributes: { disabled: true } } },
    },
    options: {
      executableName: {
        label: "i18n:ios.options.executable_name",
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
        label: "i18n:ios.options.package_name",
        description: "i18n:ios.options.package_name_hint",
        render: {
          ui: "ui-input",
          attributes: { placeholder: "com.cocos.ios" },
        },
        verifyRules: ["required", "packageName"],
        default: "",
      },
      renderBackEnd: {
        label: "i18n:ios.options.render_back_end",
        type: "object",
        default: { metal: true },
      },
      skipUpdateXcodeProject: {
        label: "i18n:ios.options.skipUpdateXcodeProject",
        default: false,
        render: { ui: "ui-checkbox" },
      },
      orientation: {
        default: {
          portrait: false,
          upsideDown: false,
          landscapeRight: true,
          landscapeLeft: true,
        },
      },
      osTarget: { default: { iphoneos: false, simulator: true } },
      targetVersion: { default: "12.0" },
    },
    hooks: "./hooks",
    textureCompressConfig: {
      platformType: "ios",
      support: {
        rgb: [
          "pvrtc_4bits_rgb",
          "pvrtc_2bits_rgb",
          "etc2_rgb",
          "etc1_rgb",
          ...astcTypes,
        ],
        rgba: [
          "pvrtc_4bits_rgb_a",
          "pvrtc_4bits_rgba",
          "pvrtc_2bits_rgb_a",
          "pvrtc_2bits_rgba",
          "etc2_rgba",
          "etc1_rgb_a",
          ...astcTypes,
        ],
      },
    },
    panel: "./view",
  },
};
