"use strict";
const e = require("./utils");
const t = require("../utils/resource-mgr");
const i = require("../utils/dom-utils");
const s = require("../behaviors/focusable");
const r = require("../behaviors/disable");
const u = require("../behaviors/button-state");

module.exports = e.registerElement("ui-button", {
  behaviors: [s, r, u],
  template: '\n    <div class="inner">\n      <slot></slot>\n    </div>\n  ',
  style: t.getResource("theme://elements/button.css"),
  factoryImpl(e) {
    if (e) {
      this.innerText = e;
    }
  },
  ready() {
    this._initFocusable(this);
    this._initDisable(false);
    this._initButtonState(this);
  },
  _onButtonClick() {
    setTimeout(() => {
      i.fire(this, "confirm", { bubbles: true });
    }, 1);
  },
});
