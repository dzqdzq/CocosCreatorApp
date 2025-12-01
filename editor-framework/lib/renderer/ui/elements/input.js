"use strict";
const t = require("./utils");
const e = require("../utils/resource-mgr");
const i = require("../utils/dom-utils");
const s = require("../utils/focus-mgr");
const u = require("../behaviors/focusable");
const l = require("../behaviors/disable");
const a = require("../behaviors/readonly");
const n = require("../behaviors/input-state");

module.exports = t.registerElement("ui-input", {
  get value() {
    return this.$input.value;
  },
  set value(t) {
    if (!t) {
      t = "";
    }

    t += "";
    this._value = t;

    if (!this.multiValues) {
      if (null !== this._maxLength) {
        this.$input.value = t.substr(0, this._maxLength);
      } else {
        this.$input.value = t;
      }
    }
  },
  get values() {
    return this._values;
  },
  set values(t) {
    this._values = t;

    if (this.multiValues) {
      this._updateMultiValue();
    }
  },
  get placeholder() {
    return this.$input.placeholder;
  },
  set placeholder(t) {
    this.$input.placeholder = t;
  },
  get password() {
    return "password" === this.$input.type;
  },
  set password(t) {
    this.$input.type = true === t ? "password" : "";
  },
  get maxLength() {
    return this._maxLength;
  },
  set maxLength(t) {
    if (null !== t) {
      t -= 0;
    }

    if (isNaN(t)) {
      t = null;
    }

    this._maxLength = t;

    if (t) {
      this.$input.value = this._value.substr(0, this._maxLength);
    }
  },
  get multiValues() {
    return this._multiValues;
  },
  set multiValues(t) {
    if ((t = !(null == t || false === t)) !== this._multiValues) {
      this._multiValues = t;
      this._updateMultiValue();
    }
  },
  get observedAttributes() {
    return ["placeholder", "password", "multi-values"];
  },
  attributeChangedCallback(t, e, i) {
    if (
      e !== i &&
      ("placeholder" === t || "password" === t || "multi-values" === t)
    ) {
      this[
        t.replace(/\-(\w)/g, function (t, e) {
          return e.toUpperCase();
        })
      ] = i;
    }
  },
  behaviors: [u, l, a, n],
  template: "\n    <input></input>\n  ",
  style: e.getResource("theme://elements/input.css"),
  $: { input: "input" },
  factoryImpl(t) {
    if (t) {
      this.value = t;
    }
  },
  ready() {
    this._value = "";
    this._values = [""];
    this.$input.value = this.getAttribute("value");
    this.$input.placeholder = this.getAttribute("placeholder") || "";
    this.$input.type = null !== this.getAttribute("password") ? "password" : "";
    this.maxLength = this.getAttribute("max-length");
    this.multiValues = this.getAttribute("multi-values");
    this._initFocusable(this, this.$input);
    this._initDisable(false);
    this._initReadonly(false);
    this._initInputState(this.$input);
    this.$input.readOnly = this.readonly;
    this._initEvents();
  },
  clear() {
    this.$input.value = "";
    this.confirm();
  },
  confirm() {
    this._onInputConfirm(this.$input);
  },
  cancel() {
    this._onInputCancel(this.$input);
  },
  _setIsReadonlyAttribute(t) {
    if (t) {
      this.setAttribute("is-readonly", "");
    } else {
      this.removeAttribute("is-readonly");
    }

    this.$input.readOnly = t;
  },
  _initEvents() {
    this.addEventListener("mousedown", this._mouseDownHandler);
    this.addEventListener("keydown", this._keyDownHandler);
    this.addEventListener("focus-changed", this._focusChangedHandler);
  },
  _onInputConfirm(t, e) {
    if (!this.readonly) {
      if (this._changed) {
        this._changed = false;
        t._initValue = t.value;
        this._value = t.value;
        this.multiValues = false;

        i.fire(this, "confirm", {
          bubbles: true,
          detail: { value: t.value, confirmByEnter: e },
        });
      }
    }

    if (e) {
      this.focus();
    }
  },
  _onInputCancel(t, e) {
    if (!this.readonly) {
      if (this._changed) {
        this._changed = false;

        if (t._initValue !== t.value) {
          t.value = t._initValue;
          this._value = t._initValue;
          i.fire(this, "change", { bubbles: true, detail: { value: t.value } });
        }

        i.fire(this, "cancel", {
          bubbles: true,
          detail: { value: t.value, cancelByEsc: e },
        });
      }
    }

    if (e) {
      t.blur();
      this.focus();
    }
  },
  _onInputChange(t) {
    this._changed = true;

    if (this._maxLength &&
      t.value.length > this._maxLength) {
      t.value = t.value.substr(0, this._maxLength);
    }

    i.fire(this, "change", { bubbles: true, detail: { value: t.value } });
  },
  _mouseDownHandler(t) {
    t.stopPropagation();
    s._setFocusElement(this);
  },
  _keyDownHandler(t) {
    if (!(this.disabled || (13 !== t.keyCode && 32 !== t.keyCode))) {
      i.acceptEvent(t);
      this.$input._initValue = this.$input.value;
      this.$input.focus();
      this.$input.select();
    }
  },
  _focusChangedHandler() {
    if (this.focused) {
      this.$input._initValue = this.$input.value;
    } else {
      this._unselect(this.$input);
    }
  },
  _updateMultiValue() {
    if (!this.multiValues || !this._values || this.values.length <= 1) {
      this.$input.value = this._value;
      return this.$input.removeAttribute("multi-values");
    }

    if (this._values.every((t, e) => 0 === e || t === this._values[e - 1])) {
      this.$input.removeAttribute("multi-values");
    } else {
      this.$input.value = "-";
      this.$input.setAttribute("multi-values", "");
    }
  },
});
