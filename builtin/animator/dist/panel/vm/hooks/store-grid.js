Object.defineProperty(exports, "__esModule", { value: true });
exports.useGridStore = undefined;
exports.useTransformEvent = useTransformEvent;

const { markRaw, ref } = require("vue/dist/vue.js");

const { defineStore } = require("pinia");

const { useEventEmitter, createEmitter } = require("./use-event-emitter");

function useTransformEvent() {
  var e = (0, exports.useGridStore)();
  const r = useEventEmitter(e.transformEvent);
  return {
    ...r,
    emitUpdate: (e) => {
      r.emit("update", e);
    },
    onUpdate: (t) => r.on("update", (e) => t(e)),
  };
}
exports.useGridStore = defineStore("animator_grid", () => ({
  transformEvent: markRaw(createEmitter()),

  offset: ref(0),
  scale: ref(20),
}));
