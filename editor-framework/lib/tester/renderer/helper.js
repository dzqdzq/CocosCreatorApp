"use strict";
let e = require("electron").remote.getCurrentWebContents();
let t = require("../share/helper");
function n(e) {
  let t = document.createElementNS("http://www.w3.org/2000/svg", "path");
  t.setAttribute("d", e.path);
  let n = t.getTotalLength();
  let o = 0;
  let s = null;

  let i = function (r) {
    if (void 0 !== e.steps) {
      let s = (o += 1) / e.steps;
      s = Math.min(s, 1);
      let r = t.getPointAtLength(s * n);

      if (o < e.steps) {
        e.onUpdate({ x: r.x, y: r.y, progress: s });
        setTimeout(i, 100);
      } else {
        e.onComplete({ x: r.x, y: r.y, progress: s });
      }
    } else {
      if (!s) {
        s = r;
      }

      let o = (r - s) / e.duration;
      o = Math.min(o, 1);
      let u = t.getPointAtLength(o * n);

      if (o < 1) {
        e.onUpdate({ x: u.x, y: u.y, progress: o });
        window.requestAnimationFrame(i);
      } else {
        e.onComplete({ x: u.x, y: u.y, progress: o });
      }
    }
  };

  let r = t.getPointAtLength(0);
  e.onStart({ x: r.x, y: r.y, progress: 0 });

  if (void 0 !== e.steps) {
    setTimeout(i, 100);
  } else {
    window.requestAnimationFrame(i);
  }
}

