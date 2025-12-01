"use strict";
const t = require("../settings");
const e = require("./utils");
const i = require("../../../share/utils");
const s = require("../../../share/math");
const a = require("../utils/resource-mgr");
const n = require("../utils/dom-utils");
const h = require("../utils/focus-mgr");
const u = require("../behaviors/focusable");
const l = require("../behaviors/disable");
const r = require("../behaviors/readonly");
const p = require("../behaviors/input-state");

module.exports = e.registerElement("ui-slider", {
  get value() {
    return this._value;
  },
  set value(t) {
    if (!t) {
      t = 0;
    }

    t = s.clamp(t, this._min, this._max);
    this._value = t;
    this._updateNubbinAndInput();
  },
  get values() {
    return this._values;
  },
  set values(t) {
    return (this._values = t);
  },
  get min() {
    return this._min;
  },
  set min(t) {
    if (null === t || void 0 === t) {
      this._min = null;
      return;
    }

    if (this._min !== t) {
      this._min = parseFloat(t);
    }
  },
  get max() {
    return this._max;
  },
  set max(t) {
    if (null === t || void 0 === t) {
      this._max = null;
      return;
    }

    if (this._max !== t) {
      this._max = parseFloat(t);
    }
  },
  get precision() {
    return this._precision;
  },
  set precision(t) {
    if (void 0 !== t &&
      null !== t &&
      this._precision !== t) {
      this._precision = parseInt(t);
    }
  },
  get step() {
    return this._step;
  },
  set step(e) {
    if (void 0 !== e &&
      null !== e &&
      this._step !== e) {
      this._step = parseFloat(e);
      this._step = 0 === this._step ? t.stepFloat : this._step;
    }
  },
  get snap() {
    return this._snap;
  },
  set snap(t) {
    if (void 0 !== t && null !== t && this._snap !== t) {
      this._snap = t;
    }
  },
  get multiValues() {
    return this._multiValues;
  },
  set multiValues(t) {
    if ((t = !(null == t || false === t)) !== this._multiValues) {
      this._multiValues = t;

      if (t) {
        this.setAttribute("multi-values", "");
      } else {
        this.removeAttribute("multi-values");
      }

      this._multiValues = t;
    }
  },
  get observedAttributes() {
    return ["precision", "min", "max", "multi-values"];
  },
  attributeChangedCallback(t, e, i) {
    if (e !== i) {
      switch (t) {
        case "multi-values":
        case "precision":
          this[
            t.replace(/\-(\w)/g, function (t, e) {
              return e.toUpperCase();
            })
          ] = i;
      }

      if ("min" === t) {
        this.min = i;
      } else {
        if ("max" === t) {
          this.max = i;
        }
      }
    }
  },
  behaviors: [u, l, r, p],
  template:
    '\n    <div class="wrapper">\n      <div class="track"></div>\n      <div class="nubbin"></div>\n    </div>\n    <input></input>\n  ',
  style: a.getResource("theme://elements/slider.css"),
  $: {
    wrapper: ".wrapper",
    track: ".track",
    nubbin: ".nubbin",
    input: "input",
  },
  factoryImpl(t) {
    if (!isNaN(t)) {
      this.value = t;
    }
  },
  ready() {
    let e = this.getAttribute("precision");
    this._precision = null !== e ? parseInt(e) : 1;
    let i = this.getAttribute("min");
    this._min = null !== i ? parseFloat(i) : 0;
    let a = this.getAttribute("max");
    this._max = null !== a ? parseFloat(a) : 1;
    let n = this.getAttribute("value");
    this._value = null !== n ? parseFloat(n) : 0;

    this._value = this._initValue =
        s.clamp(this._value, this._min, this._max);

    let h = this.getAttribute("step");
    this._step = null !== h ? parseFloat(h) : t.stepFloat;
    this._snap = null !== this.getAttribute("snap");
    this.multiValues = this.getAttribute("multi-values");
    this._dragging = false;
    this._updateNubbinAndInput();
    this._initFocusable([this.$wrapper, this.$input], this.$input);
    this._initDisable(false);
    this._initReadonly(false);
    this._initInputState(this.$input);
    this.$input.readOnly = this.readonly;
    this._initEvents();
  },
  _initEvents() {
    this.addEventListener("mousedown", this._mouseDownHandler);
    this.addEventListener("focus-changed", this._focusChangedHandler);

    this.$wrapper.addEventListener(
      "keydown",
      this._wrapperKeyDownHandler.bind(this)
    );

    this.$wrapper.addEventListener(
      "keyup",
      this._wrapperKeyUpHandler.bind(this)
    );

    this.$wrapper.addEventListener(
      "mousedown",
      this._wrapperMouseDownHandler.bind(this)
    );

    this.$input.addEventListener("keydown", (t) => {
      if (38 === t.keyCode) {
        n.acceptEvent(t);

        if (!this.readonly) {
          this._stepUp(t);
        }
      } else {
        if (40 === t.keyCode) {
          n.acceptEvent(t);

          if (!this.readonly) {
            this._stepDown(t);
          }
        }
      }
    });
  },
  _mouseDownHandler(t) {
    n.acceptEvent(t);
    h._setFocusElement(this);
  },
  _wrapperMouseDownHandler(t) {
    n.acceptEvent(t);
    h._setFocusElement(this);
    this.$wrapper.focus();
    if (this.readonly) {
      return;
    }
    this._initValue = this._value;
    this._dragging = true;
    let e = this.$track.getBoundingClientRect();
    let i = (t.clientX - e.left) / this.$track.clientWidth;
    let a = this._min + i * (this._max - this._min);

    if (this._snap) {
      a = this._snapToStep(a);
    }

    let u = this._formatValue(a);
    this.$input.value = u;
    this._value = parseFloat(u);
    this._updateNubbin();
    this._emitChange();

    n.startDrag(
      "ew-resize",
      t,
      (t) => {
        let i = (t.clientX - e.left) / this.$track.clientWidth;
        i = s.clamp(i, 0, 1);
        let a = this._min + i * (this._max - this._min);

        if (this._snap) {
          a = this._snapToStep(a);
        }

        let n = this._formatValue(a);
        this.$input.value = n;
        this._value = parseFloat(n);
        this._updateNubbin();
        this._emitChange();
      },
      () => {
        this._dragging = false;
        this.confirm();
      }
    );
  },
  _wrapperKeyDownHandler(t) {
    if (!this.disabled) {
      if (13 === t.keyCode || 32 === t.keyCode) {
        n.acceptEvent(t);
        this.$input._initValue = this.$input.value;
        this.$input.focus();
        this.$input.select();
      } else {
        if (27 === t.keyCode) {
          if (this._dragging) {
            n.acceptEvent(t);
            this._dragging = false;
            n.cancelDrag();
          }

          this.cancel();
        } else {
          if (37 === t.keyCode) {
            n.acceptEvent(t);
            if (this.readonly) {
              return;
            }
            this._stepDown(t);
          } else {
            if (39 === t.keyCode) {
              n.acceptEvent(t);
              if (this.readonly) {
                return;
              }
              this._stepUp(t);
            }
          }
        }
      }
    }
  },
  _stepUp(e) {
    let i = this._step;

    if (e.shiftKey) {
      i *= t.shiftStep;
    }

    this._value = s.clamp(this._value + i, this._min, this._max);
    this._updateNubbinAndInput();
    this._emitChange();
  },
  _stepDown(e) {
    let i = this._step;

    if (e.shiftKey) {
      i *= t.shiftStep;
    }

    this._value = s.clamp(this._value - i, this._min, this._max);
    this._updateNubbinAndInput();
    this._emitChange();
  },
  _wrapperKeyUpHandler(t) {
    if (37 === t.keyCode || 39 === t.keyCode) {
      n.acceptEvent(t);
      if (this.readonly) {
        return;
      }
      this.confirm();
    }
  },
  _parseInput() {
    if (null === this.$input.value) {
      return this._min;
    }
    if ("" === this.$input.value.trim()) {
      return this._min;
    }
    let t = parseFloat(this.$input.value);

    if (isNaN(t)) {
      t = parseFloat(this.$input._initValue);
      t = parseFloat(this._formatValue(t));
    } else {
      t = parseFloat(this._formatValue(t));
    }

    return (t = s.clamp(t, this._min, this._max));
  },
  _updateNubbin() {
    let t = (this._value - this._min) / (this._max - this._min);
    this.$nubbin.style.left = `${100 * t}%`;
  },
  _updateNubbinAndInput() {
    let t = (this._value - this._min) / (this._max - this._min);
    this.$nubbin.style.left = `${100 * t}%`;
    this.$input.value = this._formatValue(this._value);
  },
  confirm() {
    if (this._changed) {
      this._changed = false;
      this._initValue = this._value;
      this._updateNubbinAndInput();
      n.fire(this, "confirm", { bubbles: true, detail: { value: this._value } });
    }
  },
  cancel() {
    if (this._changed) {
      this._changed = false;

      if (this._value !== this._initValue) {
        this._value = this._initValue;
        this._updateNubbinAndInput();

        n.fire(this, "change", {
          bubbles: true,
          detail: { value: this._value },
        });
      }

      n.fire(this, "cancel", { bubbles: true, detail: { value: this._value } });
    }
  },
  _onInputConfirm(t, e) {
    if (!this.readonly && this._changed) {
      this._changed = false;
      let i = this._parseInput();
      t.value = i;
      t._initValue = i;
      this._value = i;
      this._initValue = i;
      this._updateNubbin();

      n.fire(this, "confirm", {
        bubbles: true,
        detail: { value: this._value, confirmByEnter: e },
      });
    }

    if (e) {
      this.$wrapper.focus();
    }
  },
  _onInputCancel(t, e) {
    if (!this.readonly && this._changed) {
      this._changed = false;
      if ((t._initValue !== t.value)) {
        t.value = t._initValue;
        let e = this._parseInput();
        t.value = e;
        this._value = e;
        this._initValue = e;
        this._updateNubbin();

        n.fire(this, "change", {
          bubbles: true,
          detail: { value: this._value },
        });
      }
      n.fire(this, "cancel", {
        bubbles: true,
        detail: { value: this._value, cancelByEsc: e },
      });
    }

    if (e) {
      this.$wrapper.focus();
    }
  },
  _onInputChange() {
    let t = this._parseInput();
    this._value = t;
    this._updateNubbin();
    this._emitChange();
  },
  _focusChangedHandler() {
    if (!this.focused) {
      this._unselect(this.$input);
    }
  },
  _emitChange() {
    this._changed = true;
    n.fire(this, "change", { bubbles: true, detail: { value: this._value } });
  },
  _snapToStep(t) {
    let e = Math.round((t - this._value) / this._step);
    t = this._value + this._step * e;
    return s.clamp(t, this.min, this.max);
  },
  _formatValue(t) {
    return null === t || "" === t
      ? ""
      : 0 === this._precision
      ? i.toFixed(t, this._precision)
      : i.toFixed(t, this._precision, this._precision);
  },
});
