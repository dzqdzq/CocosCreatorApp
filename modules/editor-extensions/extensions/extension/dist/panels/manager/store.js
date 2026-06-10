Object.defineProperty(exports, "__esModule", { value: true });
exports.createStore = createStore;
exports.useProvideStore = useProvideStore;
exports.useInjectStore = useInjectStore;

const { ref, provide, inject } = require("vue/dist/vue.js");

function createStore(e) {
  return { startupParams: ref({}) };
}
function useProvideStore(e) {
  provide("store", e);
  return { store: e };
}
function useInjectStore() {
  return inject("store");
}
