"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.ready=exports.update=exports.$=exports.style=exports.template=void 0;const fs_1=require("fs"),path_1=require("path"),lodash=require("lodash");let panel;function update(e,t){panel=this,"debug"===t?panel.vm.isDebugMode=e.debug:t&&!t.startsWith("packages."+panel.pkgName)||(panel.options=e,panel.vm.init())}function ready(e,t,n,a){panel=this;var i=require("vue/dist/vue.js");panel.options=e,panel.pkgName=n,panel.errorMap=a,panel.vm=new i({el:panel.$.root,data(){return{pkgName:n,options:panel.options,errorMap:panel.errorMap,pkgOptions:{},verifyRes:{},nativeEngine:"builtin",isDebugMode:null}},computed:{JobSystemTips(){return"ios"===panel.options.platform?"i18n:native.options.JobSystemIOS":"i18n:native.options.JobSystemOther"}},async mounted(){this.init();var e=(await Editor.Message.request("engine","query-engine-info")).native;"custom"===e.type&&(this.nativeEngine=e.path)},methods:methods})}exports.template=(0,fs_1.readFileSync)((0,path_1.join)(__dirname,"../../static/view.html"),"utf8"),exports.style=`
.native .native-engine-content {
    flex-direction: row;
    width: 0;
    overflow: hidden;
}

.native .nativePath {
    max-width: 90%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    margin-right: 10px;
}

.native .native-engine-content ui-icon {
    cursor: pointer;
}

.native .native-engine-content ui-icon:hover {
    color: var(--color-focus-fill-weaker);
}

.native .encrypt-invalid > ui-label[slot='label'],
.native .encrypt-invalid > div[slot='content'] {
    opacity: 0.55;
    pointer-events: none;
}
.native .encrypt-invalid > div[slot='message'] {
    color: var(--color-warn-fill-weaker);
}
`,exports.$={root:".native"},exports.update=update,exports.ready=ready;const methods={async updateValue(e,t){var n=this;n.pkgOptions[t]=e.target.value,panel.dispatch("update",`packages.${n.pkgName}.`+t,e.target.value,n.verifyRes[t])},onEditNativeEngine(){Editor.Message.request("preferences","open-settings","engine")},init(){var e=this;e.isDebugMode=!!panel.options.debug,e.pkgOptions=lodash.get(panel.options,"packages."+e.pkgName)||{},e.verifyRes=lodash.get(panel.errorMap,"packages."+e.pkgName)||{}},t(e){return Editor.I18n.t(e)}};