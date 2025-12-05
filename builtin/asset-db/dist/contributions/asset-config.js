"use strict";function data(){return{assetConfigMap:{},userData:{}}}function mounted(){this.initDefaultMeta()}Object.defineProperty(exports,"__esModule",{value:!0}),exports.mounted=exports.methods=exports.data=exports.template=void 0,exports.template=`
<div class="config-wrap">
    <template
        v-for="(assetConfig, handler) in assetConfigMap"
        v-if="assetConfig.userDataConfig"
    >
        <ui-section expand>
            <header slot="header">
                <ui-icon color="true"
                    v-if="assetConfig.iconInfo"
                    :value="assetConfig.iconInfo.value"
                ></ui-icon>
                <ui-label
                    :value="assetConfig.displayName || handler"
                ></ui-label>
                <ui-label class="extension"
                    v-if="assetConfig.from && !assetConfig.from.internal"
                    :value="assetConfig.from.pkgName"
                ></ui-label>
            </header>
            <ui-prop type="ui"
                v-for="(userDataConfig, attrKey) in assetConfig.userDataConfig"
                :key="attrKey"
                :label="userDataConfig.label || attrKey"
                :render="getRenderText(userDataConfig, attrKey)"
                :tooltip="userDataConfig.description"
                @confirm="defaultMetaConfirm($event, handler, attrKey)"
            ></ui-prop>
        </ui-section>
    </template>
</div>
`,exports.data=data,exports.methods={getRenderText(e,t){var a=e.render;return a.attributes=a.attributes||{},a.attributes.value=t in this.userData?this.userData[t]:e.default,JSON.stringify(a)},async initDefaultMeta(){const t=await Editor.Message.request("asset-db","query-asset-config-map"),a={};Object.keys(t).forEach(e=>{t[e].userDataConfig&&Object.keys(t[e].userDataConfig).length&&(a[e]=t[e])}),this.assetConfigMap=a},async defaultMetaConfirm(e,t,a){this.assetConfigMap[t].userDataConfig[a].default=e.target.value,await Editor.Message.request("asset-db","update-default-user-data",t,a,e.target.value),Editor.Task.addNotice({title:"Asset-DB",message:"User data has been updated.",timeout:5e3})}},exports.mounted=mounted;