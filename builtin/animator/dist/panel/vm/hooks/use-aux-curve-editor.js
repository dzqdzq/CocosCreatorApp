Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuxCurveEditor = useAuxCurveEditor;

const {
  computed,
  ref,
  unref,
  watchEffect,
  watch,
  nextTick,
  onMounted,
  onUnmounted,
} = require("vue/dist/vue.js");

const animation_editor_1 = require("../../share/animation-editor");
const grid_ctrl_1 = require("../../share/grid-ctrl");

const { syncAxisX } = grid_ctrl_1;

const {
  modifyAuxCurveOfKey,
  IApplyOperation,
  moveAuxKeys,
  createAuxKey,
  removeAuxKey,
} = require("../../share/ipc-event");

const {
  transformCtrlKeyToDump,
  transDumpKeyToCurveKey,
} = require("../../utils");

const { useAuxCurveStore } = require("./store-aux");

const { useBaseStore } = require("./store-base");

const { useTransformEvent } = require("./store-grid");

const { useCurveEditor } = require("./use-curve-editor");

const DUMP_VALUE_TYPE = "Float";
const CURVE_COLOR = "#7979D7";
function useAuxCurveEditor(e) {
  const t = useBaseStore();
  const K = useAuxCurveStore();

  const P = e.currentClip ?? computed(() => t.currentClip);

  e = useCurveEditor({
    ...e,
    configure: (e) =>
      animation_editor_1.animationEditor.configureCurveEditor(e),
    uniqueName: "auxCurve",
  });
  const { curveEditor, getElement, paint, sample } = e;
  const W = ref();

  const i = computed(() => {
    var { curves, selectedCurve } = K;

    if (curves.length < 1 || selectedCurve == null) {
      return null;
    }
    var curves = { curveInfos: {}, duration: 0, wrapMode: 0 };
    var r = [];
    for (const n of selectedCurve.keyframes) {
      if (n.curve) {
        r.push(n.curve);
      }
    }

    curves.curveInfos[selectedCurve.displayName] = {
      keys: r,
      postWrapMode: selectedCurve.postExtrap,
      preWrapMode: selectedCurve.preExtrap,
      color: CURVE_COLOR,
    };

    return curves;
  });

  const D = (e) => animation_editor_1.animationEditor.updateCurrentFrame(e);

  const o = (e, t, r) => {
    if (t) {
      switch (e) {
        case "select": {
          var n = {
            keyframes: [],
            ctrl: false,
            offset: 0,
            offsetFrame: 0,
            startX: 0,
          };
          for (const y of t) {
            var a = transformCtrlKeyToDump(y.keys, DUMP_VALUE_TYPE).map(
              (e, t) => ({
                x:
                  y.keys[t].key.canvas.x -
                  grid_ctrl_1.gridCtrl.grid.xAxisOffset,

                frame: e.frame,
                rawFrame: e.frame,
                key: y.key,
              })
            );
            n.keyframes.push(...a);
          }
          K.selectKeyInfo = n;
          break;
        }
        case "db-select": {
          var u = t[0].keys;
          var u = transformCtrlKeyToDump(u, DUMP_VALUE_TYPE);
          D(u[0].frame);
          break;
        }
        case "select-curve":
        case "select-curve-clip": {
          W.value = { name: t[0].key, color: CURVE_COLOR };
          break;
        }
        case "apply-bezier": {
          const m = t[0].key;
          u = transformCtrlKeyToDump(t[0].keys, DUMP_VALUE_TYPE).map((e) =>
            modifyAuxCurveOfKey(unref(P), m, e.frame, {
              inTangent: e.inTangent,
              outTangent: e.outTangent,
              inTangentWeight: e.inTangentWeight,
              outTangentWeight: e.outTangentWeight,
              interpMode: e.interpMode,
              tangentWeightMode: e.tangentWeightMode,
            })
          );
          IApplyOperation(u);
          break;
        }
        case "scale-keys":
        case "move-keys": {
          var i = [];
          var o = [];

          var s = {
            keyframes: [],
            ctrl: false,
            offset: 0,
            offsetFrame: 0,
            startX: 0,
          };

          for (const d of t) {
            var d_keys = d.keys;
            var p = transformCtrlKeyToDump(d_keys, DUMP_VALUE_TYPE);
            for (let e = 0; e < d_keys.length; e++) {
              var c = d_keys[e];
              var g = Math.round(c.key.point.x - c.raw.point.x);

              var v = {
                x:
                  grid_ctrl_1.gridCtrl.grid.valueToPixelH(p[e].frame) -
                  grid_ctrl_1.gridCtrl.grid.xAxisOffset,
                frame: p[e].frame,
                rawFrame: Math.round(c.raw.point.x),
                offsetFrame: g,
                key: d.key,
              };

              var v =
                (s.keyframes.push(v),
                Math.round(c.key.point.y - c.raw.point.y));

              if (g || v) {
                g !== 0 &&
                  i.push(
                    moveAuxKeys(unref(P), d.key, [Math.round(c.raw.point.x)], g)
                  );

                o.push(
                  createAuxKey(unref(P), d.key, p[e].frame, {
                    newValue: c.key.point.y,
                    inTangent: c.key.inTangent,
                    outTangent: c.key.outTangent,
                  })
                );
              }
            }
          }
          IApplyOperation([...i, ...o]);
          K.selectKeyInfo = s;
          break;
        }
        case "tangent": {
          const T = t[0].key;
          u = transformCtrlKeyToDump(t[0].keys, DUMP_VALUE_TYPE).map((e) =>
            modifyAuxCurveOfKey(unref(P), T, e.frame, {
              inTangent: e.inTangent,
              broken: e.broken,
              outTangent: e.outTangent,
              inTangentWeight: e.inTangentWeight,
              outTangentWeight: e.outTangentWeight,
            })
          );
          IApplyOperation(u);
          break;
        }
        case "change-broken-state": {
          const k = t[0].key;
          u = transformCtrlKeyToDump(t[0].keys, DUMP_VALUE_TYPE).map((e) =>
            modifyAuxCurveOfKey(unref(P), k, e.frame, {
              inTangent: e.inTangent,
              broken: e.broken,
              outTangent: e.outTangent,
              inTangentWeight: e.inTangentWeight,
              outTangentWeight: e.outTangentWeight,
            })
          );
          IApplyOperation(u);
          break;
        }
        case "create-keys": {
          const h = [];
          for (const E of t) {
            var E_keys = E.keys;
            const C = transformCtrlKeyToDump(E_keys, DUMP_VALUE_TYPE);
            C.forEach((e, t) => {
              h.push(
                createAuxKey(unref(P), E.key, C[t].frame, {
                  inTangent: e.inTangent,
                  outTangent: e.outTangent,
                  newValue: e.dump.value,
                  interpMode: e.interpMode,
                  tangentWeightMode: e.tangentWeightMode,
                  inTangentWeight: e.inTangentWeight,
                  outTangentWeight: e.outTangentWeight,
                })
              );
            });
          }
          IApplyOperation(h);
          break;
        }
        case "change-interp-mode": {
          const x = [];

          t.forEach((t) => {
            var t_keys = t.keys;
            var t_keys = transformCtrlKeyToDump(t_keys, DUMP_VALUE_TYPE);
            x.push(
              ...t_keys.map((e) =>
                modifyAuxCurveOfKey(unref(P), t.key, e.frame, {
                  inTangent: e.inTangent,
                  outTangent: e.outTangent,
                  interpMode: e.interpMode,
                })
              )
            );
          });

          IApplyOperation(x);
          break;
        }
        case "change-tangent-weight": {
          const A = [];

          t.forEach((t) => {
            var t_keys = t.keys;
            var t_keys = transformCtrlKeyToDump(t_keys, DUMP_VALUE_TYPE);
            A.push(
              ...t_keys.map((e) =>
                modifyAuxCurveOfKey(unref(P), t.key, e.frame, {
                  tangentWeightMode: e.tangentWeightMode,
                  inTangentWeight: e.inTangentWeight,
                  outTangentWeight: e.outTangentWeight,
                })
              )
            );
          });

          IApplyOperation(A);
          break;
        }
        case "remove-keys": {
          const M = [];

          t.forEach((t) => {
            var t_keys = t.keys;
            var t_keys = transformCtrlKeyToDump(t_keys, DUMP_VALUE_TYPE);
            M.push(
              ...t_keys.map((e) => removeAuxKey(unref(P), t.key, e.frame))
            );
          });

          IApplyOperation(M);
          K.selectKeyInfo = null;
          break;
        }
        case "move-curve": {
          const U = [];

          t.forEach((t) => {
            var t_keys = t.keys;
            var t_keys = transformCtrlKeyToDump(t_keys, DUMP_VALUE_TYPE);
            U.push(
              ...t_keys.map((e) =>
                createAuxKey(unref(P), t.key, e.frame, {
                  newValue: e.dump.value,
                })
              )
            );
          });

          IApplyOperation(U);
          break;
        }
        case "copy": {
          var [u] = t;
          var f = u.keys[0];
          K.copyKeyframeSnap = {
            clip: unref(P),
            name: u.key,
            frame: f.raw.point.x,
            curve: { ...f.raw },
            dump: { type: DUMP_VALUE_TYPE, value: f.raw.point.y },
          };
        }
      }
    }
  };

  const s = useTransformEvent();
  s.onUpdate((e) => {
    if (e !== "aux_curve" && grid_ctrl_1.gridCtrl.grid) {
      e = getElement();
      syncAxisX(grid_ctrl_1.gridCtrl.grid, e.curveCtrl.grid);
      paint(i.value);
    }
  });
  const _ = () => {
    var e;
    var K_copyKeyframeSnap = K.copyKeyframeSnap;
    return K_copyKeyframeSnap == null ||
      null ==
        (e = transDumpKeyToCurveKey({
          ...K_copyKeyframeSnap.curve,
          frame: K_copyKeyframeSnap.frame,
          dump: K_copyKeyframeSnap.dump,
        }))
      ? []
      : ((e = [
          {
            key: {
              ...e,
              canvas: {
                x: K_copyKeyframeSnap.frame,
                y: K_copyKeyframeSnap.dump.value,
              },
            },
            raw: K_copyKeyframeSnap.curve,
          },
        ]),
        [{ key: K_copyKeyframeSnap.name, keys: e }]);
  };

  watchEffect(() => {
    sample.value = t.currentSample;
  });

  watch(
    i,
    (e, t, r) => {
      let n = false;

      nextTick(() => {
        if (!n) {
          paint(e);
        }
      });

      r(() => {
        n = true;
      });
    },
    { flush: "post" }
  );

  onMounted(() => {
    nextTick(() => {
      var e;

      if (curveEditor.value) {
        e = curveEditor.value;
        animation_editor_1.animationEditor.configureCurveEditor(e);
        e.curveCtrl.getCopyKeys = _;
        e.curveCtrl.on("operate", o);
      }
    });
  });

  onUnmounted(() => {
    if (curveEditor.value) {
      curveEditor.value.curveCtrl.off("operate", o);
    }
  });

  return {
    ...e,
    onTransform: () => {
      var e = getElement();

      if (grid_ctrl_1.gridCtrl.grid) {
        syncAxisX(e.curveCtrl.grid, grid_ctrl_1.gridCtrl.grid);
        s.emitUpdate("aux_curve");
      }
    },
    onOperate: o,
  };
}
