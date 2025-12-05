"use strict";var __importDefault=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.KeyframeBtn=void 0;const vue_js_1=__importDefault(require("vue/dist/vue.js")),template=`
    <div class="keyframe-btn">
        <div class="keyframe-btn__key" :class="keyClasses"></div>
    </div>
`;exports.KeyframeBtn=vue_js_1.default.extend({name:"KeyframeBtn",props:{empty:{type:Boolean,default:!0}},computed:{keyClasses(){return{empty:this.empty}}},template:template});