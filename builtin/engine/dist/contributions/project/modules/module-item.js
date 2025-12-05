"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.methods=exports.props=exports.template=void 0,exports.template=`
<div
    v-if="moduleCache && module && !module.hidden"
    :class="['modules-item', module.options && moduleCache[moduleId] ? 'flex' : '']"
>
    <!-- 模块名字 -->
    <ui-checkbox class="checkbox"
        v-if="selectAll"
        :disabled="module.readonly"
        :value="module.required ? true : moduleCache[moduleId] && moduleCache[moduleId]._value"
        @change="onModuleChange(moduleId, '_value', $event.target.value)"
    >
        <ui-icon v-if="module.readonly" value="lock"></ui-icon>
        <ui-label class="name" :value="module.label" :tooltip="module.description"></ui-label>
    </ui-checkbox>
    <div v-else>
        <ui-icon v-if="module.readonly" value="lock"></ui-icon>
        <ui-label :value="module.label">
        </ui-label>
    </div>

    <!-- 如果模块是多选一，则有这个配置 -->
    <div v-if="module.options && moduleCache[moduleId]">
        <ui-select
            :value="moduleCache[moduleId]._option"
            @change="onModuleChange(moduleId, '_option', $event.target.value)"
        >
            <option v-for="(option, optionName) in module.options"
                :value="optionName"
            >
                <!-- <ui-label :value="option.label"></ui-label> -->
                {{t(option.label) || option.label}}
            </option>
        </ui-select>
    </div>
</div>`,exports.props=["module","moduleId","moduleCache","selectAll","category"],exports.methods={t(e){return e?(e=e.replace("i18n:",""),Editor.I18n.t(e)||e):""},onModuleChange(e,o,l){var u=this;u.moduleCache[e][o]=l,"_option"===o&&(u.moduleCache[l]._value=l),u.$emit("change",u.category,e,o,l)}};