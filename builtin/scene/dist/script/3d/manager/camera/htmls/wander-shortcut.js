"use strict";function createWanderShortcut(e,r){var t=document.createElement("div"),e=(t.className="wander-item-group",e.appendChild(t),document.createElement("ui-label")),e=(e.className="wander-shortcut-text",e.setAttribute("value",Editor.I18n.t("scene.shortcut.camera_wander")),t.appendChild(e),document.createElement("div"));t.appendChild(e);const a=document.createElement("div");a.className="wander-shortcut",e.appendChild(a),Object.keys(r).sort((e,t)=>r[e].order-r[t].order).forEach((e,t)=>{var r=document.createElement("div");r.className="wander-key",r.setAttribute("data-key",t+""),r.innerText=e.toUpperCase(),a.appendChild(r)})}function createWanderKeyword(e,t,r,a){var n=document.createElement("div");n.className="wander-item-group",e.appendChild(n),n.innerHTML=`
        <ui-label class="wander-shortcut-text" value='${r}'></ui-label>
        <div class="wander-key-item">
           <ui-label class="wander-key ${t}" value='${a}'></ui-label>
        </div>
    `}function createWanderPadding(e){var t=document.createElement("div");t.className="wander-padding",e.appendChild(t)}function createWanderShortcutHtml(){return{style:`
            <style>
                .wander-container {
                    position: absolute;
                    bottom: 10px;
                    left: 10px;
                    background-color: #00000047;
                    border-radius: 6px;
                    display: flex;
                    flex-direction: column;
                    align-content: flex-end;
                    flex-wrap: nowrap;
                    justify-content: flex-start;
                    font-size: 15px;
                    padding-top: 6px;
                    padding-bottom: 6px;
                }
                .wander-item-group {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: nowrap;
                    align-items: flex-start;
                    justify-content: flex-end;
                    padding-right: 12px;
                    padding-left: 12px;
                }
                .wander-shortcut {
                    display: inline-flex;
                    justify-content: center;
                    left: 16px;
                    text-align: center;
                    max-width: 120px;
                    flex-wrap: wrap;
                }
                .wander-shortcut-text {
                    color: white;
                    opacity: 0.6;
                } 
                .wander-key-item {
                    min-width: 120px;
                }
                .wander-key {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 24px;
                    border-radius: 4px;
                    background: #0505054D;
                    border: 1px solid #FAFAFA33;
                    color: #FAFAFA;
                    position: relative;
                    margin-right: 4px;
                    opacity: 0.7;
                }
                .wander-key::before {
                    position: absolute;
                    font-size: 8px;
                    top: 35%;
                    right: 2px;
                    transform-origin: center;
                    color: #A3A3A3;
                }
                .wander-key[data-key="0"]::before { content: '▲'; transform: rotate(180deg) }
                .wander-key[data-key="1"]::before { content: '+'; }
                .wander-key[data-key="2"]::before { content: '▲'; transform: rotate(0deg) }
                .wander-key[data-key="3"]::before { content: '▲'; transform: rotate(270deg) }
                .wander-key[data-key="4"]::before { content: '_'; }
                .wander-key[data-key="5"]::before { content: '▲'; transform: rotate(90deg) }
                
                .wander-speed-key {
                    width: 80px;
                    left: 3px;
                }
                
                .wander-wheel-key {
                    width: 100%;
                    left: 3px;
                }
                
                .wander-padding {
                    width: 100%;
                    height: 4px
                }
        </style>
        `,script(e,t){var r=document.createElement("div");r.className="wander-container",e.appendChild(r),createWanderShortcut(r,t),createWanderPadding(r),createWanderKeyword(r,"wander-speed-key",Editor.I18n.t("scene.shortcut.wander_speed"),"Shift"),createWanderPadding(r),createWanderKeyword(r,"wander-wheel-key",Editor.I18n.t("scene.shortcut.wander_wheelUp"),"Wheel Up"),createWanderPadding(r),createWanderKeyword(r,"wander-wheel-key",Editor.I18n.t("scene.shortcut.wander_wheelDown"),"Wheel Down")}}}Object.defineProperty(exports,"__esModule",{value:!0}),exports.createWanderShortcutHtml=createWanderShortcutHtml;