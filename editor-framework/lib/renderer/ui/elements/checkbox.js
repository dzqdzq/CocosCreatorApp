"use strict";
const e = require("./utils");
const t = require("../utils/resource-mgr");
const i = require("../utils/dom-utils");
const s = require("../behaviors/focusable");
const u = require("../behaviors/disable");
const l = require("../behaviors/readonly");
const r = require("../behaviors/button-state");

module.exports = e.registerElement("ui-checkbox", {
  get checked() {
    return null !== this.getAttribute("checked");
  },
  set checked(e) {
    if (e || "" === e || 0 === e) {
      this.setAttribute("checked", "");
    } else {
      this.removeAttribute("checked");
    }
  },
  get value() {
    return this.checked;
  },
  set value(e) {
    this.checked = e;
  },
  get values() {
    return this._values;
  },
  set values(e) {
    this._values = e;
    this._updateMultiValue();
  },
  get multiValues() {
    return this._multiValues;
  },
  set multiValues(e) {
    if ((e = !(null == e || false === e)) !== this._multiValues) {
      this._multiValues = e;
      this._updateMultiValue();
    }
  },
  get observedAttributes() {
    return ["checked", "multi-values"];
  },
  attributeChangedCallback(e, t, i) {
    if (t !== i && ("checked" === e || "multi-values" === e)) {
      this[
        e.replace(/\-(\w)/g, function (e, t) {
          return t.toUpperCase();
        })
      ] = i;
    }
  },
  behaviors: [s, u, l, r],
  template:
    '\n    <div class="box">\n      <i class="checker icon-ok"></i>\n    </div>\n    <span class="label">\n      <slot></slot>\n    </span>\n  ',
  style: t.getResource("theme://elements/checkbox.css"),
  factoryImpl(e, t) {
    if (t) {
      this.innerText = t;
    }

    this.checked = e;
  },
  ready() {
    this.multiValues = this.getAttribute("multi-values");
    this._initFocusable(this);
    this._initDisable(false);
    this._initReadonly(false);
    this._initButtonState(this);
  },
  _onButtonClick(e, t) {
    if (!this.readonly) {
      t.stopPropagation();
      this.checked = !this.checked;
      this.multiValues = false;
      i.fire(this, "change", { bubbles: true, detail: { value: this.checked } });

      i.fire(this, "confirm", {
        bubbles: true,
        detail: { value: this.checked },
      });
    }
  },
  _updateMultiValue() {
    if (!this.multiValues || !this._values || this.values.length <= 1) {
      return this.removeAttribute("multi-values");
    }

    if (this._values.every((e, t) => 0 === t || e === this._values[t - 1])) {
      this.removeAttribute("multi-values");
    } else {
      this.setAttribute("multi-values", "");
    }
  },
});
