"use strict";function createWanderSpeedTipsHtml(){return{style:`
            <style>
                .wander-speed-tips {
                    position: absolute;
                    display: inline-flex;
                    justify-content: center;
                    top: 0;
                    text-align: center;
                    width: 100%;
                    height: 100%;
                    flex-wrap: wrap;
                    opacity: 1;
                    align-items: center;
                }
                .wander-speed-bg {
                    background: rgba(0,0,0,0.3);
                    width: 200px;
                    height: 100px;
                    position: absolute;
                    border-radius: 10px;
                }
                .wander-speed-text {
                    font-size: 26px;
                    color: white;
                    opacity: 0.9;
                    z-index: 1;
                }
                .wander-speed-tips.hidden {
                    transition: opacity 0.5s ease-in-out;
                    opacity: 0;
                }
        </style>
        `,script(e,t){var a=document.createElement("div"),e=(a.className="wander-speed-tips",e.appendChild(a),document.createElement("dev")),e=(e.className="wander-speed-bg",a.appendChild(e),document.createElement("ui-label"));return e.className="wander-speed-text",e.setAttribute("value",t),a.appendChild(e),e}}}Object.defineProperty(exports,"__esModule",{value:!0}),exports.createWanderSpeedTipsHtml=void 0,exports.createWanderSpeedTipsHtml=createWanderSpeedTipsHtml;