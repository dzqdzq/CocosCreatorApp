"use strict";exports.style=`
:host {
    display: flex;
    overflow: hidden;
}

:host > .editor-title {
    display: flex;
    overflow: hidden;
    white-space: nowrap;
    padding-left: 6px;
    font-weight: bold;
    line-height: 20px;
    align-items: center;
}

:host > .editor-title > *[hidden] {
    display: none;
}

:host > .editor-title > img {
    width: 14px;
    height: 14px;
}

:host > .editor-title > .type {
    padding-left: 4px;
}

:host > .editor-title > .title {
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    padding-left: 4px;
}
`,exports.template=`
<div class="editor-title">
    <img src="packages://scene/static/icons/editor.png">
    <ui-label class="type" value="i18n:scene.project_2d_name" tooltip="i18n:scene.project_2d_tooltip"></ui-label>
    <div class="title"></div>
</div>
`,exports.$={editorLabel:".editor-title ui-label",editorTitle:".editor-title .title"},exports.ready=async function(){let t=!0;var e=await Editor.Profile.getProject("engine","modules.includeModules");e&&e.includes("3d")?(t=!0,this.$.editorLabel.setAttribute("hidden","")):(t=!1,this.$.editorLabel.removeAttribute("hidden")),Editor.Message.addBroadcastListener("engine:engine-modules-config-changed",e=>{e&&e.includes("3d")?(t=!0,this.$.editorLabel.setAttribute("hidden","")):(t=!1,this.$.editorLabel.removeAttribute("hidden"))}),this.$.editorTitle.innerHTML="Cocos Creator "+Editor.App.version,Editor.Message.addBroadcastListener("editor-title-change",e=>{this.$.editorTitle.innerHTML=(t?"":": ")+e})};