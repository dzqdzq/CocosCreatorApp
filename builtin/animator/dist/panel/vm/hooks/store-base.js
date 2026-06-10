Object.defineProperty(exports, "__esModule", { value: true });
exports.useBaseStore = undefined;

const { ref, computed } = require("vue/dist/vue.js");

const { defineStore } = require("pinia");

const defaultClipConfig = {
  sample: 60,
  isLock: false,
  speed: 1,
  duration: 60,
  wrapMode: 0,
};

exports.useBaseStore = defineStore("animator_base", () => {
  const e = ref("");
  const u = ref(null);
  const r = ref(false);
  const s = ref("");
  var i = computed(() => u.value?.sample ?? defaultClipConfig.sample);
  return {
    reset() {
      e.value = "";
      u.value = null;
      r.value = false;
      s.value = "";
    },
    currentClip: e,
    clipConfig: u,
    currentSample: i,
    isSkeletonClip: r,
    focusedCurve: s,
  };
});
