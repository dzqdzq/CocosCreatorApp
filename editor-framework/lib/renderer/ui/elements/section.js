"use strict";
const e = require("./utils");
const t = require("../utils/dom-utils");
const i = require("../utils/focus-mgr");
const s = require("../utils/resource-mgr");
const o = require("../behaviors/focusable");
const r = require("../behaviors/disable");

module.exports = e.registerElement("ui-section", {
  get hovering() {
    return null !== this.getAttribute("hovering");
  },
  set hovering(e) {
    if (e) {
      this.setAttribute("hovering", "");
    } else {
      this.removeAttribute("hovering");
    }
  },
  behaviors: [o, r],
  template:
    '\n    <div class="wrapper">\n      <i class="fold icon-fold-up"></i>\n      <slot name="header"></slot>\n    </div>\n    <slot class="content"></slot>\n  ',
  style: s.getResource("theme://elements/section.css"),
  $: { wrapper: ".wrapper", foldIcon: ".fold" },
  factoryImpl(e) {
    let t = document.createElement("span");
    t.innerText = e;
    this.appendChild(t);
  },
  ready() {
    if (null !== this.getAttribute("folded")) {
      this.fold();
    } else {
      this.foldup();
    }

    this._initFocusable(this.$wrapper);
    this._initDisable(true);
    this._initEvents();
  },
  _initEvents() {
    this.$wrapper.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      i._setFocusElement(this);
    });

    this.$wrapper.addEventListener("click", () => {
      if (this._folded) {
        this.foldup();
      } else {
        this.fold();
      }
    });

    this.$wrapper.addEventListener("mouseover", (e) => {
      e.stopImmediatePropagation();
      this.hovering = true;
    });

    this.$wrapper.addEventListener("mouseout", (e) => {
      e.stopImmediatePropagation();
      this.hovering = false;
    });

    this.$wrapper.addEventListener("keydown", (e) => {
      if (37 === e.keyCode) {
        t.acceptEvent(e);
        this.fold();
      } else {
        if (39 === e.keyCode) {
          t.acceptEvent(e);
          this.foldup();
        }
      }
    });
  },
  fold() {
    if (!this._folded) {
      this._folded = true;
      this.$foldIcon.classList.remove("icon-fold-up");
      this.$foldIcon.classList.add("icon-fold");
      this.setAttribute("folded", "");
    }
  },
  foldup() {
    if (this._folded) {
      this._folded = false;
      this.$foldIcon.classList.remove("icon-fold");
      this.$foldIcon.classList.add("icon-fold-up");
      this.removeAttribute("folded");
    }
  },
});
