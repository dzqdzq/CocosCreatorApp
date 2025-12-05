"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.destroyed=exports.mounted=exports.methods=exports.data=exports.computed=exports.watch=exports.props=exports.template=void 0;const Config={pointerRadius:5};function data(){return{pointers:[],threshold:{x:0,y:0,left:0,top:0},X:{min:0,max:0,total:0,dialPx:0},Y:{min:0,max:0,total:0,dialPx:0}}}function mounted(){this.init()}async function destroyed(){this.close()}exports.template=`
<div class="handle-2d">
    <div class="pointers" ref="pointers"
        @mousemove="mouseMoveThreshold($event)"
    >

        <div class="pointer"
            v-for="(pointer, pointerIndex) in pointers" 
            :key="'preview-play-handle-2d-pointer-' + pointerIndex"
            :style="{left: pointer.left+'px', top: pointer.top+'px', '--weight':pointer.weight }"
            @mousedown.stop="mouseDownPointer($event, pointer, pointerIndex)"
        ></div>
        <div class="threshold"
            :style="thresholdStyle"
        ></div>
    </div>
    <div class="threshold-text">{{threshold.x.toFixed(3)}}, {{threshold.y.toFixed(3)}}</div>
    <div class="threshold-tip">
        <ui-label class="text" value="i18n:animation-graph.motion.blend2DPreviewTip"></ui-label>
        <span class="point"></span>
    </div>
    
    <ui-num-input class="threshold-y threshold-input" label="Y" step="0.1"
        :value="Y.radius"
        @confirm="changeRadius($event, 'Y')"
    ></ui-num-input>

    <ui-num-input class="threshold-x threshold-input" label="X" step="0.1"
        :value="X.radius"
        @confirm="changeRadius($event, 'X')"
    ></ui-num-input>
</div>
`,exports.props=[],exports.watch={"$root.queryData.view.motion"(){this.refresh()}},exports.computed={motion(){return this.$root.viewMotion()},thresholdStyle(){var e=this;let t="hidden";return e.Y.radius>=Math.abs(e.threshold.y)&&e.X.radius>=Math.abs(e.threshold.x)&&(t="initial"),{left:e.threshold.left+"px",top:e.threshold.top+"px",visibility:t}}},exports.data=data,exports.methods={init(){const e=this;e.initEnv(),e.initThreshold(),e.resizeObserver=new window.ResizeObserver(()=>{e.refresh()}),e.resizeObserver.observe(e.$el)},initEnv(){var e=this,{clientWidth:t,clientHeight:o}=e.$refs.pointers,i=e.motion.min[0],s=e.motion.max[0];let r=Math.max(Math.abs(i),Math.abs(s));i=2*(r=(r=e.motion.editorData.threshold?e.motion.editorData.threshold.radiusX:r)||1.5),e.X={min:0-r,max:r,radius:r,total:i,dialPx:t/i},s=e.motion.min[1],t=e.motion.max[1];let n=Math.max(Math.abs(s),Math.abs(t));i=2*(n=(n=e.motion.editorData.threshold?e.motion.editorData.threshold.radiusY:n)||1.5);e.Y={min:0-n,max:n,radius:n,total:i,dialPx:o/i}},initThreshold(){var e=this,t=e.X.total/2+e.X.min,o=e.Y.total/2+e.Y.min;e.threshold.x=t,e.threshold.y=o},close(){var e=this;e.resizeObserver&&e.resizeObserver.unobserve(e.$el)},refresh(){const t=this,o=[];t.initEnv(),t.motion.children.forEach(e=>{e=t.getPointerPosition(e.threshold);o.push(e)});var e=t.getPointerPosition({x:t.threshold.x,y:t.threshold.y});t.threshold.left=e.left,t.threshold.top=e.top,t.pointers=o,t.refreshWeight()},async refreshWeight(){const o=this;var e=await o.$parent.queryBlend2DThresholdsWeights({x:o.threshold.x,y:o.threshold.y});Array.isArray(e)&&e.forEach((e,t)=>{o.$set(o.pointers[t],"weight",e)})},getPointerPosition(e){var t=this;return{left:(e.x-t.X.min)*t.X.dialPx-Config.pointerRadius,top:(t.Y.max-e.y)*t.Y.dialPx-Config.pointerRadius}},getPointerThreshold(e){var t=this,o=(e.left+Config.pointerRadius)/t.X.dialPx+t.X.min,e=t.Y.max-(e.top+Config.pointerRadius)/t.Y.dialPx;return{x:Math.min(t.X.max,Math.max(t.X.min,o)),y:Math.min(t.Y.max,Math.max(t.Y.min,e))}},mouseDownPointer(e,a,h){const d=this,l=0-Config.pointerRadius,u=d.$refs.pointers.clientWidth-Config.pointerRadius,p=0-Config.pointerRadius,m=d.$refs.pointers.clientHeight-Config.pointerRadius;function i(o){if(d.mouseDownPoint){o.stopPropagation(),o.preventDefault();var{clientX:i,clientY:s,left:r,top:n}=d.mouseDownPoint,i=o.clientX-i,o=o.clientY-s;if(0!=i||0!=o){d.mouseDownPoint.hasMoved=!0;let e=r+i,t=(e<l?e=l:e>u&&(e=u),n+o);t<p?t=p:t>m&&(t=m);s={left:e,top:t},r=(Object.assign(a,s),d.getPointerThreshold(s));Object.assign(d.motion.children[h].threshold,r)}}}d.mouseDownPoint=Object.assign({hasMoved:!1,clientX:e.clientX,clientY:e.clientY,pointerIndex:h},a),document.addEventListener("mousemove",i),document.addEventListener("mouseup",function e(){var t,o;d.mouseDownPoint.hasMoved&&(t=d.mouseDownPoint.pointerIndex,o=d.motion.children[t].threshold,d.$root.changeMotionThreshold2D(d.$root.queryData.view.motionLevel,t,o)),document.removeEventListener("mousemove",i),document.removeEventListener("mouseup",e),d.mouseDownPoint=null})},mouseMoveThreshold(e){var t,o=this,i=e.currentTarget;e.ctrlKey?(i.setAttribute("ctrl",""),o.mouseDownPoint||(e={left:e.offsetX-Config.pointerRadius,top:e.offsetY-Config.pointerRadius},t=o.getPointerThreshold(e),Object.assign(o.threshold,e,t),o.$parent.updatePreviewBlendVariable([{name:o.motion.value[0].variable,value:o.threshold.x},{name:o.motion.value[1].variable,value:o.threshold.y}]),o.refreshWeight())):i.removeAttribute("ctrl")},changeRadius(e,t){e=e.target;e&&(this[t].radius=e.value,this.$parent.updateMotionEditDataThreshold({radiusX:this.X.radius,radiusY:this.Y.radius}))}},exports.mounted=mounted,exports.destroyed=destroyed;