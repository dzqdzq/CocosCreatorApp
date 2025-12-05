"use strict";let panel,clearLabelTimmer=null;function onScriptStartCompile(){clearLabelTimmer&&clearTimeout(clearLabelTimmer),panel.$.label.value="i18n:programming.startCompile",panel.$.icon.style.display="none",panel.$.loading.style.display="inline-flex",panel.$.root.style.display="flex"}function onScriptCompiled(){panel.$.label.value="i18n:programming.compileEnd",panel.$.loading.style.display="none",panel.$.icon.style.display="inline-flex",clearLabelTimmer=setTimeout(()=>{panel.$.root.style.display="none"},500)}module.exports=Editor.Panel.define({template:`<div class="process-root" style="display:none">
                    <ui-loading></ui-loading>
                    <ui-icon value="check"></ui-icon>
                    <ui-label></ui-label>
               </div>`,style:`
        .process-root {
            display: flex;
            align-items: center;
        }
        ui-label {
            margin-left: 4px;
            white-space: nowrap;
        }
    `,$:{root:".process-root",label:"ui-label",icon:"ui-icon",loading:"ui-loading"},async ready(){panel=this,Editor.Message.__protected__.addBroadcastListener("programming:compile-start",onScriptStartCompile),Editor.Message.__protected__.addBroadcastListener("programming:compiled",onScriptCompiled)},async close(){Editor.Message.__protected__.removeBroadcastListener("programming:compile-start",onScriptStartCompile),Editor.Message.__protected__.removeBroadcastListener("programming:compiled",onScriptCompiled)}});