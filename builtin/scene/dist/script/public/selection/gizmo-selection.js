var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, i, r = i) => {
        var o = Object.getOwnPropertyDescriptor(t, i);

        if (
          !o ||
          (!("get" in o) ? !o.writable && !o.configurable : t.__esModule)
        ) {
          o = {
            enumerable: true,
            get() {
              return t[i];
            },
          };
        }

        Object.defineProperty(e, r, o);
      }
    : (e, t, i, r) => {
        e[(r = r === undefined ? i : r)] = t[i];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var o = (e) =>
      (o =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var i = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              i[i.length] = t;
            }
          }
          return i;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var i = o(e), r = 0; r < i.length; r++) {
          if (i[r] !== "default") {
            __createBinding(t, e, i[r]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const node_1 = __importDefault(require("../../3d/manager/node"));
const gizmo_selection_logic_1 = __importDefault(
  require("./gizmo-selection-logic")
);
const set_util_1 = __importStar(require("../gizmos/utils/set-util"));
class GizmoSelection extends events_1.EventEmitter {
  gizmoOperationEventListeners;
  logic = new gizmo_selection_logic_1.default();
  constructor(e) {
    super();
    this.gizmoOperationEventListeners = e;
  }
  processCurrent(e, t = true, i = false) {
    const r = new set_util_1.default();
    this.gizmoOperationEventListeners.forEach((e) => {
      r.addAll(e.shouldEmitNodes());
    });
    e = (0, set_util_1.toSet)(e).intersection(r);

    if (e.size !== 0 || t) {
      t = this.logic.process(e.toArray(), i);
      this.select(t.shouldSelects);
      this.unselect(t.shouldUnselects);
    }
  }
  select(t) {
    if (t.size !== 0) {
      this.logic.selected.addAll(t);

      this.gizmoOperationEventListeners.forEach((e) =>
        e.select(
          t
            .intersection(e.shouldEmitNodes())
            .mapSet((e) => node_1.default.query(e))
            .filter((e) => e !== null)
            .mapSet((e) => e)
        )
      );
    }
  }
  unselect(t) {
    if (t.size !== 0) {
      this.logic.selected.deleteAll(t);

      this.gizmoOperationEventListeners.forEach((e) =>
        e.unselect(
          t
            .intersection(e.shouldEmitNodes())
            .mapSet((e) => node_1.default.query(e))
            .filter((e) => e !== null)
            .mapSet((e) => e)
        )
      );
    }
  }
  clear() {
    this.logic.clear();
  }
  confirm() {
    this.logic.confirm();
  }
  unselectAll() {
    if (this.logic.selected.size > 0) {
      this.unselect(this.logic.selected.clone());
    }

    this.clear();
  }
}
exports.default = GizmoSelection;
