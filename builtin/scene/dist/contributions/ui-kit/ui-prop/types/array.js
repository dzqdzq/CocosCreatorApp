Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");

const { setElementReadonly } = utils_1;

const dum_element_base_1 = require("../dum-element-base");
class ArrayList extends dum_element_base_1.DumpElementBase {
  type = ["Array"];
  $container = null;
  $numInput = null;
  $icon = null;
  $content = null;
  isExpand = false;
  hoveringTimer = null;
  dragoverEventBind = this.dragoverEvent.bind(this);
  dragleaveEventBind = this.dragleaveEvent.bind(this);
  dragDropEventBind = this.dragDropEvent.bind(this);
  _listeners = ["confirm"];
  parseAndSetData(n, e) {
    return (
      !!this.$numInput &&
      ((this.$numInput.value = n.length),
      this.inputConfirmEvent(e),
      e.value.forEach((e, t) => (e.value = n[t].value)),
      true)
    );
  }
  confirm(e, t) {
    if (
      e.target &&
      e.target === this.$numInput &&
      (this.inputConfirmEvent(t), this.$parentElement)
    ) {
      this.$parentElement.dispatch("change");
    }
  }
  template = `
        <ui-section no-border>
            <div slot="header" class="prop-name">
                <ui-label style="flex: 1; white-space: nowrap;"></ui-label>
                <ui-icon style="display: none; font-size: 10px;" value="lock"></ui-icon>
            </div>
            <ui-num-input slot="header" class="prop-content" step="1" min="0" preci="0"></ui-num-input>
            <ui-list class="content" style="--list-padding: 0px; --item-space: 4px; --ui-prop-margin-left: 4px; margin-left: var(--ui-prop-margin-left); padding: 4px 0px 4px 10px"></ui-list>
        </ui-section>
    `;
  style = ":host { margin-left: 0; }";
  mounted(e) {
    this.$container = e.querySelector("ui-section");
    this.$icon = e.querySelector("ui-icon");
    this.$numInput = e.querySelector("ui-num-input");
    this.$content = e.querySelector(".content");
  }
  queryParentCacheExpend(e) {
    var t = "cache-expand";
    let n = e;

    while (n) {
      if (n.hasAttribute(t)) {
        return n.getAttribute(t) || "";
      }
      n = n.parentElement;
    }

    return "root";
  }
  getCacheKeyInfo(e) {
    var t = "-array-joint-";

    var e =
      this.queryParentCacheExpend(this.$parentElement) +
      "-" +
      (e.name + t + e.type);

    var t = (e.match(new RegExp(`(${t})`, "g")) || []).length || 1;
    return { key: e, deep: t };
  }
  fillContentElement(e, n) {
    if (this.$content) {
      var { readonly, type } = e;
      for (
        var a = e.value, s = Array.from(this.$content.children);
        s.length > a.length;

      ) {
        var t = s.pop();

        if (t) {
          this.$content.removeChild(t);
        }
      }
      for (let t = 0; t < a.length; t++) {
        let e = s[t];

        if (!e) {
          e = document.createElement("ui-list-item");

          (l = document.createElement("ui-prop")).setAttribute(
            "style",
            `flex: 1; --left-width: calc(100% - var(--ui-prop-content-width) + var(--ui-prop-margin-right) * ${n});margin-top:0;`
          );

          e.appendChild(l);
          this.$content.appendChild(e);
        }

        e.setAttribute("index", String(t));
        e.setAttribute("style", "--suffix-margin-left: 5px;");
        e.showSuffix = Boolean(!readonly);
        e.showDrag = Boolean(!readonly);
        var l = e.querySelector("ui-prop");

        if (l) {
          l.setAttribute("type", "dump");
          l.setAttribute("array-index", t.toString());
          type && l.setAttribute("array-type", type);
          l.render(a[t]);
        } else {
          console.log("error $prop");
        }
      }
    }
  }
  inputConfirmEvent(t) {
    if (this.$numInput && this.$parentElement) {
      if (!Array.isArray(t.value)) {
        t.value = [];
      }

      for (var e = Number(this.$numInput.value); t.value.length < e; ) {
        let e = null;

        if (t.elementTypeData) {
          e = JSON.parse(JSON.stringify(t.elementTypeData));
          e.name = t.value.length.toString();
        }

        t.value.push(e);
      }
      t.value.length = e;
      this.isExpand = true;
    }
  }
  queryDragUuids(t) {
    const n = [];
    let e = {};
    try {
      e = JSON.parse(
        JSON.stringify(Editor.UI.__protected__.DragArea.currentDragInfo)
      );
    } catch (e) {
      console.error(e);
    }

    if (e && e.additional) {
      e.additional.forEach((e) => {
        if (e.type === t.type) {
          n.push(e.value);
        }
      });
    }

    return n;
  }
  dragoverEvent(e) {
    var t;
    e.preventDefault();

    if (
      this.$parentElement &&
      (t = this.$parentElement.dump) &&
      t.type &&
      this.queryDragUuids(t).length
    ) {
      clearTimeout(this.hoveringTimer);
      this.$parentElement.setAttribute("hoving", "");
      e.stopPropagation();
    }
  }
  dragleaveEvent() {
    clearTimeout(this.hoveringTimer);

    this.hoveringTimer = setTimeout(() => {
      if (this.$parentElement) {
        this.$parentElement.removeAttribute("hoving");
      }
    }, 200);
  }
  dragDropEvent(e) {
    this.dragleaveEvent();

    if (this.$parentElement && this.$parentElement.hasAttribute("hoving")) {
      const n = this.$parentElement.dump;

      if (
        n &&
        (e.stopPropagation(),
        e.preventDefault(),
        (e = this.queryDragUuids(n)).length)
      ) {
        this.$numInput && (this.$numInput.value = e.length + n.value.length);
        this.isExpand = true;

        e.forEach((e) => {
          var t = JSON.parse(JSON.stringify(n.elementTypeData));
          t.name = n.value.length.toString();
          t.value.uuid = e;
          n.value.push(t);
        });

        this.$parentElement.dispatch("change");
        this.$parentElement.dispatch("confirm");
      }
    }
  }
  ready() {
    var e;
    super.ready();

    if (
      this.$parentElement &&
      this.$container &&
      this.$content &&
      this.$numInput
    ) {
      this.$numInput.addEventListener("change", (e) => {
        e.stopPropagation();
        e.preventDefault();
      });

      this.$content.addEventListener("change", (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (this.$parentElement && this.$parentElement.dump) {
          e = e.detail.list;
          this.$parentElement.dump.value = e;
          this.$parentElement.dispatch("change");
          this.$parentElement.dispatch("confirm");
        }
      });

      this.$container.addEventListener("expand", () => (this.isExpand = false));
      e = this.getCacheKeyInfo(this.$parentElement.dump).key;
      this.$container.setAttribute("cache-expand", e);

      this.$parentElement.addEventListener("dragover", this.dragoverEventBind);

      this.$parentElement.addEventListener(
        "dragleave",
        this.dragleaveEventBind
      );

      this.$parentElement.addEventListener("drop", this.dragDropEventBind);
    }
  }
  update(e) {
    var t;
    var n;
    super.update(e);

    if (this.$numInput && this.$content && this.$container && this.$icon) {
      t = this.getCacheKeyInfo(e).deep;
      n = e.value;

      setTimeout(() => {
        if (
          this.isExpand &&
          this.$container &&
          !this.$container.hasAttribute("expand")
        ) {
          this.$container.expand = true;
          this.$container.setAttribute("expand", "");
          this.isExpand = false;
        }
      }, 0);

      this.$content.list = n;
      this.$numInput.value = n.length;

      e.values && e.values.length > 0
        ? ((this.$numInput.invalid = true),
          (this.$content.innerHTML = `
          <ui-prop style="color: var(--color-default-fill-weakest);">
              <ui-label slot="content" value="i18n:scene.ui_prop.array_not_support_multiple"></ui-label>
          </ui-prop>
          `))
        : (this.$numInput.invalid && (this.$content.innerHTML = ""),
          ((this.$numInput.invalid = false), utils_1.setElementReadonly)(
            e,
            this.$numInput
          ),
          (this.$icon.style.display = e.readonly ? "block" : "none"),
          this.fillContentElement(e, t),
          setElementReadonly(e, this.$content));
    }
  }
  close() {
    if (this.$parentElement) {
      this.$parentElement.removeEventListener(
        "dragover",
        this.dragoverEventBind
      );

      this.$parentElement.removeEventListener(
        "dragleave",
        this.dragleaveEventBind
      );

      this.$parentElement.removeEventListener("drop", this.dragDropEventBind);
    }

    super.close();
  }
}
exports.default = ArrayList;
