"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.mounted=exports.methods=exports.computed=exports.watch=exports.data=exports.name=exports.props=exports.template=void 0;const path_1=require("path"),plugin_1=require("../plugin"),fs_extra_1=require("fs-extra");function data(){return{buttonConfig:{buttons:[]},buildModeList:[{label:"i18n:builder.options.build_mode_normal",value:"normal"},{label:"i18n:builder.options.build_mode_bundle",value:"bundle"}]}}function mounted(){Object.keys(plugin_1.pluginManager.platformMap).length&&(this.buttonConfig=this.calcBuildConfig())}exports.template=`
<div v-if="task" class="buttons" @dblclick.stop>
    <div class="select">
        <ui-icon color v-if="task.options.buildMode === 'bundle'" tooltip="i18n:builder.experiment" value="experiment"></ui-icon>
        <ui-select-pro :disabled="type === 'new'" @confirm="onBuildModeChange($event.target.value)">
            <template v-for="option in buildModeList">
                <ui-select-option-pro 
                    :key="option.value"
                    :value="option.value" 
                    :label="option.label" 
                    :selected='task.options.buildMode === option.value'>
                </ui-select-option-pro>
            </template>
        </ui-select-pro>
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
                :type="isButtonActive(configItem) ? 'primary' : ''"
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
                    <ui-button type="icon"
                        :class="{transparent: true, blue: isButtonActive(configItem)}"
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
                    :type="isButtonActive(configItem) ? 'primary' : ''"
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
`,exports.props=["task","type","free","checkRes","runningTaskId"],exports.name="buttons",exports.data=data,exports.watch={"task.options.platform"(t,o){this.buttonConfig=this.calcBuildConfig()},"task.options"(t,o){this.buttonConfig=this.calcBuildConfig()}},exports.computed={isDisabled(){var t=this.task;return"processing"===t.state||"waiting"===t.state||!t.id||!plugin_1.pluginManager.platformMap[t.options.platform]},isBuildDisabled(){var{task:t,type:o,checkRes:e}=this;return"list"!==o&&!e||"new"!==o&&("processing"===t.state||"waiting"===t.state)||!plugin_1.pluginManager.platformMap[t.options.platform]},runDisabled(){return"failure"===this.task.state||this.isDisabled},buildToolTip(){var t=this;return!1===t.checkRes?"i18n:builder.error.check_options_failed":"new"===t.type||t.free&&"processing"!==t.task.state&&"waiting"!==t.task.state?plugin_1.pluginManager.platformMap[t.task.options.platform]?"":Editor.I18n.t("i18n:builder.tips.platform_missing",{platform:t.task.options.platform}):"i18n:builder.tips.task_busy"}},exports.methods={onKeyConfirm(){var t=this,o=t.buttonConfig.buttons[0];o&&"build"===o.name&&!t.isButtonDisabled(o)&&t.onButtonConfirm(o)},async onButtonConfirm(t){var o=this;if(!t.lock)if(t.lock=!0,"build"===t.name)await o.onBuild()||(t.lock=!1);else{var e,i,s=(0,path_1.join)(Editor.UI.__protected__.File.resolveToRaw(o.task.options.buildPath),o.task.options.outputName);if(!(0,fs_extra_1.existsSync)(s))return t.lock=!1,Editor.Dialog.info(Editor.I18n.t("builder.tips.buildPackageMissing",{dest:s})),!1;t.message?({target:e,name:i}=t.message,Editor.Message.send(e,i,s,o.task.options),t.lock=!1):(Editor.Message.request("builder","execute-build-stage",t.name,{taskId:o.task.id}),o.$root.showSettings=!1,setTimeout(()=>{t.lock=!1},500))}},checkDelisted(){return new Promise(async o=>{var e=await Editor.Profile.getConfig("utils","delisted."+this.task.options.platform);if(e){let t="warn";"delisted"===e.status&&(t="error");var i=Editor.I18n.getLanguage(),i=e["message_"+i]||e.message;0===(await Editor.Dialog[t](i,{title:Editor.I18n.t("builder.delisted.title"),cancel:0,buttons:[Editor.I18n.t("builder.delisted.confirm")]})).response&&("preDelisted"===e.status?o(!1):o(!0))}o(!1)})},async onBuild(t){var o=this;return!await o.checkDelisted()&&!!await plugin_1.pluginManager.checkPlatformsInformation(o.task.options.platform)&&!(!await plugin_1.pluginManager.checkRemoveSplashInformation(o.task.options.useSplashScreen)||("new"===o.type?Editor.Message.send("builder","add-task",o.task.options):Editor.Message.send("builder","recompile-task",o.task.id,o.task.options),o.$root.showSettings=!1))},isButtonDisabled(t){var o=this;if("build"===t.name)return o.isBuildDisabled;if(o.isDisabled||"new"===o.type||!o.free)return!0;if(o.runningTaskId){if(!t.parallelism||"none"===t.parallelism)return!0;if("other"===t.parallelism){t=o.$root.taskMap[o.runningTaskId];if(t&&o.task.options.platform===t.options.platform)return!0}}return!1},isButtonActive(t){var o=this;return!o.isButtonDisabled(t)&&("new"===o.type||"edit"===o.type)},linkBuildStage(t,o){var e=this,t=(e.task.options.buildStageGroup=e.task.options.buildStageGroup||{},e.task.options.buildStageGroup[t]=Array.isArray(e.task.options.buildStageGroup[t])?e.task.options.buildStageGroup[t]:[],e.task.options.buildStageGroup[t].push(o),e.task.options.buildStageGroup[o]&&(e.task.options.buildStageGroup[t].push(...e.task.options.buildStageGroup[o]),delete e.task.options.buildStageGroup[o]),Object.keys(e.task.options.buildStageGroup).length?e.task.options.buildStageGroup:void 0);Editor.Profile.setConfig(e.task.options.platform,"builder.common.buildStageGroup",t,"local"),e.task.options.buildStageGroup=t,e.$root.updateTaskOptions(e.task),e.buttonConfig=e.calcBuildConfig()},onBuildModeChange(t){var o=this;Editor.Profile.setConfig(o.task.options.platform,"builder.common.buildMode",t,"local"),o.$set(o.task.options,"buildMode",t),o.$forceUpdate(),o.calcBuildConfig(),Editor.Message.send("builder","update-task",o.task)},unlinkBuildStage(t,o){var e,i=this,s=i.task.options.buildStageGroup[t];Array.isArray(s)&&(1<s.length&&(1<(e=s.splice(s.findIndex(t=>t===o),s.length)).length&&(e.shift(),i.task.options.buildStageGroup[o]=e),s)||delete i.task.options.buildStageGroup[t],e=Object.keys(i.task.options.buildStageGroup).length?i.task.options.buildStageGroup:void 0,Editor.Profile.setConfig(i.task.options.platform,"builder.common.buildStageGroup",e,"local"),i.task.options.buildStageGroup=e,i.$root.updateTaskOptions(i.task),i.buttonConfig=i.calcBuildConfig())},calcBuildConfig(){const e=this;var t={displayName:"i18n:builder.build",hookHandle:"build",name:"build",description:e.buildToolTip};const s=plugin_1.pluginManager.getButtonsConfig(e.task.options.platform);return s&&s.buttons&&0!==s.buttons.length?(e.task.options.buildStageGroup&&s.buttons?(s.buttons=JSON.parse(JSON.stringify(s.buttons)),s.buttons.unshift(t),Object.keys(e.task.options.buildStageGroup).forEach(o=>{if(Array.isArray(e.task.options.buildStageGroup[o])){var t=s.buttons.find(t=>t.name===o);if(t){const i=[];e.task.options.buildStageGroup[o].forEach(o=>{var t=s.buttons.findIndex(t=>t.name===o),e=s.buttons[t];if(!e||e.groupItems)return null;s.buttons.splice(t,1),i.push(e)}),i.length&&(t.groupItems=i)}}})):(s.buttons=s.buttons||[],s.buttons.unshift(t)),s):{buttons:[t]}}},exports.mounted=mounted;