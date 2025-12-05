"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.update=exports.ready=exports.template=exports.$=exports.platformSettings=void 0;const const_1=require("./utils/const"),fs_1=require("fs");let settings;async function ready(t){let i=this;settings=await Editor.Profile.getConfig(const_1.PLATFORM_NAME,"options."+t.platform),settings=Object.assign({},exports.platformSettings,settings,t.packages[const_1.PLATFORM_NAME]),i.dispatch("update","packages."+const_1.PLATFORM_NAME,settings),new(require("vue/dist/vue.js"))({el:i.$.root,data:function(){return settings},methods:{i18n(t){return Editor.I18n.t(const_1.PLATFORM_NAME+"."+t)},onChange(t){var t=t.target,e=t.getAttribute("id");settings[e]=t.value,i.dispatch("update",`packages.${const_1.PLATFORM_NAME}.`+e,settings[e]),verifyData(e,t.value,t)}}})}function verifyData(t,e,i){let o="1px solid #ff726e";switch(t){case"versionName":e?(o="",exports.platformSettings.versionNameValidity=""):exports.platformSettings.versionNameValidity=t+" "+Editor.I18n.t("qtt.tips.not_empty");break;case"versionCode":e?(o="",exports.platformSettings.versionCodeValidity=""):exports.platformSettings.versionCodeValidity=t+" "+Editor.I18n.t("qtt.tips.not_empty");break;case"package":e&&/^[a-zA-Z]+[0-9a-zA-Z_]*(\.[a-zA-Z]+[0-9a-zA-Z_]*)*$/.test(e)?(o="",exports.platformSettings.packageValidity=""):exports.platformSettings.packageValidity=""+Editor.I18n.t("qtt.tips.package_name_error");break;case"icon":"string"==typeof e&&fs_1.existsSync(e)?(o="",exports.platformSettings.iconValidity=""):exports.platformSettings.iconValidity="Icon Path"+Editor.I18n.t("qtt.tips.icon_not_exist");break;default:console.debug("verifyData key:",t,e),o=""}i.style.border=o}async function update(t,e){e&&!e.startsWith("packages."+const_1.PLATFORM_NAME)||(settings=Object.assign(settings,t.packages[const_1.PLATFORM_NAME]))}exports.platformSettings={runtimeVersion:"1.0.0",deviceOrientation:"portrait",statusbarDisplay:!1,startSceneAssetBundle:!1,workerPath:"",XHRTimeout:6e4,WSTimeout:6e4,uploadFileTimeout:6e4,downloadFileTimeout:6e4,cameraPermissionHint:"",userInfoPermissionHint:"",locationPermissionHint:"",albumPermissionHint:"",package:"com.qtt.cocos",icon:Editor.App.icon,versionName:Editor.App.version,versionCode:"1",packageValidity:"",iconValidity:"",versionNameValidity:"",versionCodeValidity:""},exports.$={root:".root"},exports.template=`
<div class="root" @change="onChange">
    <ui-prop tooltip="i18n:${const_1.PLATFORM_NAME}.options.start_scene_asset_bundle_tooltip">
        <ui-label slot="label">i18n:${const_1.PLATFORM_NAME}.options.start_scene_asset_bundle</ui-label>
        <ui-checkbox id="startSceneAssetBundle" slot="content" :value="startSceneAssetBundle"></ui-checkbox>
    </ui-prop>
    <!--游戏版包名-->
    <span class="required">*</span>
    <ui-prop tooltip="i18n:${const_1.PLATFORM_NAME}.options.package_hint" >
        <ui-label slot="label"  v-bind:class="{'required': packageValidity}" i18n>${const_1.PLATFORM_NAME}.options.package</ui-label>
        <div slot="content" >
            <ui-input  id="package" slot="content" :value="package"></ui-input>
        </div>
    </ui-prop>

    <ui-prop  v-if="packageValidity">
        <span  slot="content" style="color: #ff726e">{{packageValidity}}</span>
    </ui-prop>

    <!--桌面图标-->
    <span class="required">*</span>
    <ui-prop>
        <ui-label slot="label"  v-bind:class="{'required': iconValidity}" i18n>${const_1.PLATFORM_NAME}.options.desktop_icon</ui-label>
        <div slot="content">
            <ui-file id="icon" extensions="png"
                :value="icon"
                :title="iconValidity"
            ></ui-file>
        </div>
    </ui-prop>

    <ui-prop  v-if="iconValidity">
        <span slot="content" style="color: #ff726e">{{iconValidity}}</span>
    </ui-prop>


    <!--游戏版本名称-->
    <span class="required">*</span>
    <ui-prop >
        <ui-label slot="label"  v-bind:class="{'required': versionNameValidity}" i18n>${const_1.PLATFORM_NAME}.options.version_name</ui-label>
        <div slot="content">
            <ui-input id="versionName" slot="content" :value="versionName"></ui-input>
        </div>
    </ui-prop>

    <ui-prop  v-if="versionNameValidity">
        <span slot="content" style="color: #ff726e">{{versionNameValidity}}</span>
    </ui-prop>

    <!--游戏版本号-->
    <span class="required">*</span>
    <ui-prop >
        <ui-label slot="label" v-bind:class="{'required': versionCodeValidity}" i18n>${const_1.PLATFORM_NAME}.options.version_number</ui-label>
        <div slot="content">
            <ui-input id="versionCode" slot="content" :value="versionCode"></ui-input>
        </div>
    </ui-prop>

    <ui-prop  v-if="versionCodeValidity">
        <span slot="content" style="color: #ff726e">{{versionCodeValidity}}</span>
    </ui-prop>
</div>
`,exports.ready=ready,exports.update=update;