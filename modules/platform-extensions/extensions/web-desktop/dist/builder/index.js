Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;
exports.Paths = undefined;

const { join } = require("path");

exports.Paths = {
  internalTemplateDir: join(
    __dirname,
    "../../../../../../../resources/3d/engine/templates/web-desktop"
  ),
};

exports.configs = {
  "web-desktop": {
    platformName: "i18n:web-desktop.title",
    platformType: "HTML5",
    doc: "editor/publish/publish-web.html",
    icon: { type: "image", value: "../../static/computer.png" },
    options: {
      useWebGPU: {
        label: "WEBGPU",
        default: false,
        description: "i18n:web-desktop.tips.webgpu",
        render: { ui: "ui-checkbox" },
        experiment: true,
      },
      resolution: {
        type: "object",
        label: "i18n:web-desktop.options.resolution",
        itemConfigs: {
          designWidth: {
            label: "i18n:web-desktop.options.design_width",
            default: 1280,
            render: { ui: "ui-num-input" },
          },
          designHeight: {
            label: "i18n:web-desktop.options.design_height",
            default: 960,
            render: { ui: "ui-num-input" },
          },
        },
        default: { designWidth: 1280, designHeight: 960 },
      },
    },
    commonOptions: {
      polyfills: { hidden: false, default: { asyncFunctions: true } },
      buildScriptTargets: { hidden: false },
      useBuiltinServer: { hidden: false },
      nativeCodeBundleMode: { default: "both" },
      overwriteProjectSettings: {
        default: { includeModules: { "gfx-webgl2": "on" } },
      },
    },
    hooks: "./hooks",
    textureCompressConfig: {
      platformType: "web",
      support: { rgb: [], rgba: [] },
    },
    assetBundleConfig: {
      supportedCompressionTypes: ["none", "merge_dep", "merge_all_json"],
      platformType: "web",
    },
    customBuildStages: [
      {
        type: "message",
        name: "run",
        displayName: "i18n:web-desktop.run.label",
        message: { name: "preview", target: "web-desktop" },
        parallelism: "all",
      },
    ],
    buildTemplateConfig: {
      templates: ["index.ejs"].map((e) => ({
        path: join(exports.Paths.internalTemplateDir, e),
        destUrl: e,
      })),
      version: "1.0.0",
    },
  },
};
