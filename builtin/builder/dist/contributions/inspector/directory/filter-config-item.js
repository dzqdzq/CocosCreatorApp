"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.methods=exports.computed=exports.data=exports.props=exports.template=exports.defaultBundleFilterConfig=void 0,exports.defaultBundleFilterConfig={range:"exclude",type:"url",patchOption:{patchType:"glob",value:"db://assets/*.test"},assets:[""]},exports.template=`
<div class="filter-item indent" @click="toggleSelect">
    <ui-select
        :value="config.type"
        @click.stop
        @confirm="onConfigChange('type', $event.target.value, config)"
    >
        <option value="asset">{{t('filterConfig.asset')}}</option>
        <option value="url">{{t('filterConfig.url')}}</option>
    </ui-select>
    <div class="url"
        v-if="config.type === 'url'"
    >
        <ui-select
            :value="config.patchOption.patchType"
            @click.stop
            @confirm="onConfigChange('patchOption.patchType', $event.target.value, config)"
        >
            <option value="glob">{{t('filterConfig.glob')}}</option>
            <option value="beginWith">{{t('filterConfig.beginWith')}}</option>
            <option value="endWith">{{t('filterConfig.endWith')}}</option>
            <option value="contain">{{t('filterConfig.contain')}}</option>
        </ui-select>
        <ui-input
            :value="config.patchOption.value"
            :placeholder="config.patchOption.patchType === 'url' ? 'i18n:builder.asset_bundle.filterConfig.globTips' : ''"
            :tooltip="config.patchOption.value"
            @click.stop
            @confirm="onConfigChange('patchOption.value', $event.target.value, config)"
        ></ui-input>
    </div>
    <ui-drag-area v-else class="assets" droppable="cc.Asset"
        @click.stop
        @drop="onAssetDrop($event, config)"
    >
        <div class="asset-item" v-for="(uuid, index) in config.assets">
            <ui-asset placeholder="cc.Asset" droppable="cc.Asset" 
                :value="uuid"
                :key="uuid"
                @confirm="onAssets(index, $event.target.value, config)"
                :filter='filterConfig'
            ></ui-asset>
        </div>
    </ui-drag-area>
</div>
`,exports.props=["config","range","assetUrl"];const data=function(){return{}};exports.data=data,exports.computed={filterConfig(){return JSON.stringify({pattern:this.assetUrl+"/**/*"})}},exports.methods={t(t){return Editor.I18n.t("builder.asset_bundle."+t)},onAssetDrop(t,e){var i=(JSON.parse(JSON.stringify(Editor.UI.__protected__.DragArea.currentDragInfo))||{})["additional"];e.assets=e.assets.concat(i.map(t=>t.value)),e.assets=Array.from(new Set(e.assets));this.$emit("change")},onConfigChange(t,e,i){switch(t){case"type":i.type=e,"url"!==i.type||i.patchOption?i.assets=[""]:i.patchOption=JSON.parse(JSON.stringify(exports.defaultBundleFilterConfig.patchOption));break;case"patchOption.value":i.patchOption.value=e;break;case"patchOption.patchType":i.patchOption.patchType=e;break;default:return}this.$emit("change")},onAssets(t,e,i){i.assets[t]=e;this.$emit("change")},toggleSelect(){this.$emit("select")},changeConfigType(t,e){t.type=e,"url"!==t.type||t.patchOption?t.assets=[""]:t.patchOption=JSON.parse(JSON.stringify(exports.defaultBundleFilterConfig.patchOption));this.$emit("change")}};