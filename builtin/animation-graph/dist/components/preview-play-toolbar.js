"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.methods=exports.watch=exports.props=exports.template=void 0,exports.template=`
<div class="toolbar"
    :disable="state!==$root.queryData.previewState.NO_ERROR"
>
    <div>
        <ui-icon class="icon" value="rewind" ref="start" tooltip="Start"
            @click="$parent.timePlay(0)"
        ></ui-icon>
        <ui-icon class="icon" value="prev-play" ref="prev" tooltip="Prev"
            @click="prevClick"
        ></ui-icon>
        <ui-icon class="icon" value="play" ref="play"  tooltip="Play"
            v-show="play.state!==1"
            @click="$parent.runPlay"
        ></ui-icon>
        <ui-icon class="icon" value="pause" ref="pause" tooltip="Pause"
            v-show="play.state===1"
            @click="$parent.pausePlay"
        ></ui-icon>
        <ui-icon class="icon" value="stop" ref="stop" tooltip="Stop"
            @click="$parent.stopPlay"
        ></ui-icon>
        <ui-icon class="icon" value="next-play" ref="next" tooltip="Next"
            @click="nextClick"
        ></ui-icon>
        <ui-icon class="icon" value="forward" ref="end" tooltip="End"
            @click="$parent.timePlay(play.status.timeLineLength)"
        ></ui-icon>
        
        <span class="text" ref="time">{{play.time.toFixed(2)}} s</span>
    </div>
    <div>
        <ui-scale-plate ref="plate"
            @confirm="setTime($event)"
            @wheel.stop.capture
        ></ui-scale-plate>
    </div>
</div>
`,exports.props=["play","state"],exports.watch={play(){this.update()}},exports.methods={prevClick(){var e=this,t=e.play.time-e.play.speed;e.$parent.timePlay(t<0?0:t)},nextClick(){var e=this,t=e.play.time+e.play.speed;e.$parent.timePlay(t)},update(){var e=this;e.$refs.plate.setConfig({min:0,max:e.play.status.timeLineLength,preci:2}),e.$refs.plate.value=e.play.time},setTime(e){e=e.target.value;isFinite(e)&&this.$parent.timePlay(e)}};