"use strict";
const e = require("./utils");
const s = require("../utils/resource-mgr");
const i = require("../behaviors/focusable");
const t = require("../behaviors/disable");

module.exports = e.registerElement("ui-box-container", {
  behaviors: [i, t],
  style: s.getResource("theme://elements/box-container.css"),
  template: "\n    <slot></slot>\n  ",
  ready() {
    this._initFocusable(this);
    this._initDisable(true);
  },
});
