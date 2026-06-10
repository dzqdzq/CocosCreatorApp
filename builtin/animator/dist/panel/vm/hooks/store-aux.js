Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuxCurveStore = undefined;

const { ref, computed } = require("vue/dist/vue.js");

const { defineStore } = require("pinia");

const { calcFrames } = require("../../share/animation-editor");

exports.useAuxCurveStore = defineStore("animator_aux_curve", () => {
  const a = ref(false);
  const u = ref([]);
  const e = ref(null);
  const r = ref("");
  var s = ref();
  const l = ref({});
  const t = ref(null);
  var v = ref({ size: { w: 0, h: 0 }, height: 0, top: 0 });
  const n = ref([]);

  var i = computed(() =>
    r.value == ""
      ? null
      : u.value.find((e) => e.displayName === r.value) ?? null
  );

  var o = computed(() => {
    var e = {};
    for (const a of u.value) {
      e[a.displayName] = a;
    }
    return e;
  });

  return {
    reset: () => {
      u.value = [];
      e.value = null;
      r.value = "";
      n.value = [];
      t.value = null;
    },
    enabled: a,
    updateEnableState: async () => {
      var e =
        (await Editor.Profile.getConfig("animator", "enableAuxiliaryCurve")) ??
        false;
      a.value = e;
    },
    curves: u,
    calcCurves: (e, a) => {
      if (e.length < 1) {
        u.value = [];
      } else {
        for (const r of e) {
          calcFrames(r.keyframes, a, false);
        }
        u.value = e;
      }
    },
    selectedCurve: i,
    selectedCurveName: r,
    selectedFrameDump: s,
    selectedFrameDumpRenderKey: l,
    forceDumpUpdate: () => {
      l.value = {};
    },
    renaming: n,
    switchRename: (e, a) => {
      var n_value = n.value;
      var u = n_value.indexOf(e);
      var s = -1 < u;

      if (s || a === false) {
        if (s && a !== true) {
          n_value.splice(u, 1);
        }
      } else {
        n_value.push(e);
      }
    },
    copyKeyframeSnap: t,
    setCopyKeyframe: (e) => {
      t.value = e;
    },
    scrollInfo: v,
    selectKeyInfo: e,
    curveNameMap: o,
  };
});
