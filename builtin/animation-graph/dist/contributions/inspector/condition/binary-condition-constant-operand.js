Object.defineProperty(exports, "__esModule", { value: true });

const template = `
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
`;

const binaryConditionConstantOperand = {
  props: ["value", "isInteger"],
  template,
};

exports.default = binaryConditionConstantOperand;
