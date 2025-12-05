"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.mounted=exports.methods=exports.data=exports.template=void 0;const fs_1=require("fs"),path_1=require("path");function data(){return{}}function mounted(){const s=this;var t={detail:{value:"test",checked:!1},children:[{detail:{value:"test-2",checked:!1},children:[{detail:{value:"test-3",checked:!1},showArrow:!1,children:[]}]}]},r=[];for(let e=0;e<1e3;e++)r.push(JSON.parse(JSON.stringify(t)));s.$refs.example.setTemplate("left","<ui-checkbox></ui-checkbox>"),s.$refs.example.setTemplateInit("left",t=>{t.$checkbox=t.querySelector("ui-checkbox"),t.$checkbox.addEventListener("confirm",e=>{t.data.detail.checkbox=!t.data.detail.checkbox,s.$refs.example.render(!0)})}),s.$refs.example.setRender("left",(e,t)=>{e.$checkbox.value=t.detail.checkbox}),s.$refs.example.setTemplate("text",'<span class="name"></span><span class="link"></span>'),s.$refs.example.setTemplateInit("text",e=>{e.$name=e.querySelector(".name"),e.$link=e.querySelector(".link")}),s.$refs.example.setRender("text",(e,t)=>{e.$name.innerHTML=t.detail.value,e.$link.innerHTML=`link(${t.index})`}),s.$refs.example.setTemplate("right",'<ui-icon value="reset"></ui-icon>'),s.$refs.example.setTemplateInit("right",t=>{t.$refresh=t.querySelector("ui-icon"),t.$refresh.addEventListener("click",e=>{console.log(t.data)})}),s.$refs.example.tree=r,s.$refs.example.addEventListener("keydown",e=>{var t,r=s.$refs.example;"ArrowUp"===e.code?(t=r.selectItems[r.selectItems.length-1],t=Math.max(t.index-1,0),e.shiftKey||r.clear(),r.select(r.list[t]),r.render()):"ArrowDown"===e.code&&(t=r.selectItems[r.selectItems.length-1],t=Math.min(t.index+1,r.list.length-1),e.shiftKey||r.clear(),r.select(r.list[t]),r.render())}),s.$refs.example.setTemplateInit("item",t=>{const r=s.$refs.example;t.addEventListener("click",e=>{e.ctrlKey||e.metaKey||r.clear(),r.select(t.data),r.render()})}),s.$refs.example.setRender("item",(e,t)=>{t.detail.disabled?e.setAttribute("disabled",""):e.removeAttribute("disabled")}),s.$refs.example.setItemRender,s.$refs.example.css=`
.item[disabled] {
    opacity: 0.4;
}

.text > .link {
    margin-left: 10px;
    cursor: pointer;
    color: yellow;
}

.right > ui-icon {
    cursor: pointer;
    color: green;
}
    `}exports.template=(0,fs_1.readFileSync)((0,path_1.join)(__dirname,"../../../../static/template/components/ui-tree.html"),"utf8"),exports.data=data,exports.methods={},exports.mounted=mounted;