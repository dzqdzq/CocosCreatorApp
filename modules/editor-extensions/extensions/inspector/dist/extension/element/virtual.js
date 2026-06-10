Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualElement = undefined;
let ID = 1000; /* 1e3 */
class Additional {
  constructor() {
    this.parent = null;
    this.events = {};
  }
  changeCallback() {}
}
const elementMap = new WeakMap();
class VirtualElement {
  constructor(e) {
    this.id = ID++;
    this.tag = e.toLocaleLowerCase();
    this.text = "";
    this.attrs = {};
    this.events = [];
    this.children = [];
    elementMap.set(this, new Additional());
  }
  setAttribute(e, t) {
    this.attrs[e] = String((t += ""));
  }
  removeAttribute(e) {
    delete this.attrs[e];
  }
  getAttribute(e) {
    return this.attrs[e];
  }
  hasAttribute(e) {
    return e in this.attrs;
  }
  addEventListener(e, t) {
    var n;

    if (
      typeof t == "function" &&
      !((n = elementMap.get(this)).events[e] ||
        ((n.events[e] = []), this.events.push(e)),
      (n = n.events[e]).includes(t))
    ) {
      n.push(t);
    }
  }
  removeEventListener(e, t) {
    var n = elementMap.get(this);
    if (n.events[e]) {
      var s = n.events[e];
      const i = s.indexOf(t);

      if (-1 !== i) {
        s.splice(i, 1);
      }

      if (s.length === 0) {
        delete n.events[e];
        const i = this.events.indexOf(e);

        if (-1 !== i) {
          this.events.splice(i, 1);
        }
      }
    }
  }
  removeAllEventListener(e) {
    var t = elementMap.get(this);

    if (
      t.events[e] &&
      (delete t.events[e], -1 !== (t = this.events.indexOf(e)))
    ) {
      this.events.splice(t, 1);
    }
  }
  async dispatch(e, ...t) {
    var n = elementMap.get(this);
    if (n.events[e]) {
      n = n.events[e];

      return Promise.all(n.map((e) => e.call(this, ...t)));
    }
  }
  setParent(e) {
    elementMap.get(this).parent = e;
  }
  getParent() {
    return elementMap.get(this).parent || null;
  }
  getRoot() {
    let e = this.getParent();
    let t = e;

    while (e) {
      e = (t = e).getParent();
    }

    return t;
  }
  appendChild(e) {
    if (!this.children.includes(e)) {
      this.children.push(e);
      e.setParent(this);
    }
  }
  insertChild(e, t) {
    if (this.children.includes(e)) {
      this.removeChild(e);
    }

    this.children.splice(t, 0, e);
    e.setParent(this);
  }
  removeChild(e) {
    var t = this.children.indexOf(e);

    if (-1 !== t) {
      this.children.splice(t, 1);
      e.setParent(null);
    }
  }
  queryChildrenByTag(i) {
    const r = [];

    (function e(t) {
      for (const n of t) {
        if (n.tag === i) {
          r.push(n);
        }
      }
      for (const s of t) {
        e(s.children);
      }
    })(this.children);

    return r;
  }
  queryChildByID(r) {
    return (function e(t) {
      for (const s of t) {
        if (s.id === r) {
          return s;
        }
      }
      for (const i of t) {
        var n = e(i.children);
        if (n) {
          return n;
        }
      }
    })(this.children);
  }
  apply(e) {
    this.tag = e.tag;
    this.text = e.text;
    this.attrs = JSON.parse(JSON.stringify(e.attrs));
    this.events = JSON.parse(JSON.stringify(e.events));
    var t = elementMap.get(this);
    t.events = {};
    var n = elementMap.get(e);
    for (const s in n.events) {
      t.events[s] = n.events[s];
    }

    e.children.forEach((t, n) => {
      let s;
      for (let e = n; e < this.children.length; e++) {
        if (t.tag === this.children[e].tag) {
          s = this.children[e];
          break;
        }
      }

      if (s) {
        s.apply(t);
      } else {
        s = t;
      }

      this.insertChild(s, n);
    });

    this.children.length = e.children.length;
    t.changeCallback.call(this);
  }
  setChangeCallback(e) {
    var t = elementMap.get(this);
    t.changeCallback = typeof e == "function" ? e : () => {};
  }
}
exports.VirtualElement = VirtualElement;
