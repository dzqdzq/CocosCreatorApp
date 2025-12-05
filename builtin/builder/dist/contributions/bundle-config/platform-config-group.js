"use strict";var __createBinding=this&&this.__createBinding||(Object.create?function(t,e,o,l){void 0===l&&(l=o);var i=Object.getOwnPropertyDescriptor(e,o);i&&("get"in i?e.__esModule:!i.writable&&!i.configurable)||(i={enumerable:!0,get:function(){return e[o]}}),Object.defineProperty(t,l,i)}:function(t,e,o,l){t[l=void 0===l?o:l]=e[o]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}:function(t,e){t.default=e}),__importStar=this&&this.__importStar||function(t){if(t&&t.__esModule)return t;var e={};if(null!=t)for(var o in t)"default"!==o&&Object.prototype.hasOwnProperty.call(t,o)&&__createBinding(e,t,o);return __setModuleDefault(e,t),e};Object.defineProperty(exports,"__esModule",{value:!0}),exports.methods=exports.data=exports.computed=exports.components=exports.props=exports.template=void 0;const ConfigItem=__importStar(require("./bundle-config-item")),bundle_utils_1=require("../../share/bundle-utils"),data=(exports.template=`
<div class="container">
    <ui-prop class="label tip">
        <ui-label slot="label" value="i18n:builder.asset_bundle.platform"></ui-label>
        <div slot="content" class="platform-container">
            <ui-label
                value="i18n:builder.asset_bundle.compression_type"
                tooltip="i18n:builder.asset_bundle.compression_type_tooltip"
            ></ui-label>
            <div>
                <ui-label
                    value="i18n:builder.asset_bundle.is_remote_bundle"
                    tooltip="i18n:builder.asset_bundle.remote_bundle_invalid_tooltip"
                ></ui-label>
            </div>
        </div>
    </ui-prop>
    <template v-if="platformConfigs">
        <ui-prop class="platform-config"
            v-for="(config, platform) in platformConfigs"
            v-if="platformSettings && platformSettings[platform] || showAll"
            :key="JSON.stringify(config)"
            :selectable="canSelect"
            :active="canSelect && selectPlatform.includes(platform)"
            @click.stop="onSelect($event, platform)"
        >
            <ui-label slot="label"
                :value="config.platformName"
            ></ui-label>
            <div slot="content" v-if="config.supportOptions">
                <config-item class="platform-container"
                    :type="platform"
                    :option="platformSettings && platformSettings[platform] || {}"
                    :readonly="readonly"
                    :support-options="config.supportOptions"
                    @update="onPlatformSettingsChange"
                >
                </config-item>
            </div>
        </ui-prop>
    </template>
</div>
`,exports.props=["platformSettings","readonly","platformConfigs","showAll","selectPlatform"],exports.components={"config-item":ConfigItem},exports.computed={canSelect(){return!this.readonly&&this.selectPlatform}},()=>({compressRenderList:Object.freeze(bundle_utils_1.BundlecompressionTypeMap)}));exports.data=data,exports.methods={onPlatformSettingsChange(t,e,o){var l=this.platformSettings&&this.platformSettings[o]||{};this.platformSettings?(this.$set(this.platformSettings,o,l),this.$set(this.platformSettings[o],t,e)):l[t]=e,this.$emit("update",o,l)},onSelect(t,e){var o=this;!o.readonly&&o.canSelect&&(t.shiftKey?o.selectPlatform.includes(e)?o.selectPlatform.splice(o.selectPlatform.indexOf(e),1):o.selectPlatform.push(e):(o.selectPlatform.length=0,o.selectPlatform.push(e)))}};