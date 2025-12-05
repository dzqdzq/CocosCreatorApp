"use strict";var __importDefault=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.Texture=void 0;const utils_1=require("./utils"),terrain_1=__importDefault(require("../../public/terrain")),Vue=require("vue/dist/vue.js");Vue.config.productionTip=!1,Vue.config.devtools=!1,exports.Texture=Vue.extend({props:{layer:{type:Object,required:!0},index:{type:Number,required:!0}},data(){return{src:"",isBusy:!1}},watch:{layer(e){this.update()}},mounted(){this.update()},methods:{async update(){var e;this.layer&&this.layer.uuid?this.isBusy||(this.isBusy=!0,e=this.layer.uuid,e=await Editor.Message.request("asset-db","query-asset-meta",e),this.src=e?await(0,utils_1.getImageLikeAssetSource)(e):"",this.isBusy=!1):this.src=""},_onImgClick(){this.$parent&&this.$parent.$emit("select-layer",this.index)},_onDrop(e){e.stopPropagation();e=null==(e=e.dataTransfer)?void 0:e.getData("additional");if(e)try{var t,r,i=JSON.parse(e);Array.isArray(i)&&i[0]&&((t=i[0].value)&&-1!==t.indexOf("@")&&-1!==t.indexOf("@6c48a")?(r=this.index,terrain_1.default.setLayer(r,t)):console.warn("Terrain Layer need cc.Texture2D asset, and can't recognize texture without entity, which maybe from FBX or GLTF."))}catch(e){console.error(e)}}},template:`
        <ui-drag-area droppable="cc.Texture2D"
            @drop="_onDrop($event)"
        >
            <img v-if="src"
            :src="src" 
            @click="_onImgClick()"
            >
        </ui-drag-area>
`});