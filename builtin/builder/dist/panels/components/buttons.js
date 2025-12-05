"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.mounted=exports.methods=exports.computed=exports.watch=exports.data=exports.name=exports.props=exports.template=void 0;const path_1=require("path"),plugin_1=require("../plugin");function data(){return{buttonConfig:{buttons:[]},buildModeList:[{label:"i18n:builder.options.build_mode_normal",value:"normal"},{label:"i18n:builder.options.build_mode_bundle",value:"bundle"}]}}function mounted(){Object.keys(plugin_1.pluginManager.platformMap).length&&(this.buttonConfig=this.calcBuildConfig())}exports.template=`
<div v-if="task" class="buttons" @dblclick.stop>
    <div class="select">
        <ui-icon color v-if="task.options.buildMode === 'bundle'" tooltip="i18n:builder.experiment" value="experiment"></ui-icon>
        <ui-select
            :value="task.options.buildMode || 'normal'"
            :disabled="type === 'new'"
            @confirm="onBuildModeChange($event.target.value)"
        >
            <option v-for="option in buildModeList"
                :value="option.value"
            >{{option.label}}</option>
        </ui-select>
    </div>
    <template class="options">
        <template
            v-for="(configItem, index) in buttonConfig.buttons"
        >
            <ui-button type="icon"
                v-if="index !== 0"
                class="transparent"
                :disabled="isButtonDisabled(buttonConfig.buttons[index - 1])"
                @confirm.stop="linkBuildStage(buttonConfig.buttons[index - 1].name, configItem.name)"
                @mousedown.stop
            >
                <ui-icon value="link"></ui-icon>
            </ui-button>
            <ui-button class="group"
                v-if="configItem.groupItems"
                :key="configItem.name + !!configItem.groupItems"
                :disabled="isButtonDisabled(configItem)"
                @confirm.stop="onButtonConfirm(configItem)"
                @mousedown.stop
                @mouseover.stop
            >
                <ui-label
                    :tooltip="configItem.description"
                    :value="configItem.displayName || configItem.name"
                ></ui-label>
                <template
                    v-for="(groupItem, groupIndex) in configItem.groupItems"
                >
                    <ui-button class="transparent" type="icon"
                        :disabled="isButtonDisabled(configItem)"
                        @mousedown.stop
                        @confirm.stop="unlinkBuildStage(configItem.name, groupItem.name)"
                    >
                        <ui-icon value="unlink"></ui-icon>
                        <ui-icon value="to-right-arrow"></ui-icon>
                    </ui-button>
                    <ui-label
                        :key="groupItem.name + index"
                        :tooltip="groupItem.description"
                        :value="groupItem.displayName || groupItem.name"
                    ></ui-label>
                </template>
            </ui-button>
            <template v-else>
                <ui-button
                    class="single"
                    :key="configItem.name"
                    :disabled="isButtonDisabled(configItem)"
                    @mousedown.stop
                    @confirm.stop="onButtonConfirm(configItem)"
                >
                    <ui-label :value="configItem.displayName || configItem.name"></ui-label>
                </ui-button>
            </template>
        </template>
    </template>
    <div class="custom" v-if="buttonConfig.custom">
        <ui-panel :src="buttonConfig.custom"></ui-panel>
    </div>
