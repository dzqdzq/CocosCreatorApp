"use strict";function createWanderShortcutHtml(){return{style:`
            <style>
                .wander-container {
                    position: absolute;
                    display: inline-flex;
                    justify-content: center;
                    bottom: 16px;
                    left: 16px;
                    text-align: center;
                    width: 114px;
                    height: 52px;
                    flex-wrap: wrap;
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
                    font-size: 12px;
                    position: relative;
                    margin-right: 4px;
                    margin-bottom: 4px;
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
        </style>
        `,script(e,r){const n=document.createElement("div");n.className="wander-container",e.appendChild(n),Object.keys(r).sort((e,t)=>r[e].order-r[t].order).forEach((e,t)=>{var r=document.createElement("div");r.className="wander-key",r.setAttribute("data-key",t+""),r.innerText=e.toUpperCase(),n.appendChild(r)})}}}Object.defineProperty(exports,"__esModule",{value:!0}),exports.createWanderShortcutHtml=void 0,exports.createWanderShortcutHtml=createWanderShortcutHtml;