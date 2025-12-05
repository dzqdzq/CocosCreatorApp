"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.mounted=exports.methods=exports.components=exports.computed=exports.data=exports.props=exports.template=void 0;const animation_editor_1=require("../../share/animation-editor"),global_data_1=require("../../share/global-data");function data(){return{}}function mounted(){}exports.template=`
<div class="ctrl-stick"
    :style="stickStyle"
    @mousedown.stop="onMouseDown"
>
    <div :class="name"><div class="info">{{frame}}</div></div>
</div>
`,exports.props=["selectKey","stickInfo","name"],exports.data=data,exports.computed={stickStyle(){var t,e,o,s,a=this;return a.stickInfo?({width:t,height:e,left:o,top:s}=a.stickInfo,"left"===a.name?`left: ${o}px; top: ${s}px;height: ${e}px;`:`left: ${o+t}px; top: ${s}px; height: ${e}px;`):null},frame(){return this.stickInfo&&this.stickInfo[this.name+"Frame"]}},exports.components={},exports.methods={onMouseDown(t){var e,o;this.selectKey&&2!==t.button&&(global_data_1.Flags.mouseDownName="stick",e=t.target.className,(o={}).cacheData=JSON.parse(JSON.stringify(this.selectKey.keyFrames)),o.startX=t.x,o.width=animation_editor_1.animationEditor.stickInfo.width,o.type=e,global_data_1.Flags.startDragStickInfo=o)}},exports.mounted=mounted;