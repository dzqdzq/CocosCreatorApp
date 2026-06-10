Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmitter = undefined;
class EventEmitter {
  _eventListenerMap = new Map();
  constructor() {}
  on(e, t) {
    let i = this._eventListenerMap.get(e);

    if (!i) {
      i = [];
      this._eventListenerMap.set(e, i);
    }

    if (!i.includes(t)) {
      i.push(t);
    }
  }
  off(e, t) {
    if (
      this._eventListenerMap.has(e) &&
      undefined !== (t = (e = this._eventListenerMap.get(e))?.indexOf(t)) &&
      t >= 0
    ) {
      e?.splice(t);
    }
  }
  emit(e, ...t) {
    e = this._eventListenerMap.get(e);
    if (!e) {
      return false;
    }
    e.forEach((e) => {
      Function.prototype.apply.call(e, this, t);
    });
  }
}
exports.EventEmitter = EventEmitter;
