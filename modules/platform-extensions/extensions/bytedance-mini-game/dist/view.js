"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.ready=exports.update=exports.$=exports.data=exports.style=exports.template=void 0;const fs_extra_1=require("fs-extra"),path_1=require("path"),PKG_NAME="bytedance-mini-game";let panel;exports.template=(0,fs_extra_1.readFileSync)((0,path_1.join)(__dirname,"../static/view.html"),"utf8"),exports.style=`
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
`;const component={data(){return{includeModules:[],pkgOptions:null,overwritePhysics:""}},computed:{physicsX(){var e=this;return e.physics3D&&("physics-physx"===e.overwritePhysics||"inherit-project-setting"===e.overwritePhysics&&e.includeModules.includes("physics-physx"))},physics3D(){return!!this.includeModules.filter(e=>e.startsWith("physics-")&&!e.startsWith("physics-2d")).length},selectStyle(){return this.physics3D?{display:"flex"}:{display:"flex",color:"var(--color-warn-fill)"}}},methods:{t(e){return Editor.I18n.t("bytedance-mini-game.options."+e)},async updateEngineModules(){console.debug("engine-modules-config-changed"),this.includeModules=await Editor.Profile.getProject("engine","modules.includeModules")},updatePhysicsOption(){var e;this.overwritePhysics=null==(e=null==(e=panel.options.overwriteProjectSettings)?void 0:e.includeModules)?void 0:e.physics},async init(){this.pkgOptions=panel.options.packages["bytedance-mini-game"],await this.updateEngineModules(),this.updatePhysicsOption()},onChange(e){var t=e.target.value,e=e.target.getAttribute("path");this.pkgOptions.physX[e]=t,panel.dispatch("update",`packages.${PKG_NAME}.physX.`+e,t,null)},openProjectSettings(){Editor.Message.send("project","open-settings","engine","modules")}},mounted(){this.init(),Editor.Message.__protected__.addBroadcastListener("engine:engine-modules-config-changed",this.updateEngineModules)},beforeDestroy(){Editor.Message.__protected__.removeBroadcastListener("engine:engine-modules-config-changed",this.updateEngineModules)}};async function update(e,t,s){(panel=this).options=e,t&&"overwriteProjectSettings.includeModules.physics"===t?panel.vm.updatePhysicsOption(e):t&&!t.startsWith("packages."+panel.pkgName)||panel.vm.init()}function ready(e){panel=this;var t=require("vue/dist/vue.js");panel.options=e,panel.pkgName=PKG_NAME,panel.vm=new t(Object.assign({el:panel.$.root},component))}exports.data={vm:null,options:{}},exports.$={root:".bytedance-mini-game"},exports.update=update,exports.ready=ready;