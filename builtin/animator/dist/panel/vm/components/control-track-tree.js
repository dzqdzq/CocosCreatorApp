"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.ControlTrackTree=void 0;const vue_js_1=require("vue/dist/vue.js"),animation_editor_1=require("../../share/animation-editor"),template=`
    <div :class="classStyle" @mousedown.right.stop="showContextMenu">
        <ui-icon
            :value="trackInfo.menuInfo.icon"
            :style="{color: trackInfo.menuInfo.color}"
            class="content-item__icon"
        ></ui-icon>
        <ui-label :value="trackInfo.menuInfo && trackInfo.menuInfo.trackLabel || trackInfo.name"></ui-label>

        <div class="tw-flex-1"></div>

        <ui-button :disabled="adding" class="content-item__add" size="small" transparent @click="onAddPlayer">
            <ui-icon value="add" class=""></ui-icon>
        </ui-button>
    </div>
`;exports.ControlTrackTree=(0,vue_js_1.defineComponent)({name:"ControlTrackTree",props:{trackInfo:{type:Object,default:void 0},index:{type:Number,default:-1},lock:Boolean,currentFrame:{type:Number,default:0},adding:{type:Boolean,default:!1}},data(){return{hoving:!1}},computed:{disabled(){return!(!this.lock&&this.trackInfo)},classStyle(){return`content-item ${this.index%2==0?"dark":"light"} `+(this.disabled?"disabled":"")}},methods:{async showContextMenu(e){this.trackInfo&&await animation_editor_1.animationEditor.onEmbeddedPlayerTrackMenu(e,this.trackInfo)},onAddPlayer(e){var t;this.adding||(this.currentFrame,t={playable:{type:(t=this.trackInfo).type},group:t.key},this.$emit("add-player",t))}},template:template});