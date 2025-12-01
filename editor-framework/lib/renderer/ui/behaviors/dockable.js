"use strict";
const e = require("../../console");
const t = require("../utils/dock-utils");
let i = {
  _dockable: true,
  get noCollapse() {
    return null !== this.getAttribute("no-collapse");
  },
  set noCollapse(e) {
    if (e) {
      this.setAttribute("no-collapse", "");
    } else {
      this.removeAttribute("no-collapse");
    }
  },
  _initDockable() {
    this._preferredWidth = "auto";
    this._preferredHeight = "auto";
    this._computedMinWidth = 0;
    this._computedMinHeight = 0;

    requestAnimationFrame(() => {
      this.style.minWidth = "auto";
      this.style.minHeight = "auto";
      this.style.maxWidth = "auto";
      this.style.maxHeight = "auto";
    });

    this.addEventListener("dragover", (e) => {
      e.preventDefault();
      t.dragoverDock(this);
    });
  },
  _notifyResize() {
    for (let e = 0; e < this.children.length; ++e) {
      let t = this.children[e];

      if (t._dockable) {
        t._notifyResize();
      }
    }
  },
  _collapse() {
    let e = this.parentNode;
    if (this.noCollapse || !e) {
      return false;
    }
    if (0 === this.children.length) {
      if (e._dockable) {
        e.removeDock(this);
      } else {
        e.removeChild(this);
      }

      return true;
    }
    if (1 === this.children.length) {
      let t = this.children[0];
      t.style.flex = this.style.flex;
      t._preferredWidth = this._preferredWidth;
      t._preferredHeight = this._preferredHeight;
      e.insertBefore(t, this);
      e.removeChild(this);

      if (t._dockable) {
        t._collapse();
      }

      return true;
    }
    if (e._dockable && e.row === this.row) {
      for (; this.children.length > 0; ) {
        e.insertBefore(this.children[0], this);
      }
      e.removeChild(this);
      return true;
    }
    return false;
  },
  _makeRoomForNewComer(e, i) {
    if ("left" === e || "right" === e) {
      let e = this._preferredWidth - i._preferredWidth - t.resizerSpace;

      if (e > 0) {
        this._preferredWidth = e;
      } else {
        e = Math.floor(0.5 * (this._preferredWidth - t.resizerSpace));
        this._preferredWidth = e;
        i._preferredWidth = e;
      }
    } else {
      let e = this._preferredHeight - i._preferredHeight - t.resizerSpace;

      if (e > 0) {
        this._preferredHeight = e;
      } else {
        e = Math.floor(0.5 * (this._preferredHeight - t.resizerSpace));
        this._preferredHeight = e;
        i._preferredHeight = e;
      }
    }
  },
  addDock(t, i, r) {
    if (false === i._dockable) {
      e.warn(`Dock element at position ${t} must be dockable`);
      return;
    }
    let h;
    let s;
    let l;
    let o = false;
    let d = this.parentNode;
    if (d._dockable) {
      if ("left" === t || "right" === t) {
        if (!d.row) {
          o = true;
        }
      } else {
        if (d.row) {
          o = true;
        }
      }

      if (o) {
        (h = document.createElement("ui-dock")).row = "left" === t || "right" === t;
        d.insertBefore(h, this);

        if ("left" === t || "top" === t) {
          h.appendChild(i);
          h.appendChild(this);
        } else {
          h.appendChild(this);
          h.appendChild(i);
        }

        h._initResizers();
        h._finalizePreferredSize();
        h.style.flex = this.style.flex;
        h._preferredWidth = this._preferredWidth;
        h._preferredHeight = this._preferredHeight;
        this._makeRoomForNewComer(t, i);
      } else {
        s = null;
        (s = document.createElement("ui-dock-resizer")).vertical = d.row;

        if ("left" === t || "top" === t) {
          d.insertBefore(i, this);
          d.insertBefore(s, this);
        } else {
          if (null === (l = this.nextElementSibling)) {
            d.appendChild(s);
            d.appendChild(i);
          } else {
            d.insertBefore(s, l);
            d.insertBefore(i, l);
          }
        }

        if (!r) {
          this._makeRoomForNewComer(t, i);
        }
      }
    } else {
      if ("left" === t || "right" === t) {
        if (!this.row) {
          o = true;
        }
      } else {
        if (this.row) {
          o = true;
        }
      }

      if (o) {
        for (
          (h = document.createElement("ui-dock")).row = this.row,
            this.row = "left" === t || "right" === t;
          this.children.length > 0;

        ) {
          let e = this.children[0];
          h.appendChild(e);
        }

        if ("left" === t || "top" === t) {
          this.appendChild(i);
          this.appendChild(h);
        } else {
          this.appendChild(h);
          this.appendChild(i);
        }

        this._initResizers();
        h._finalizePreferredSize();
        h.style.flex = this.style.flex;
        h._preferredWidth = this._preferredWidth;
        h._preferredHeight = this._preferredHeight;
        this._makeRoomForNewComer(t, i);
      } else {
        s = null;
        (s = document.createElement("ui-dock-resizer")).vertical = this.row;

        if ("left" === t || "top" === t) {
          this.insertBefore(i, this.firstElementChild);
          this.insertBefore(s, this.firstElementChild);
        } else {
          if (null === (l = this.nextElementSibling)) {
            this.appendChild(s);
            this.appendChild(i);
          } else {
            this.insertBefore(s, l);
            this.insertBefore(i, l);
          }
        }

        if (!r) {
          this._makeRoomForNewComer(t, i);
        }
      }
    }
  },
  removeDock(e) {
    let i = false;
    for (let t = 0; t < this.children.length; ++t) {
      if (this.children[t] === e) {
        i = true;
        break;
      }
    }
    return (
      !!i &&
      (this.children[0] === e
        ? e.nextElementSibling &&
          t.isResizer(e.nextElementSibling) &&
          this.removeChild(e.nextElementSibling)
        : e.previousElementSibling &&
          t.isResizer(e.previousElementSibling) &&
          this.removeChild(e.previousElementSibling),
      this.removeChild(e),
      this._collapse())
    );
  },
};
module.exports = i;
