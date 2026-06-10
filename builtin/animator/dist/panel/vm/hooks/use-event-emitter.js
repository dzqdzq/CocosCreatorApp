Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmitter = createEmitter;
exports.useEventEmitter = useEventEmitter;

const { onScopeDispose } = require("vue/dist/vue.js");

const events_1 = require("events");
function createEmitter() {
  var e = new events_1.EventEmitter({ captureRejections: true });
  e.setMaxListeners(100);
  return e;
}
function useEventEmitter(r) {
  return {
    on: (e, t) => {
      r.on(e, t);
      onScopeDispose(() => {
        r.off(e, t);
      });
    },
    once: (e, t) => {
      r.once(e, t);
      onScopeDispose(() => {
        r.off(e, t);
      });
    },
    off: r.off.bind(r),
    emit: r.emit.bind(r),
  };
}
