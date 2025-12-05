"use strict";var __createBinding=this&&this.__createBinding||(Object.create?function(e,t,s,r){void 0===r&&(r=s);var o=Object.getOwnPropertyDescriptor(t,s);o&&("get"in o?t.__esModule:!o.writable&&!o.configurable)||(o={enumerable:!0,get:function(){return t[s]}}),Object.defineProperty(e,r,o)}:function(e,t,s,r){e[r=void 0===r?s:r]=t[s]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),__importStar=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var s in e)"default"!==s&&Object.prototype.hasOwnProperty.call(e,s)&&__createBinding(t,e,s);return __setModuleDefault(t,e),t};Object.defineProperty(exports,"__esModule",{value:!0}),exports.components=exports.beforeDestroy=exports.mounted=exports.created=exports.methods=exports.computed=exports.data=exports.props=exports.template=void 0;const lodash_1=require("lodash"),electron_1=require("electron"),ConfigGroup=__importStar(require("../../texture-compress/comp/config-group")),minimaps_1=require("../../../worker/builder/asset-handler/texture-compress/minimaps"),CONFIG_UPDATED_EVENT="builder:texture-compress-config-updated";function data(){return{textureCompressConfig:null,customConfigs:null,overwriteFormats:{},latestConfigUpdate:null,genMipMaps:!1,imageSize:null}}function created(){this.throttledOnConfigUpdated=(0,lodash_1.throttle)(this.onConfigUpdated.bind(this),250,{trailing:!0})}async function mounted(){Editor.Message.__protected__.addBroadcastListener(CONFIG_UPDATED_EVENT,this.throttledOnConfigUpdated),await this.refresh()}function beforeDestroy(){Editor.Message.__protected__.removeBroadcastListener(CONFIG_UPDATED_EVENT,this.throttledOnConfigUpdated)}exports.template=`
<div>
    <ui-prop
        v-if="meta && meta.userData"
        :readonly="readonly"
        :disabled="readonly"
    >
        <ui-label slot="label" value="i18n:builder.assets.auto_atlas.useCompressTexture" tooltip="Use Compress Texture"></ui-label>
        <ui-checkbox slot="content"
            :value="useCompressTexture"
            :disabled="readonly"
            :invalid="invalidUseCompressTexture"
            @confirm="_onCompressSettingsChanged($event, 'useCompressTexture')"
        ></ui-checkbox>
    </ui-prop>
    <ui-label v-if="disabledMipMapTips" class="warn" :value="disabledMipMapTips"></ui-label>

    <ui-prop
        v-if="useCompressTexture && !invalidUseCompressTexture"
        :readonly="readonly"
    >
        <ui-label slot="label" tooltip="Preset Id">Preset Id</ui-label>
        <div slot="content">
            <ui-select
                :disabled="readonly"
                :value="meta.userData.compressSettings && meta.userData.compressSettings.presetId || 'default'"
                :invalid="invalidPresetId"
                @confirm="_onCompressSettingsChanged($event, 'presetId')"
            >
                <option
                    v-for="(config, id) in textureCompressConfig.userPreset"
                    v-if="config"
                    :value="id"
                    :key="id"
                >{{config.name}}</option>
                <option
                    v-for="(config, id) in textureCompressConfig.defaultConfig"
                    v-if="config"
                    :value="id"
                    :key="id"
                >{{config.name}}</option>
            </ui-select>
            <ui-button value="edit"
                @confirm.stop="jumpToProjectSettings(meta.userData.compressSettings && meta.userData.compressSettings.presetId || 'default')"
                tooltip="i18n:builder.project.texture_compress.tips.jump_to_edit_config"
            ><ui-label value="i18n:builder.assets.image.edit_preset"></ui-label></ui-button>
        </div>
    </ui-prop>

    <config-group readonly="true"
        class="platform-setting"
        v-if="userTextureCompress && !invalidUseCompressTexture && !invalidPresetId"
        :compress-config="textureCompressConfig"
        :overwrite-formats="overwriteFormats"
        :config="userTextureCompress.config"
    >
    </config-group>
</div>`,exports.props=["meta","metas","readonly"],exports.data=data,exports.computed={userTextureCompress(){var e=this,t=e.meta||e.metas[0];return e.textureCompressConfig&&e.textureCompressConfig.userPreset&&t.userData.compressSettings&&t.userData.compressSettings.useCompressTexture&&(t=t.userData.compressSettings.presetId||"default",e=e.textureCompressConfig.userPreset[t]||e.textureCompressConfig.defaultConfig[t])?{name:t,config:e}:null},invalidUseCompressTexture(){const s=this,r=!!s.meta.userData.compressSettings;return s.metas.some(e=>{var t=!!e.userData.compressSettings;return r!=t||r&&e.userData.compressSettings.useCompressTexture!==s.meta.userData.compressSettings.useCompressTexture})},invalidPresetId(){const s=this,r=!!s.meta.userData.compressSettings;return s.metas.some(e=>{var t=!!e.userData.compressSettings;return r!=t||r&&e.userData.compressSettings.presetId!==s.meta.userData.compressSettings.presetId})},useCompressTexture(){var{textureCompressConfig:e,meta:t}=this;return e&&t.userData&&t.userData.compressSettings&&t.userData.compressSettings.useCompressTexture},disabledMipMapTips(){var e=this,t=e.meta||e.metas[0];return e.genMipMaps&&e.useCompressTexture&&(0,minimaps_1.checkHasMipMaps)(t)?"auto-atlas"!==t.importer||t.userData.powerOfTwo?!(t=e.imageSize)||(0,minimaps_1.isPowerOfTwo)(t.width)&&(0,minimaps_1.isPowerOfTwo)(t.height)?"":"i18n:builder.project.texture_compress.mipmap.noPowerOfTwo":"i18n:builder.project.texture_compress.mipmap.noPowerOfTwoWithAtlas":""}},exports.methods={jumpToProjectSettings(e){Editor.Message.send("project","open-settings","builder","compress-texture",e)},_onCompressSettingsChanged(s,r){const o=this;o.metas.forEach(e=>{var t=e.userData.compressSettings&&JSON.parse(JSON.stringify(e.userData.compressSettings))||{};t[r]=s.target.value,o.$set(e.userData,"compressSettings",t)}),o.$emit("confirm")},async refreshCompressConfig(){const t=this;var e,s,r=Date.now();this.latestConfigUpdate=r,this.latestConfigUpdate===r&&({userPreset:r,defaultConfig:e}=await Editor.Profile.getProject("builder","textureCompressConfig"),t.customConfigs=await Editor.Profile.getProject("builder","textureCompressConfig.customConfigs")||{},t.customConfigs&&Object.keys(t.customConfigs)&&Object.values(t.customConfigs).forEach(e=>{e.overwrite&&(t.overwriteFormats[e.format]&&(t.customConfigs[t.overwriteFormats[e.format]].overwrite=!1,console.debug(`conflict format config ${e.format}(${t.overwriteFormats[e.format]} is invalid.)`)),t.$set(t.overwriteFormats,e.format,e.id))}),s=await Editor.Message.request("builder","query-compress-config"),Object.assign(s,{userPreset:r,defaultConfig:e}),t.$set(t,"textureCompressConfig",s))},async getImageSize(e){var t=this;if(!e||!t.useCompressTexture)return null;if(!t.imageSize){e=await Editor.Message.request("asset-db","query-asset-info",e);if(!e)return;e=electron_1.nativeImage.createFromPath(e.file);t.imageSize=e.getSize()}return t.imageSize},async refresh(){var e=this;await e.refreshCompressConfig(),e.genMipMaps=await Editor.Profile.getProject("builder","textureCompressConfig.genMipmaps"),e.imageSize=await e.getImageSize(e.meta.uuid)},onConfigUpdated(){this.refreshCompressConfig()}},exports.created=created,exports.mounted=mounted,exports.beforeDestroy=beforeDestroy,exports.components={"config-group":ConfigGroup};