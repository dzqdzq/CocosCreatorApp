"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.ready=exports.update=exports.$=exports.data=exports.template=exports.style=void 0;const fs_extra_1=require("fs-extra"),path_1=require("path"),PKG_NAME="taobao-mini-game";let panel;const isNormalVersion=/\d*\.\d*\.\d*$/.test(Editor.App.version)||Editor.App.dev,component=(exports.style=`
.warning-tip {
    color: var(--color-warn-fill);
    font-size： 11px;
    line-height: 16px;
    margin-bottom: 2px;
}

.jump {
    cursor: pointer;
    text-decoration: underline;
}

.jump:hover {
    color: var(--color-focus-fill-weakest)
}

`,exports.template=(0,fs_extra_1.readFileSync)((0,path_1.join)(__dirname,"../static/view.html"),"utf8"),{data(){return{isNormalVersion:isNormalVersion,isDebugMode:null,pkgOptions:{},includeModules:[]}},computed:{physics3D(){return!!this.includeModules.filter(e=>e.startsWith("physics-")&&!e.startsWith("physics-2d")).length}},methods:{t(e){return Editor.I18n.t("taobao-mini-game."+e)},async init(){this.isDebugMode=!!panel.options.debug,this.pkgOptions=panel.options.packages["taobao-mini-game"]},onChange(t){var o=t.target.getAttribute("path");if(o){let e=t.target.value;void 0!==t.target.value&&null!==t.target.value||(e=t.target.getAttribute("value")),this.$set(this.pkgOptions,o,e),panel.dispatch("update",`packages.${PKG_NAME}.`+o,e,null)}},openProjectSettings(){Editor.Message.send("project","open-settings","engine","modules")},async updateEngineModules(){this.includeModules=await Editor.Profile.getProject("engine","modules.includeModules")}},mounted(){this.init()}});async function update(e,t){panel=this,"debug"===t?panel.vm.isDebugMode=e.debug:t&&!t.startsWith("packages."+panel.pkgName)||(panel.options=e,panel.vm.init())}function ready(e){panel=this;var t=require("vue/dist/vue.js");panel.options=e,panel.pkgName=PKG_NAME,panel.vm=new t(Object.assign({el:panel.$.root},component))}exports.data={vm:null,options:{}},exports.$={root:".taobao-mini-game"},exports.update=update,exports.ready=ready;