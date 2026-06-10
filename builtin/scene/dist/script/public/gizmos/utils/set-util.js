Object.defineProperty(exports, "__esModule", { value: true });
exports.toSet = toSet;
class SimpleSet extends Set {
  map(e, t) {
    return Array.from(this).map(e, t);
  }
  mapSet(e, t) {
    return toSet(this.map(e, t));
  }
  clone() {
    return new SimpleSet(this);
  }
  addAll(e) {
    for (const t of e) {
      this.add(t);
    }
  }
  deleteAll(e) {
    for (const t of e) {
      this.delete(t);
    }
  }
  equals(e) {
    if (this.size !== e.size) {
      return false;
    }
    for (const t of e) {
      if (!this.has(t)) {
        return false;
      }
    }
    return true;
  }
  toArray() {
    return Array.from(this);
  }
  union(e) {
    var t = new SimpleSet(this);
    for (const r of e) {
      t.add(r);
    }
    return t;
  }
  intersection(e) {
    var t = new SimpleSet();
    for (const r of e) {
      if (this.has(r)) {
        t.add(r);
      }
    }
    return t;
  }
  symmetricDifference(e) {
    var t = new SimpleSet(this);
    for (const r of e) {
      if (t.has(r)) {
        t.delete(r);
      } else {
        t.add(r);
      }
    }
    return t;
  }
  difference(e) {
    var t = new SimpleSet(this);
    for (const r of e) {
      t.delete(r);
    }
    return t;
  }
  filter(n, e) {
    const o = new SimpleSet();

    this.forEach((e, t, r) => {
      if (n(e, t, r)) {
        o.add(e);
      }
    });

    return o;
  }
}
function toSet(e) {
  return new SimpleSet(e);
}
exports.default = SimpleSet;
