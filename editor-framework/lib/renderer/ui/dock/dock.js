"use strict";
const e = require("../../../share/js-utils");
const t = require("../utils/dock-utils");
const i = require("../utils/dom-utils");
const r = require("../behaviors/dockable");
class h extends window.HTMLElement {
  static get tagName() {
    return "ui-dock";
  }
  get row() {
    return null !== this.getAttribute("row");
  }
  set row(e) {
    if (e) {
      this.setAttribute("row", "");
    } else {
      this.removeAttribute("row");
    }
  }
  constructor() {
    super();
    let e = this.attachShadow({ mode: "open" });
    e.innerHTML = '\n      <div class="content">\n        <slot select="ui-dock,ui-dock-panel,ui-dock-resizer"></slot>\n      </div>\n    ';

    e.insertBefore(
      i.createStyleElement("theme://elements/dock.css"),
      e.firstChild
    );

    this._initDockable();
    this._initResizers();
  }
  _initResizers() {
    if (this.children.length > 1) {
      for (let e = 0; e < this.children.length; ++e) {
        if (e !== this.children.length - 1) {
          let t = this.children[e + 1];
          let i = document.createElement("ui-dock-resizer");
          i.vertical = this.row;
          this.insertBefore(i, t);
          e += 1;
        }
      }
    }
  }
  _collapseRecursively() {
    for (let e = 0; e < this.children.length; ++e) {
      let t = this.children[e];

      if (t._dockable) {
        t._collapseRecursively();
      }
    }
    this._collapse();
  }
  _reflowRecursively() {
    this._reflow();
    for (let e = 0; e < this.children.length; ++e) {
      let t = this.children[e];

      if (t._dockable) {
        t._reflowRecursively();
      }
    }
  }
  _updatePreferredSizeRecursively() {
    for (let e = 0; e < this.children.length; ++e) {
      let t = this.children[e];

      if (t._dockable) {
        t._updatePreferredSizeRecursively();
      }
    }
    this._preferredWidth = this.clientWidth;
    this._preferredHeight = this.clientHeight;
  }
  _finalizePreferredSizeRecursively() {
    for (let e = 0; e < this.children.length; ++e) {
      let t = this.children[e];

      if (t._dockable) {
        t._finalizePreferredSizeRecursively();
      }
    }
    this._finalizePreferredSize();
  }
  _finalizeMinMaxRecursively() {
    for (let e = 0; e < this.children.length; ++e) {
      let t = this.children[e];

      if (t._dockable) {
        t._finalizeMinMaxRecursively();
      }
    }
    this._finalizeMinMax();
  }
  _finalizeStyleRecursively() {
    this._finalizeStyle();
    for (let e = 0; e < this.children.length; ++e) {
      let t = this.children[e];

      if (t._dockable) {
        t._finalizeStyleRecursively();
      }
    }
  }
  _finalizePreferredSize() {
    let e = t.resizerSpace;
    let i = [];
    for (let e = 0; e < this.children.length; ++e) {
      let t = this.children[e];

      if (t._dockable) {
        i.push(t);
      }
    }
    if ("auto" === this._preferredWidth) {
      let t = false;
      if (this.row) {
        this._preferredWidth = i.length > 0 ? e * (i.length - 1) : 0;
        for (let e = 0; e < i.length; ++e) {
          let r = i[e];

          if (t || "auto" === r._preferredWidth) {
            t = true;
            this._preferredWidth = "auto";
          } else {
            this._preferredWidth += r._preferredWidth;
          }
        }
      } else {
        this._preferredWidth = 0;
        for (let e = 0; e < i.length; ++e) {
          let r = i[e];

          if (t || "auto" === r._preferredWidth) {
            t = true;
            this._preferredWidth = "auto";
          } else {
            if (r._preferredWidth > this._preferredWidth) {
              this._preferredWidth = r._preferredWidth;
            }
          }
        }
      }
    }
    if ("auto" === this._preferredHeight) {
      let t = false;
      if (this.row) {
        this._preferredHeight = 0;
        for (let e = 0; e < i.length; ++e) {
          let r = i[e];

          if (t || "auto" === r._preferredHeight) {
            t = true;
            this._preferredHeight = "auto";
          } else {
            if (r._preferredHeight > this._preferredHeight) {
              this._preferredHeight = r._preferredHeight;
            }
          }
        }
      } else {
        this._preferredHeight = i.length > 0 ? e * (i.length - 1) : 0;
        for (let e = 0; e < i.length; ++e) {
          let r = i[e];

          if (t || "auto" === r._preferredHeight) {
            t = true;
            this._preferredHeight = "auto";
          } else {
            this._preferredHeight += r._preferredHeight;
          }
        }
      }
    }
  }
  _finalizeMinMax() {
    let e = t.resizerSpace;
    let i = [];
    for (let e = 0; e < this.children.length; ++e) {
      let t = this.children[e];

      if (t._dockable) {
        i.push(t);
      }
    }
    if (this.row) {
      this._computedMinWidth = i.length > 0 ? e * (i.length - 1) : 0;
      this._computedMinHeight = 0;
      for (let e = 0; e < i.length; ++e) {
        let t = i[e];
        this._computedMinWidth += t._computedMinWidth;

        if (this._computedMinHeight < t._computedMinHeight) {
          this._computedMinHeight = t._computedMinHeight;
        }
      }
    } else {
      this._computedMinWidth = 0;
      this._computedMinHeight = i.length > 0 ? e * (i.length - 1) : 0;
      for (let e = 0; e < i.length; ++e) {
        let t = i[e];

        if (this._computedMinWidth < t._computedMinWidth) {
          this._computedMinWidth = t._computedMinWidth;
        }

        this._computedMinHeight += t._computedMinHeight;
      }
    }
  }
  _finalizeStyle() {
    this.style.minWidth = `${this._computedMinWidth}px`;
    this.style.minHeight = `${this._computedMinHeight}px`;
    if (1 === this.children.length) {
      this.children[0].style.flex = "1 1 auto";
    } else {
      for (let e = 0; e < this.children.length; ++e) {
        let t = this.children[e];
        if (t._dockable) {
          let e = this.row ? t._preferredWidth : t._preferredHeight;
          t.style.flex = "auto" === e ? "1 1 auto" : `0 0 ${e}px`;
        }
      }
    }
  }
  _reflow() {
    let e = this.children.length;
    let t = new Array(e);
    let i = 0;
    for (let r = 0; r < e; ++r) {
      let e = this.children[r];
      let h = this.row ? e.offsetWidth : e.offsetHeight;
      t[r] = h;

      if (e._dockable) {
        i += h;
      }
    }
    for (let e = 0; e < this.children.length; ++e) {
      let r = this.children[e];
      if (r._dockable) {
        let h = t[e] / i;
        r.style.flex = `${h} ${h} 0px`;
      }
    }
  }
}
e.addon(h.prototype, r);
module.exports = h;
