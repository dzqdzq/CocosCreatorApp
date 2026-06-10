Object.defineProperty(exports, "__esModule", { value: true });
class UuidArray {
  uuids = [];
  constructor() {}
  add(u) {
    return !this.uuids.includes(u) && (this.uuids.splice(0, 0, u), true);
  }
  remove(u) {
    u = this.uuids.indexOf(u);
    return -1 !== u && (this.uuids.splice(u, 1), true);
  }
  forEach(u) {
    this.uuids.forEach(u);
  }
  clear() {
    this.uuids.length = 0;
  }
  indexOf(u) {
    return this.uuids.indexOf(u);
  }
  last() {
    return this.uuids[this.uuids.length - 1];
  }
  first() {
    return this.uuids[0];
  }
}
exports.default = UuidArray;
