var __importDefault =
  (this && this.__importDefault) ||
  ((l) => (l && l.__esModule ? l : { default: l }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallbacksInvoker = undefined;
const createMap = cc.js.createMap;
const fastRemoveAt = cc.js.array.fastRemoveAt;
const pool_1 = __importDefault(require("./pool"));
function empty() {}
class CallbackInfo {
  callback = empty;
  target = undefined;
  once = false;
  off;
  set(l, a, e, c) {
    this.callback = l;
    this.target = a;
    this.once = !!e;
    this.off = c;
  }
}
const callbackInfoPool = new pool_1.default(() => new CallbackInfo(), 32);
class CallbackList {
  callbackInfos = [];
  isInvoking = false;
  containCanceled = false;
  removeByCallback(a) {
    for (let l = 0; l < this.callbackInfos.length; ++l) {
      var e = this.callbackInfos[l];

      if (e && e.callback === a) {
        callbackInfoPool.free(e);
        fastRemoveAt(this.callbackInfos, l);
        --l;
      }
    }
  }
  removeByTarget(a) {
    for (let l = 0; l < this.callbackInfos.length; ++l) {
      var e = this.callbackInfos[l];

      if (e && e.target === a) {
        callbackInfoPool.free(e);
        fastRemoveAt(this.callbackInfos, l);
        --l;
      }
    }
  }
  cancel(l) {
    var a = this.callbackInfos[l];

    if (a) {
      callbackInfoPool.free(a);
      this.callbackInfos[l] = null;
    }

    this.containCanceled = true;
  }
  cancelAll() {
    for (let l = 0; l < this.callbackInfos.length; l++) {
      var a = this.callbackInfos[l];

      if (a) {
        callbackInfoPool.free(a);
        this.callbackInfos[l] = null;
      }
    }
    this.containCanceled = true;
  }
  purgeCanceled() {
    for (let l = this.callbackInfos.length - 1; l >= 0; --l) {
      if (!this.callbackInfos[l]) {
        fastRemoveAt(this.callbackInfos, l);
      }
    }
    this.containCanceled = false;
  }
  clear() {
    this.cancelAll();
    this.callbackInfos.length = 0;
    this.isInvoking = false;
    this.containCanceled = false;
  }
}
const MAX_SIZE = 16;

const callbackListPool = new pool_1.default(() => new CallbackList(), MAX_SIZE);

class CallbacksInvoker {
  _callbackTable = createMap(true);
  on(l, a, e, c) {
    let t = this._callbackTable[l];
    t = t || (this._callbackTable[l] = callbackListPool.alloc());
    l = callbackInfoPool.alloc();
    l.set(a, e, c);
    t.callbackInfos.push(l);
  }
  hasEventListener(l, a, e) {
    l = this._callbackTable[l];
    if (l) {
      var l_callbackInfos = l.callbackInfos;
      if (!a) {
        if (l.isInvoking) {
          for (const o of l_callbackInfos) {
            if (o) {
              return true;
            }
          }
          return false;
        }
        return l_callbackInfos.length > 0;
      }
      for (let l = 0; l < l_callbackInfos.length; ++l) {
        var t = l_callbackInfos[l];
        if (t && t.callback === a && t.target === e) {
          return true;
        }
      }
    }
    return false;
  }
  removeAll(a) {
    if (typeof a == "string") {
      var l = this._callbackTable[a];

      if (l) {
        if (l.isInvoking) {
          l.cancelAll();
        } else {
          l.clear();
          callbackListPool.free(l);
          delete this._callbackTable[a];
        }
      }
    } else if (a) {
      for (const o in this._callbackTable) {
        var e = this._callbackTable[o];
        if (e.isInvoking) {
          var e_callbackInfos = e.callbackInfos;
          for (let l = 0; l < e_callbackInfos.length; ++l) {
            var t = e_callbackInfos[l];

            if (t && t.target === a) {
              e.cancel(l);
            }
          }
        } else {
          e.removeByTarget(a);
        }
      }
    }
  }
  removeAllListeners() {
    Object.keys(this._callbackTable).forEach((l) => {
      this.removeAll(l);
    });
  }
  off(l, a, e) {
    var c = this._callbackTable[l];
    if (c) {
      var c_callbackInfos = c.callbackInfos;
      if (a) {
        for (let l = 0; l < c_callbackInfos.length; ++l) {
          var o = c_callbackInfos[l];
          if (o && o.callback === a && o.target === e) {
            if (c.isInvoking) {
              c.cancel(l);
            } else {
              fastRemoveAt(c_callbackInfos, l);
              callbackInfoPool.free(o);
            }

            break;
          }
        }
      } else {
        this.removeAll(l);
      }
    }
  }
  emit(e, ...c) {
    var l = this._callbackTable[e];
    if (l) {
      var a = !l.isInvoking;
      l.isInvoking = true;
      var l_callbackInfos = l.callbackInfos;
      for (let l = 0, a = l_callbackInfos.length; l < a; ++l) {
        var o;
        var n;
        var s = l_callbackInfos[l];

        if (s) {
          o = s.callback;
          n = s.target;
          s.once && this.off(e, o, n);
          n ? o.call(n, ...c) : o(...c);
        }
      }

      if (a && ((l.isInvoking = false), l.containCanceled)) {
        l.purgeCanceled();
      }
    }
  }
}
exports.CallbacksInvoker = CallbacksInvoker;
