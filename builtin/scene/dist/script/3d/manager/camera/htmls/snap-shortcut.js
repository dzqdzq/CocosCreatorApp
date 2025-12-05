"use strict";function createSnapShortcut(){return{style:`
            <style>
                .snap-container {
                    width: 240px;
                    height: 65px;
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
                    padding-top: 10px;
                }
                .snap-item-group {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: nowrap;
                    align-items: flex-start;
                    justify-content: flex-end;
                    padding-right: 18px;
                }
                .snap-shortcut-item {
                    
                }
                .snap-shortcut-text {
                    color: white;
                    opacity: 0.6;
                }
                .snap-shortcut {
                    display: inline-flex;
                    justify-content: center;
                    left: 16px;
                    text-align: center;
                    width: 114px;
                    flex-wrap: wrap;
                }
                .snap-key-plus {
                    font-size: 12px;
                    line-height: 20px;
                    margin-right: 4px;
                    margin-left: 4px;
                    color: rgba(250, 250, 250, 1);
                }
                .snap-shortcut-key-group {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: nowrap;
                    align-content: center;
                    justify-content: flex-start;
                    align-items: baseline;
                    min-width: 120px;
                }
                .snap-key {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 50px;
                    height: 24px;
                    border-radius: 4px;
                    background: #0505054D;
                    border: 1px solid #FAFAFA33;
                    color: #FAFAFA;
                    position: relative;
                    opacity: 0.7;
                }
                
                .snap-padding {
                    width: 100%;
                    height: 4px
                }
            </style>
        `,script(e,o){const s=document.createElement("div");s.className="snap-container",e.appendChild(s);Editor.I18n.getLanguage();Object.keys(o).sort((e,t)=>o[e].order-o[t].order).forEach((e,t)=>{var n=o[e],a=document.createElement("key-combination"),i=(a.className="snap-item-group",document.createElement("ui-label"));i.className="snap-shortcut-text",i.innerText=Editor.I18n.t(null!=(n=n.title)?n:""),a.appendChild(i);const r=document.createElement("div"),p=(r.className="snap-shortcut-key-group",a.appendChild(r),e.split("+"));p.forEach((e,t)=>{var n=document.createElement("div");n.className="snap-shortcut-item";const a=document.createElement("div");if(a.className="snap-key",a.innerText=e.charAt(0).toUpperCase()+e.slice(1),n.appendChild(a),0<t&&t<p.length){const a=document.createElement("div");a.className="snap-key-plus",a.innerText="+",r.appendChild(a)}r.appendChild(n)}),0<t&&t<p.length&&((n=document.createElement("div")).className="snap-padding",s.appendChild(n)),s.appendChild(a)})}}}Object.defineProperty(exports,"__esModule",{value:!0}),exports.createSnapShortcut=void 0,exports.createSnapShortcut=createSnapShortcut;