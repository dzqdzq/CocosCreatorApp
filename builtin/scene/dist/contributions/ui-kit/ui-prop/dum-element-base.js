Object.defineProperty(exports, "__esModule", { value: true });
exports.DumpElementBase = undefined;
const electron_1 = require("electron");

const { getNameByDump, getDocsURL, validatePasteEnable } = require("./utils");

class DumpElementBase {
  $parentElement = null;
  $label = null;
  labelContextMenuEventBind = this.labelContextMenuEvent.bind(this);
  mount(e) {
    var t;

    if (e) {
      e.shadowRoot &&
        this.style &&
        (t = e.shadowRoot.querySelector("#custom-style")) &&
        t.innerHTML !== this.style &&
        (t.innerHTML = this.style);

      e.innerHTML = this.template;
      this.$parentElement = e;
      this.$label = e.querySelector("ui-label");
      this.mounted(e);
    }
  }
  setLabel(e) {
    var t;
    var l;
    var n;

    if (
      this.$label &&
      ((t = getNameByDump(e)),
      (this.$label.value = t),
      (l = e.tooltip ? e.tooltip.trim() : ""))
    ) {
      n = (n = getDocsURL(e))
        ? `
                  <ui-link value='${n}'>
                      <ui-label value="${e.name || t}"></ui-label>
                  </ui-link>`.trim()
        : `<ui-label value="${e.name || t}"></ui-label>`;

      this.$label.setAttribute(
        "tooltip",
        `
                <div style='margin-bottom: 10px'><ui-label style="font-weight:bold;" value="i18n:ENGINE.common.attribute.title"></ui-label>${n}</div><ui-label value="${l}"></ui-label>`.trim()
      );
    }
  }
  pastePropertyValue(e) {
    if (e) {
      try {
        var t = JSON.parse(electron_1.clipboard.readText());
        var { type, value } = t;

        if (
          type &&
          value !== undefined &&
          this.$parentElement &&
          this.$parentElement.dump &&
          this.parseAndSetData(value, this.$parentElement.dump, t)
        ) {
          this.$parentElement.dispatch("change");
          this.$parentElement.dispatch("confirm");
        }
      } catch (e) {
        console.warn("paste error:", e);
      }
    }
  }
  labelContextMenuEvent(e) {
    e.stopPropagation();
    e.preventDefault();

    if (this.$parentElement) {
      const t = electron_1.clipboard.readText();
      e = validatePasteEnable(this.$parentElement.dump, t);
      Editor.Menu.popup({
        menu: [
          {
            label: Editor.I18n.t(
              "scene.property_contextmenu.copy_property_path"
            ),
            click: () => {
              var e;

              if (this.$parentElement && this.$parentElement.dump) {
                e = (e = this.$parentElement.dump).path || e.name;
                electron_1.clipboard.writeText(e || "");
              }
            },
          },
          { type: "separator" },
          {
            label: Editor.I18n.t(
              "scene.property_contextmenu.copy_property_value"
            ),
            click: () => {
              var e;
              var t;
              var l;
              var n;

              if (this.$parentElement) {
                ({
                  type: e = "",
                  value: n,
                  enumList: t,
                  bitmaskList: l,
                } = this.$parentElement.dump);

                n = { type: e, value: n };
                e === "Enum" && (n.enumList = t);
                e === "BitMask" && (n.bitmaskList = l);
                electron_1.clipboard.writeText(JSON.stringify(n));
              }
            },
          },
          {
            label: Editor.I18n.t(
              "scene.property_contextmenu.paste_property_value"
            ),
            enabled: e,
            click: () => this.pastePropertyValue(t),
          },
        ],
      });
    }
  }
  parseAndSetData(e, t, l) {
    return false;
  }
  ready() {
    if (this.$label) {
      this.$label.addEventListener(
        "contextmenu",
        this.labelContextMenuEventBind
      );
    }
  }
  update(e) {
    this.setLabel(e);

    if (
      !this.$parentElement &&
      this.$label &&
      (e = this.$label.parentElement) &&
      e.dump
    ) {
      this.$parentElement = e;
    }
  }
  close() {
    this.$parentElement = null;
  }
  isEventMethod(e) {
    return typeof e == "function";
  }
  get listeners() {
    return this._listeners.reduce((e, t) => {
      var l = this[t];

      if (this.isEventMethod(l)) {
        e[t.toString()] = l.bind(this);
      }

      return e;
    }, {});
  }
}
exports.DumpElementBase = DumpElementBase;
