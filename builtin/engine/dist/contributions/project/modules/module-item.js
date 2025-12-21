"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.computed=exports.methods=exports.props=exports.template=void 0,exports.template=`
<div
    v-if="moduleCache && module && !module.hidden"
    :class="['modules-item', module.options && moduleCache[moduleId] ? 'flex' : '']"
>
    <!-- 模块名字 -->
    <template>
        <ui-checkbox class="checkbox"
           
            :disabled="module.readonly || (disableOpt() && value)"
            :value="value"
            @change="onModuleChange(moduleId, '_value', $event.target.value)"
        >
            <ui-icon v-if="module.readonly" value="lock"></ui-icon>
            <ui-label class="name" :value="module.label" :tooltip="module.description"></ui-label>
        </ui-checkbox>
       
        <div class="flag-wrap" v-if="module.flags && moduleCache[moduleId]?._value">
            <template v-for="(option, name) in module.flags">
                <ui-checkbox 
                    :key="name"
                    v-if="option['ui-type'] === 'checkbox'"
                    :value="moduleCache[moduleId]?._flags?.[name]"
                    @change="onChangeFlag(moduleId, name, $event.target.value)"
                >
                    <ui-label class="name" :value="option.label" :tooltip="option.description"></ui-label>
                </ui-checkbox>

                <div v-if="option['ui-type'] === 'select'" class="flags-ui-type-select" :key="name">
                    <ui-label class="name" :value="option.label" :tooltip="option.description"></ui-label>
                    <ui-select-pro
                        @change="onChangeFlag(moduleId, name, $event.target.value)"
                    >
                        <ui-select-option-pro
                            v-for="(option, optionName) in option.options"
                            :key="optionName"
                            :value="option.value"
                            :selected="moduleCache[moduleId]?._flags[name] === option.value"
                            :label="option.label"
                        >
                        </ui-select-option-pro>
                    </ui-select-pro>
                </div>
            </template>
        </div> 
        <div class="icon-box" v-if="envLimitModuleIconMap[moduleId]" slot="suffix">
            <ui-icon v-for="icon in envLimitModuleIconMap[moduleId]" :key="icon"  :tooltip="icon"  :value="icon"></ui-icon>
        </div>
    </template>

    <!-- 如果模块是多选一，则有这个配置 -->
    <div class="option-wrap" v-if="module.options && moduleCache[moduleId]?._value">
        <ui-select-pro
            @change="onModuleChange(moduleId, '_option', $event.target.value)"
        >
            <ui-select-option-pro
                v-for="(option, optionName) in module.options"
                :selected="moduleCache[moduleId]._option === optionName"
                :key="optionName"
                :value="optionName"
                :label="option.label"
            >
            <div class="icon-box" v-if="envLimitModuleIconMap[optionName]" slot="prefix" style="white-space: nowrap;">
                <ui-icon v-for="icon in envLimitModuleIconMap[optionName]" :key="icon"  :tooltip="icon"  :value="icon"></ui-icon>
            </div>  
            </ui-select-option-pro>
        </ui-select-pro>
        <div class="flag-wrap" v-if="optionFlags">
            <template  v-for="(option, name) in optionFlags">
                <ui-checkbox 
                    :key="name"
                    v-if="option['ui-type'] === 'checkbox'"
                    :value="moduleCache[moduleCache[moduleId]._option]?._flags?.[name]"
                    @change="onChangeFlag(moduleCache[moduleId]._option, name, $event.target.value)"
                >
                    <ui-label class="name" :value="option.label" :tooltip="option.description"></ui-label>
                </ui-checkbox>

                <div v-if="option['ui-type'] === 'select'" class="flags-ui-type-select" :key="name">
                    <ui-label class="name" :value="option.label" :tooltip="option.description"></ui-label>
                    <ui-select-pro
                        @change="onChangeFlag(moduleCache[moduleId]._option, name, $event.target.value)"
                    >
                        <ui-select-option-pro
                            v-for="(option, optionName) in option.options"
                            :key="optionName"
                            :value="option.value"
                            :label="option.label"
                            :selected="moduleCache[moduleCache[moduleId]._option]?._flags[name] === option.value"
                        >
                        </ui-select-option-pro>
                    </ui-select-pro>
                </div>
            </template>
        </div>
    </div>
</div>`,exports.props=["module","moduleId","moduleCache","category","categoryDetail","envLimitModuleIconMap"],exports.methods={t(e){return e?(e=e.replace("i18n:",""),Editor.I18n.t(e)||e):""},onModuleChange(e,o,l){this.$emit("change",this.category,e,o,l)},onChangeFlag(e,o,l){l="boolean"==typeof l?l:Number(l);this.$emit("change-flag",e,o,l)},disableOpt(){const l=this;return!!l.categoryDetail?.required&&1===Object.entries(l.categoryDetail.modules??{}).filter(([e,o])=>!o.hidden&&Boolean(l.moduleCache[e]?._value)).length}},exports.computed={value(){var{module:e,moduleCache:o,moduleId:l}=this;return!!e.required||o[l]&&o[l]._value},optionFlags(){var e=this;if(e.module.options&&e.moduleCache[e.moduleId]?._value){e=e.module.options[e.moduleCache[e.moduleId]._option];if(e?.flags)return e.flags}}};