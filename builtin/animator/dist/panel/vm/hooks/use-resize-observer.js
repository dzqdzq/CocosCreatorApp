Object.defineProperty(exports, "__esModule", { value: true });
exports.useResizeObserver = useResizeObserver;

const { watch, onUnmounted } = require("vue/dist/vue.js");

function useResizeObserver(e, s) {
  let r = undefined;

  const o = () => {
    if (r) {
      r.disconnect();
      r = undefined;
    }
  };

  const t = watch(
    e,
    (e) => {
      o();

      if (e) {
        (r = new ResizeObserver(s)).observe(e, { box: "border-box" });
      }
    },
    { immediate: true, flush: "post" }
  );

  onUnmounted(() => {
    o();
    t();
  });
}
