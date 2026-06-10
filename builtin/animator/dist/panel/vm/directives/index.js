var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, o = r) => {
        var i = Object.getOwnPropertyDescriptor(t, r);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, o, i);
      }
    : (e, t, r, o) => {
        e[(o = o === undefined ? r : o)] = t[r];
      });

var __exportStar =
  (this && this.__exportStar) ||
  ((e, t) => {
    for (var r in e) {
      if (r !== "default" && !Object.prototype.hasOwnProperty.call(t, r)) {
        __createBinding(t, e, r);
      }
    }
  });

Object.defineProperty(exports, "__esModule", { value: true });
exports.PropSet = undefined;
exports.AutoFocus = undefined;
exports.UiPropDump = undefined;

const { nextTick } = require("vue/dist/vue.js");

__exportStar(require("./utils"), exports);

exports.UiPropDump = {
  inserted(e, t, r) {
    e.dump = t.value;
    e.render();
  },
  update(e, t, r) {
    e.dump = t.value;
    e.render();
  },
};

exports.AutoFocus = {
  inserted(e) {
    nextTick(() => {
      e.focus?.();
    });
  },
};

exports.PropSet = {
  inserted(e, t, r) {
    if (t.arg) {
      Reflect.set(e, t.arg, t.value);
    }
  },
  update(e, t, r) {
    if (t.arg) {
      Reflect.set(e, t.arg, t.value);
    }
  },
};
