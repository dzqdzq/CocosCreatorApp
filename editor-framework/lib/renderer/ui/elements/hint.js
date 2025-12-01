"use strict";
const t = require("./utils");
const s = require("../utils/resource-mgr");

module.exports = t.registerElement("ui-hint", {
  get position() {
    return this._position;
  },
  set position(t) {
    if (this._position !== t) {
      this._position = t;

      if (this.classList.contains("top") || this.classList.contains("bottom")) {
        if ("-" === this._position[0]) {
          this.$arrow.style.right = this._position.substr(1);
        } else {
          this.$arrow.style.left = this._position;
        }
      } else {
        if ((this.classList.contains("left") || this.classList.contains("right"))) {
          if ("-" === this._position[0]) {
            this.$arrow.style.bottom = this._position.substr(1);
          } else {
            this.$arrow.style.top = this._position;
          }
        }
      }
    }
  },
  template:
    '\n    <div class="box">\n      <slot></slot>\n      <div class="arrow"></div>\n    </div>\n  ',
  $: { arrow: ".arrow" },
  style: s.getResource("theme://elements/hint.css"),
  factoryImpl(t) {
    if (t) {
      this.innerText = t;
    }
  },
  ready() {
    let t = this.getAttribute("position");

    if (null === t) {
      t = "50%";
    }

    this.position = t;
  },
});
