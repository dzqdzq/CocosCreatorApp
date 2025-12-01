"use strict";
let e = {};
module.exports = e;
let t = {};
const r = require("chroma-js");
const s = require("../../console");
const n = require("../../../share/js-utils");
const i = require("../utils/resource-mgr");
const o = require("../utils/dom-utils");
function l(e, t, r) {
  let s;
  if (t.hasUserContent) {
    let t = e.querySelector(".user-content");

    if ((t = t || e).children.length) {
      s = [].slice.call(t.children, 0);
    }
  }
  o.clear(e);
  let i = e.shadowRoot.getElementById("custom-style");

  if (i) {
    i.remove();
  }

  n.assignExcept(e, t, [
    "template",
    "style",
    "attrs",
    "value",
    "hasUserContent",
  ]);

  if (
    (t.attrs)
  ) {
    let r = e._attrs || {};
    for (let s in t.attrs) {
      let n = e.getAttribute(s);
      if (null !== n) {
        let e = t.attrs[s];
        r[s] = e(n);
      }
    }
    e._attrs = r;
  }
  if (void 0 === e._value) {
    let r = e.getAttribute("value");

    if (null !== r) {
      e._value = t.value(r);
    }
  }
  if (t.template) {
    let r = typeof t.template;

    if ("string" === r) {
      e.innerHTML = t.template;
    } else {
      if ("function" === r) {
        e.innerHTML = t.template(e._attrs);
      }
    }
  }
  if (t.hasUserContent && s) {
    let t = document.createElement("div");
    t.classList = ["user-content"];

    s.forEach((e) => {
      t.appendChild(e.cloneNode(true));
    });

    e.insertBefore(t, e.firstChild);
  }
  if (t.style) {
    let r = document.createElement("style");
    r.type = "text/css";
    r.textContent = t.style;
    r.id = "custom-style";
    e.shadowRoot.insertBefore(r, e.shadowRoot.firstChild);
  }
  e._propgateDisable();
  e._propgateReadonly();

  if (e.ready) {
    e.ready(s);
  }

  if (r) {
    r();
  }
}

e.registerElement = function (e, t) {
  let r = t.template;
  let i = t.style;
  let o = t.listeners;
  let l = t.behaviors;
  let a = t.$;
  let c = t.factoryImpl;
  let u = t.observedAttributes || [];
  let d = true;

  if (void 0 !== t.shadowDOM) {
    d = !!t.shadowDOM;
  }

  class p extends HTMLElement {
    static tagName() {
      return e.toUpperCase();
    }
    static get observedAttributes() {
      return u;
    }
    constructor() {
      super();
      let e = this;

      if (d) {
        e = this.attachShadow({ mode: "open" });
      }

      if (r) {
        e.innerHTML = r;
      }

      if (i) {
        if (d) {
          let t = document.createElement("style");
          t.type = "text/css";
          t.textContent = i;
          e.insertBefore(t, e.firstChild);
        } else {
          s.warn("Can not use style in light DOM");
        }
      }
      if (a) {
        for (let t in a) if (this[`$${t}`]) {
          s.warn(`Failed to assign selector $${t}, already used`);
        } else {
          this[`$${t}`] = e.querySelector(a[t]);
        }
      }
      if (o) {
        for (let t in o) {
          if (e) {
            e.addEventListener(
              t,
              o[t].bind(this),
              "mousewheel" === t ? { passive: true } : {}
            );
          }

          this.addEventListener(
            t,
            o[t].bind(this),
            "mousewheel" === t ? { passive: true } : {}
          );
        }
      }

      if (c && arguments.length > 0) {
        c.apply(this, arguments);
      }

      if (this.ready) {
        this.ready();
      }
    }
  }

  n.assignExcept(p.prototype, t, [
    "shadowDOM",
    "dependencies",
    "factoryImpl",
    "template",
    "style",
    "listeners",
    "behaviors",
    "$",
  ]);

  if (l) {
    l.forEach((e) => {
      n.addon(p.prototype, e);
    });
  }

  window.customElements.define(e, p);
  return p;
};

e.registerProperty = function (e, r) {
    t[e] = r;
  };

e.unregisterProperty = function (e) {
    delete t[e];
  };

e.getProperty = function (e) {
    return t[e];
  };

e.regenProperty = function (e, r) {
    let n = t[e._type];
    if (!n) {
      s.warn(`Failed to regen property ${e._type}: type not registered.`);
      return;
    }
    if ("string" == typeof n) {
      i
        .importScript(n)
        .then((t) => {
          try {
            l(e, t, r);
          } catch (e) {
            s.error(e.stack);

            if (r) {
              r(e);
            }
          }
        })
        .catch((e) => {
        s.error(e.stack);

        if (r) {
          r(e);
        }
      });

      return;
    }
    try {
      l(e, n, r);
    } catch (e) {
      s.error(e.stack);

      if (r) {
        r(e);
      }
    }
  };

e.parseString = function (e) {
    return e;
  };

e.parseBoolean = function (e) {
    return "false" !== e && null !== e;
  };

e.parseColor = function (e) {
    return r(e).rgba();
  };

e.parseArray = function (e) {
    return JSON.parse(e);
  };

e.parseObject = function (e) {
    return JSON.parse(e);
  };
