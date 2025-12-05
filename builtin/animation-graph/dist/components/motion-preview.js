"use strict";function data(){return{state:0,image:{GLPreview:{name:"scene:motion-preview",method:"query-motion-preview-data"}},play:{time:0,state:0,speed:0,status:{timeLineLength:0,sourceMotionStart:0,sourceMotionRepeatCount:0,sourceMotionDuration:0,targetMotionStart:0,targetMotionRepeatCount:0,targetMotionDuration:0,exitTimesStart:0,exitTimesLength:0,transitionDurationStart:0,transitionDurationLength:0}}}}function mounted(){this.init()}function destroyed(){this.close()}Object.defineProperty(exports,"__esModule",{value:!0}),exports.destroyed=exports.mounted=exports.methods=exports.data=exports.computed=exports.watch=exports.props=exports.components=exports.template=void 0,exports.template=`
<div class="preview">
    <inspector-resize-preview area="footer"></inspector-resize-preview>
    <template
        v-if="show"
    >
        <play-toolbar
            :play="play"
            :state="state"
        ></play-toolbar>

        <div class="operation"
            v-if="motion && isBlend1D && motion.involvedBlendParamVariables"
        >
            <ui-prop class="prop"
                v-for="(varInfo, varName) in motion.involvedBlendParamVariables"
                v-bind:key="varName"
            >
                <ui-label slot="label" class="name"
                    :tooltip="varName"
                    :value="varName"
                ></ui-label>
                <ui-slider slot="content" class="content" step="0.1"
                    :min="varInfo.min"
                    :max="varInfo.max" 
                    :value="varInfo.value"
                    @change.stop="updatePreviewBlendVariable([{name: varName, value: $event.target.value}])"
                    @confirm.stop="confirmPreviewBlendVariable"
                ></ui-slider>
            </ui-prop>
        </div>
        <play-handle-2d
            v-else-if="motion && isBlend2D"
        ></play-handle-2d>
        <image-canvas ref="image"
            :config="image"
            :play="play"
            :state="state"
        ></image-canvas>
    </template>
    <ui-label class="error-tip"
        v-else
        :value="'i18n:animation-graph.preview.'+$root.queryData.previewState[state]"
    ></ui-label>
</div>
`,exports.components={"play-toolbar":require("./preview-play-toolbar"),"play-handle-2d":require("./preview-play-handle-2d"),"image-canvas":require("./preview-image-canvas")},exports.props=["crumb"],exports.watch={crumb(){this.init()}},exports.computed={show(){var e=this;return void 0!==e.$root.queryData.previewState.ILLEGAL_MOTION&&![e.$root.queryData.previewState.ILLEGAL_MOTION].includes(e.state)},motion(){return this.$root.viewMotion()},isBlend1D(){var e=this;return e.motion&&e.motion.type===e.$root.queryData.animationBlendType[0]},isBlend2D(){var e=this;return e.motion&&e.motion.type===e.$root.queryData.animationBlendType[1]}},exports.data=data,exports.methods={async init(){var e=this,t=(e.state=await Editor.Message.request("scene","execute-scene-script",{name:"animation-graph",method:"showMotionPreview",args:[]}),e.$root.queryData.previewState);void 0!==t.NO_ERROR&&e.state!==t.NO_ERROR&&console.warn(Editor.I18n.t("animation-graph.preview."+t[e.state]))},close(){Editor.Message.request("scene","execute-scene-script",{name:"animation-graph",method:"hideMotionPreview",args:[]})},async setModel(e){await Editor.Message.request("scene","execute-scene-script",{name:"animation-graph",method:"setPreviewModel",args:[e]}),this.init()},update(e){var t=this;t.play=e,t.$refs.image&&(t.$refs.image.isDirty=!0)},timePlay(e){Editor.Message.request("scene","execute-scene-script",{name:"animation-graph",method:"setTimeMotionPreview",args:[e]})},runPlay(){Editor.Message.request("scene","execute-scene-script",{name:"animation-graph",method:"playMotionPreview",args:[]}),Editor.Metrics._trackEventWithTimer({category:"animationStateMachine",id:"A100014",value:1})},pausePlay(){Editor.Message.request("scene","execute-scene-script",{name:"animation-graph",method:"pauseMotionPreview",args:[]})},stopPlay(){Editor.Message.request("scene","execute-scene-script",{name:"animation-graph",method:"stopMotionPreview",args:[]})},async queryBlend2DThresholdsWeights(e){var t=this.motion.children.map(e=>e.threshold);return await Editor.Message.request("scene","execute-scene-script",{name:"animation-graph",method:"queryBlend2DThresholdsWeights",args:[t,e]})},updatePreviewBlendVariable(e){Editor.Message.request("scene","execute-scene-script",{name:"animation-graph",method:"updatePreviewVariable",args:[e]})},confirmPreviewBlendVariable(){this.$root.metric("A100011")},updateMotionEditDataThreshold(e){Editor.Message.request("scene","execute-scene-script",{name:"animation-graph",method:"updateMotionEditData",args:["threshold",e]})}},exports.mounted=mounted,exports.destroyed=destroyed;