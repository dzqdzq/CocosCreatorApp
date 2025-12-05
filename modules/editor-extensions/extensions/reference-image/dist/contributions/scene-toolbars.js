"use strict";exports.toolbars=[{position:"right",template:`
            <style>
                .reference-image {
                    position: relative;
                    width: 24px;
                    height: 24px;
                    box-sizing: border-box;
                    background-color: var(--color-default-fill-emphasis);
                    border-top: 1px solid var(--color-default-border-normal);
                    border-bottom: 1px solid var(--color-default-border-normal);
                    border-right: 1px solid var(--color-default-border-normal);
                    border-radius: 0 calc(var(--size-normal-radius) * 2px) calc(var(--size-normal-radius) * 2px) 0;
                }
                
                .reference-image > ui-button {
                    margin-top: -1px;
                    border-radius: 0 calc(var(--size-normal-radius) * 2px) calc(var(--size-normal-radius) * 2px) 0;
                }
                
                .reference-image[hidden] {
                    display: none;
                }
                
                .reference-image.enabled {
                    background-color: var(--color-focus-fill-important);
                    color: var(--color-focus-contrast-emphasis);
                    border-color: var(--color-focus-fill-important);
                }

                .reference-image.enabled > ui-button {
                    background-color: var(--color-focus-fill-important);
                    color: var(--color-focus-contrast-emphasis);
                }
              
            </style>
            <div class="reference-image" hidden>
                <ui-button type="icon" class="transparent" tooltip="i18n:reference-image.show_tips">
                    <ui-icon value='ref-map'></ui-icon>
                </ui-button>
            </div>
        `,$:{container:".reference-image",button:".reference-image > ui-button"},ready(e){const r=this,o=r.$.container;var a=r.$.button;r.showReferenceImage=async e=>{await Editor.Message.request("scene","execute-scene-script",{name:"reference-image",method:"setImageVisible",args:[e]}),await Editor.Profile.setConfig("reference-image","show",e)},r.onShow=e=>{r.showReferenceImage(e)},r.onConfirm=()=>{var e=o.classList.toggle("enabled");r.showReferenceImage(e)},r.dimensionChanged=e=>{e?o.removeAttribute("hidden"):o.setAttribute("hidden","")},r.sceneReady=async()=>{var e=await Editor.Message.request("scene","query-is2D");r.dimensionChanged(e)},a.addEventListener("click",r.onConfirm),Editor.Message.__protected__.addBroadcastListener("scene:ready",r.sceneReady),Editor.Message.__protected__.addBroadcastListener("reference-image:show",r.onShow),Editor.Message.__protected__.addBroadcastListener("scene:dimension-changed",r.dimensionChanged)},close(){var e=this;e.$.button.removeEventListener("click",e.onConfirm),Editor.Message.__protected__.removeBroadcastListener("scene:ready",e.sceneReady),Editor.Message.__protected__.removeBroadcastListener("reference-image:show",e.onShow),Editor.Message.__protected__.removeBroadcastListener("scene:dimension-changed",e.dimensionChanged)}}];