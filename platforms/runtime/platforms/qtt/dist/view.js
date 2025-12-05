"use strict";var __awaiter=this&&this.__awaiter||function(t,a,r,p){return new(r=r||Promise)(function(e,i){function o(t){try{s(p.next(t))}catch(t){i(t)}}function n(t){try{s(p.throw(t))}catch(t){i(t)}}function s(t){var i;t.done?e(t.value):((i=t.value)instanceof r?i:new r(function(t){t(i)})).then(o,n)}s((p=p.apply(t,a||[])).next())})};Object.defineProperty(exports,"__esModule",{value:!0}),exports.update=exports.ready=exports.buttonConfig=exports.template=exports.$=exports.style=exports.platformSettings=void 0;const const_1=require("./utils/const"),fs_1=require("fs");let settings;function ready(t){return __awaiter(this,void 0,void 0,function*(){let e=this;settings=yield Editor.Profile.getConfig(const_1.PLATFORM_NAME,"options."+t.platform),settings=Object.assign({},exports.platformSettings,settings,t.packages[const_1.PLATFORM_NAME]),e.dispatch("update","packages."+const_1.PLATFORM_NAME,settings),new(require("vue/dist/vue.js"))({el:e.$.root,data:function(){return settings},methods:{i18n(t){return Editor.I18n.t(const_1.PLATFORM_NAME+"."+t)},onConfirm(t){var t=t.target,i=t.getAttribute("id");settings[i]=t.value,e.dispatch("update",`packages.${const_1.PLATFORM_NAME}.`+i,settings[i]),verifyData(i,t.value,t)}}})})}function verifyData(t,i,e){let o="1px solid #ff726e";switch(t){case"versionName":i?(o="",exports.platformSettings.versionNameValidity=""):exports.platformSettings.versionNameValidity=t+" "+Editor.I18n.t("oppo-mini-game.tips.not_empty");break;case"versionCode":i?(o="",exports.platformSettings.versionCodeValidity=""):exports.platformSettings.versionCodeValidity=t+" "+Editor.I18n.t("oppo-mini-game.tips.not_empty");break;case"package":i&&/^[a-zA-Z]+[0-9a-zA-Z_]*(\.[a-zA-Z]+[0-9a-zA-Z_]*)*$/.test(i)?(o="",exports.platformSettings.packageValidity=""):exports.platformSettings.packageValidity=""+Editor.I18n.t("oppo-mini-game.tips.package_name_error");break;case"icon":"string"==typeof i&&fs_1.existsSync(i)?(o="",exports.platformSettings.iconValidity=""):exports.platformSettings.iconValidity="Icon Path"+Editor.I18n.t("oppo-mini-game.tips.icon_not_exist");break;default:console.debug("verifyData key:",t,i),o=""}e.style.border=o}function update(t,i){return __awaiter(this,void 0,void 0,function*(){i&&!i.startsWith("packages."+const_1.PLATFORM_NAME)||(settings=Object.assign(settings,t.packages[const_1.PLATFORM_NAME]))})}exports.platformSettings={runtimeVersion:"1.0.0",deviceOrientation:"portrait",statusbarDisplay:!1,startSceneAssetBundle:!1,resourceURL:"",workerPath:"",XHRTimeout:6e4,WSTimeout:6e4,uploadFileTimeout:6e4,downloadFileTimeout:6e4,cameraPermissionHint:"",userInfoPermissionHint:"",locationPermissionHint:"",albumPermissionHint:"",package:"com.qtt.cocos",icon:Editor.App.icon,versionName:Editor.App.version,versionCode:"1",packageValidity:"",iconValidity:"",versionNameValidity:"",versionCodeValidity:""},exports.style=`
    .root ui-prop {
        margin-bottom: 4px;
    }
    .root ui-section {
        margin-bottom: 4px;
    }

    .required {
        position: absolute;
        left: -2px;
        color: #ff726e;
    },

    .redText{
        color: ff726e;
        font-size:10px;
    }

    ui-prop > *[slot='content'] {
                flex: 1;
                display: flex;
                flex-direction: column;

                .build-prop {
                    display: flex;
                    flex: 1;
                }

                > ui-select,
                > ui-input,
                > ui-color,
                > ui-num-input,
                > ui-num-input,
                > ui-file,
                > ui-section {
                    flex: 1;
                }

                > ui-image {
                    width: 60px;
                    height: 60px;
                    border: 1px dashed;
                }
            }
`,exports.$={root:".root"},exports.template=`
<div class="root" @confirm="onConfirm">
    <ui-prop tooltip="i18n:${const_1.PLATFORM_NAME}.options.start_scene_asset_bundle_tooltip">
        <ui-label slot="label">i18n:${const_1.PLATFORM_NAME}.options.start_scene_asset_bundle</ui-label>
        <ui-checkbox id="startSceneAssetBundle" slot="content" :value="startSceneAssetBundle"></ui-checkbox>
    </ui-prop>
    <ui-prop tooltip="i18n:${const_1.PLATFORM_NAME}.options.resource_url_hint">
        <ui-label slot="label">i18n:${const_1.PLATFORM_NAME}.options.resource_url</ui-label>
        <ui-input id="resourceURL" slot="content" :value="resourceURL"></ui-input>
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
`,exports.buttonConfig={configs:{make:{label:`i18n:${const_1.PLATFORM_NAME}.make.label`,hookHandle:"make"},build:{label:`i18n:${const_1.PLATFORM_NAME}.build.label`}}},exports.ready=ready,exports.update=update;