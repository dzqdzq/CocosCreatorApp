Object.defineProperty(exports, "__esModule", { value: true });
exports.RecyclePool = undefined;
class RecyclePool {
  _fn;
  _count = 0;
  _data;
  constructor(e, a) {
    this._fn = e;
    this._data = new Array(a);
    for (let t = 0; t < a; ++t) {
      this._data[t] = e();
    }
  }
  get length() {
    return this._count;
  }
  get data() {
    return this._data;
  }
  reset() {
    this._count = 0;
  }
  resize(e) {
    if (e > this._data.length) {
      for (let t = this._data.length; t < e; ++t) {
        this._data[t] = this._fn();
      }
    }
  }
  add() {
    if (this._count >= this._data.length) {
      this.resize(2 * this._data.length);
    }

    return this._data[this._count++];
  }
  removeAt(t) {
    var e;
    var a;

    if (t < this._count) {
      e = this._count - 1;
      a = this._data[t];
      this._data[t] = this._data[e];
      this._data[e] = a;
      --this._count;
    }
  }
}
exports.RecyclePool = RecyclePool;
