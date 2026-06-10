Object.defineProperty(exports, "__esModule", { value: true });
exports.useRootVm = useRootVm;

const { getCurrentInstance } = require("vue/dist/vue.js");

function useRootVm() {
  var e = getCurrentInstance();
  if (e) {
    return e.proxy.$root;
  }
  throw new Error("should call in setup function");
}
