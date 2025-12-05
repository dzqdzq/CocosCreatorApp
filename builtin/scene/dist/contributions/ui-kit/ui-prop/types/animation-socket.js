"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.ready=exports.update=exports.methods=exports.$=exports.template=exports.listeners=void 0;const utils_1=require("../../utils");function update(e){var t=this;t._dump=e,t.refreshSocketPathList(),t.$.select.value=e.value.path.value,t.$.node.value=e.value.target.value.uuid}function ready(){}exports.listeners={change(e){var t=this,a=e.target.getAttribute("local");const u=e.target.value;switch(a){case"path":t._dump.value.path.value=u,"values"in t._dump&&t._dump.values.forEach(e=>{e.path.value=u});break;case"target":t._dump.value.target.value={uuid:u},"values"in t._dump&&t._dump.values.forEach(e=>{e.target.value={uuid:u}})}}},exports.template=`
<ui-label slot="label"></ui-label>
<ui-prop>
    <ui-label slot="label">Path</ui-label>
    <ui-select slot="content" local="path"></ui-select>
</ui-prop>
<ui-prop dump="cc.Asset" style="margin-top: 4px;">
    <ui-label slot="label">Target</ui-label>
    <ui-node droppable="cc.Node" slot="content" local="target"></ui-node>
</ui-prop>
`,exports.$={label:"ui-label",select:"ui-select",node:"ui-node"},exports.methods={findComponent(){let e=this.$this;do{if((e=e.parentElement||e.getRootNode().host)&&e.dump&&Array.isArray(e.dump.extends)&&-1!==e.dump.extends.indexOf("cc.Component"))break}while(e);return e},async refreshSocketPathList(){var e=this,t=e.findComponent();let a="";if(null!=(u=null==(u=null==t?void 0:t.dump)?void 0:u.value)&&u.uuid){var u=t.dump.value.uuid.value,t=await Editor.Message.request((0,utils_1.getMessageProtocolScene)(e.$this),"execute-component-method",{uuid:u,name:"querySockets",args:[]});if(t)for(const l of t)a+=`<option value="${l}">${l}</option>`}e.$.select.innerHTML=a}},exports.update=update,exports.ready=ready;