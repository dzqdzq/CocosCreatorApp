"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const template=`
    <ui-select
        :value="value"
        :tooltip="tooltip"
        @confirm.stop="$emit('change', $event.target.value, variables[$event.target.value].type)"
    >
        <option
            v-for="(variable, variableName, index) in variables" 
            :key="variable.type + '-' + variableName"
            v-if="!typeFilter || (!Array.isArray(typeFilter) && typeFilter === variable.type) || (typeFilter.includes(variable.type))"
            :value="variableName"
        >
            {{variableName}}
        </option>
    </ui-select>
`,variableSelection={props:["value","variables","typeFilter","tooltip"],emits:["change"],template:template,methods:{isTypeIncluded(e){return void 0===this.typeFilter||("string"==typeof this.typeFilter?e===this.typeFilter:!Array.isArray(this.typeFilter)||this.typeFilter.includes(e))}}};exports.default=variableSelection;