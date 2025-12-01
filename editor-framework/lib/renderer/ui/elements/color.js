"use strict";
let e;
const t = require("chroma-js");
const i = require("./utils");
const s = require("../utils/resource-mgr");
const l = require("../utils/dom-utils");
const a = require("../utils/focus-mgr");
const h = require("../behaviors/focusable");
const u = require("../behaviors/disable");
const r = require("../behaviors/readonly");

module.exports = i.registerElement("ui-color", {
  get value() {
    return this._value;
  },
  set value(e) {
    if (!e) {
      e = [0, 0, 0, 1];
    }

    var i = this._value;
    this._value = e;

    if (!(i + "" == this._value + "" || this._multiValues)) {
      this._draw = t(e).rgba();
      this._updateRGB();
      this._updateAlpha();
    }
  },
  get values() {
    return this._values;
  },
  set values(e) {
    var i = this._values;
    this._values = e;

    if (i + "" != e + "" &&
      this._multiValues) {
      this._draw = t(e[0]).rgba();
      this._updateRGB();
      this._updateAlpha();
    }
  },
  get multiValues() {
    return this._multiValues;
  },
  set multiValues(e) {
    var t;

    e = !(null == e || false === e);

    if ((this._multiValues !== e)) {
      this._multiValues = e;

      if (e) {
        if (this._values) {
          t = this._values[0];
        }

        this.setAttribute("multi-values", "");
      } else {
        t = this._value;
        this.removeAttribute("multi-values");
      }

      if (t) {
        this._updateRGB();
        this._updateAlpha();
      }
    }
  },
  get observedAttributes() {
    return ["multi-values"];
  },
  attributeChangedCallback(e, t, i) {
    if (t !== i && "multi-values" == e) {
      this[
        e.replace(/\-(\w)/g, function (e, t) {
          return t.toUpperCase();
        })
      ] = i;
    }
  },
  behaviors: [h, u, r],
  template:
    '\n    <div class="inner">\n      <div class="rgb"></div>\n      <div class="alpha"></div>\n    </div>\n    <div class="mask"></div>\n  ',
  style: s.getResource("theme://elements/color.css"),
  $: { rgb: ".rgb", alpha: ".alpha" },
  factoryImpl(e) {
    if (e) {
      this.value = e;
    }
  },
  ready() {
    this._showing = false;
    let t = this.getAttribute("value");
    this.value = null !== t ? t : [255, 255, 255, 1];
    this.multiValues = this.getAttribute("multi-values");
    this._updateRGB();
    this._updateAlpha();
    this._initFocusable(this);
    this._initDisable(false);
    this._initReadonly(false);
    this._initEvents();

    if (!e) {
      (e = document.createElement("ui-color-picker")).style.position = "fixed";
      e.style.zIndex = 999;
      e.style.display = "none";
    }
  },
  detachedCallback() {
    this._showColorPicker(false);
  },
  _initEvents() {
    this.addEventListener("mousedown", (t) => {
      if (!this.disabled) {
        l.acceptEvent(t);
        a._setFocusElement(this);

        if (!this.readonly) {
          if (this._showing) {
            this._showColorPicker(false);
          } else {
            e.value = this._draw;
            this._showColorPicker(true);
          }
        }
      }
    });

    this.addEventListener("keydown", (t) => {
      if (!(this.readonly ||
        this.disabled || (13 !== t.keyCode && 32 !== t.keyCode))) {
        l.acceptEvent(t);
        e.value = this._draw;
        this._showColorPicker(true);
      }
    });

    this._hideFn = (e) => {
      if (this._changed) {
        this._changed = false;

        if (e.detail.confirm) {
          this._initValue = this._value;

          l.fire(this, "confirm", {
            bubbles: true,
            detail: { value: this._value },
          });
        } else {
          if (this._initValue !== this._value) {
            this.value = this._initValue;

            l.fire(this, "change", {
              bubbles: true,
              detail: { value: this._value },
            });
          }

          l.fire(this, "cancel", {
            bubbles: true,
            detail: { value: this._value },
          });
        }
      }

      this._showColorPicker(false);
    };

    this._changeFn = (e) => {
      this._changed = true;
      this.multiValues = false;
      l.acceptEvent(e);
      this.value = e.detail.value.map((e) => e);

      l.fire(this, "change", {
        bubbles: true,
        detail: { value: this._value },
      });
    };
  },
  _updateRGB() {
    this.$rgb.style.backgroundColor = t(this._draw.slice(0, 3)).hex();
  },
  _updateAlpha() {
    this.$alpha.style.width = `${100 * this._draw[3]}%`;
  },
  _equals(e) {
    return (
      this._value.length === e.length &&
      this._value[0] === e[0] &&
      this._value[1] === e[1] &&
      this._value[2] === e[2] &&
      this._value[3] === e[3]
    );
  },
  _showColorPicker(t) {
    if (this._showing !== t) {
      this._showing = t;

      if (t) {
        this._initValue = this._draw;
        e.addEventListener("hide", this._hideFn);
        e.addEventListener("change", this._changeFn);
        e.addEventListener("confirm", this._confirmFn);
        e.addEventListener("cancel", this._cancelFn);

        l.addHitGhost("default", 998, () => {
          e.hide(true);
        });

        document.body.appendChild(e);
        e._target = this;
        e.style.display = "block";
        this._updateColorPickerPosition();
        a._setFocusElement(e);
      } else {
        e.removeEventListener("hide", this._hideFn);
        e.removeEventListener("change", this._changeFn);
        e.removeEventListener("confirm", this._confirmFn);
        e.removeEventListener("cancel", this._cancelFn);
        l.removeHitGhost();
        e._target = null;
        e.remove();
        e.style.display = "none";
        a._setFocusElement(this);
      }
    }
  },
  _updateColorPickerPosition() {
    window.requestAnimationFrame(() => {
      if (!this._showing) {
        return;
      }
      let t = document.body.getBoundingClientRect();
      let i = this.getBoundingClientRect();
      let s = e.getBoundingClientRect();
      let l = e.style;
      l.left = i.right - s.width + "px";

      if (t.height - i.bottom <= s.height + 10) {
        l.top = t.bottom - s.height - 10 + "px";
      } else {
        l.top = i.bottom - t.top + 10 + "px";
      }

      if (t.width - i.left <= s.width) {
        l.left = t.right - s.width - 10 + "px";
      } else {
        l.left = i.left - t.left + "px";
      }

      this._updateColorPickerPosition();
    });
  },
});
