"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.PreviewContainer=void 0;const Vue=require("vue/dist/vue.js"),template=`
<div ref="container" class="">
    <slot>
        <div class="preview"
            :style="{
                '--preview-scale': scale,
                '--preview-top': isLandscape ? '50%' : '0',
                '--preview-left': isLandscape? '0' : '50%',
                '--preview-transform': isLandscape ? 'scale(var(--preview-scale, 1)) translateY(-50%)' : 'scale(var(--preview-scale, 1)) translateX(-50%)',
                '--preview-width': containerWidth + 'px',
                '--preview-height': containerHeight + 'px',
                '--preview-background-color': backgroundColor,
                '--preview-background-image': backgroundImage,
                '--preview-background-size': backgroundImageSize,
                '--preview-logo-height': logoHeight + 'px',
            }"
            :data-watermark="settings.watermarkLocation"
        >
            <div class="preview__main">
                <div class="main">
                    <ui-image name="image" class="logo"
                        v-if="settings.logoSrc"
                        :value="settings.logoSrc"
                    ></ui-image>
                    <div class="text watermark">
                        <ui-label value="Created with Cocos"
                            v-if="previewWatermark"
                        ></ui-label>
                    </div>
                </div>
            </div>
        </div>
    </slot>
</div>
`;exports.PreviewContainer=Vue.extend({name:"PreviewContainer",props:{settings:{type:Object,required:!0},designResolution:{type:Object,default:()=>({width:1280,height:720,fitWidth:!0,fitHeight:!1})}},data(){return{elWidth:0,elHeight:0}},computed:{isLandscape(){return this.designResolution.width>=this.designResolution.height},containerWidth(){var e=this;return e.isLandscape,e.designResolution.width},containerHeight(){var e=this;return e.isLandscape,e.designResolution.height},scale(){var e=this,t=e.isLandscape?e.designResolution.width:e.designResolution.height,i=Math.min(1,e.elWidth/t),t=Math.min(1,e.elHeight/t);return e.isLandscape?i:t},logoHeight(){return.185*this.containerHeight*this.settings.displayRatio},backgroundColor(){const t=this;return"default"===t.settings.background?.type?"rgba(4, 9, 10, 255)":"color"===t.settings.background?.type&&t.settings.background.color?`rgba(${["x","y","z","w"].map(e=>255*t.settings.background.color[e]).join(", ")})`:null},backgroundImage(){var e=this;return"custom"===e.settings.background?.type&&e.settings.backgroundSrc?`url("${e.settings.backgroundSrc.replace(/\\/g,"/").split("?")[0]}")`:null},backgroundImageSize(){var e=this;return e.designResolution.fitWidth||e.designResolution.fitHeight?`${e.designResolution.fitWidth?"100%":"auto"} `+(e.designResolution.fitHeight?"100%":"auto"):null},previewWatermark(){return this.settings.logoSrc&&"default"===this.settings.logo?.type}},created(){var e=this;e.elWidth=e.designResolution.width,e.elHeight=e.designResolution.height},mounted(){this.setup()},beforeDestroy(){this.teardown()},methods:{setup(){var e=this.$refs.container;if(!e)throw new Error("preview container not found");var t=new ResizeObserver(([e])=>{var e=e.contentRect.width,t=e*(9/16);this.elWidth=e,this.elHeight=t});t.observe(e),this.observer=t},teardown(){var e=this;e.observer&&(e.observer.disconnect(),e.observer=void 0)}},template:template});