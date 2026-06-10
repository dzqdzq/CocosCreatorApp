function fastRemove(e, s) {
  s = e.indexOf(s);

  if (s >= 0) {
    e[s] = e[e.length - 1];
    --e.length;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncDelegate = undefined;
exports.fastRemove = fastRemove;
class AsyncDelegate {
  _delegates = [];
  add(e) {
    if (!this._delegates.includes(e)) {
      this._delegates.push(e);
    }
  }
  hasListener(e) {
    return this._delegates.includes(e);
  }
  remove(e) {
    fastRemove(this._delegates, e);
  }
  dispatch(...args) {
    return Promise.all(this._delegates.map((e) => e(...args)).filter(Boolean));
  }
}
exports.AsyncDelegate = AsyncDelegate;
