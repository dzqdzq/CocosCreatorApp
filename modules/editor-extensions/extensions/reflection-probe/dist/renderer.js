"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const scene_message_1=require("./shared/scene-message"),Vue=require("vue/dist/vue.js"),panelDataMap=(Vue.config.productionTip=!1,Vue.config.devtools=!1,new WeakMap),Component=Vue.extend({data:()=>({remaining:[],finished:[],logInfos:[],currentInfo:null,isClearing:!1,isBaking:!1,isStopping:!1}),computed:{progressLog(){return Editor.I18n.t("reflection-probe.panel.log.start_bake",{currentNum:this.currentNum.toString(),totalNum:this.total.toString(),nodeName:this.currentInfo?.nodeName||""})},currentNum(){return(this.currentInfo?1:0)+this.finished.length},progress(){return this.total?100*this.finished.length/this.total:0},total(){return this.finished.length+this.remaining.length+(this.currentInfo?1:0)},isFirstBuild(){return 0===this.finished.length}},methods:{onClearUpdated(e){this.isClearing=e},startBake(){this.isBaking=!0,this.clearLog(),(0,scene_message_1.operation)("start-bake"),Editor.Metrics._trackEventWithTimer({category:"bakingSystem",id:"A100014",value:1})},stopBake(){this.isStopping=this.isBaking,(0,scene_message_1.query)("query-bake-info").then(e=>{e.currentInfo||(this.isStopping=!1,this.isBaking=!1)}),this.currentInfo&&this.log(Editor.I18n.t("reflection-probe.panel.log.start_cancel",{nodeName:this.currentInfo.nodeName})),(0,scene_message_1.operation)("cancel-bake")},onBakeStart(e){this.currentInfo=e,this.total&&this.log(this.progressLog)},onBakeEnd(e,t){"cancel"===e?this.remaining.length<=1&&this.log(Editor.I18n.t("reflection-probe.panel.log.cancel_success")):null!==e&&t?(this.error(Editor.I18n.t("reflection-probe.panel.log.bake_error",{nodeName:t.nodeName,err:e.message})),console.debug(`Failed to bake reflection probe on the node ${t.nodeName} with error :  `+e.message),e.stack&&console.debug(`Failed to bake reflection probe on the node ${t.nodeName} with stack trace : `+e.stack)):e||(t&&this.log(Editor.I18n.t("reflection-probe.panel.log.bake_finished",{nodeName:t.nodeName,currentNum:this.currentNum.toString(),totalNum:this.total.toString()})),t&&0!=this.remaining.length)||this.log(Editor.I18n.t("reflection-probe.panel.log.bake_all_finished",{num:this.total.toString()})),this.currentInfo=null,this.isBaking=!1,this.isStopping=!1},async clearResults(){this.clearLog(),this.isClearing=!0,await(0,scene_message_1.operation)("clear-results")},onBakeUpdate(e){this.remaining=e.remaining,this.finished=e.finished,this.currentInfo=e.currentInfo??null},log(e){this.logInfos.push({text:e,type:"log",key:performance.now()+Math.random()})},warning(e){this.logInfos.push({text:e,type:"warning",key:performance.now()+Math.random()})},error(e){this.logInfos.push({text:e,type:"error",key:performance.now()+Math.random()})},clearLog(){this.logInfos.splice(0,this.logInfos.length)}},template:`
        <div class="reflectionProbe">
            <div class="main">
                <ui-button v-show="!isBaking" type="primary" @confirm="startBake"><ui-label value="i18n:reflection-probe.panel.start_bake"></ui-label></ui-button>
                <ui-button v-show="isBaking" :disabled="isStopping" type="danger" @confirm="stopBake"><ui-label value="i18n:reflection-probe.panel.cancel_bake"></ui-label></ui-button>
                <ui-button type="danger" :disabled="isClearing || isBaking" @confirm="clearResults"><ui-label value="i18n:reflection-probe.panel.clear_result"></ui-label></ui-button>
            </div>
            <ui-progress v-show="isBaking" :value="progress"></ui-progress>
            <div class="footer">
                <div class="output">
                    <div v-for="(item, index) in logInfos" :type="item.type" :key="item.key">
                        <div >{{ item.text }}</div>
                    </div>
                </div>    
            </div>
        </div>
    `}),methods={onBakeStart(...e){panelDataMap.get(this)?.component.onBakeStart(...e)},onBakeEnd(...e){panelDataMap.get(this)?.component.onBakeEnd(...e)},onBakeUpdate(...e){panelDataMap.get(this)?.component.onBakeUpdate(...e)},onClearUpdated(...e){panelDataMap.get(this)?.component.onClearUpdated(...e)},async init(){if(!panelDataMap.get(this)){var{remaining:e,finished:t,currentInfo:n}=await(0,scene_message_1.query)("query-bake-info"),i=!!await(0,scene_message_1.query)("query-is-clearing");const a=new Component({el:this.$.app,data:{remaining:e,finished:t,currentInfo:n,isClearing:i}});panelDataMap.set(this,{component:a,onBakeStart:(...e)=>{a.onBakeStart(...e)},onBakeEnd:(...e)=>{a.onBakeEnd(...e)},onBakeUpdate:(...e)=>{a.onBakeUpdate(...e)},onClearUpdated:(...e)=>{a.onClearUpdated(...e)}})}}};module.exports=Editor.Panel.define({template:`
    <div id="app"></div>
    `,$:{app:"#app"},methods:methods,style:`
        .reflectionProbe {
            display: flex;
            flex-direction: column;
            align-items: center;
            height: 100%;
            padding: 30px;
        }

        .main {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .main > ui-button {
            margin-bottom:15px;
            width: 200px;
            border-radius: 4px;
        }

        .footer {
            flex: 1;
            min-height: 120px;
            background-color: var(--color-normal-fill-emphasis);
            overflow: auto;
            margin: 0 14px 14px 14px;
            padding: 7px 14px;
            border-radius: 4px;
            width: 100%;
        }
        
        .output {
            padding-bottom: 20px;
        }

        .output > div[type="error"] {
            color: var(--color-danger-fill-normal);
        }

        .output > div[type="warning"] {
            color: var(--color-warn-fill);
        }

        ui-progress {
            margin: 14px;
        }
    `,async ready(){await Editor.Message.request("scene","query-is-ready")&&this.init()},close(){var e=panelDataMap.get(this);e&&(e.component.$destroy(),panelDataMap.delete(this))}});