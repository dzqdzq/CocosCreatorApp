"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const template=`
    <div>
        <ui-num-input v-if="isInteger" class="constant" step="1"
            :value="value"
            :tooltip="value"
            @change="$emit('value-changed', parseInt($event.target.value))"
        ></ui-num-input>
        <ui-num-input v-else class="constant" step="0.1"
            :value="value"
            :tooltip="value"
            @change="$emit('value-changed', parseFloat($event.target.value))"
        ></ui-num-input>
    </div>
`,binaryConditionConstantOperand={props:["value","isInteger"],template:template};exports.default=binaryConditionConstantOperand;