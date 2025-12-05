"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.ready=exports.$=exports.template=exports.style=void 0;const utils_1=require("../utils"),Vue=require("vue/dist/vue.js");let vm=null;exports.style=`
.row { display: flex; }
.row > ui-prop {
    --left-width: 40%;
    flex: 1;
    padding-left: 5px;
}
.row > ui-prop > ui-file { flex: 1; }
.row > ui-icon {
    visibility: hidden;
}
.row:hover > ui-icon {
    visibility: visible;
}
.row > ui-icon[type='local'] {
    color: var(--color-warn-fill);
    visibility: visible;
}
`,exports.template=`
<div class="program" @confirm="onConfirm">
    <div class=row>
        <ui-icon value="setting" tooltip="i18n:preferences.menu.position_info"
            @click="onChangePosition($event.target.pageX, $event.target.pageY, 'androidNDK')"
        ></ui-icon>
        <ui-prop
            :class="errorMap.androidNDK ? 'danger' : ''"
            :message="errorMap.androidNDK"
        >
            <div slot=label>
                <ui-label value="i18n:android.program.androidNDK"></ui-label>
                <ui-icon value="help" tooltip="i18n:android.program.androidNDKTips"></ui-icon>
            </div>
            <ui-file slot="content" type="directory" data="path" path="androidNDK"
                :value="androidNDK.path"
            ></ui-file>
        </ui-prop>
    </div>

    <div class="row">
        <ui-icon value="setting" tooltip="i18n:preferences.menu.position_info"
            @click="onChangePosition($event.target.pageX, $event.target.pageY, 'androidSDK')"
        ></ui-icon>
        <ui-prop
            :class="errorMap.androidSDK ? 'danger' : ''"
            :message="errorMap.androidSDK"
        >
            <div slot=label>
                <ui-label value="i18n:android.program.androidSDK"></ui-label>
                <ui-icon value="help" tooltip="i18n:android.program.androidSDKTips"></ui-icon>
            </div>
            <ui-file slot="content" type="directory" data="path" path="androidSDK"
                :value="androidSDK.path"
            ></ui-file>
        </ui-prop>
    </div>
</div>
`,exports.$={program:".program"};const component={data:{androidNDK:{path:"",commandArgument:""},androidSDK:{path:"",commandArgument:""},types:{androidNDK:"global",androidSDK:"global"},errorMap:{androidNDK:"",androidSDK:""}},methods:{async refresh(i){var o=await Editor.Profile.getConfig("android",i,"local");this.types[i]=null!=o?"local":"global"},async onConfirm(i){var o=this,e=i.target.getAttribute("path"),r=i.target.getAttribute("data"),i=i.target.value;o[e][r]=i,await Editor.Profile.setConfig("android",e+"."+r,i,o.types[e]),o.errorMap[e]=(0,utils_1.checkProgramConfig)(e,o[e].path)},onChangePosition(i,o,e){const r=this;Editor.Menu.popup({x:i,y:o,menu:[{label:Editor.I18n.t("preferences.menu.copyConfigKey"),click(){Editor.Clipboard.write("text",`'android', '${e}'`)}},{label:Editor.I18n.t("preferences.menu.move_local"),enabled:"global"===r.types[e],async click(){let i=await Editor.Profile.getConfig("android",e);null==i&&(i={path:""}),await Editor.Profile.setConfig("android",e,i,"local"),r.refresh()}},{label:Editor.I18n.t("preferences.menu.move_global"),enabled:"local"===r.types[e],async click(){var i=await Editor.Profile.getConfig("android",e,"local");await Editor.Profile.setConfig("android",e,i,"global"),await Editor.Profile.removeConfig("android",e,"local"),r.refresh()}}]})}}};async function ready(){component.el=this.$.program,(vm=new Vue(component)).androidNDK=await Editor.Profile.getConfig("android","androidNDK"),vm.androidSDK=await Editor.Profile.getConfig("android","androidSDK");for(const i of Object.keys(vm.types))await vm.refresh(i),vm.errorMap[i]=(0,utils_1.checkProgramConfig)(i,vm[i].path)}exports.ready=ready;