Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSdk = generateSdk;
exports.useProvideSdk = useProvideSdk;
exports.useProvideExtensionPaths = useProvideExtensionPaths;
exports.injectSdk = injectSdk;
exports.useInjectSdk = useInjectSdk;

const { provide, inject } = require("vue/dist/vue.js");

const extension_sdk_1 = require("@editor/extension-sdk");

const { readConfigs } = require("../../shared/config");

async function generateSdk() {
  var { customSdkDomain, extensionPaths } = await readConfigs();
  return {
    sdk: new extension_sdk_1.Manager({
      extensionPaths: [extensionPaths.project],
      domain: customSdkDomain,
    }),
    extensionPaths: extensionPaths,
  };
}
function useProvideSdk(e) {
  provide("sdk", e);
  return { sdk: e };
}
function useProvideExtensionPaths(e) {
  provide("extensionPaths", e);
  return { extensionPaths: e };
}
function injectSdk() {
  return { sdk: { from: "sdk" }, extensionPaths: { from: "extensionPaths" } };
}
function useInjectSdk() {
  return {
    sdk: inject("sdk"),
    extensionPaths: inject("extensionPaths", {
      builtin: "",
      global: "",
      project: "",
    }),
  };
}
