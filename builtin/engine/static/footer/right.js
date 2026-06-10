const ipc = require("@base/electron-base-ipc");
const fse = require("fs-extra");
const ps = require("path");

exports.style = `
:host {
    padding-left: 8px;
    display: flex;
}
.warning {
    color: var(--color-warn-fill);
    padding-left: 4px;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: default;
}
`;

exports.template = `
<ui-label class="custom" value="i18n:engine.version"></ui-label>
<span>${Editor.App.version}</span>
<ui-label class="custom"></ui-label>
<ui-label class="warning"></ui-label>
`;

exports.$ = { custom: ".custom", message: ".warning" };

exports.ready = async function () {
  var e = await Editor.Message.request("engine", "query-engine-info");
  var s = fse.readJSONSync(ps.join(e.typescript.path, "package.json"));

  if (e.typescript.type === "custom") {
    this.$.custom.innerHTML = "(Custom)";
  }

  let t = "";

  if (s.version !== Editor.App.version && this.$.message) {
    t = Editor.I18n.t("engine.footer.version_warning", {
      engineVersion: Editor.I18n.t(
        "engine.footer." +
          (e.typescript.type === "custom" ? "custom" : "internal")
      ),
    });

    this.$.message.setAttribute(
      "tooltip",
      Editor.I18n.t("engine.footer.version_warning_tip") +
        `
` +
        t
    );

    this.$.message.addEventListener("click", () => {
      Editor.Message.request("preferences", "open-settings", "engine");
    });
  }

  this.$.message.innerHTML = t;
};
