"use strict";var __createBinding=this&&this.__createBinding||(Object.create?function(e,t,i,l){void 0===l&&(l=i);var n=Object.getOwnPropertyDescriptor(t,i);n&&("get"in n?t.__esModule:!n.writable&&!n.configurable)||(n={enumerable:!0,get:function(){return t[i]}}),Object.defineProperty(e,l,n)}:function(e,t,i,l){e[l=void 0===l?i:l]=t[i]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),__importStar=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var i in e)"default"!==i&&Object.prototype.hasOwnProperty.call(e,i)&&__createBinding(t,e,i);return __setModuleDefault(t,e),t};Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0;let timer=null;const type="cc.ParticleSystem",width=200,height=160,bottom=10,right=10,template=`
<style>
    .scene-particle ui-prop { --left-width: 60%; margin-bottom: 4px; }
    .scene-particle .buttons { display: flex; justify-content: space-around; margin-bottom: 8px; }
    .scene-particle .buttons ui-button { padding: 0 8px; width: 56px; }
</style>
<div class="scene-particle">
    <div class="buttons">
        <ui-button class="toggle">
            <ui-icon class="toggle-icon" value="play"></ui-icon>
        </ui-button>
        <ui-button class="reset"><ui-icon value="refresh"></ui-icon></ui-button>
        <ui-button class="stop"><ui-icon value="stop"></ui-icon></ui-button>
    </div>
    <ui-prop>
        <ui-label slot="label" value="Playback Speed"></ui-label>
        <ui-num-input slot="content" class="speed"></ui-num-input>
    </ui-prop>
    <ui-prop>
        <ui-label slot="label" value="Playback Time"></ui-label>
        <ui-num-input slot="content" class="time" disabled></ui-num-input>
    </ui-prop>
    <ui-prop>
        <ui-label slot="label" value="Particle"></ui-label>
        <ui-num-input slot="content" class="total" disabled></ui-num-input>
    </ui-prop>
</div>
`;async function ready(e,t,l){null!==timer&&clearTimeout(timer);const n=e.parentElement;if(n){t=1<t.nodes.length;if(l[type]&&l[type][0].enabled){const u=l[type][0].uuid;let i=!1;l=e.querySelector(".scene-particle .toggle");const o=e.querySelector(".scene-particle .toggle .toggle-icon");var a=e.querySelector(".scene-particle .reset"),r=e.querySelector(".scene-particle .stop");l.addEventListener("confirm",()=>{i?n.callSceneMethod("pauseParticle",[]):(n.callSceneMethod("playParticle",[]),Editor.Metrics._trackEventWithTimer({category:"particleSystem",id:"A100014",value:1}))}),a.addEventListener("confirm",()=>{n.callSceneMethod("restartParticle",[])}),r.addEventListener("confirm",()=>{n.callSceneMethod("stopParticle",[])});const c=e.querySelector(".scene-particle .speed"),s=e.querySelector(".scene-particle .total"),p=e.querySelector(".scene-particle .time");t&&(null!==c&&void 0!==c&&c.setAttribute("invalid",""),null!==s&&void 0!==s&&s.setAttribute("invalid",""),null!==p)&&void 0!==p&&p.setAttribute("invalid",""),c.addEventListener("confirm",e=>{n.callSceneMethod("setParticlePlaySpeed",[u,Number(e.target.value)])}),!async function e(){var t=await n.callSceneMethod("queryParticlePlayInfo",[u]);t&&(i=!!t.isPlaying,c.setAttribute("value",t.speed),s.setAttribute("value",t.particle),p.setAttribute("value",t.time),o.setAttribute("value",i?"pause":"play"),timer=setTimeout(()=>{e()},300))}()}else e.hidden=!0}}async function close(){null!==timer&&clearTimeout(timer)}function update(e){}const configs={ready:ready,update:update,type:type,template:template,width:width,height:height,bottom:bottom,right:right,close:close};module.exports=configs,exports.default=__importStar(require("."));