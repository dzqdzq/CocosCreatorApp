"use strict";
const e = require("../../../share/js-utils");
const t = require("../utils/dock-utils");
const i = require("../utils/dom-utils");
const s = require("../utils/focus-mgr");
const r = require("../behaviors/dockable");
class a extends window.HTMLElement {
  static get tagName() {
    return "ui-dock-panel";
  }
  get focusable() {
    return true;
  }
  get focused() {
    return null !== this.getAttribute("focused");
  }
  get activeTab() {
    return this.$tabs.activeTab;
  }
  get activeIndex() {
    return i.index(this.$tabs.activeTab);
  }
  get tabCount() {
    return this.$tabs.children.length;
  }
  constructor() {
    super();
    let e = this.attachShadow({ mode: "open" });
    e.innerHTML = '\n      <ui-dock-tabs id="tabs"></ui-dock-tabs>\n      <div class="border">\n        <div class="frame-wrapper">\n          <slot></slot>\n        </div>\n      </div>\n    ';

    e.insertBefore(
      i.createStyleElement("theme://elements/panel.css"),
      e.firstChild
    );

    requestAnimationFrame(() => {
      this.tabIndex = -1;
    });

    this.$tabs = this.shadowRoot.querySelector("#tabs");
    this._initDockable();
    this._initTabs();
    this.$tabs.addEventListener("tab-changed", this._onTabChanged.bind(this));

    this.addEventListener(
      "keydown",
      (e) => {
        if (
          (e.shiftKey && e.metaKey && 221 === e.keyCode) ||
          (e.ctrlKey && 9 === e.keyCode)
        ) {
          e.stopPropagation();
          let t = this.activeIndex + 1;

          if (t >= this.tabCount) {
            t = 0;
          }

          this.select(t);
          return;
        }
        if (
          (e.shiftKey && e.metaKey && 219 === e.keyCode) ||
          (e.ctrlKey && e.shiftKey && 9 === e.keyCode)
        ) {
          e.stopPropagation();
          let t = this.activeIndex - 1;

          if (t < 0) {
            t = this.tabCount - 1;
          }

          this.select(t);
          return;
        }
      },
      true
    );

    this.addEventListener(
      "mousedown",
      (e) => {
        if (1 === e.which) {
          s._setFocusPanelFrame(this.activeTab.frameEL);
        }
      },
      true
    );

    this.addEventListener("mousedown", (e) => {
      if (1 === e.which) {
        s._setFocusElement(null);
      }
    });
  }
  _getFirstFocusableElement() {
    return this;
  }
  _setFocused(e) {
    this.$tabs._setFocused(e);

    if (e) {
      this.setAttribute("focused", "");
    } else {
      this.removeAttribute("focused");
    }
  }
  _onTabChanged(e) {
    e.stopPropagation();
    let s = e.detail;

    if (null !== s.oldTab) {
      s.oldTab.frameEL.style.display = "none";
      i.fire(s.oldTab.frameEL, "panel-hide");
    }

    if (null !== s.newTab) {
      s.newTab.frameEL.style.display = "";
      i.fire(s.newTab.frameEL, "panel-show");
      this._notifyResize();
    }

    t.saveLayout();
  }
  _initTabs() {
    let e = this.$tabs;
    e.panelEL = this;
    for (let t = 0; t < this.children.length; ++t) {
      let i = this.children[t];
      let s = i.name;
      let r = e.addTab(s);
      r.setAttribute("draggable", "true");
      i.style.display = "none";
      r.frameEL = i;
      r.setIcon(i.icon);
    }
    e.select(0);
  }
  _collapseRecursively() {
    this._collapse();
  }
  _reflowRecursively() {}
  _updatePreferredSizeRecursively() {
    this._preferredWidth = this.clientWidth;
    this._preferredHeight = this.clientHeight;
  }
  _finalizePreferredSizeRecursively() {
    this._calcPreferredSizeByFrames();
  }
  _finalizeMinMaxRecursively() {
    this._calcMinMaxByFrames();
  }
  _finalizeStyleRecursively() {
    this.style.minWidth = `${this._computedMinWidth}px`;
    this.style.minHeight = `${this._computedMinHeight}px`;
  }
  _notifyResize() {
    for (let e = 0; e < this.children.length; ++e) {
      let t = this.children[e];
      i.fire(t, "panel-resize");
    }
  }
  _calcPreferredSizeByFrames() {
    let e = t.tabbarSpace;
    let i = t.panelSpace;
    if ("auto" === this._preferredWidth) {
      let e = false;
      this._preferredWidth = 0;
      for (let t = 0; t < this.children.length; ++t) {
        let s = this.children[t];
        if (e || "auto" === s.width) {
          e = true;
          this._preferredWidth = "auto";
        } else {
          let e = s.width + i;

          if (e > this._preferredWidth) {
            this._preferredWidth = e;
          }
        }
      }
    }
    if ("auto" === this._preferredHeight) {
      let t = false;
      this._preferredHeight = 0;
      for (let s = 0; s < this.children.length; ++s) {
        let r = this.children[s];
        if (t || "auto" === r.height) {
          t = true;
          this._preferredHeight = "auto";
        } else {
          let t = r.height + e + i;

          if (t > this._preferredHeight) {
            this._preferredHeight = t;
          }
        }
      }
    }
  }
  _calcMinMaxByFrames() {
    let e = t.tabbarSpace;
    let i = t.panelSpace;
    this._computedMinWidth = 0;
    this._computedMinHeight = 0;
    for (let e = 0; e < this.children.length; ++e) {
      let t = this.children[e];

      if (this._computedMinWidth < t.minWidth) {
        this._computedMinWidth = t.minWidth;
      }

      if (this._computedMinHeight < t.minHeight) {
        this._computedMinHeight = t.minHeight;
      }
    }
    this._computedMinWidth = this._computedMinWidth + i;
    this._computedMinHeight = this._computedMinHeight + e + i;
    this._computedMinHeight -= 100;
  }
  _collapse() {
    return (
      !(0 !== this.$tabs.children.length || !this.parentNode._dockable) &&
      this.parentNode.removeDock(this)
    );
  }
  outOfDate(e) {
    let t = this.$tabs;
    if ("number" == typeof e) {
      t.outOfDate(e);
    } else {
      for (let i = 0; i < this.children.length; ++i) {
        if (e === this.children[i]) {
          t.outOfDate(i);
          break;
        }
      }
    }
  }
  select(e) {
    let t = this.$tabs;
    if ("number" == typeof e) {
      t.select(e);
    } else {
      for (let i = 0; i < this.children.length; ++i) {
        if (e === this.children[i]) {
          t.select(i);
          break;
        }
      }
    }
  }
  insert(e, t, s) {
    let r = this.$tabs;
    r.insertTab(e, s);
    e.setAttribute("draggable", "true");

    if (e.parentNode !== r) {
      t.style.display = "none";
    }

    e.frameEL = t;
    e.setIcon(t.icon);

    if (s) {
      if (t !== s.frameEL) {
        this.insertBefore(t, s.frameEL);
      }
    } else {
      this.appendChild(t);
    }

    this._calcMinMaxByFrames();
    return i.index(e);
  }
  add(e) {
    let t = this.$tabs;
    let i = e.name;
    let s = t.addTab(i);
    s.setAttribute("draggable", "true");
    e.style.display = "none";
    s.frameEL = e;
    s.setIcon(e.icon);
    this.appendChild(e);
    this._calcMinMaxByFrames();
    return this.children.length - 1;
  }
  closeNoCollapse(e) {
    this.$tabs.removeTab(e);
    if ((e.frameEL)) {
      e.frameEL.parentNode.removeChild(e.frameEL);
      e.frameEL = null;
    }
    this._calcMinMaxByFrames();
  }
  close(e) {
    this.closeNoCollapse(e);
    this._collapse();
  }
}
e.addon(a.prototype, r);
module.exports = a;
