var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const uuid_array_1 = __importDefault(require("./uuid-array"));
class Selection extends events_1.EventEmitter {
  selectUuids = new uuid_array_1.default();
  unselectUuids = new uuid_array_1.default();
  uuids = new uuid_array_1.default();
  noticeTimer = null;
  _hover;
  constructor() {
    super();
    this._hover = undefined;
  }
  isSelect(e) {
    return this.uuids.includes(e);
  }
  query() {
    return this.uuids.uuids.slice();
  }
  select(e) {
    if (this.uuids.add(e)) {
      this.selectUuids.add(e);
      this.unselectUuids.remove(e);
      this.notice();
      this.emit("select", e, this.uuids.uuids.slice());
    }
  }
  unselect(e) {
    if (this.uuids.remove(e)) {
      this.selectUuids.remove(e);
      this.unselectUuids.add(e);
      this.notice();
      this.emit("unselect", e, this.uuids.uuids.slice());
    }
  }
  selectGizmo(e) {
    this.uuids.add(e);

    this.emit(
      "select_gizmo",
      this.uuids.last(),
      this.uuids.uuids.slice(0, this.uuids.uuids.length - 1)
    );

    this.selectUuids.add(e);
    this.unselectUuids.remove(e);
  }
  unselectGizmo(e) {
    this.uuids.remove(e);
    this.emit("unselect_gizmo", this.uuids.last(), [e]);
    this.selectUuids.remove(e);
    this.unselectUuids.add(e);
  }
  clearGizmo() {
    this.emit(
      "unselect_gizmo",
      this.uuids.last(),
      this.selectUuids.uuids.slice(0, this.uuids.uuids.length - 1)
    );

    this.uuids.clear();
    this.selectUuids.clear();
    this.unselectUuids.clear();
  }
  clear() {
    while (this.uuids.uuids.length > 0) {
      var e = this.uuids.uuids.shift();

      if (e) {
        this.selectUuids.remove(e);
        this.unselectUuids.add(e);
        this.emit("unselect", e, this.uuids.uuids.slice());
      }
    }

    this.notice();
  }
  notice() {
    clearTimeout(this.noticeTimer);

    this.noticeTimer = setTimeout(() => {
      cce.Ipc.send("unselect-nodes", this.unselectUuids.uuids);
      cce.Ipc.send("select-nodes", this.selectUuids.uuids);
      this.selectUuids.clear();
      this.unselectUuids.clear();
    }, 100);
  }
  _select(e) {
    if (this.uuids.add(e)) {
      this.selectUuids.add(e);
      this.unselectUuids.remove(e);
      this.emit("select", e, this.uuids.uuids.slice());
    }
  }
  _unselect(e) {
    if (this.uuids.remove(e)) {
      this.selectUuids.remove(e);
      this.unselectUuids.add(e);
      this.emit("unselect", e, this.uuids.uuids.slice());
    }
  }
}
exports.default = new Selection();
