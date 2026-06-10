Object.defineProperty(exports, "__esModule", { value: true });
exports.InspectorElement = undefined;
exports.createElement = createElement;
exports.register = register;
const elementHandleMap = new Map();
const HTMLElementMap = new WeakMap();
function createElement(e) {
  let t = elementHandleMap.get(e.tag);
  var n = (t = t || elementHandleMap.get("*")).create(e);
  t.init(e, n);
  return n;
}
function register(e, t) {
  elementHandleMap.set(e, new t());
}
class InspectorElement {
  create(t) {
    const n = document.createElement(t.tag);
    HTMLElementMap.set(t, n);
    for (const e in t.attrs) {
      n.setAttribute(e, t.attrs[e]);
    }

    if (t.text.trim()) {
      n.innerHTML = t.text;
    }

    const r = (n.__handle__ = n.__handle__ || {});

    t.events.forEach((e) => {
      r[e] = () => {
        t.getRoot()?.dispatch("elem-change", t, e);
      };

      n.addEventListener(e, r[e]);
    });

    t.children.forEach((E, t) => {
      E = createElement(E);
      t = n.children[t];

      if (t) {
        if (t !== E) {
          n.insertBefore(E, t);
        }
      } else {
        n.appendChild(E);
      }
    });

    return n;
  }
  init(e, t) {
    this.bind(e, t);
  }
  bind(r, s) {
    r.setChangeCallback(() => {
      const t = (s.__handle__ = s.__handle__ || {});
      r.events.forEach((e) => {
        if (!t[e]) {
          t[e] = () => {
            r.getRoot()?.dispatch("elem-change", r, e);
          };

          s.addEventListener(e, t[e]);
        }
      });
      for (const e in t) {
        if (!r.events.includes(e)) {
          s.removeEventListener(e, t[e]);
          delete t[e];
        }
      }
      for (const n in r.attrs) {
        s.setAttribute(n, r.attrs[n]);
      }

      if (r.text.trim()) {
        s.innerHTML = r.text;
      }

      r.children.forEach((E, t) => {
        E = HTMLElementMap.get(E) || createElement(E);
        t = s.children[t];

        if (E.parentElement === s || (E.remove(), t)) {
          if (t !== E) {
            s.insertBefore(E, t);
          }
        } else {
          s.appendChild(E);
        }
      });

      for (let e = r.children.length; e < s.children.length; e++) {
        s.children[e].remove();
      }
    });
  }
}
register("*", (exports.InspectorElement = InspectorElement));
class UIBase extends InspectorElement {
  init(e, t) {
    t.addEventListener("change", () => {
      e.setAttribute("value", t.value);
    });

    super.init(e, t);
  }
}
register("ui-asset", UIBase);
register("ui-checkbox", UIBase);
register("ui-component", UIBase);
register("ui-file", UIBase);
register("ui-input", UIBase);
register("ui-node", UIBase);
register("ui-num-input", UIBase);
register("ui-slider", UIBase);
register("ui-select", UIBase);
register("ui-textarea", UIBase);
register("ui-tab", UIBase);
class UIColor extends InspectorElement {
  init(e, t) {
    t.addEventListener("change", () => {
      e.setAttribute("value", JSON.stringify(t.value));
    });

    super.init(e, t);
  }
}
register("ui-color", UIColor);
