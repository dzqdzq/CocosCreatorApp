Object.defineProperty(exports, "__esModule", { value: true });
const cfg = {
  platformName: "i18n:ohos.title",
  platformType: "OHOS",
  doc: "editor/publish/publish-huawei-ohos.html",
  panel: "./panel",
  hooks: "./hooks",
  commonOptions: {
    polyfills: { hidden: !(exports.configs = undefined) },
    useBuiltinServer: { hidden: false },
    nativeCodeBundleMode: { default: "wasm" },
  },
  options: {
    packageName: { default: "com.cocos.ohos" },
    apiLevel: { default: "5", verifyRules: ["required"] },
    orientation: {
      default: {
        portrait: false,
        upsideDown: false,
        landscapeRight: true,
        landscapeLeft: true,
      },
    },
  },
};
exports.configs = { ohos: cfg };
