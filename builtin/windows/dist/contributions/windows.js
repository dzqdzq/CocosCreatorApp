"use strict";const Vue=require("vue/dist/vue.js");let vm=null;module.exports=Editor.Panel.define({template:`
<div class="windows">
    <div class=row>
        <ui-prop>
            <div slot=label>
                <ui-label value="i18n:windows.configure.zoomLevel"></ui-label>
                <ui-icon value="help" tooltip="i18n:windows.configure.zoomLevelTips"></ui-icon>
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
    `,$:{windows:".windows"},async ready(){(vm=new Vue({el:this.$.windows,data:{zoomLevel:0},methods:{onZoomLevelChange(e){Editor.Message.send("windows","window-zoom-level-change",e)}}})).zoomLevel=await Editor.Windows.__protected__.getDefaultZoomLevel()},close(){null!==vm&&void 0!==vm&&vm.$destroy(),vm=void 0}});