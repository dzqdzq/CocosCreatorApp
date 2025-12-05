"use strict";var __createBinding=this&&this.__createBinding||(Object.create?function(e,n,t,o){void 0===o&&(o=t);var a=Object.getOwnPropertyDescriptor(n,t);a&&("get"in a?n.__esModule:!a.writable&&!a.configurable)||(a={enumerable:!0,get:function(){return n[t]}}),Object.defineProperty(e,o,a)}:function(e,n,t,o){e[o=void 0===o?t:o]=n[t]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,n){Object.defineProperty(e,"default",{enumerable:!0,value:n})}:function(e,n){e.default=n}),__importStar=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var n={};if(null!=e)for(var t in e)"default"!==t&&Object.prototype.hasOwnProperty.call(e,t)&&__createBinding(n,e,t);return __setModuleDefault(n,e),n};Object.defineProperty(exports,"__esModule",{value:!0});let panel=exports.default=exports.close=exports.ready=exports.methods=exports.$=exports.template=exports.position=void 0;function ready(){panel&&close(),panel=this,Editor.Message.__protected__.addBroadcastListener("scene:ready",panel.sceneReady),Editor.Message.__protected__.addBroadcastListener("scene:dimension-changed",panel.dimensionChanged),panel.$.dimension.addEventListener("click",panel.eventChangeIs2D),document.body.addEventListener("keydown",panel.eventDocumentKeyDown),panel.sceneReady()}function close(){Editor.Message.__protected__.removeBroadcastListener("scene:ready",panel.sceneReady),Editor.Message.__protected__.removeBroadcastListener("scene:dimension-changed",panel.dimensionChanged),panel.$.dimension.removeEventListener("click",panel.eventChangeIs2D),document.body.removeEventListener("keydown",panel.eventDocumentKeyDown),panel=void 0}exports.position="left",exports.template=`
<style>
    .camera-dimension {
        margin-right: 8px;
        background-color: var(--color-default-fill-emphasis);
        border-radius: calc(var(--size-normal-radius) * 2px);
        box-shadow: inset 0 0 0 calc(var(--size-normal-border) * 1px) var(--color-default-border-normal);
        overflow: hidden;
    }
</style>
<div class="camera-dimension">
    <ui-button type="icon" class="dimension transparent" tooltip="i18n:scene.tooltips.edit_mode">
        <ui-icon class="icon" value="3D"></ui-icon>
    </ui-button>
</div>
`,exports.$={dimension:".dimension",icon:".icon"},exports.methods={dimensionChanged(e){panel.is2D=e,panel.$.icon.value=panel.is2D?"2D":"3D"},async sceneReady(){var e=await Editor.Message.request("scene","query-is2D");panel.dimensionChanged(e)},eventChangeIs2D(){Editor.Message.send("scene","change-is2D",!panel.is2D)},eventDocumentKeyDown(e){var n=function e(n){return n&&n.shadowRoot?e(n.shadowRoot.activeElement):n}(document.activeElement);n&&("INPUT"===n.tagName||"TEXTAREA"===n.tagName)||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||"2"===e.key&&panel.$.dimension.click()}},exports.ready=ready,exports.close=close,exports.default=__importStar(require("./dimension"));