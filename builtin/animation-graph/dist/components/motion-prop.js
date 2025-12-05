"use strict";var __importDefault=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.methods=exports.data=exports.props=exports.components=exports.template=void 0,require("../clip-related/animation-graph-clip-asset");const variable_selection_1=__importDefault(require("../contributions/inspector/variable-selection"));function data(){return{}}exports.template=`
<div class="motion"
    @mousedown.stop
>
    <ui-prop class="prop" no-label
        v-if="dump.type === $root.queryData.envType.ClipMotion"
    >
        <animation-graph-clip-asset class="content"
            :value="dump.value.uuid"
            @change.stop="changeMotionValue($event.target.value, dump)"
        ></animation-graph-clip-asset>
    </ui-prop>
  
    <ui-prop class="prop" no-label
        v-else-if="dump.type === $root.queryData.envType.AnimationBlend1D"
    >
        <variable-selection
            class="content"
            :value="dump.value.variable"
            :variables="$root.queryData.variables"
            :type-filter="'FLOAT'"
            @change="(varName) => changeMotionValue(varName, dump, $root.queryData.envType.animationBlendVariable)"
        ></variable-selection>
    </ui-prop>

    <template
        v-else-if="dump.type === $root.queryData.envType.AnimationBlend2D"
    >
        <ui-prop class="prop">
            <ui-label slot="label" value="X" class="name"></ui-label>
            <variable-selection
                slot="content"
                class="content"
                :value="dump.value[0].variable"
                :variables="$root.queryData.variables"
                :type-filter="'FLOAT'"
                @change="(varName) => changeMotionValue(varName, dump, $root.queryData.envType.animationBlendVariable, 0)"
            ></variable-selection>
        </ui-prop>
        <ui-prop class="prop">
            <ui-label slot="label" value="Y" class="name"></ui-label>
            <variable-selection
                slot="content"
                class="content"
                :value="dump.value[1].variable"
                :variables="$root.queryData.variables"
                :type-filter="'FLOAT'"
                @change="(varName) => changeMotionValue(varName, dump, $root.queryData.envType.animationBlendVariable, 1)"
            ></variable-selection>
        </ui-prop>
    </template>
</div>
`,exports.components={"variable-selection":variable_selection_1.default},exports.props=["dump"],exports.data=data,exports.methods={changeMotionValue(e,a,t,o){var l=this;switch(a.type){case l.$root.queryData.envType.ClipMotion:l.$root.changeClipMotionInMotion(a.level,e);break;case l.$root.queryData.envType.AnimationBlend1D:l.$root.changeAnimationBlend1DInMotion(a.level,t,e);break;case l.$root.queryData.envType.AnimationBlend2D:l.$root.changeAnimationBlend2DInMotion(a.level,o,t,e)}},getSliderTooltip(e,a){return Editor.I18n.t("animation-graph.motion.thresholdTip",{min:e,max:a})}};