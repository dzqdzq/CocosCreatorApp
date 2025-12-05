"use strict";var __createBinding=this&&this.__createBinding||(Object.create?function(e,t,n,o){void 0===o&&(o=n);var i=Object.getOwnPropertyDescriptor(t,n);i&&("get"in i?t.__esModule:!i.writable&&!i.configurable)||(i={enumerable:!0,get:function(){return t[n]}}),Object.defineProperty(e,o,i)}:function(e,t,n,o){e[o=void 0===o?n:o]=t[n]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),__importStar=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n in e)"default"!==n&&Object.prototype.hasOwnProperty.call(e,n)&&__createBinding(t,e,n);return __setModuleDefault(t,e),t};Object.defineProperty(exports,"__esModule",{value:!0});let panel=exports.default=exports.close=exports.ready=exports.methods=exports.$=exports.template=exports.position=void 0;function ready(){panel&&close(),(panel=this).gizmoToolNames=["position","rotation","scale","rect"],Editor.Message.__protected__.addBroadcastListener("scene:ready",panel.sceneReady),Editor.Message.__protected__.addBroadcastListener("scene:gizmo-tool-changed",panel.gizmoToolChanged),Editor.Message.__protected__.addBroadcastListener("scene:gizmo-pivot-changed",panel.gizmoPivotChanged),Editor.Message.__protected__.addBroadcastListener("scene:gizmo-coordinate-changed",panel.gizmoCoordinateChanged),Editor.Message.__protected__.addBroadcastListener("scene:toolbar-menu-active",panel.toolbarMenuActive),Editor.Message.__protected__.addBroadcastListener("scene:light-probe-edit-mode-changed",panel.gizmoLightProbeAndBoundBoxEditModeChanged),Editor.Message.__protected__.addBroadcastListener("scene:light-probe-bounding-box-edit-mode-changed",panel.gizmoLightProbeAndBoundBoxEditModeChanged),panel.gizmoToolNames.forEach(e=>{panel.$[e].eventChangeGizmoToolBind=panel.eventChangeGizmoTool.bind(panel,e),panel.$[e].addEventListener("click",panel.$[e].eventChangeGizmoToolBind)}),panel.$.pivot.addEventListener("click",panel.eventChangeGizmoPivot),panel.$.coordinate.addEventListener("click",panel.eventChangeGizmoCoordinate),panel.initConfiguration(),document.body.addEventListener("keydown",panel.eventDocumentKeyDown),panel.sceneReady()}function close(){Editor.Message.__protected__.removeBroadcastListener("scene:ready",panel.sceneReady),Editor.Message.__protected__.removeBroadcastListener("scene:gizmo-tool-changed",panel.gizmoToolChanged),Editor.Message.__protected__.removeBroadcastListener("scene:gizmo-pivot-changed",panel.gizmoPivotChanged),Editor.Message.__protected__.removeBroadcastListener("scene:gizmo-coordinate-changed",panel.gizmoCoordinateChanged),Editor.Message.__protected__.removeBroadcastListener("scene:toolbar-menu-active",panel.toolbarMenuActive),Editor.Message.__protected__.removeBroadcastListener("scene:light-probe-edit-mode-changed",panel.gizmoLightProbeAndBoundBoxEditModeChanged),Editor.Message.__protected__.removeBroadcastListener("scene:light-probe-bounding-box-edit-mode-changed",panel.gizmoLightProbeAndBoundBoxEditModeChanged),panel.$.pivot.removeEventListener("click",panel.eventChangeGizmoPivot),panel.$.coordinate.removeEventListener("click",panel.eventChangeGizmoCoordinate),panel.gizmoToolNames.forEach(e=>{panel.$[e].removeEventListener("click",panel.$[e].eventChangeGizmoToolBind)}),document.body.removeEventListener("keydown",panel.eventDocumentKeyDown),panel=void 0}exports.position="left",exports.template=`
<style>
    .scene-toolbar {
        display: flex;
        white-space: nowrap;
    }

    .scene-gizmo-buttons {
        border-radius: calc(var(--size-normal-radius) * 2px);
        overflow: hidden;
        display: flex;
        margin-right: 8px;
        background-color: var(--color-default-fill-emphasis);
        box-shadow: inset 0 0 0 calc(var(--size-normal-border) * 1px) var(--color-default-border-normal);
    }

    .scene-gizmo-buttons > ui-button {
        border-radius: 0;
    }

    .scene-gizmo-buttons > ui-button[active] {
        background: var(--color-info-fill-important);
        color: var(--color-info-contrast-important);
    }

    .scene-gizmo-buttons .configuration {
        display: none;
        position: absolute;
        z-index: 99;
        left: 40px;
        top: 30px;
        width: 230px;
        padding: 8px;
        background-color: var(--color-normal-fill);
        border-radius: calc(var(--size-normal-radius) * 2px);
        border: 1px solid var(--color-normal-fill-weakest);
    }

    .scene-gizmo-buttons .configuration ui-button[type="icon"] {
        height: 20px;
    }

    .scene-gizmo-buttons .configuration[active] {
        display: block;
    }

    .scene-gizmo-buttons .configuration > .title {
        color: var(--color-normal-contrast-emphasis)
    }

    .scene-gizmo-buttons .configuration > .title:not(:first-child) {
        margin-top: 8px;
    }

    .scene-gizmo-buttons .configuration > .column-wrap {
        padding-left: 8px;
    }

    .scene-gizmo-buttons .configuration > .column-wrap > .column {
        margin-top: 4px;
        --left-width: 30px;
    }

    .scene-gizmo-buttons .configuration > .column-wrap > .column > ui-button[active] {
        background-color: var(--color-info-fill-important);
        color: var(--color-info-contrast-important);
    }

    .scene-gizmo-buttons .configuration > .column-wrap > .column > .translate {
        display: flex;
    }

    .scene-gizmo-buttons .configuration > .column-wrap > .column > .translate > .part {
        flex: 1;
        padding-right: 5px;
    }
    .scene-gizmo-buttons .configuration > .column-wrap > .column > .translate > .part ui-num-input {
        height: 20px;
    }
    .scene-gizmo-buttons > ui-button[disabled] {
        pointer-events: none;
    }
</style>
<div class="scene-toolbar">
    <div class="scene-gizmo-buttons">
        <ui-button type="icon" class="position transparent" tooltip="i18n:scene.tooltips.translate_gizmo">
            <ui-icon value="move"></ui-icon>
        </ui-button>
        <ui-button type="icon" class="rotation transparent" tooltip="i18n:scene.tooltips.rotate_gizmo">
            <ui-icon value="whirl"></ui-icon>
        </ui-button>
        <ui-button type="icon" class="scale transparent" tooltip="i18n:scene.tooltips.scale_gizmo">
             <ui-icon value="shrink"></ui-icon>
        </ui-button>
        <ui-button type="icon" class="rect transparent" tooltip="i18n:scene.tooltips.rect_gizmo">
             <ui-icon value="rectangle"></ui-icon>
        </ui-button>
        <ui-button type="icon" class="config transparent" tooltip="i18n:scene.increment_snap.title">
            <ui-icon value="magnet"></ui-icon>
        </ui-button>
    <div class="configuration" tabindex="1">
        <div class="title">
            <ui-label value="i18n:scene.increment_snap.title"></ui-label>
        </div>
        <div class="column-wrap">
            <ui-prop class="column">
                <ui-button type="icon" class="transparent translate-button" slot="label" tooltip="i18n:scene.increment_snap.enable_translate">
                     <ui-icon value="move"></ui-icon>
                </ui-button>
                <div class="translate" slot="content">
                    <div class="part">
                        <ui-num-input class="x-input" label="X" step="0.1" min="0"></ui-num-input>
                    </div>
                    <div class="part">
                        <ui-num-input class="y-input" label="Y" step="0.1" min="0"></ui-num-input>
                    </div>
                    <div class="part">
                        <ui-num-input class="z-input" label="Z" step="0.1" min="0"></ui-num-input>
                    </div>
                    <div class="together">
                        <ui-button type="icon" class="together-button transparent" tooltip="i18n:scene.increment_snap.xyz_together">
                            <ui-icon value="link"></ui-icon>
                        </ui-button>
                    </div>
                </div>
            </ui-prop>
            <ui-prop class="column">
                <ui-button type="icon" class="transparent rotate-button" slot="label" tooltip="i18n:scene.increment_snap.enable_rotate">
                    <ui-icon value="whirl"></ui-icon>
                </ui-button>
                <ui-num-input class="rotate-input" slot="content" step="0.1" min="0"></ui-num-input>
            </ui-prop>
            <ui-prop class="column">
            <ui-button type="icon" class="transparent scale-button" slot="label" tooltip="i18n:scene.increment_snap.enable_scale">
                <ui-icon value="shrink"></ui-icon>
            </ui-button>
            <ui-num-input class="scale-input" slot="content" step="0.1" min="0"></ui-num-input>
        </ui-prop>
        </div>
        <div class="title">
            <ui-label value="i18n:scene.rect_tool_snap.title"></ui-label>
        </div>
        <div class="column-wrap">
            <ui-prop class="column" style="--left-width: 60%;">
                <ui-label slot="label" value="i18n:scene.rect_tool_snap.enable_snap"></ui-label>
                <ui-checkbox 
                    slot="content"
                    class="rect-tool-snap-enable"
                    tooltip="i18n:scene.rect_tool_snap.enable_snap"
                ></ui-checkbox>
            </ui-prop>
            <ui-prop class="column" style="--left-width: 60%;">
                <ui-label slot="label" value="i18n:scene.rect_tool_snap.threshold"></ui-label>
                <ui-num-input slot="content" class="threshold-input" slot="content" step="0.1" min="0"></ui-num-input>
            </ui-prop>
        </div>
    </div></div>
    <div class="scene-gizmo-buttons scene-gizmo-location">
        <ui-button type="icon" class="pivot transparent" tooltip="i18n:scene.tooltips.pivotTip">
            <ui-icon value="anchor"></ui-icon>
        </ui-button>
        <ui-button type="icon" class="coordinate transparent" tooltip="i18n:scene.tooltips.local_gizmo">
             <ui-icon value="coordinates-local"></ui-icon>
        </ui-button>
    </div>
</div>
`,exports.$={sceneToolbar:".scene-toolbar",position:".position",rotation:".rotation",scale:".scale",rect:".rect",config:".config",configuration:".configuration",translateButton:".translate-button",rotateButton:".rotate-button",scaleButton:".scale-button",xInput:".x-input",yInput:".y-input",zInput:".z-input",togetherButton:".together-button",togetherButtonIcon:".together-button > ui-icon",rotateInput:".rotate-input",scaleInput:".scale-input",rectToolSnapEnable:".rect-tool-snap-enable",rectToolSnapThresholdInput:".threshold-input",pivot:".pivot",pivotIcon:".pivot > ui-icon",coordinate:".coordinate",coordinateIcon:".coordinate > ui-icon"},exports.methods={async sceneReady(){var e=await Editor.Message.request("scene","query-gizmo-tool-name"),e=(panel.gizmoToolChanged(e),await Editor.Message.request("scene","query-gizmo-pivot")),e=(panel.gizmoPivotChanged(e),await Editor.Message.request("scene","query-gizmo-coordinate")),e=(panel.gizmoCoordinateChanged(e),await Editor.Message.request("scene","query-light-probe-edit-mode")),e=(panel.gizmoLightProbeAndBoundBoxEditModeChanged(e),await Editor.Message.request("scene","query-light-probe-bounding-box-edit-mode"));panel.gizmoLightProbeAndBoundBoxEditModeChanged(e)},gizmoToolChanged(t){panel.gizmoToolNames.forEach(e=>{e===t?panel.$[e].setAttribute("active",""):panel.$[e].removeAttribute("active")})},gizmoPivotChanged(e){panel.pivot=e,"center"===panel.pivot&&(panel.$.pivot.setAttribute("tooltip","i18n:scene.tooltips.centerTip"),panel.$.pivotIcon.value="center"),"pivot"===panel.pivot&&(panel.$.pivot.setAttribute("tooltip","i18n:scene.tooltips.pivotTip"),panel.$.pivotIcon.value="anchor")},gizmoCoordinateChanged(e){panel.coordinate=e,"global"===panel.coordinate&&(panel.$.coordinate.setAttribute("tooltip","i18n:scene.tooltips.global_gizmo"),panel.$.coordinateIcon.value="coordinates-world"),"local"===panel.coordinate&&(panel.$.coordinate.setAttribute("tooltip","i18n:scene.tooltips.local_gizmo"),panel.$.coordinateIcon.value="coordinates-local")},toolbarMenuActive(e){var t=panel.$.configuration.hasAttribute("active");"increment"!==e||t?t&&panel.$.configuration.removeAttribute("active"):(panel.$.configuration.setAttribute("active",""),panel.refreshConfiguration())},gizmoLightProbeAndBoundBoxEditModeChanged(t){["rotation","scale","rect","config","pivot","coordinate"].forEach(e=>{t?panel.$[e].setAttribute("disabled",""):panel.$[e].removeAttribute("disabled")})},initConfiguration(){panel.$.config.addEventListener("click",e=>{e.stopPropagation(),Editor.Message.broadcast("scene:toolbar-menu-active","increment")}),panel.$.configuration.addEventListener("click",e=>{e.stopPropagation()}),panel.$.togetherButton.addEventListener("click",()=>{panel.$.togetherButton.toggleAttribute("active"),panel.$.yInput.toggleAttribute("disabled"),panel.$.zInput.toggleAttribute("disabled"),panel.$.togetherButton.hasAttribute("active")?(panel.setConfigurationPositionYZSameAsX(),panel.$.togetherButtonIcon.value="unlink"):panel.$.togetherButtonIcon.value="link"}),panel.$.translateButton.addEventListener("click",()=>{panel.$.translateButton.toggleAttribute("active"),panel.submitConfiguration("isPositionSnapEnabled",panel.$.translateButton.hasAttribute("active"))}),panel.$.xInput.addEventListener("change",e=>{panel.configData.position.x=e.target.value,panel.$.togetherButton.hasAttribute("active")?panel.setConfigurationPositionYZSameAsX():panel.submitConfiguration("position",panel.configData.position)}),panel.$.yInput.addEventListener("change",e=>{panel.configData.position.y=e.target.value,panel.submitConfiguration("position",panel.configData.position)}),panel.$.zInput.addEventListener("change",e=>{panel.configData.position.z=e.target.value,panel.submitConfiguration("position",panel.configData.position)}),panel.$.rotateButton.addEventListener("click",()=>{panel.$.rotateButton.toggleAttribute("active"),panel.submitConfiguration("isRotationSnapEnabled",panel.$.rotateButton.hasAttribute("active"))}),panel.$.rotateInput.addEventListener("change",e=>{panel.submitConfiguration("rotation",e.target.value)}),panel.$.scaleButton.addEventListener("click",()=>{panel.$.scaleButton.toggleAttribute("active"),panel.submitConfiguration("isScaleSnapEnabled",panel.$.scaleButton.hasAttribute("active"))}),panel.$.scaleInput.addEventListener("change",e=>{panel.submitConfiguration("scale",e.target.value)}),panel.$.rectToolSnapEnable.addEventListener("change",e=>{Editor.Message.request("scene","set-rect-snapping-configs","enableSnapping",e.target.value)}),panel.$.rectToolSnapThresholdInput.addEventListener("change",e=>{Editor.Message.request("scene","set-rect-snapping-configs","snapThreshold",e.target.value)})},async refreshConfiguration(){var e=await Editor.Message.request("scene","query-transform-snap-configs");e&&(panel.configData=e,panel.$.xInput.setAttribute("value",panel.configData.position.x),panel.$.yInput.setAttribute("value",panel.configData.position.y),panel.$.zInput.setAttribute("value",panel.configData.position.z),panel.$.rotateInput.setAttribute("value",panel.configData.rotation),panel.$.scaleInput.setAttribute("value",panel.configData.scale),panel.rectToolConfigData=await Editor.Message.request("scene","query-rect-snapping-configs"),panel.$.rectToolSnapEnable.setAttribute("value",panel.rectToolConfigData.enableSnapping),panel.$.rectToolSnapThresholdInput.setAttribute("value",panel.rectToolConfigData.snapThreshold),panel.refreshConfigurationButtons(),panel.refreshConfigurationInputs())},refreshConfigurationButtons(){var e={translateButton:"isPositionSnapEnabled",rotateButton:"isRotationSnapEnabled",scaleButton:"isScaleSnapEnabled"};for(const n in e){var t=e[n];panel.configData[t]?panel.$[n].setAttribute("active",""):panel.$[n].removeAttribute("active")}},refreshConfigurationInputs(){panel.configData.position.x===panel.configData.position.y&&panel.configData.position.x===panel.configData.position.z?(panel.$.togetherButton.setAttribute("active",""),panel.$.yInput.setAttribute("disabled",""),panel.$.zInput.setAttribute("disabled",""),panel.$.togetherButtonIcon.value="unlink"):(panel.$.togetherButton.removeAttribute("active"),panel.$.yInput.removeAttribute("disabled"),panel.$.zInput.removeAttribute("disabled"),panel.$.togetherButtonIcon.value="link")},setConfigurationPositionYZSameAsX(){panel.configData.position.z=panel.configData.position.y=panel.configData.position.x,panel.$.yInput.setAttribute("value",panel.configData.position.y),panel.$.zInput.setAttribute("value",panel.configData.position.z),panel.submitConfiguration("position",panel.configData.position)},submitConfiguration(e,t){Editor.Message.send("scene","set-transform-snap-configs",e,t)},eventChangeGizmoTool(e){Editor.Message.send("scene","change-gizmo-tool",e)},eventChangeGizmoPivot(){var e="pivot"===panel.pivot?"center":"pivot";Editor.Message.send("scene","change-gizmo-pivot",e)},eventChangeGizmoCoordinate(){var e="local"===panel.coordinate?"global":"local";Editor.Message.send("scene","change-gizmo-coordinate",e)},eventDocumentKeyDown(e){var t=function e(t){return t&&t.shadowRoot?e(t.shadowRoot.activeElement):t}(document.activeElement);if(!t||"INPUT"!==t.tagName&&"TEXTAREA"!==t.tagName){t=e.key.toLowerCase();if(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)"f"===t&&e.ctrlKey&&e.shiftKey&&(e=Editor.Selection.getSelected("node"))&&e.length&&Editor.Message.send("scene","align-node-to-scene-view",e);else switch(t){case"w":Editor.Message.send("scene","change-gizmo-tool","position");break;case"e":Editor.Message.send("scene","change-gizmo-tool","rotation");break;case"r":Editor.Message.send("scene","change-gizmo-tool","scale");break;case"t":Editor.Message.send("scene","change-gizmo-tool","rect");break;case"f":var n=Editor.Selection.getSelected("node");n&&n.length&&Editor.Message.send("scene","focus-camera",n)}}}},exports.ready=ready,exports.close=close,exports.default=__importStar(require("./scene-toolbar"));