"use strict";var __awaiter=this&&this.__awaiter||function(t,u,l,a){return new(l=l||Promise)(function(o,i){function e(t){try{s(a.next(t))}catch(t){i(t)}}function n(t){try{s(a.throw(t))}catch(t){i(t)}}function s(t){var i;t.done?o(t.value):((i=t.value)instanceof l?i:new l(function(t){t(i)})).then(e,n)}s((a=a.apply(t,u||[])).next())})};Object.defineProperty(exports,"__esModule",{value:!0}),exports.update=exports.ready=exports.buttonConfig=exports.template=exports.$=exports.style=exports.platformSettings=void 0;const const_1=require("./utils/const");let settings;function ready(t){return __awaiter(this,void 0,void 0,function*(){settings=yield Editor.Profile.getConfig(const_1.PLATFORM_NAME,"options."+t.platform),settings=Object.assign({},exports.platformSettings,settings),Object.assign(settings,t.packages[const_1.PLATFORM_NAME]||{}),t.packages[const_1.PLATFORM_NAME]=settings;let o=this;o.dispatch("update","packages."+const_1.PLATFORM_NAME,settings),new(require("vue/dist/vue.js"))({el:o.$.root,data:function(){return settings},methods:{i18n(t){return Editor.I18n.t(const_1.PLATFORM_NAME+"."+t)},onConfirm(t){var t=t.target,i=t.getAttribute("id");settings[i]=t.value,o.dispatch("update",`packages.${const_1.PLATFORM_NAME}.`+i,settings[i])}}})})}function update(t,i){return __awaiter(this,void 0,void 0,function*(){i&&!i.startsWith("packages."+const_1.PLATFORM_NAME)||(settings=Object.assign(settings,t.packages[const_1.PLATFORM_NAME]))})}exports.platformSettings={runtimeVersion:"1.0.0",deviceOrientation:"portrait",statusbarDisplay:!1,startSceneAssetBundle:!1,resourceURL:"",workerPath:"",XHRTimeout:6e4,WSTimeout:6e4,uploadFileTimeout:6e4,downloadFileTimeout:6e4,cameraPermissionHint:"",userInfoPermissionHint:"",locationPermissionHint:"",albumPermissionHint:""},exports.style=`
    .root ui-prop {
        margin-bottom: 4px;
    }
    .root ui-section {
        margin-bottom: 4px;
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
    <!-- cocos-play 基于 cocos-runtime 裁剪功能
    <ui-prop>
        <ui-label slot="label">i18n:${const_1.PLATFORM_NAME}.options.runtime_version</ui-label>
        <ui-input id="runtimeVersion" slot="content" :value="runtimeVersion"></ui-input>
    </ui-prop>
    -->
    <ui-prop>
        <ui-label slot="label">i18n:${const_1.PLATFORM_NAME}.options.orientation</ui-label>
        <ui-select id="deviceOrientation" slot="content" :value="deviceOrientation">
            <option value="landscape">{{i18n("options.landscape")}}</option>
            <option value="portrait">{{i18n("options.portrait")}}</option>
        </ui-select>
    </ui-prop>
    <!-- cocos-play 基于 cocos-runtime 裁剪功能
    <ui-prop>
        <ui-label slot="label">i18n:${const_1.PLATFORM_NAME}.options.status_bar_display</ui-label>
        <ui-checkbox id="statusbarDisplay" slot="content" :value="statusbarDisplay"></ui-checkbox>
    </ui-prop>
    -->
    <ui-prop tooltip="i18n:${const_1.PLATFORM_NAME}.options.start_scene_asset_bundle_tooltip">
        <ui-label slot="label">i18n:${const_1.PLATFORM_NAME}.options.start_scene_asset_bundle</ui-label>
        <ui-checkbox id="startSceneAssetBundle" slot="content" :value="startSceneAssetBundle"></ui-checkbox>
    </ui-prop>
    <ui-prop tooltip="i18n:${const_1.PLATFORM_NAME}.options.resource_url_hint">
        <ui-label slot="label">i18n:${const_1.PLATFORM_NAME}.options.resource_url</ui-label>
        <ui-input id="resourceURL" slot="content" :value="resourceURL"></ui-input>
    </ui-prop>
    <!-- cocos-play 基于 cocos-runtime 裁剪功能
    <ui-prop tooltip="i18n:${const_1.PLATFORM_NAME}.options.worker_path_hint">
        <ui-label slot="label">i18n:${const_1.PLATFORM_NAME}.options.worker_path</ui-label>
        <ui-input id="workerPath" slot="content" :value="workerPath"></ui-input>
    </ui-prop>
    <ui-section class="config" header="i18n:${const_1.PLATFORM_NAME}.options.network_timeout" expand>
        <ui-prop>
            <ui-label slot="label">i18n:${const_1.PLATFORM_NAME}.options.xhr_timeout</ui-label>
            <ui-num-input id="XHRTimeout" slot="content" :value="XHRTimeout" step="1" unit="ms" min="0"></ui-num-input>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label">i18n:${const_1.PLATFORM_NAME}.options.ws_timeout</ui-label>
            <ui-num-input id="WSTimeout" slot="content" :value="WSTimeout" step="1" unit="ms" min="0"></ui-num-input>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label">i18n:${const_1.PLATFORM_NAME}.options.uploadFile_timeout</ui-label>
            <ui-num-input id="uploadFileTimeout" slot="content" :value="uploadFileTimeout" step="1" unit="ms" min="0"></ui-num-input>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label">i18n:${const_1.PLATFORM_NAME}.options.downloadFile_timeout</ui-label>
            <ui-num-input id="downloadFileTimeout" slot="content" :value="downloadFileTimeout" step="1" unit="ms" min="0"></ui-num-input>
        </ui-prop>
    </ui-section>
    <ui-section class="config" header="i18n:${const_1.PLATFORM_NAME}.options.permission_hint" expand>
        <ui-prop>
            <ui-label slot="label">i18n:${const_1.PLATFORM_NAME}.options.permission_camera</ui-label>
            <ui-input id="cameraPermissionHint" slot="content" :value="cameraPermissionHint"></ui-input>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label">i18n:${const_1.PLATFORM_NAME}.options.permission_user_info</ui-label>
            <ui-input id="userInfoPermissionHint" slot="content" :value="userInfoPermissionHint"></ui-input>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label">i18n:${const_1.PLATFORM_NAME}.options.permission_location</ui-label>
            <ui-input id="locationPermissionHint" slot="content" :value="locationPermissionHint"></ui-input>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label">i18n:${const_1.PLATFORM_NAME}.options.permission_album</ui-label>
            <ui-input id="albumPermissionHint" slot="content" :value="albumPermissionHint"></ui-input>
        </ui-prop>
    </ui-section>
    -->
</div>
`,exports.buttonConfig={configs:{make:{label:`i18n:${const_1.PLATFORM_NAME}.make.label`,hookHandle:"make"},build:{label:`i18n:${const_1.PLATFORM_NAME}.build.label`}}},exports.ready=ready,exports.update=update;