"use strict";function data(){return{state:0,image:{GLPreview:{name:"scene:transition-preview",method:"query-transition-preview-data"}},play:{time:0,state:0,speed:0,status:{timeLineLength:0,sourceMotionStart:0,sourceMotionRepeatCount:0,sourceMotionDuration:0,targetMotionStart:0,targetMotionRepeatCount:0,targetMotionDuration:0,exitTimesStart:0,exitTimesLength:0,transitionDurationStart:0,transitionDurationLength:0}}}}function mounted(){this.init()}function destroyed(){this.close()}Object.defineProperty(exports,"__esModule",{value:!0}),exports.destroyed=exports.mounted=exports.methods=exports.data=exports.components=exports.computed=exports.watch=exports.props=exports.template=void 0,exports.template=`
<div class="preview">
<inspector-resize-preview area="footer"></inspector-resize-preview>
    <template
        v-if="show"
    >
        <play-toolbar
            :play="play"
            :state="state"
        ></play-toolbar>

        <timeline
            v-if="state === $root.queryData.previewState.NO_ERROR"
            :play="play"
            :transition="transition"
        ></timeline>

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
`,exports.props=["transition"],exports.watch={"transition.index"(){this.init()}},exports.computed={show(){var e=this;return void 0!==e.$root.queryData.previewState.ILLEGAL_TRANSITION&&![e.$root.queryData.previewState.ILLEGAL_TRANSITION,e.$root.queryData.previewState.NO_TRANSITION_SOURCE_MOTION,e.$root.queryData.previewState.NO_TRANSITION_DESTINATION_MOTION].includes(e.state)}},exports.components={"play-toolbar":require("./preview-play-toolbar"),"image-canvas":require("./preview-image-canvas"),timeline:require("./preview-transition-timeline")},exports.data=data,exports.methods={async init(){var e=this,t=(e.state=await Editor.Message.request("scene","execute-scene-script",{name:"animation-graph",method:"showTransitionPreview",args:[e.transition.index]}),e.$root.queryData.previewState);void 0!==t.NO_ERROR&&e.state!==t.NO_ERROR&&console.warn(Editor.I18n.t("animation-graph.preview."+t[e.state]))},close(){Editor.Message.request("scene","execute-scene-script",{name:"animation-graph",method:"hideTransitionPreview",args:[]})},async setModel(e){await Editor.Message.request("scene","execute-scene-script",{name:"animation-graph",method:"setPreviewModel",args:[e]}),this.init()},update(e){var t=this;t.play=e,t.$refs.image&&(t.$refs.image.isDirty=!0)},timePlay(e){Editor.Message.request("scene","execute-scene-script",{name:"animation-graph",method:"setTimeTransitionPreview",args:[e]})},runPlay(){Editor.Message.request("scene","execute-scene-script",{name:"animation-graph",method:"playTransitionPreview",args:[]})},pausePlay(){Editor.Message.request("scene","execute-scene-script",{name:"animation-graph",method:"pauseTransitionPreview",args:[]})},stopPlay(){Editor.Message.request("scene","execute-scene-script",{name:"animation-graph",method:"stopTransitionPreview",args:[]})}},exports.mounted=mounted,exports.destroyed=destroyed;