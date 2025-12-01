"use strict";
const e = require("./utils");
const i = require("../behaviors/droppable");
const r = require("../behaviors/disable");

module.exports = e.registerElement("ui-drop-area", {
  shadowDOM: false,
  behaviors: [i, r],
  ready() {
    this._initDroppable(this);
    this._initDisable(false);
  },
});
