"use strict";function createSnapShortcut(){return{style:`
            <style>
                .snap-container {
                    position: absolute;
                    display: inline-flex;
                    bottom: 16px;
                    left: 16px;
                    padding: 6px;
                    border-radius: 2px;
                    background: #0505054D;
                    flex-direction: column;
                    align-content: flex-start;
                }
                .snap-key-combination {
                    padding: 2px 2px 2px 2px;
                    display: flex;
                    align-items: center;
                    height: 24px;
                    flex-direction: row;
                    justify-content: flex-start;
                }
                .snap-key-combination span {
                    font-size: 12px;
                    height: 20px;
                    color: #FAFAFA;
                    opacity: 60%;
                    line-height: 20px;
                }
                .snap-key {
                    display: flex;
                    height: 24px;
                    border-radius: 4px;
                    background: rgba(5, 5, 5, 0.3);
                    border: 1px solid rgba(250, 250, 250, 0.2);
                    align-items: center;
                    justify-content: center;
                }
                .snap-key-plus {
                    font-size: 12px;
                    line-height: 20px;
                    margin-right: 5px;
                    margin-left: 5px;
                    color: rgba(250, 250, 250, 1);
                }
                .snap-key-text {
                    font-size: 12px;
                    line-height: 20px;
                    padding: 2px 8px;
                    color: rgba(250, 250, 250, 1);
                }
            </style>
        `,script(e,a){const r=document.createElement("div"),o=(r.className="snap-container",e.appendChild(r),Editor.I18n.getLanguage());Object.keys(a).sort((e,t)=>a[e].order-a[t].order).forEach(e=>{var t=a[e];const i=document.createElement("key-combination");i.className="snap-key-combination";var n=document.createElement("span");n.innerText=Editor.I18n.t(null!=(t=t.title)?t:""),n.style.minWidth="zh"===o?"60px":"90px",i.appendChild(n);const p=e.split("+");p.forEach((e,t)=>{var n=document.createElement("div");n.className="snap-key";const a=document.createElement("div");if(a.className="snap-key-text",a.innerText=e.charAt(0).toUpperCase()+e.slice(1),n.appendChild(a),0<t&&t<p.length){const a=document.createElement("div");a.className="snap-key-plus",a.innerText="+",i.appendChild(a)}i.appendChild(n)}),r.appendChild(i)})}}}Object.defineProperty(exports,"__esModule",{value:!0}),exports.createSnapShortcut=void 0,exports.createSnapShortcut=createSnapShortcut;