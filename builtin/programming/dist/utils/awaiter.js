Object.defineProperty(exports, "__esModule", { value: true });
exports.Awaiter = undefined;

const { asserts } = require("./asserts");

class Awaiter {
  resolve(t) {
    asserts(this._state === State.PENDING);
    this._result = t;
    this._state = State.RESOLVED;
    for (var { resolve } of this._queue) {
      resolve(t);
    }
    this._queue.length = 0;
  }
  reject(t) {
    asserts(this._state === State.PENDING);
    this._result = t;
    this._state = State.RESOLVED;
    for (var { reject } of this._queue) {
      reject(t);
    }
    this._queue.length = 0;
  }
  async wait() {
    switch (this._state) {
      case State.RESOLVED: {
        return this._result;
      }
      case State.REJECTED: {
        throw this._result;
      }
    }
    return new Promise((t, e) => {
      this._queue.push({ resolve: t, reject: e });
    });
  }
  _state = State.PENDING;
  _result = null;
  _queue = [];
}
var State;
exports.Awaiter = Awaiter;

((t) => {
  t[(t.PENDING = 0)] = "PENDING";
  t[(t.RESOLVED = 1)] = "RESOLVED";
  t[(t.REJECTED = 2)] = "REJECTED";
})((State = State || {}));
