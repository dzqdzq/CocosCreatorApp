Object.defineProperty(exports, "__esModule", { value: true });
let panel;
let clearLabelTimmer = null;
module.exports = Editor.Panel.define({
  template: `<div class="process-root" style="display:none">
                    <ui-loading></ui-loading>
                    <ui-icon value="check"></ui-icon>
                    <ui-label></ui-label>
               </div>`,
  style: `
        .process-root {
            display: flex;
            align-items: center;
        }
        ui-label {
            margin-left: 4px;
            white-space: nowrap;
        }
    `,
  $: {
    root: ".process-root",
    label: "ui-label",
    icon: "ui-icon",
    loading: "ui-loading",
  },
  async ready() {
    panel = this;

    Editor.Message.__protected__.addBroadcastListener(
      "programming:compile-start",
      onScriptStartCompile
    );

    Editor.Message.__protected__.addBroadcastListener(
      "programming:compiled",
      onScriptCompiled
    );
  },
  async close() {
    Editor.Message.__protected__.removeBroadcastListener(
      "programming:compile-start",
      onScriptStartCompile
    );

    Editor.Message.__protected__.removeBroadcastListener(
      "programming:compiled",
      onScriptCompiled
    );
  },
});
const tips = [];
function onScriptStartCompile(e) {
  if (clearLabelTimmer) {
    clearTimeout(clearLabelTimmer);
  }

  if (!tips.includes(e)) {
    tips.push(e);
  }

  e = tips
    .map((e) => Editor.I18n.t("programming.compileScript." + e))
    .join(", ");

  panel.$.label.value = Editor.I18n.t("programming.compileScript.start", {
    types: e,
  });

  panel.$.icon.style.display = "none";
  panel.$.loading.style.display = "inline-flex";
  panel.$.root.style.display = "flex";
}
function onScriptCompiled(e) {
  var e = tips.indexOf(e);

  if (-1 !== e) {
    tips.splice(e, 1);
  }

  if (tips.length > 0) {
    e = tips
      .map((e) => Editor.I18n.t("programming.compileScript." + e))
      .join(", ");

    panel.$.label.value = Editor.I18n.t("programming.compileScript.start", {
      types: e,
    });
  } else {
    panel.$.label.value = "i18n:programming.compileScript.end";
    panel.$.loading.style.display = "none";
    panel.$.icon.style.display = "inline-flex";

    clearLabelTimmer = setTimeout(() => {
      panel.$.root.style.display = "none";
    }, 500);
  }
}
