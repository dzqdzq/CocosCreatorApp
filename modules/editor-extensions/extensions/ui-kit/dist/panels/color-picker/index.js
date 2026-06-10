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
  (vm = this).$.color.addEventListener("change", (e) => {
    e.stopPropagation();
    e.preventDefault();
    e = new CustomEvent("change", { detail: { value: e.target.value } });
    vm.$.color.parentNode.dispatchEvent(e);
  });

  vm.$.color.addEventListener("confirm", (e) => {
    e.stopPropagation();
    e.preventDefault();
    e = new CustomEvent("confirm", { detail: { value: e.target.value } });
    vm.$.color.parentNode.dispatchEvent(e);
  });

  vm.$.color.addEventListener("cancel", (e) => {
    e.stopPropagation();
    e.preventDefault();
    e = new CustomEvent("cancel", { detail: { value: e.target.value } });
    vm.$.color.parentNode.dispatchEvent(e);
  });
}
async function beforeClose() {}
async function close() {}
exports.template =
  '<ui-color-picker class="color" value="[0,0,0,0]"></ui-color-picker>';
exports.$ = { color: ".color" };

exports.methods = {
  reset(e) {
    vm.$.color.value = e.value;
  },
  async clear() {
    vm.$.color.value = [0, 0, 0, 0];
  },
};
