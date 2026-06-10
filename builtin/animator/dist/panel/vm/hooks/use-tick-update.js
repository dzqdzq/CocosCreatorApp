Object.defineProperty(exports, "__esModule", { value: true });
exports.useTickUpdate = useTickUpdate;

const { watch, onScopeDispose } = require("vue/dist/vue.js");

const TICK_RESET = -1;
function useTickUpdate(e, i) {
  let o = TICK_RESET;
  const u = () => {
    window.cancelAnimationFrame(o);
    o = TICK_RESET;
  };
  e = watch(e, (e, t, s) => {
    s(u);
    o = window.requestAnimationFrame(i);
  });
  onScopeDispose(u);
  return { stop: e };
}
