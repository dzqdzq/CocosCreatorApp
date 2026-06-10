Object.defineProperty(exports, "__esModule", { value: true });
exports.useElementSize = useElementSize;

const { ref } = require("vue/dist/vue.js");

const { useResizeObserver } = require("./use-resize-observer");

function useElementSize(e) {
  const s = ref(0);
  const r = ref(0);

  useResizeObserver(e, ([e]) => {
    e = e.contentRect;
    s.value = e.width;
    r.value = e.height;
  });

  return { width: s, height: r };
}
