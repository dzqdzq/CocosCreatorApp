"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.ready=exports.update=exports.$=exports.template=exports.style=void 0;const lodash=require("lodash");let panel;function update(e,t){panel=this,t&&!t.startsWith("pacakges."+panel.pkgName)||(panel.options=e,panel.vm.init())}function ready(e,t,i,n){panel=this;var p=require("vue/dist/vue.js");panel.options=e,panel.pkgName=i,panel.errorMap=n,panel.vm=new p({el:panel.$.root,methods:methods,data(){return{pkgName:i,options:panel.options,errorMap:panel.errorMap,pkgOptions:{},verifyRes:{},nativeEngine:"builtin"}},computed:{JobSystemTips(){return"ios"===panel.options.platform?"i18n:native.options.JobSystemIOS":"i18n:native.options.JobSystemOther"}},async mounted(){this.init();var e=await Editor.Message.request("engine","query-info");"custom"===e.nativeVersion&&(this.nativeEngine=e.nativePath)},components:{"build-prop":BuildPanel.vueComps.buildProp,"template-comp":BuildPanel.vueComps.templateComp}})}exports.style=".",exports.template=`
<div class="native">
    <ui-prop class="build-prop">
        <ui-label slot="label" value="i18n:native.encrypt.title"></ui-label>
        <div slot="content" style="flex-direction: column">
            <ui-checkbox :value="pkgOptions.encrypted"
                @change="updateValue($event,'encrypted')"
            ></ui-checkbox>
            <ui-prop v-if="pkgOptions.encrypted">
                <ui-label slot="label" value="i18n:native.encrypt.encrypt_encrypt"></ui-label>
                <div slot="content">
                    <ui-input :value="pkgOptions.xxteaKey"
                        @change="updateValue($event,'xxteaKey')"
                    ></ui-input>
                </div>
            </ui-prop>
            <ui-prop v-if="pkgOptions.encrypted">
                <ui-label slot="label" value="i18n:native.encrypt.compress_zip"></ui-label>
                <div slot="content">
                    <ui-checkbox :value="pkgOptions.compressZip"
                        @change="updateValue($event,'compressZip')"
                    ></ui-checkbox>
                </div>
            </ui-prop>
        </div>
    </ui-prop>
    <ui-prop class="build-prop">
        <ui-label slot="label" value="i18n:native.options.native_engine"></ui-label>
        <div slot="content" style="display: flex; flex-direction: row;">
            <div style="flex: 1;">
                <ui-label v-if="nativeEngine === 'builtin'" value="i18n:native.options.builtin_engine"></ui-label>
                <span v-else>{{nativeEngine}}</span>
            </div>
            <ui-icon value="edit" @click="onEditNativeEngine"></ui-icon>
        </div>
    </ui-prop>
    <ui-prop class="build-prop">
        <ui-label slot="label" value="i18n:native.options.JobSystem"></ui-label>
        <div slot="content">
            <ui-select :value="pkgOptions.JobSystem" @change="updateValue($event,'JobSystem')">
                <option value="none">{{t('native.options.none')}}</option>
                <option value="tbb">TBB</option>
                <option value="taskFlow">TaskFlow</option>
            </ui-select>
            <ui-label v-if="pkgOptions.JobSystem === 'taskFlow'" class="tips" :value="JobSystemTips"></ui-label>
        </div>
    </ui-prop>
</div>
`,exports.$={root:".native"},exports.update=update,exports.ready=ready;const methods={async updateValue(e,t){var i=this;i.pkgOptions[t]=e.target.value,panel.dispatch("update",`packages.${i.pkgName}.`+t,e.target.value,i.verifyRes[t])},onEditNativeEngine(){Editor.Message.request("preferences","open-settings","engine")},init(){var e=this;e.pkgOptions=lodash.get(panel.options,"packages."+e.pkgName)||{},e.verifyRes=lodash.get(panel.errorMap,"packages."+e.pkgName)||{}},t(e){return Editor.I18n.t(e)}};