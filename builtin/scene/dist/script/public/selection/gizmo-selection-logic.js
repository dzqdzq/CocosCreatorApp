var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const set_util_1 = __importDefault(require("../gizmos/utils/set-util"));
class GizmoSelectionLogic {
  buffer = new set_util_1.default();
  selected = new set_util_1.default();
  lastSelects = new set_util_1.default();
  process(e, t = false) {
    var e = new set_util_1.default(e);
    this.buffer.addAll(e);
    var s = this.buffer.intersection(e);
    var e = this.buffer.difference(e);
    let l;
    let i;

    i = t
      ? ((l = s.difference(this.lastSelects).union(e)),
        e.difference(this.lastSelects).union(s.intersection(this.lastSelects)))
      : ((l = s), e.union(this.lastSelects.difference(s)));

    l = l.difference(i).difference(this.selected);
    i = i.intersection(this.selected);
    return { shouldSelects: l, shouldUnselects: i };
  }
  select(e) {
    this.selected.addAll(e);
  }
  clear() {
    this.selected.clear();
    this.lastSelects.clear();
    this.buffer.clear();
  }
  confirm() {
    this.lastSelects.clear();
    this.lastSelects.addAll(this.selected);
  }
}
exports.default = GizmoSelectionLogic;
