"use strict";var __importDefault=this&&this.__importDefault||function(n){return n&&n.__esModule?n:{default:n}};Object.defineProperty(exports,"__esModule",{value:!0});const variable_selection_1=__importDefault(require("../variable-selection")),tc_binding_1=__importDefault(require("./tc-binding")),binary_condition_constant_operand_1=__importDefault(require("./binary-condition-constant-operand")),template=`
    <table class="condition">
        <tr
            v-for="(condition, conditionIndex) in conditions"
            :key="keyOrRefPrefix + conditionIndex"
            :ref="keyOrRefPrefix + conditionIndex"
        >
            <!-- 二元条件 -->

            <template
                v-if="condition.type==='BinaryCondition'"
            >
                <td class="lhs">
                    <tcf-binding
                        :binding="condition.lhsBinding"
                        :query-data="queryData"
                        :type-filter="['FLOAT', 'INTEGER']"
                        :transition-source-type="transitionSourceType"
                        @binding-type-changed="(...args) => $emit('condition-binding-type-changed', conditionIndex, 'lhsBinding', ...args)"
                        @binding-prop-changed="(patch) => $emit('condition-binding-prop-changed', conditionIndex, 'lhsBinding', patch)"
                    ></tcf-binding>
                </td>

                <td class="operator">
                    <ui-select
                        :value="condition.operator"
                        @change="$emit('condition-prop-changed', conditionIndex, ['operator'], parseInt($event.target.value))"
                    >
                        <option
                            v-for="(name,value) in queryData.binaryConditionOperator" 
                            :key="name"
                            v-if="!isFinite(name)"
                            :value="value"
                        >
                            {{queryData.binaryConditionOperatorI18n[name] || name}}
                        </option>
                    </ui-select>
                </td>

                <td class="rhs">
                    <binary-condition-constant-operand
                        :value="condition.rhs"
                        :is-integer="condition.isRhsInteger"
                        @value-changed="(value) => $emit('condition-prop-changed', conditionIndex, ['rhs'], value)"
                    ></binary-condition-constant-operand>
                </td>
            </template>

            <!-- 一元条件 -->

            <template
                v-else-if="condition.type==='UnaryCondition'"
            >
                <td class="lhs">
                    <variable-selection
                        :value="condition.operand"
                        :variables="queryData.variables"
                        :typeFilter="'BOOLEAN'"
                        @change="(varName) => $emit('condition-prop-changed', conditionIndex, ['operand', 'variable'], varName)"
                    ></variable-selection>
                </td>
                <td class="operator">
                    <span class="label">=</span>
                </td>
                <td class="rhs">
                    <ui-select
                        :value="condition.operator"
                        @change="$emit('condition-prop-changed', conditionIndex, ['operator'], parseInt($event.target.value))"
                    >
                        <option
                            v-for="(name,value) in queryData.unaryConditionOperator"
                            :key="name" 
                            v-if="!isFinite(name)"
                            :value="value"
                        >
                            {{queryData.unaryConditionOperatorI18n[name] || name}}
                        </option>
                    </ui-select>
                </td>
            </template>

            <!-- 触发器条件 -->

            <template
                v-else-if="condition.type==='TriggerCondition'"
            >
                <td class="lhs">
                    <ui-label value="i18n:animation-graph.condition.TriggerCondition"></ui-label>
                </td>
                <td class="rhs" colspan="2">
                    <variable-selection
                        :value="condition.trigger"
                        :variables="queryData.variables"
                        :typeFilter="'TRIGGER'"
                        @change="(varName) => $emit('condition-prop-changed', conditionIndex, ['trigger'], varName)"
                    ></variable-selection>
                </td>
            </template>

            <td class="remove">
                <ui-icon value="del" color="true" tooltip="i18n:animation-graph.condition.remove"
                    @click.stop="$emit('remove-condition', conditionIndex)"
                ></ui-icon>
            </td>

        </tr>
    </table>
`,conditionGrid={components:{"tcf-binding":tc_binding_1.default,"binary-condition-constant-operand":binary_condition_constant_operand_1.default,"variable-selection":variable_selection_1.default},props:["conditions","queryData","keyOrRefPrefix","transitionSourceType"],template:template};exports.default=conditionGrid;