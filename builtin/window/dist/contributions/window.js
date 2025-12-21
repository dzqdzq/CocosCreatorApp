"use strict";const Vue=require("vue/dist/vue.js");let vm=null;module.exports=Editor.Panel.define({template:`
<div class="window">
    <div class=row>
        <ui-prop>
            <div slot=label>
                <ui-label value="i18n:window.configure.zoomLevel"></ui-label>
                <ui-icon value="help" tooltip="i18n:window.configure.zoomLevelTips"></ui-icon>
            </div>
            <ui-num-input slot="content"
                :value="zoomLevel"
                :min="-2"
                :max="6"
                :step="1"
               @change="onZoomLevelChange($event.target.value)" 
            ></ui-num-input>
        </ui-prop>
    </div>
</div>
    `,$:{window:".window"},async ready(){(vm=new Vue({el:this.$.window,data:{zoomLevel:0},methods:{onZoomLevelChange(e){Editor.Message.send("window","window-zoom-level-change",e)}}})).zoomLevel=await Editor.Windows.__protected__.getDefaultZoomLevel()},close(){vm?.$destroy(),vm=void 0}});