"use strict";const ipc=require("@base/electron-base-ipc"),fse=require("fs-extra"),ps=require("path");exports.style=`
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
`,exports.template=`
<ui-label class="custom" value="i18n:engine.version"></ui-label>
<span>${Editor.App.version}</span>
<ui-label class="custom"></ui-label>
<ui-label class="warning"></ui-label>
`,exports.$={custom:".custom",message:".warning"},exports.ready=async function(){var e=await Editor.Message.request("engine","query-engine-info"),s=fse.readJSONSync(ps.join(e.typescript.path,"package.json"));"custom"===e.typescript.type&&(this.$.custom.innerHTML="(Custom)");let t="";s.version!==Editor.App.version&&this.$.message&&(t=Editor.I18n.t("engine.footer.version_warning",{engineVersion:Editor.I18n.t("engine.footer."+("custom"===e.typescript.type?"custom":"internal"))}),this.$.message.setAttribute("tooltip",Editor.I18n.t("engine.footer.version_warning_tip")+`
`+t),this.$.message.addEventListener("click",()=>{Editor.Message.request("preferences","open-settings","engine")})),this.$.message.innerHTML=t};