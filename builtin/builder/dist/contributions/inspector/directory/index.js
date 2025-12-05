"use strict";var __createBinding=this&&this.__createBinding||(Object.create?function(e,i,t,n){void 0===n&&(n=t);var l=Object.getOwnPropertyDescriptor(i,t);l&&("get"in l?i.__esModule:!l.writable&&!l.configurable)||(l={enumerable:!0,get:function(){return i[t]}}),Object.defineProperty(e,n,l)}:function(e,i,t,n){e[n=void 0===n?t:n]=i[t]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,i){Object.defineProperty(e,"default",{enumerable:!0,value:i})}:function(e,i){e.default=i}),__importStar=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var i={};if(null!=e)for(var t in e)"default"!==t&&Object.prototype.hasOwnProperty.call(e,t)&&__createBinding(i,e,t);return __setModuleDefault(i,e),i};Object.defineProperty(exports,"__esModule",{value:!0}),exports.close=exports.methods=exports.update=exports.$=exports.template=exports.style=void 0;const fs_extra_1=require("fs-extra"),electron_1=require("electron"),path_1=require("path"),bundle_utils_1=require("../../../share/bundle-utils"),configItem=__importStar(require("./filter-config-item")),BundleConfigGroup=__importStar(require("../../bundle-config/bundle-config-group")),Vue=require("vue/dist/vue.js");function onProfileChange(e,i,t,n){"project"===e&&i.includes("builder")&&t.includes("bundleConfig.custom")&&this.updateBundleConfigs(n)}Vue.config.productionTip=!1,Vue.config.devtools=!1;const vueTemplate=`
<section class="asset-directory">
    <div class="path" v-for="info in infos">
        <div class="name">
            <span>{{info.source}}</span>
        </div>
        <div class="button">
            <ui-button class="blue explore-btn" tabindex="0" tooltip="i18n:builder.open"
                @confirm.stop="_onOpenDirectory($event, info)"
                @change.stop
            >
                <ui-icon value="folder-open"></ui-icon>
            </ui-button>
        </div>
    </div>

    <div class="content">
        <ui-prop
            :readonly="_isResources || info.readonly"
            @confirm="_onPropertyChanged($event, 'isBundle')"
        >
            <ui-label slot="label" value="i18n:builder.asset_bundle.is_bundle"></ui-label>
            <div slot="content">
                <ui-checkbox
                    :value="_isBundle"
                    :disabled="_isResources || info.readonly"
                    :invalid="invalid('isBundle')"
                ></ui-checkbox>
                <ui-icon value="help"
                    :tooltip="bundleTooltip"
                    @click="openDocs"
                ></ui-icon>
            </div>
        </ui-prop>
        <div v-if="_isBundle && !invalid('isBundle')">
            <ui-prop
                @confirm="_onPropertyChanged($event, 'bundleName')"
                :readonly="_isResources || info.readonly || metas.length > 1"
            >
                <ui-label slot="label" value="i18n:builder.asset_bundle.bundle_name"></ui-label>
                <ui-input slot="content" :disabled="_isResources || info.readonly  || metas.length > 1" :value="metas[0].userData.bundleName || defaultValue.bundleName" :placeholder="getDefaultValue()" :invalid="invalid('bundleName')"></ui-input>
            </ui-prop>
            <ui-prop
                tooltip="i18n:builder.asset_bundle.priority_tooltip"
                :readonly="info.readonly"
                @confirm="_onPropertyChanged($event, 'priority')"
            >
                <ui-label slot="label" value="i18n:builder.asset_bundle.priority"></ui-label>
                <ui-num-input slot="content" min="1" max="20" step="1"
                    :disabled="info.readonly"
                    :value="metas[0].userData.priority || defaultValue.priority"
                    :invalid="invalid('priority')"
                >
                </ui-num-input>
            </ui-prop>

            <ui-section expand class="bundle-config">
                <ui-label slot="header" value="i18n:builder.asset_bundle.targetPlatform"></ui-label>
                <ui-prop class="header"
                    :readonly="info.readonly"
                    @change.stop
                >
                    <ui-label slot="label" value="i18n:builder.asset_bundle.platformConfig"></ui-label>
                    <div slot="content">
                        <ui-select
                            :disabled="info.readonly"
                            :value="metas[0].userData.bundleConfigID || defaultValue.bundleConfigID"
                            @confirm.stop="_onPropertyChanged($event, 'bundleConfigID')"
                            @click.stop
                        >
                            <option
                                v-for="(config, key) in bundleConfigs"
                                :value="key"
                                :key="key"
                            >{{config.displayName}}</option>
                        </ui-select>
                        <ui-button @click="editBundleConfig(metas[0].userData.bundleConfigID || defaultValue.bundleConfigID)">
                            <ui-label value="i18n:builder.asset_bundle.editConfig"></ui-label>
                        </ui-button>
                    </div>
                </ui-prop>

                <template v-if="renderConfigs && currentBundleConfig">
                    <config-group
                        :custom-config="currentBundleConfig"
                        :render-config="renderConfigs"
                        readonly="true"
                    ></config-group>
                </template>
            </ui-section>

            <ui-section expand class="bundle-filter-wrap">
                <ui-label slot="header" value="i18n:builder.asset_bundle.filterConfig.title"></ui-label>
                <div class="config-content">
                    <div class="include">
                        <div class="filter-header">
                            <ui-label value="i18n:builder.asset_bundle.filterConfig.include"></ui-label>
                            <div>
                                <ui-button class="transparent" type="icon"
                                    @click="removeConfig('include')"
                                >
                                    <ui-icon value="mini"></ui-icon>
                                </ui-button>
                                <ui-button class="transparent" type="icon"
                                    @click="addConfig('include')"
                                >
                                    <ui-icon value="add"></ui-icon>
                                </ui-button>
                            </div>
                        </div>
                        <config-item type="include"
                            v-for="(config, index) in bundleFilterConfig"
                            v-if="config.range === 'include'"
                            :key="index"
                            :config="config"
                            :uuid="meta.uuid"
                            :asset-url="assetUrl"
                            :active="selectArr.includes(index)"
                            @change="onConfigChange(index, config)"
                            @select="toggleSelect(config, index)"
                        >
                        </config-item>
                    </div>
                    <div class="exclude">
                        <div class="filter-header">
                            <ui-label value="i18n:builder.asset_bundle.filterConfig.exclude"></ui-label>
                            <div>
                                <ui-button class="transparent" type="icon"
                                    @click="removeConfig('exclude')"
                                >
                                    <ui-icon value="mini"></ui-icon>
                                </ui-button>
                                <ui-button class="transparent" type="icon"
                                    @click="addConfig('exclude')"
                                >
                                    <ui-icon value="add"></ui-icon>
                                </ui-button>
                            </div>
                        </div>
                        <config-item type="exclude"
                            v-for="(config, index) in bundleFilterConfig"
                            v-if="config.range === 'exclude'"
                            :config="config"
                            :key="index"
                            :uuid="meta.uuid"
                            :asset-url="assetUrl"
                            :active="selectArr.includes(index)"
                            @change="onConfigChange(index, config)"
                            @select="toggleSelect(config, index)"
                        >
                        </config-item>
                    </div>
                    <div class="empty" v-if="!bundleFilterConfig || !bundleFilterConfig.length">
                        <ui-label value="i18n:builder.asset_bundle.filterConfig.emptyConfig"></ui-label>
                    </div>
                    <div class="preview">
                        <div class="header">
                            <ui-button
                                :disabled="!bundleFilterConfig || !bundleFilterConfig.length"
                                @confirm="onPreview"
                            >
                                <ui-label value="i18n:builder.asset_bundle.filterConfig.preview"></ui-label>
                            </ui-button>
                        </div>
                        <ui-section expand class="preview-content" v-if="hasPreview">
                            <div slot="header">
                                <ui-label value="i18n:builder.asset_bundle.filterConfig.previewList"></ui-label>
                                <ui-icon value="info-i" tooltip="i18n:builder.asset_bundle.filterConfig.previewTips"></ui-icon>
                            </div>
                            <div v-if="previewList.length" class="content">
                                <div v-for="url in previewList">
                                    <ui-label :value="url"></ui-label>
                                </div>
                            </div>
                            <div v-else class="content empty">
                                <ui-label 
                                    tooltip="i18n:builder.asset_bundle.filterConfig.emptyPreviewList"
                                    value="i18n:builder.asset_bundle.filterConfig.emptyPreviewList"
                                ></ui-label>
                            </div>
                        </ui-section>
                    </div>
                </div>
            </ui-section>

            <div class="build-bundle" v-if="metas.length === 1">
                <ui-button @click="onBuild">
                    <ui-icon value="build-bundle"></ui-icon>
                    <ui-label value="i18n:builder.asset_bundle.buildBundle"></ui-label>
                </ui-button>
            </div>
        </div>
    </div>
</section>
`;function update(e,i){const t=this;t.vm||((n=new Vue({components:{"config-item":configItem,"config-group":BundleConfigGroup},data(){return{infos:[],info:{},metas:[],meta:{},curPlatform:"web-desktop",defaultValue:{isBundle:!1,bundleName:"",priority:1,bundleConfigID:"default"},assetUrl:"",previewList:[],selectArr:[],bundleConfigs:{},renderConfigs:null,hasPreview:!1}},computed:{_isResources(){return!!this.infos&&this.infos.some(e=>"db://assets/resources"===e.url)},_isBundle(){var e;return null==(e=this.meta.userData)?void 0:e.isBundle},_priority(){var e;return null==(e=this.meta.userData)?void 0:e.priority},bundleFilterConfig(){return this.meta.userData.bundleFilterConfig&&this.meta.userData.bundleFilterConfig.length?this.meta.userData.bundleFilterConfig:[]},bundleTooltip(){return this._isResources?`
                        <ui-label value="i18n:engine.resources_docs_1"></ui-label><br>
                        <ui-label value="i18n:engine.resources_docs_2"></ui-label>
                        `:`
                        <ui-label value="i18n:engine.bundle_docs1"></ui-label><br>
                        <ui-label value="i18n:engine.bundle_docs2"></ui-label>
                    `},currentBundleConfig(){var e=this.meta.userData.bundleConfigID||this.defaultValue.bundleConfigID;return null==(e=this.bundleConfigs[e])?void 0:e.configs}},mounted(){t.onProfileChangeBind=onProfileChange.bind(this),Editor.Profile.__protected__.on("change",t.onProfileChangeBind)},destroyed(){Editor.Profile.__protected__.removeListener("change",t.onProfileChangeBind)},methods:{reset(){this.previewList=[]},async refresh(){this.meta&&this.meta.uuid&&(e=await Editor.Message.request("asset-db","query-asset-info",this.meta.uuid))&&(this.assetUrl=e.url);var e=await Editor.Profile.getProject("builder","bundleConfig.custom"),e=(e&&await this.updateBundleConfigs(e),await Editor.Message.request("builder","query-bundle-config"));e&&(this.renderConfigs=Object.freeze(e))},async updateBundleConfigs(e){e.default||(e.default=bundle_utils_1.DefaultBundleConfig),this.bundleConfigs=e},onBuild(){Editor.Message.send("builder","open","build-bundle",{root:this.assetUrl}),Editor.Message.send("builder","change-build-bundle",{root:this.assetUrl})},t(e){return Editor.I18n.t("builder.asset_bundle."+e)},editBundleConfig(e){Editor.Message.send("project","open-settings","builder","bundle-config",e)},_onOpenDirectory(e,i){electron_1.shell.openPath(i.file)},_onPropertyChanged(e,i){let t=e.target.value;t===this.defaultValue[i]&&(t=void 0),this.metas&&this.metas.forEach(e=>{this.$set(e.userData,i,t)}),this._afterPropertyChanged()},_afterPropertyChanged(){t.dispatch("change"),t.dispatch("snapshot")},onConfigChange(){this._afterPropertyChanged()},removeConfig(t){if(this.meta.userData.bundleFilterConfig){if(this.selectArr.length)this.meta.userData.bundleFilterConfig=this.meta.userData.bundleFilterConfig.filter((e,i)=>!this.selectArr.includes(i)||e.range!==t),this.selectArr=[];else for(let e=this.meta.userData.bundleFilterConfig.length-1;0<=e;e--)if(this.meta.userData.bundleFilterConfig[e].range===t){this.meta.userData.bundleFilterConfig.splice(e,1);break}this._afterPropertyChanged()}},toggleSelect(e,i){this.selectArr.includes(i)?this.selectArr.splice(i,1):this.selectArr.splice(this.selectArr.length,0,i)},addConfig(e){var i=JSON.parse(JSON.stringify(configItem.defaultBundleFilterConfig));"include"===(i.range=e)&&i.patchOption&&(i.patchOption.value=this.assetUrl+"/**/*"),this.meta.userData.bundleFilterConfig?(this.meta.userData.bundleFilterConfig.splice(this.meta.userData.bundleFilterConfig.length-1,0,i),this.$set(this.meta.userData,"bundleFilterConfig",this.meta.userData.bundleFilterConfig)):this.$set(this.meta.userData,"bundleFilterConfig",[i]),this._afterPropertyChanged()},async onPreview(){this.previewList=await Editor.Message.request("asset-db","execute-script",{name:"builder",method:"queryAssetsInBundle",args:[this.meta.uuid]}),this.hasPreview=!0},getDefaultValue(){return this.info?(0,bundle_utils_1.getBundleDefaultName)(this.info):""},openDocs(){var e=this._isResources?Editor.Utils.Url.getDocUrl("asset/dynamic-load-resources.html"):Editor.Utils.Url.getDocUrl("asset/bundle.html");Editor.Message.send("program","open-url",e)},async apply(){if(this._isBundle&&this.meta){const s=this.meta.userData.bundleName||this.getDefaultValue();if(!/^[a-zA-Z0-9_-]+$/.test(s))return console.error(`Invalid bundle name(${s}), only numbers, letters, minus sign and underscores can be included in the bundle name.`),!1;var{MAIN:e,START_SCENE:i,RESOURCES:t,INTERNAL:n}=bundle_utils_1.BuiltinBundleName;if(l(t,s)&&!this._isResources||[e,i,n].find(e=>l(e,s)))return console.error(Editor.I18n.t("builder.asset_bundle.duplicate_reserved_keyword_message",{name:s})),!1;for(const u of await Editor.Message.request("asset-db","query-assets",{isBundle:!0}))if(this.info&&u.url!==this.info.url){if(l(u.meta.userData.bundleName||(0,path_1.basename)(u.url),s))return console.error(Editor.I18n.t("builder.asset_bundle.duplicate_name_message",{name:s,url:u.url})),!1;if(Editor.Utils.Path.contains(u.url,this.info.url))return console.error(Editor.I18n.t("builder.asset_bundle.nest_bundle",{url:u.url})),!1;if(Editor.Utils.Path.contains(this.info.url,u.url))return console.error(Editor.I18n.t("builder.asset_bundle.nest_bundle",{url:u.url})),!1}function l(e,i){return new RegExp(`^${e}$`,"i").test(i)}}},invalid(i){return!this.metas||!this.meta||this.metas.some(e=>e.userData[i]!==this.meta.userData[i])},invalidCompressionType(){return!this.metas||!this.meta||this.metas.some(e=>e.userData.compressionType[this.curPlatform]!==this.meta.userData.compressionType[this.curPlatform])},invalidIsRemoteBundle(){return!this.metas||!this.meta||this.metas.some(e=>e.userData.isRemoteBundle[this.curPlatform]!==this.meta.userData.isRemoteBundle[this.curPlatform])}},template:vueTemplate})).$mount(t.$.container),t.vm=n),t.vm.infos=e,t.vm.metas=i,t.vm.info=e[0];var n=i[0];t.vm.meta&&n&&t.vm.meta.uuid!==n.uuid&&t.vm.reset(),t.vm.meta=n,t.vm.refresh()}function close(){var e;Editor.Profile.__protected__.removeListener("change",this.onProfileChangeBind),null!=(e=this.vm)&&e.$destroy(),this.vm=null}exports.style=(0,fs_extra_1.readFileSync)((0,path_1.join)(__dirname,"./style.css"),"utf8"),exports.template='<div class="container"></div>',exports.$={container:".container"},exports.update=update,exports.methods={async apply(){return this.vm.apply()}},exports.close=close;