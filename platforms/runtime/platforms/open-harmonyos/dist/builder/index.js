Object.defineProperty(exports, "__esModule", { value: true });
const cfg = {
  platformName: "i18n:open-harmonyos.title",
  panel: "./panel",
  hooks: "./hooks",
  options: {
    packageName: { default: "com.cocos.open-harmonyos" },
    apiLevel: { default: "7", verifyRules: ["required"] },
    orientation: {
      default: {
        portrait: false,
        upsideDown: false,
        landscapeRight: !(exports.load = exports.configs = undefined),
        landscapeLeft: true,
      },
    },
    renderBackEnd: {
      label: "i18n:open-harmonyos.options.render_back_end",
      type: "object",
      attributes: { class: "wrap" },
      itemConfigs: {
        gles3: { label: "GLES3", default: true, render: { ui: "ui-checkbox" } },
      },
    },
  },
  assetBundleConfig: {
    supportedCompressionTypes: ["none", "merge_dep", "merge_all_json"],
  },
};
async function load() {
  if (!(await Editor.Profile.getConfig("utils", "features.open-harmonyos"))) {
    exports.configs["open-harmonyos"] = {};
  }
}
exports.configs = { "open-harmonyos": cfg };
exports.load = load;