</div>
`,exports.props=["task","type","free","checkRes","runningTaskId"],exports.name="buttons",exports.data=data,exports.watch={"task.options.platform"(t,o){this.buttonConfig=this.calcBuildConfig()},"task.options"(t,o){this.buttonConfig=this.calcBuildConfig()}},exports.computed={isDisabled(){var t=this.task;return"processing"===t.state||"waiting"===t.state||!t.id||!plugin_1.pluginManager.platformMap[t.options.platform]},isBuildDisabled(){var{task:t,type:o,checkRes:i}=this;return"list"!==o&&!i||"new"!==o&&("processing"===t.state||"waiting"===t.state)||!plugin_1.pluginManager.platformMap[t.options.platform]},runDisabled(){return"failure"===this.task.state||this.isDisabled},buildToolTip(){var t=this;return!1===t.checkRes?"i18n:builder.error.check_options_failed":"new"===t.type||t.free&&"processing"!==t.task.state&&"waiting"!==t.task.state?plugin_1.pluginManager.platformMap[t.task.options.platform]?"":Editor.I18n.t("i18n:builder.tips.platform_missing",{platform:t.task.options.platform}):"i18n:builder.tips.task_busy"}},exports.methods={onKeyConfirm(){var t=this,o=t.buttonConfig.buttons[0];o&&"build"===o.name&&!t.isButtonDisabled(o)&&t.onButtonConfirm(o)},async onButtonConfirm(t){var o,i,e,n=this;t.lock||(t.lock=!0,"build"===t.name?await n.onBuild()||(t.lock=!1):t.message?({target:o,name:i}=t.message,e=(0,path_1.join)(Editor.UI.__protected__.File.resolveToRaw(n.task.options.buildPath),n.task.options.outputName),Editor.Message.send(o,i,e,n.task.options),t.lock=!1):(Editor.Message.request("builder","execute-build-stage",t.name,{taskId:n.task.id}),n.$root.showSettings=!1,setTimeout(()=>{t.lock=!1},500)))},checkDelisted(){return new Promise(async o=>{var i=await Editor.Profile.getConfig("utils","delisted."+this.task.options.platform);if(i){let t="warn";"delisted"===i.status&&(t="error");var e=Editor.I18n.getLanguage(),e=i["message_"+e]||i.message;0===(await Editor.Dialog[t](e,{title:Editor.I18n.t("builder.delisted.title"),cancel:0,buttons:[Editor.I18n.t("builder.delisted.confirm")]})).response&&("preDelisted"===i.status?o(!1):o(!0))}o(!1)})},async onBuild(t){var o=this;return!await o.checkDelisted()&&!!await plugin_1.pluginManager.checkPlatformsInformation(o.task.options.platform)&&!(!await plugin_1.pluginManager.checkRemoveSplashInformation(o.task.options.useSplashScreen)||("new"===o.type?Editor.Message.send("builder","add-task",o.task.options):Editor.Message.send("builder","recompile-task",o.task.id,o.task.options),o.$root.showSettings=!1))},isButtonDisabled(t){var o=this;if("build"===t.name)return o.isBuildDisabled;if(o.isDisabled||"new"===o.type||!o.free)return!0;if(o.runningTaskId){if(!t.parallelism||"none"===t.parallelism)return!0;if("other"===t.parallelism){t=o.$root.taskMap[o.runningTaskId];if(t&&o.task.options.platform===t.options.platform)return!0}}return!1},linkBuildStage(t,o){var i=this,t=(i.task.options.buildStageGroup=i.task.options.buildStageGroup||{},i.task.options.buildStageGroup[t]=Array.isArray(i.task.options.buildStageGroup[t])?i.task.options.buildStageGroup[t]:[],i.task.options.buildStageGroup[t].push(o),i.task.options.buildStageGroup[o]&&(i.task.options.buildStageGroup[t].push(...i.task.options.buildStageGroup[o]),delete i.task.options.buildStageGroup[o]),Object.keys(i.task.options.buildStageGroup).length?i.task.options.buildStageGroup:void 0);Editor.Profile.setConfig(i.task.options.platform,"builder.common.buildStageGroup",t,"local"),i.task.options.buildStageGroup=t,i.$root.updateTaskOptions(i.task),i.buttonConfig=i.calcBuildConfig()},onBuildModeChange(t){var o=this;Editor.Profile.setConfig(o.task.options.platform,"builder.common.buildMode",t,"local"),o.$set(o.task.options,"buildMode",t),o.$forceUpdate(),o.calcBuildConfig(),Editor.Message.send("builder","update-task",o.task)},unlinkBuildStage(t,o){var i,e=this,n=e.task.options.buildStageGroup[t];Array.isArray(n)&&(1<n.length&&(1<(i=n.splice(n.findIndex(t=>t===o),n.length)).length&&(i.shift(),e.task.options.buildStageGroup[o]=i),n)||delete e.task.options.buildStageGroup[t],i=Object.keys(e.task.options.buildStageGroup).length?e.task.options.buildStageGroup:void 0,Editor.Profile.setConfig(e.task.options.platform,"builder.common.buildStageGroup",i,"local"),e.task.options.buildStageGroup=i,e.$root.updateTaskOptions(e.task),e.buttonConfig=e.calcBuildConfig())},calcBuildConfig(){const i=this;var t={displayName:"i18n:builder.build",hookHandle:"build",name:"build",description:i.buildToolTip};const n=plugin_1.pluginManager.getButtonsConfig(i.task.options.platform);return n&&n.buttons&&0!==n.buttons.length?(i.task.options.buildStageGroup&&n.buttons?(n.buttons=JSON.parse(JSON.stringify(n.buttons)),n.buttons.unshift(t),Object.keys(i.task.options.buildStageGroup).forEach(o=>{if(Array.isArray(i.task.options.buildStageGroup[o])){var t=n.buttons.find(t=>t.name===o);if(t){const e=[];i.task.options.buildStageGroup[o].forEach(o=>{var t=n.buttons.findIndex(t=>t.name===o),i=n.buttons[t];if(!i||i.groupItems)return null;n.buttons.splice(t,1),e.push(i)}),e.length&&(t.groupItems=e)}}})):(n.buttons=n.buttons||[],n.buttons.unshift(t)),n):{buttons:[t]}}},exports.mounted=mounted;