"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.methods=exports.computed=exports.data=exports.props=exports.template=exports.defaultBundleFilterConfig=void 0,exports.defaultBundleFilterConfig={range:"exclude",type:"url",patchOption:{patchType:"glob",value:"db://assets/*.test"},assets:[""]},exports.template=`
<div class="filter-item indent" @click="toggleSelect">
    <ui-select-pro
        option-pure
        style="width:80px"
        @click.stop
        @confirm="onConfigChange('type', $event.target.value, config)"
    >
        <ui-select-option-pro  
            value="asset" 
            label="i18n:builder.asset_bundle.filterConfig.asset"
            :selected="config.type === 'asset'"
        />
        <ui-select-option-pro 
            value="url" 
            label="i18n:builder.asset_bundle.filterConfig.url"
            :selected="config.type === 'url'"
        />
    </ui-select-pro>
    <div class="url"
        v-if="config.type === 'url'"
    >
        <ui-select-pro
            option-pure
            style="width:90px"
            @click.stop
            @confirm="onConfigChange('patchOption.patchType', $event.target.value, config)"
        >
            <ui-select-option-pro value="glob" label='i18n:builder.asset_bundle.filterConfig.glob' :selected="config.patchOption.patchType === 'glob'" />
            <ui-select-option-pro value="beginWith" label='i18n:builder.asset_bundle.filterConfig.beginWith' :selected="config.patchOption.patchType === 'beginWith'" />
            <ui-select-option-pro value="endWith" label='i18n:builder.asset_bundle.filterConfig.endWith' :selected="config.patchOption.patchType === 'endWith'"/>
            <ui-select-option-pro value="contain" label='i18n:builder.asset_bundle.filterConfig.contain' 
            :selected="config.patchOption.patchType === 'contain'"/>
        </ui-select-pro>
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
`,exports.props=["config","range","assetUrl"];const data=function(){return{}};exports.data=data,exports.computed={filterConfig(){return JSON.stringify({pattern:this.assetUrl+"/**/*"})}},exports.methods={t(e){return Editor.I18n.t("builder.asset_bundle."+e)},onAssetDrop(e,t){var i=(JSON.parse(JSON.stringify(Editor.UI.__protected__.DragArea.currentDragInfo))||{})["additional"];t.assets=t.assets.concat(i.map(e=>e.value)),t.assets=Array.from(new Set(t.assets));this.$emit("change")},onConfigChange(e,t,i){switch(e){case"type":i.type=t,"url"!==i.type||i.patchOption?i.assets=[""]:i.patchOption=JSON.parse(JSON.stringify(exports.defaultBundleFilterConfig.patchOption));break;case"patchOption.value":i.patchOption.value=t;break;case"patchOption.patchType":i.patchOption.patchType=t;break;default:return}this.$emit("change")},onAssets(e,t,i){i.assets[e]=t;this.$emit("change")},toggleSelect(){this.$emit("select")},changeConfigType(e,t){e.type=t,"url"!==e.type||e.patchOption?e.assets=[""]:e.patchOption=JSON.parse(JSON.stringify(exports.defaultBundleFilterConfig.patchOption));this.$emit("change")}};