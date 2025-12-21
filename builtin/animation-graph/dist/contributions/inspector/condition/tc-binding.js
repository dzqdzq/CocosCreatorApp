"use strict";var __importDefault=this&&this.__importDefault||function(i){return i&&i.__esModule?i:{default:i}};Object.defineProperty(exports,"__esModule",{value:!0});const variable_selection_1=__importDefault(require("../variable-selection")),template=`
    <div class="variable">
        <ui-icon class="switch"
            value="whirl" 
            tooltip="i18n:animation-graph.condition.changeTCBindingType.label"
            @click="showBindingTypeMenu()" 
        ></ui-icon>

        <div class="content"
            v-if="binding.__type__ === 'cc.animation.TCVariableBinding'"
        >
            <ui-label class="name"
                value="i18n:ENGINE.classes.cc.animation.TCVariableBinding.properties.variableName.label"
                tooltip="i18n:ENGINE.classes.cc.animation.TCVariableBinding.properties.variableName.tooltip"
            ></ui-label>
            <variable-selection class="element"
                :variables="queryData.variables"
                :value="binding.variableName"
                :typeFilter="['FLOAT', 'INTEGER']"
                tooltip="i18n:ENGINE.classes.cc.animation.TCVariableBinding.properties.variableName.tooltip"
                @change="(varName, varType) => { $emit('binding-prop-changed', [[['variableName'], varName], [['type'], queryData.variableType[varType]]]) }"
            ></variable-selection>
        </div>
        
        <div class="content"
            v-else-if="binding.__type__ === 'cc.animation.TCAuxiliaryCurveBinding'"
        >
            <ui-label class="name"
                value="i18n:ENGINE.classes.cc.animation.TCAuxiliaryCurveBinding.properties.curveName.label"
                tooltip="i18n:ENGINE.classes.cc.animation.TCAuxiliaryCurveBinding.properties.curveName.tooltip"
            ></ui-label>
            <ui-input class="element"
                :value="binding.curveName"
                tooltip="i18n:ENGINE.classes.cc.animation.TCAuxiliaryCurveBinding.properties.curveName.tooltip"
                @confirm.stop="$emit('binding-prop-changed', [[['curveName'], $event.target.value]])"
            ></ui-input>
        </div>

        <div class="content"
            v-else-if="binding.__type__ === 'cc.animation.TCStateWeightBinding'"
        >
            <ui-label class="name"
                value="i18n:ENGINE.classes.cc.animation.TCStateWeightBinding.abbr.label"
                tooltip="i18n:ENGINE.classes.cc.animation.TCStateWeightBinding.abbr.tooltip"
            ></ui-label>
        </div>

        <div class="content"
            v-else-if="binding.__type__ === 'cc.animation.TCStateMotionTimeBinding'"
        >
            <ui-label class="name"
                value="i18n:ENGINE.classes.cc.animation.TCStateMotionTimeBinding.abbr.label"
                tooltip="i18n:ENGINE.classes.cc.animation.TCStateMotionTimeBinding.abbr.tooltip"
            ></ui-label>
        </div>
    </div>
`,tcBinding={components:{"variable-selection":variable_selection_1.default},props:["binding","queryData","typeFilter","transitionSourceType"],template:template,methods:{showBindingTypeMenu(){var i=this["typeFilter"];const{tcBindingTypeInfos:e,TCBindingValueType:a}=this.queryData,n="string"==typeof i?[a[i]]:i.map(i=>a[i]);i=e.filter(i=>i.provisions.some(i=>n.includes(i)));Editor.Menu.popup({menu:i.filter(i=>!i.transitionSourceFilter||i.transitionSourceFilter.includes(this.transitionSourceType)).map(i=>({label:`i18n:ENGINE.classes.${i.id}.menu`,click:()=>{this.$emit("binding-type-changed",i.id)}}))})}}};exports.default=tcBinding;