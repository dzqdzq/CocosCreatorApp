"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const{defineComponent,computed}=require("vue/dist/vue.js"),template=`
  <div :class="['tab-container', active ? 'active' : '']" @mouseup="mouseupEvent">
    <div class="tab-content">
      <div class="tab-icon">
        <ui-icon :color="active" :value="icon"></ui-icon>
      </div>
      <div class='tab-title'>
        <ui-label :value='pureTitle' :class="{'label-unsave': unsave}"></ui-label>
        <div v-if="unsave" class='unsave-sign'>*</div>
      </div>
      <div class="tab-close">
        <div v-show="closeable" class="tab-close-wrap" @click="closeEvent" @mouseup="event => event.stopPropagation()">
            <ui-icon value="close"></ui-icon>
        </div>
      </div>
    </div>
  </div>
`;exports.default=defineComponent({name:"SceneTabItem",props:{id:{type:[String,Number],required:!0},title:{type:String,required:!0},data:{type:Object,required:!0},icon:{type:String,default:""},active:{type:Boolean,default:!1},closeable:{type:Boolean,default:!0}},emits:["close","select","contextmenu"],setup(a,l){return{unsave:computed(()=>-1<a.title.lastIndexOf("*")),pureTitle:computed(()=>a.title.replace(/\*/g,"")),closeEvent:e=>{e.stopPropagation();var{id:e,data:t}=a;l.emit("close",e,t)},mouseupEvent:e=>{e.preventDefault();var{id:t,data:i}=a;0===e.button?l.emit("select",t,i):2===e.button&&l.emit("contextmenu",e,t,i)}}},template:template});