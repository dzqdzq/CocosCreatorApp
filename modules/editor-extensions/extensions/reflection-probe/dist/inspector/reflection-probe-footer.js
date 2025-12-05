"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const scene_message_1=require("../shared/scene-message"),panelDataMap=new WeakMap;module.exports=Editor.Panel.define({ready(){const t=this.$.bake;this.$.bake.addEventListener("confirm",()=>{var e=panelDataMap.get(this).dump,e=e.value.uuid.values??[e.value.uuid.value];(0,scene_message_1.operation)("start-bake",e),Editor.Metrics._trackEventWithTimer({category:"bakingSystem",id:"A100014",value:1})});var e=e=>{var a=panelDataMap.get(this).dump;(a.value.uuid.values??[a.value.uuid.value]).some(a=>e.currentInfo?.uuid===a||e.remaining.some(e=>e.uuid===a))||!1===a.value.enabled.value?t.setAttribute("disabled","disabled"):t.removeAttribute("disabled")};panelDataMap.set(this,{onUpdateInfo:e}),(0,scene_message_1.addBroadcastListener)("reflection-probe:update-bake-info",e)},update(e){if(e){const s=panelDataMap.get(this);s.dump=e;var a=this.$.bake,t=e.value.probeType.values??[e.value.probeType.value];const n=e.value.probeType.enumList.findIndex(e=>"CUBE"===e.name);a.hidden=t.some(e=>e!==n),(0,scene_message_1.query)("query-bake-info").then(e=>{e&&s?.onUpdateInfo(e)})}},$:{bake:".bake"},style:`
        .reflection-probe-footer {
            display: flex;
            flex-wrap: wrap;
            margin-top: 6px;
        }

        ui-button[hidden] {
            display: none;
        }

        .bake {
            flex: 1;
        }
    `,template:`
        <div class="reflection-probe-footer">
            <ui-button class="bake blue">Bake</ui-button>
        </div>
    `,close(){var e=panelDataMap.get(this);(0,scene_message_1.removeBroadcastListener)("reflection-probe:update-bake-info",e.onUpdateInfo)}});