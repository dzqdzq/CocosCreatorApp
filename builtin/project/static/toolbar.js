"use strict";const shell=require("electron")["shell"];exports.style=`
:host {
    display: flex;
}
.open-project {
    display: flex;
    height: 24px;
    width: 24px;
    padding: 0;
    margin-right: 8px;
    border-color: var(--color-default-border);
    border-radius: calc(var(--size-normal-radius) * 2px);
}
`,exports.template=`
<div class="project-operation">
    <ui-button type="icon" class="open-project transparent">
        <ui-icon tooltip="i18n:project.toolbar.openProjectPath" value="folder-open"></ui-icon>
    </ui-button>
</div>
`,exports.$={project:".open-project",editor:".open-editor",wrap:".project-operation"},exports.ready=function(){this.$.wrap.addEventListener("dblclick",e=>{e.stopPropagation()}),this.$.project.addEventListener("click",()=>{shell.showItemInFolder(Editor.Project.path)})};