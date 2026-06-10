Object.defineProperty(exports, "__esModule", { value: true });
const cfg = {
  platformName: "i18n:ohos.title",
  panel: "./panel",
  hooks: "./hooks",
  options: {
    packageName: { default: "com.cocos.ohos" },
    apiLevel: { default: "5", verifyRules: ["required"] },
    orientation: {
      default: {
        portrait: false,
        upsideDown: false,
        landscapeRight: !(exports.load = exports.configs = undefined),
        landscapeLeft: true,
      },
    },
  },
  assetBundleConfig: {
    supportedCompressionTypes: ["none", "merge_dep", "merge_all_json"],
  },
};
async function load() {
  if (!(await Editor.Profile.getConfig("utils", "features.ohos"))) {
    exports.configs.ohos = {};
  }
}
exports.configs = { ohos: cfg };
exports.load = load;
