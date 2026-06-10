var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, a = r) => {
        var n = Object.getOwnPropertyDescriptor(t, r);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, a, n);
      }
    : (e, t, r, a) => {
        e[(a = a === undefined ? r : a)] = t[r];
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
    var n = (e) =>
      (n =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = n(e), a = 0; a < r.length; a++) {
          if (r[a] !== "default") {
            __createBinding(t, e, r[a]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.components = undefined;
exports.computed = undefined;
exports.watch = undefined;
exports.props = undefined;
exports.template = undefined;

exports.data = data;
exports.mounted = mounted;
const eventItem = __importStar(require("./event-item"));
const join = require("path").join;
const readFileSync = require("fs-extra").readFileSync;
const defaultFunc = [{ func: "", params: [] }];
function data() {
  return {
    toast: "",
    toastTask: [],
    newFuncName: "",
    value: [],
    dirty: false,
    debounceSave: null,
  };
}
function mounted() {
  var e = this;
  e.refresh();
  e.debounceSave = require("lodash").debounce(e.saveData, 300);
}

exports.template = readFileSync(
  join(__dirname, "./../../../../static/template/components/event-editor.html"),
  "utf-8"
);

exports.props = ["events", "frame", "uuid", "name"];
exports.watch = {};
exports.computed = {};
exports.components = { "event-item": eventItem };

exports.methods = {
  t(e, t = "event.") {
    return Editor.I18n.t("animator." + t + e);
  },
  addFunc() {
    var e = this;

    if (e.newFuncName) {
      e.value.push({ func: e.newFuncName, params: [] });
      e.dirty = true;
      e.debounceSave();
    } else {
      e.showToast(Editor.I18n.t("animator.event.enter_func_name"));
    }
  },
  updateValue(e, t) {
    var r = this;

    if (e) {
      r.value[t] = e;
    } else {
      r.value.splice(t, 1);
    }

    r.dirty = true;
    r.debounceSave();
  },
  showToast(e, t = 800) {
    const r = this;

    if (r.toast) {
      r.toastTask.push(e);
    } else {
      r.toast = e;

      setTimeout(() => {
        r.toast = null;

        if (r.toastTask.length > 0) {
          r.showToast(r.toastTask.shift());
        }
      }, t);
    }
  },
  async saveData() {
    var e = this;

    var t = e.value.map((e) => ({
      frame: e.frame,
      func: e.func,
      params: e.params,
    }));

    e.$emit("update", e.uuid, e.frame, t);
    e.dirty = false;
  },
  refresh() {
    const t = this;
    let e = JSON.parse(JSON.stringify(t.events));

    if ((e = e.filter((e) => e.frame === t.frame)).length < 1) {
      (e = JSON.parse(JSON.stringify(defaultFunc)))[0].frame = t.frame;
    }

    t.value = e;
  },
};
