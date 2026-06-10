Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOperateHandler = generateOperateHandler;
exports.useCurveEditor = useCurveEditor;

const {
  ref,
  unref,
  computed,
  customRef,
  nextTick,
} = require("vue/dist/vue.js");

const { useBaseStore } = require("./store-base");

function generateOperateHandler(u) {
  return (...e) => {
    var [r] = e;
    u[r]?.apply(undefined, e);
  };
}
function useCurveEditor(r) {
  const { size, configure } = r;
  const o = ref(false);
  const s = ref();
  const i = ref(false);
  const v = useBaseStore();
  function a() {
    var e = unref(s);
    if (e) {
      return e;
    }
    throw new Error("curve editor element is not ready");
  }

  const e = computed(() => s.value?.curveCtrl);

  const n = customRef((e, r) => ({
    get() {
      e();
      return s.value?.sample ?? 1;
    },

    set(e) {
      if (s.value) {
        s.value.sample = e;
        r();
      }
    },
  }));

  const l = (e, r) => {
    var u = unref(s);
    if (u) {
      if (e === undefined) {
        if (!size) {
          throw new Error("boxSize is required");
        }
        e = unref(size.width);
      }
      if (r === undefined) {
        if (!size) {
          throw new Error("boxSize is required");
        }
        r = unref(size.height);
      }
      u.resize(e, r);
    }
  };

  const _ = (e) => {
    var r = unref(s);

    if (r) {
      r.curveCtrl.paint(e);
    }
  };

  const c = () => {
    a().repaint();
  };

  const d = () => {
    a().curveCtrl.zoomToFit();
  };

  const f = () => {
    a().curveCtrl.zoomToSelectedKeyframes();
  };

  return {
    curveEditor: s,
    getElement: a,
    visible: o,
    show: () => {
      if (!o.value) {
        o.value = true;

        nextTick(() => {
          var e;

          if (o.value) {
            e = a();
            i.value || (configure(e), (i.value = true));
            l();
          }
        });
      }
    },
    hide: () => {
      if (o.value) {
        o.value = false;
      }
    },
    onFocus: (e) => {
      if (r.uniqueName) {
        v.focusedCurve = r.uniqueName;
      }
    },
    onBlur: (e) => {
      if (r.uniqueName) {
        v.focusedCurve = "";
      }
    },
    curveCtrl: e,
    paint: _,
    resize: l,
    repaint: c,
    zoomToFit: d,
    sample: n,
    getExposedAPI: () => ({
      editor: s,
      curveCtrl: e,
      paint: _,
      resize: l,
      repaint: c,
      zoomToFit: d,
      zoomToSelectedKeys: f,
      sample: n,
    }),
  };
}
