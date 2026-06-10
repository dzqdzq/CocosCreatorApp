Object.defineProperty(exports, "__esModule", { value: true });

const { escape } = require("lodash");

const dum_element_base_1 = require("../dum-element-base");

const { setElementInvalid, setElementReadonly } = require("../utils");

const tagName = { select: "UI-SELECT", radio: "UI-RADIO-GROUP" };
class Enum extends dum_element_base_1.DumpElementBase {
  type = ["Enum"];
  $content = null;
  _listeners = ["change"];
  parseAndSetData(n, a) {
    a.value = n;

    if ("values" in a) {
      a.values.forEach((e, t) => {
        a.values[t] = n;
      });
    }

    return true;
  }
  change(t, n) {
    if (t.target) {
      let e = t.target.value;

      if (e !== undefined) {
        isFinite(e) && (e = Number(e));
        this.parseAndSetData(e, n);
      }
    }
  }
  template = `
        <ui-label slot="label"></ui-label>
        <ui-select slot="content"></ui-select>`;
  style = "";
  mounted(e) {
    this.$content = e.querySelector('[slot="content"]');
  }
  ready() {
    super.ready();
  }
  updateContent(e, t) {
    if (!this.$parentElement) {
      return null;
    }
    let n = this.$parentElement.querySelector("[slot=content]");

    if (n != null && n.tagName !== e) {
      this.$parentElement.removeChild(n);
    }

    if (n == null || n.tagName !== e) {
      e = t(false);
      this.$parentElement.insertAdjacentHTML("beforeend", e);
      n = this.$parentElement.lastElementChild;
    } else {
      n.innerHTML = t(true);
    }

    return n;
  }
  renderSelect(e) {
    if (this.$parentElement) {
      let t = "";
      if (e.enumList) {
        for (const a of e.enumList) {
          t += `<option value="${a.value}">${escape(a.name)}</option>`;
        }
      }
      var n = this.updateContent(tagName.select, (e) =>
        e ? t : `<ui-select slot="content">${t}</ui-select>`
      );

      if (n && n.value !== e.value?.toString()) {
        n.value = e.value?.toString();
      }

      return n;
    }
  }
  renderRadioGroup(e) {
    if (this.$parentElement) {
      let t = "";
      if (e.enumList) {
        for (const a of e.enumList) {
          t += `<ui-radio-button value="${a.value}">${escape(
            a.name
          )}</ui-radio-button>`;
        }
      }
      var n = this.updateContent(tagName.radio, (e) =>
        e
          ? t
          : `<ui-radio-group slot="content">
${t}</ui-radio-group>`
      );

      if (n && ((n.innerHTML = t), n.value !== e.value?.toString())) {
        n.value = e.value?.toString();
      }

      return n;
    }
  }
  update(e) {
    var t;
    super.update(e);

    if (
      this.$parentElement &&
      (t =
        e.radioGroup === true ? this.renderRadioGroup(e) : this.renderSelect(e))
    ) {
      this.$content = t;
      setElementInvalid(e, this.$content);
      setElementReadonly(e, this.$content);
    }
  }
}
exports.default = Enum;
