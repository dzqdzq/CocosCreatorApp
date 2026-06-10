Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.ready = ready;
exports.beforeClose = beforeClose;
exports.close = close;
const panel = null;
let vm = null;
async function ready() {
  (vm = this).$.gradient.addEventListener("change", (e) => {
    e.stopPropagation();
    e.preventDefault();
    e = new CustomEvent("change", { detail: { value: e.target.value } });
    vm.$.gradient.parentNode.dispatchEvent(e);
  });

  vm.$.gradient.addEventListener("confirm", (e) => {
    e.stopPropagation();
    e.preventDefault();
    e = new CustomEvent("confirm", { detail: { value: e.target.value } });
    vm.$.gradient.parentNode.dispatchEvent(e);
  });

  vm.$.gradient.addEventListener("cancel", (e) => {
    e.stopPropagation();
    e.preventDefault();
    e = new CustomEvent("cancel", { detail: { value: e.target.value } });
    vm.$.gradient.parentNode.dispatchEvent(e);
  });
}
async function beforeClose() {}
async function close() {}
exports.template = '<ui-gradient-picker class="gradient"></ui-gradient-picker>';
exports.$ = { gradient: ".gradient" };

exports.methods = {
  async reset(e) {
    vm.$.gradient.value = e.value;
  },
  clear() {},
};
