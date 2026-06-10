Object.defineProperty(exports, "__esModule", { value: true });
class Pool {
  _fn;
  _idx;
  _frees;
  constructor(s, t) {
    this._fn = s;
    this._idx = t - 1;
    this._frees = new Array(t);
    for (let e = 0; e < t; ++e) {
      this._frees[e] = s();
    }
  }
  alloc() {
    if (this._idx < 0) {
      this._expand(Math.round(1.2 * this._frees.length) + 1);
    }

    var e = this._frees[this._idx];
    this._frees.splice(this._idx);
    --this._idx;
    return e;
  }
  free(e) {
    ++this._idx;
    this._frees[this._idx] = e;
  }
  clear(s) {
    for (let e = 0; e <= this._idx; e++) {
      if (s) {
        s(this._frees[e]);
      }
    }
    this._frees.splice(0);
    this._idx = -1;
  }
  _expand(t) {
    var i = this._frees;
    this._frees = new Array(t);
    var r = t - i.length;
    for (let e = 0; e < r; ++e) {
      this._frees[e] = this._fn();
    }
    for (let e = r, s = 0; e < t; ++e, ++s) {
      this._frees[e] = i[s];
    }
    this._idx += r;
  }
}
exports.default = Pool;
