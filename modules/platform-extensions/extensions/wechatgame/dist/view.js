"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.ready=exports.update=exports.$=exports.data=exports.template=exports.style=void 0;const fs_extra_1=require("fs-extra"),path_1=require("path"),PKG_NAME="wechatgame";let panel;const isNormalVersion=/\d*\.\d*\.\d*$/.test(Editor.App.version)||Editor.App.dev,component=(exports.style=`
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

.high-performance-mode-message > ui-label {
    display: inline;
}

.separate-engine-invalid > ui-label[slot='label'],
.separate-engine-invalid > div[slot='content'] {
    opacity: 0.55;
    pointer-events: none;
}
.separate-engine-invalid > div[slot='message'],
.separate-engine-warning > div[slot='message'] {
    color: var(--color-warn-fill-weaker);
}
`,exports.template=(0,fs_extra_1.readFileSync)((0,path_1.join)(__dirname,"../static/view.html"),"utf8"),{data(){return{isNormalVersion:isNormalVersion,isDebugMode:null,pkgOptions:{},wasmConfig:{mode:"wasm",compressMode:""}}},computed:{separateEngineWarningTip(){var e=this;return e.pkgOptions.separateEngine?e.isDebugMode?"i18n:wechatgame.tips.separate_engine_with_debug":"wasm"!==e.wasmConfig.mode||e.wasmConfig.compressMode?"i18n:wechatgame.tips.separate_engine_with_wasm":void 0:""}},methods:{t(e){return Editor.I18n.t("wechatgame."+e)},async init(){this.isDebugMode=!!panel.options.debug,this.wasmConfig.mode=panel.options.nativeCodeBundleMode,this.wasmConfig.compressMode=panel.options.wasmCompressionMode,this.pkgOptions=panel.options.packages.wechatgame},onChange(t){var a=t.target.getAttribute("path");if(a){let e=t.target.value;void 0!==t.target.value&&null!==t.target.value||(e=t.target.getAttribute("value")),this.$set(this.pkgOptions,a,e),panel.dispatch("update",`packages.${PKG_NAME}.`+a,e,null)}},openProjectSettings(){Editor.Message.send("project","open-settings","engine","modules")}},mounted(){this.init()}});async function update(e,t){switch(panel=this,t){case"debug":panel.vm.isDebugMode=e.debug;break;case"nativeCodeBundleMode":panel.vm.wasmConfig.mode=e.nativeCodeBundleMode;break;case"wasmCompressionMode":panel.vm.wasmConfig.compressMode=e.wasmCompressionMode}t&&!t.startsWith("packages."+panel.pkgName)||(panel.options=e,panel.vm.init())}function ready(e){panel=this;var t=require("vue/dist/vue.js");panel.options=e,panel.pkgName=PKG_NAME,panel.vm=new t(Object.assign({el:panel.$.root},component))}exports.data={vm:null,options:{}},exports.$={root:".wechatgame"},exports.update=update,exports.ready=ready;