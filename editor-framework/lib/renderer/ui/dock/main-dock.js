"use strict";
const e = require("../../console");
const t = require("../utils/dock-utils");
const a = require("../utils/focus-mgr");
const r = require("../utils/drag-drop");
const i = require("./dock");
const o = require("../../ipc");

module.exports = class extends i {
  static get tagName() {
    return "ui-main-dock";
  }
  constructor() {
    super();
    this._initEvents();
    t.root = this;
  }
  connectedCallback() {
    this.noCollapse = true;

    this._loadLayout((t) => {
      if (t) {
        e.error(`Failed to load layout: ${t.stack}`);
      }

      a._setFocusPanelFrame(null);
    });
  }
  _finalizeStyle() {
    super._finalizeStyle();
    this.style.minWidth = "";
    this.style.minHeight = "";
  }
  _initEvents() {
    this.addEventListener("dragenter", (e) => {
      if ("tab" === r.type(e.dataTransfer)) {
        e.stopPropagation();
        t.dragenterMainDock();
      }
    });

    this.addEventListener("dragleave", (e) => {
      if ("tab" === r.type(e.dataTransfer)) {
        e.stopPropagation();
        t.dragleaveMainDock();
      }
    });

    this.addEventListener("dragover", (e) => {
      if ("tab" === r.type(e.dataTransfer)) {
        e.preventDefault();
        e.stopPropagation();
        r.updateDropEffect(e.dataTransfer, "move");
        t.dragoverMainDock(e.x, e.y);
      }
    });

    this.addEventListener("drop", (e) => {
      if ("tab" !== r.type(e.dataTransfer)) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      let a = r.items(e.dataTransfer)[0];
      t.dropMainDock(a);
    });
  }
  _loadLayout(e) {
    o.sendToMain("editor:window-query-layout", (a, r) => {
      if (a) {
        if (e) {
          e(a);
        }

        return;
      }
      t.reset(this, r, (t) => {
        if (e) {
          e(t);
        }
      });
    });
  }
};
