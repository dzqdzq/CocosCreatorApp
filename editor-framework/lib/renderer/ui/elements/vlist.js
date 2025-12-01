"use strict";
const e = require("./utils");
const i = require("../behaviors/focusable");
const s = require("../behaviors/disable");

module.exports = e.registerElement("ui-vlist", {
  behaviors: [i, s],
  template: "\n    <slot></slot>\n  ",
  factoryImpl(e) {
    if (e) {
      this._items = e;
    }
  },
  ready() {
    this._initFocusable(this);
    this._initDisable(true);
  },
});
