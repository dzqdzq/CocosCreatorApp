Object.defineProperty(exports, "__esModule", { value: true });
exports.listeners = undefined;
exports.template = undefined;
exports.update = update;
exports.ready = ready;

const { transI18nName } = require("../../share/utils");

const validator_manager_1 = require("../../share/validator-manager");
const lodash = require("lodash");
const PROP_SPLIT_POSITION = "40";
const PROP_SPLIT_DISABLED = true;
const MessageTypeMap = { warn: "warn", error: "danger", log: "", debug: "" };
async function update(a) {
  if (a && (a.itemConfigs || a.render)) {
    const i = this.$this;
    var e;

    if (
      a.render &&
      a.render.ui &&
      a.render.ui.toLocaleLowerCase() !== i.$ui?.tagName.toLocaleLowerCase() &&
      (Build.debugMode && console.debug("ui-prop need reload", a.label),
      i.$ui && i.removeChild(i.$ui),
      (e = initRenderUI(a)))
    ) {
      i.$ui = e;
      i.appendChild(e);
    }

    if (a.itemConfigs) {
      Object.keys(a.itemConfigs).forEach((e) => {
        var t = a.itemConfigs[e];
        var r = lodash.get(a.value, e);

        if (i.$items[e]) {
          [null, undefined].includes(r) ||
            ((t.value = r), (i.valueDirty = true));

          t.verifyLevel = t.verifyLevel || "error";
          i.$items[e].dump = t;
          i.$items[e].render(t);
        } else {
          console.debug(e + " has not init");
        }
      });
    } else {
      [null, undefined].includes(a.value) || (i.$ui.value = a.value);
      updateRenderUI(i.$ui, a);
      await checkTargetValue(i, a);
    }

    a.verifyLevel = a.verifyLevel || "error";
    i.dump = a;
    i.removeAttribute("dump");

    if (i.valueDirty) {
      i.dispatch("change");
      i.valueDirty = false;
    }
  }
}
async function ready() {
  const a = this.$this;
  const a_dump = a.dump;
  a.className = "build-prop";
  a.innerHTML = "";

  if (
    [undefined, null].includes(a_dump.value) &&
    ![undefined, null].includes(a_dump.default)
  ) {
    a_dump.value = a_dump.default;
  }

  if (a_dump.verifyRules && a_dump.verifyRules.includes("required")) {
    a.innerHTML = '<span class="required">*</span>';
  }

  if (a_dump.label) {
    (e = initLabel(a_dump)).setAttribute("slot", "label");
    a.appendChild(e);
  }

  if (a_dump.itemConfigs) {
    const n = document.createElement("ui-prop-split");
    n.setAttribute("slot", "content");
    n.setAttribute("position", PROP_SPLIT_POSITION);

    if (PROP_SPLIT_DISABLED) {
      n.setAttribute("disabled", "");
    }

    a.appendChild(n);
    a.$items = {};

    Object.keys(a_dump.itemConfigs).forEach((t) => {
      var e = a_dump.itemConfigs[t];
      const r = document.createElement("ui-prop");
      n.appendChild(r);
      r.customInfo = a.customInfo;
      r.setAttribute("type", "build");
      r.className = "build-prop";
      a.$items[t] = r;
      e.verifyLevel = e.verifyLevel || "error";
      r.dump = e;

      r.addEventListener("change", (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        lodash.set(a.dump.value, t, r.dump.value);
        a.dispatch("change");
      });

      r.render(e);
    });
  } else {
    a_dump.verifyLevel = a_dump.verifyLevel || "error";
    var e = initRenderUI(a_dump);

    if (e) {
      a.$ui = e;
      a.appendChild(e);
    }

    await checkTargetValue(a, a.dump);
  }

  if (a.valueDirty) {
    a.dispatch("change");
    a.valueDirty = false;
  }
}
function checkDisabledWhen(e, t) {
  try {
    return new Function("options", `with(options) { return ${e}}`)(t);
  } catch (e) {
    console.error(e);
  }
  return null;
}
function toggleErrorState(e, t, r) {
  var a;
  e.$errorMap = e.$errorMap || {};

  if (
    ((r = r || "") || e.$errorMap[t]) &&
    (r || !e.$errorMap[t] || e.$errorMap[t].style.display !== "none")
  ) {
    e.$errorMap[t] ||
      ((e.$errorMap[t] = document.createElement("ui-prop")),
      (e.$errorMap[
        t
      ].innerHTML = `<ui-label slot="content" value="${r}" tooltip="${r}"></ui-label>`));

    a = e.$errorMap[t];
    e.$errorMap[t].setAttribute("value", r || "");
    e.$errorMap[t].setAttribute("tooltip", r ?? "");
    a.className = "error";
    a.setAttribute("error", "");

    r
      ? (e.setAttribute("error", ""), (a.style.display = "block"))
      : (e.removeAttribute("error"), (a.style.display = "none"));

    e.appendChild(a);
    e.$errorMap[t] = a;
  }
}
async function onChange(e, t) {
  if (t !== e.dump.value) {
    e.dump.value = t;
    await checkTargetValue(e, e.dump);
    e.dispatch("change");
    e.valueDirty = false;
  }
}
async function checkTargetValue(e, t) {
  var r;
  var a;

  if (e.customInfo) {
    ({ options: r, pkgKey: a } = e.customInfo);
    t.message = await checkValue(t, t.value, r, a);
  } else {
    t.message = await checkValue(t, t.value);
  }

  if (e.message !== t.message && (e.message || t.message)) {
    e.valueDirty = true;
  }

  e.message = t.message;

  if (e.message) {
    e.classList.add(
      (t.verifyLevel && MessageTypeMap[t.verifyLevel]) ?? "danger"
    );
  } else {
    e.classList.remove(
      (t.verifyLevel && MessageTypeMap[t.verifyLevel]) ?? "danger"
    );
  }
}
async function checkValue(e, t, r, a) {
  var { verifyRules: e, render } = e;
  return (
    (e &&
      render &&
      (validator_manager_1.validator.checkWithInternalRule("valid", t) ||
        !validator_manager_1.validator.checkWithInternalRule("required", t) ||
        e.includes("required")) &&
      (await validator_manager_1.validatorManager.check(t, e, r, a))) ||
    null
  );
}
function initLabel(e) {
  var t = document.createElement("ui-label");
  t.value = e.label;

  if (e.description) {
    t.setAttribute("tooltip", e.description);
  }

  return e.experiment
    ? (((e = document.createElement("div")).innerHTML +=
        '<ui-icon color style="margin-right: 2px;" tooltip="i18n:builder.experiment" value="experiment"></ui-icon>'),
      e.appendChild(t),
      e)
    : t;
}
function initRenderUI(t) {
  if (!t.render) {
    return null;
  }
  var e = document.createElement(t.render.ui);
  e.setAttribute("slot", "content");
  let r = "";

  if (t.render.ui === "ui-select" && t.render.items) {
    t.render.items.forEach((e) => {
      e.label = transI18nName(e.label);
      r += `<option value="${e.value}">${e.label}</option>`;
    });

    e.innerHTML = r;
  } else if (t.render.ui === "ui-select-pro" && t.render.items) {
    t.render.items.forEach((e) => {
      r += `<ui-select-option-pro
             value="${e.value}" 
             label="${e.label}"
             ${t.value.toString() === e.value ? "selected" : ""}
             ></ui-select-option-pro>`;
    });

    e.innerHTML = r;
  }

  return e;
}
function updateRenderUI(t, r) {
  if (r.render.attributes) {
    Object.keys(r.render.attributes).forEach((e) => {
      if (r.render.attributes[e] === false) {
        t.removeAttribute(e);
      } else {
        t.setAttribute(e, String(r.render.attributes[e]));
      }
    });
  }

  let a = "";
  if (r.render.ui === "ui-select" && r.render.items) {
    r.render.items.forEach((e) => {
      a += `<option value="${e.value}">${e.label}</option>`;
    });

    t.innerHTML = a;

    t.setAttribute(
      "value",
      r.value ?? r.default ?? r.render.items[0].value ?? ""
    );
  } else if (r.render.ui === "ui-select-pro" && r.render.items) {
    const i = r.value ?? r.default ?? r.render.items[0].value ?? "";

    r.render.items.forEach((e) => {
      a += `<ui-select-option-pro
             value="${e.value}" 
             label="${e.label}"
             ${i.toString() === e.value ? "selected" : ""}
             ></ui-select-option-pro>`;
    });

    t.innerHTML = a;
  }
}
exports.template = "";

exports.listeners = {
  change(e) {
    var t = this.$this;
    var e_target = e.target;

    if (e_target !== t) {
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
      onChange(t, e_target.value);
    }
  },
  confirm(e) {
    var t = this.$this;

    if (e.target !== t) {
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
      t.dispatch("confirm");
    }
  },
};