Object.assign(t, {
  detail: false,
  showMouseHint: true,
  focus(e) {
    Editor.UI.focus(e);
  },
  blur() {
    Editor.UI.focus(null);
  },
  type(t, n) {
    n = n || [];
    e.sendInputEvent({ type: "keyDown", keyCode: t, modifiers: n });
    e.sendInputEvent({ type: "char", keyCode: t, modifiers: n });
    e.sendInputEvent({ type: "keyUp", keyCode: t, modifiers: n });
  },
  keydown(t, n) {
    n = n || [];
    e.sendInputEvent({ type: "keyDown", keyCode: t, modifiers: n });
  },
  keyup(t, n) {
    n = n || [];
    e.sendInputEvent({ type: "keyUp", keyCode: t, modifiers: n });
  },
  keypress(e, t) {
    e.dispatchEvent(
      (function (e, t, n) {
        let o = new window.CustomEvent(e);
        o.keyCode = t;
        o.code = Editor.KeyCode.names[t];
        o.which = t;

        if (n) {
          if (-1 !== n.indexOf("shift")) {
            o.shiftKey = true;
          } else {
            if (-1 !== n.indexOf("ctrl")) {
              o.ctrlKey = true;
            } else {
              if (-1 !== n.indexOf("command")) {
                o.metaKey = true;
              } else {
                if (-1 !== n.indexOf("alt")) {
                  o.altKey = true;
                }
              }
            }
          }
        }

        return o;
      })("keypress", Editor.KeyCode(t))
    );
  },
  click(e, t, n, o, s) {
    t = t || "left";
    n = n || [];
    this.mousedown(e, t, n, 1, o, s);
    this.mouseup(e, t, n, 1, o, s);
  },
  dblclick(e, t, n, o, s) {
    t = t || "left";
    n = n || [];
    this.mousedown(e, t, n, 2, o, s);
    this.mouseup(e, t, n, 2, o, s);
  },
  mousedown(t, n, o, i, r, u) {
    let p = this.offset(t, r, u);
    n = n || "left";
    o = o || [];
    i = i || 1;

    e.sendInputEvent({
      type: "mouseDown",
      x: parseInt(p.x),
      y: parseInt(p.y),
      button: n,
      modifiers: o,
      clickCount: i,
    });

    if (this.showMouseHint) {
      s(p.x, p.y, "down");
    }
  },
  mouseup(t, n, o, s, r, u) {
    let p = this.offset(t, r, u);
    n = n || "left";
    o = o || [];
    s = s || 1;

    e.sendInputEvent({
      type: "mouseUp",
      x: parseInt(p.x),
      y: parseInt(p.y),
      button: n,
      modifiers: o,
      clickCount: s,
    });

    if (this.showMouseHint) {
      i();
    }
  },
  mousewheel(e, t, n, o, s, i) {
    let r = this.offset(e, s, i);
    t = t || [];

    if (!o) {
      o = n;
    }

    e.dispatchEvent(
      new window.WheelEvent("mousewheel", {
        bubbles: true,
        cancelable: true,
        clientX: r.x,
        clientY: r.y,
        deltaX: n,
        deltaY: o,
      })
    );
  },
  mousemove(t, o, r, u, p) {
    let m;
    let d;
    let l;
    let a;
    o = o || "left";

    n({
      path: u,
      duration: (r = r || 500),
      onStart: (t) => {
        l = t.x;
        a = t.y;

        e.sendInputEvent({
          type: "mousemove",
          x: parseInt(t.x),
          y: parseInt(t.y),
          button: o,
          movementX: parseInt(0),
          movementY: parseInt(0),
        });

        if (this.showMouseHint) {
          s(t.x, t.y, "moving");
        }
      },
      onUpdate: (t) => {
        m = t.x - l;
        l = t.x;
        d = t.y - a;
        a = t.y;

        e.sendInputEvent({
          type: "mousemove",
          x: parseInt(t.x),
          y: parseInt(t.y),
          button: o,
          movementX: parseInt(m),
          movementY: parseInt(d),
        });

        if (this.showMouseHint) {
          s(t.x, t.y, "moving");
        }
      },
      onComplete: (t) => {
        m = t.x - l;
        l = t.x;
        d = t.y - a;
        a = t.y;

        e.sendInputEvent({
          type: "mousemove",
          x: parseInt(t.x),
          y: parseInt(t.y),
          button: o,
          movementX: parseInt(m),
          movementY: parseInt(d),
        });

        if (this.showMouseHint) {
          i();
        }

        if (p) {
          setTimeout(p, 1);
        }
      },
    });
  },
  mousemoveStep(t, o, r, u, p) {
    let m;
    let d;
    let l;
    let a;
    o = o || "left";

    n({
      path: u,
      steps: (r = r || 5),
      onStart: (t) => {
        l = t.x;
        a = t.y;

        e.sendInputEvent({
          type: "mousemove",
          x: parseInt(t.x),
          y: parseInt(t.y),
          button: o,
          movementX: parseInt(0),
          movementY: parseInt(0),
        });

        if (this.showMouseHint) {
          s(t.x, t.y, "moving");
        }
      },
      onUpdate: (t) => {
        m = t.x - l;
        l = t.x;
        d = t.y - a;
        a = t.y;

        e.sendInputEvent({
          type: "mousemove",
          x: parseInt(t.x),
          y: parseInt(t.y),
          button: o,
          movementX: parseInt(m),
          movementY: parseInt(d),
        });

        if (this.showMouseHint) {
          s(t.x, t.y, "moving");
        }
      },
      onComplete: (t) => {
        m = t.x - l;
        l = t.x;
        d = t.y - a;
        a = t.y;

        e.sendInputEvent({
          type: "mousemove",
          x: parseInt(t.x),
          y: parseInt(t.y),
          button: o,
          movementX: parseInt(m),
          movementY: parseInt(d),
        });

        if (this.showMouseHint) {
          i();
        }

        if (p) {
          setTimeout(p, 1);
        }
      },
    });
  },
  mousetrack(e, t, n, o, s) {
    this.mousedown(e, t);

    this.mousemove(e, t, n, o, () => {
      this.mouseup(e, t);

      if (s) {
        s();
      }
    });
  },
  mousetrackStep(e, t, n, o, s) {
    this.mousedown(e, t);

    this.mousemoveStep(e, t, n, o, () => {
      this.mouseup(e, t);

      if (s) {
        s();
      }
    });
  },
  pressAndReleaseKeyOn(e) {
    this.keydown(e);

    setTimeout(() => {
      this.keyup(e);
    }, 1);
  },
  pressEnter() {
    this.pressAndReleaseKeyOn("enter");
  },
  pressSpace() {
    this.pressAndReleaseKeyOn("space");
  },
  fireEvent(e, t, n) {
    let o = new window.CustomEvent(t, { bubbles: true, cancelable: true });
    for (let e in n) o[e] = n[e];
    e.dispatchEvent(o);
  },
  offset(e, t, n) {
    if (!e) {
      e = document.body;
    }

    let o = e.getBoundingClientRect();

    if ("number" != typeof t) {
      t = o.width / 2;
    }

    if ("number" != typeof n) {
      n = o.height / 2;
    }

    return { x: o.left + t, y: o.top + n };
  },
  center(e) {
    if (!e) {
      e = document.body;
    }

    let t = e.getBoundingClientRect();
    return { x: t.left + t.width / 2, y: t.top + t.height / 2 };
  },
  topleft(e) {
    if (!e) {
      e = document.body;
    }

    let t = e.getBoundingClientRect();
    return { x: t.left, y: t.top };
  },
  importHTML(e, t) {
    let n = document.createElement("link");
    n.rel = "import";
    n.href = e;

    n.onload = function () {
        t(this.import);
      };

    document.head.appendChild(n);
  },
  loadTemplate(e, t, n) {
    this.importHTML(e, (e) => {
      if (t) {
        let o = e.querySelector(`#${t}`);
        if (!o) {
          throw new Error(`Cannot find template by id ${t}`);
        }
        n(o);
        return;
      }
      n(e.querySelector("template"));
    });
  },
  createFrom(e, t, n) {
    if ("function" == typeof t) {
      n = t;
      t = "";
    }

    this.loadTemplate(e, t, (e) => {
      if (!e || "TEMPLATE" !== e.tagName) {
        n();
        return;
      }
      let t = document.importNode(e.content, true);

      if (window.CustomElements &&
        window.CustomElements.upgradeSubtree) {
        window.CustomElements.upgradeSubtree(t);
      }

      n(t);
    });
  },
  runElement(e, t, n, o) {
    this.createFrom(e, t, (e) => {
      let t;
      t = n ? e.querySelector(n) : e.firstElementChild;
      document.body.appendChild(e);
      this._targetEL = t;
      o(t);
    });
  },
  runPanel(e, t) {
    Editor.Panel.newFrame(e, (e, n) => {
      if (e) {
        throw e;
      }
      document.body.appendChild(n);

      n.load((e) => {
        if (e) {
          throw e;
        }

        if (n.ready) {
          n.ready();
        }

        if (n.run) {
          n.run();
        }

        this._spy();
        this._targetEL = n;
        t(n);
      });
    });
  },
  reset() {
    i();
    this._unspy();

    if (this._targetEL) {
      this._targetEL.remove();
      this._targetEL = null;
    }
  },
});

module.exports = t;
let o = null;
function s(e, t, n) {
  if (null === o) {
    (o = document.createElement("div")).classList.add("mouse-hint");
    o.style.position = "absolute";
    o.style.width = "10px";
    o.style.height = "10px";
  }

  o.classList.add(n);
  o.style.left = `${e - 5}px`;
  o.style.top = `${t - 5}px`;
  document.body.appendChild(o);
}
function i() {
  if (null !== o) {
    o.className = "mouse-hint";
    o.remove();
  }
}
