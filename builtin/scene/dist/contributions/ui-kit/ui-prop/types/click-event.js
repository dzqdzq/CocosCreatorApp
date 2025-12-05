"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.ready=exports.update=exports.methods=exports.$=exports.style=exports.template=exports.listeners=void 0;const utils_1=require("../../utils");function update(e){const t=this;t._dump=e;var n=t.$this.renderInfo.panel;let a="root",l=t.$this.parentElement;for(;l;){if(l.hasAttribute("cache-expand")){a=l.getAttribute("cache-expand")||"";break}l=l.parentElement}var u=e.path||e.name+":"+e.type,u=(t.$.container.setAttribute("cache-expand",a+"-"+u),t.$.label);n.setLabel(e,u),e.values&&1<e.values.length?t.$.content.innerHTML='<div style="padding-left: 10px;">EventHandler do not support multiple selections</div>':(n.setReadonly(e,t.$.node),n.setReadonly(e,t.$.select[0]),n.setReadonly(e,t.$.select[1]),n.setReadonly(e,t.$.input),e.value?(t.$.node.value=e.value.target.value.uuid,t.$.select[0].value=e.value._componentId.value,t.$.select[1].value=e.value.handler.value,t.$.input.value=e.value.customEventData.value,u=e.value.target.value.uuid,t.updateComponentList(u)):requestAnimationFrame(()=>{t.$this.dispatch("reset")}))}function ready(){const e=this;e.$.button.addEventListener("click",async()=>{e.updateComponentList(e.$.node.value)})}exports.listeners={change(e){var t=this,n=e.target.getAttribute("local");const a=e.target.value;switch(n){case"node":t._dump.value.target.value.uuid=a,"values"in t._dump&&t._dump.values.forEach(e=>{e.target.value.uuid=a}),t.updateComponentList(a);break;case"component":t._dump.value._componentId.value=a,"values"in t._dump&&t._dump.values.forEach(e=>{e._componentId.value=a}),t.updateComponentList(t._dump.value.target.value.uuid);break;case"function":t._dump.value.handler.value=a,"values"in t._dump&&t._dump.values.forEach(e=>{e.handler.value=a});break;case"param":t._dump.value.customEventData.value=a,"values"in t._dump&&t._dump.values.forEach(e=>{e.customEventData.value=a})}}},exports.template=`
<style>
.click-event-line { display: flex; margin-top: 4px; }
.click-event-line > * { flex: 1; margin-right: 4px; }
.click-event-line > *:last-child { flex: 1; margin-right: 0; }
.click-event-line >  ui-button.transparent { flex: none; }
.click-event-line > span { flex: none; }
</style>
<ui-section expand>
    <ui-label slot="header"></ui-label>
    <section class="content">
        <div class="click-event-line click-event-top">
            <ui-node droppable="cc.Node" local="node"></ui-node>
            <ui-select local="component"></ui-select>
            <ui-select local="function"></ui-select>
            <ui-button class="transparent" tooltip="Refresh Methods">
                <ui-icon value="refresh"></ui-icon>
            </ui-button>
        </div>
        <div class="click-event-line">
            <span>CustomEventData</span>
            <ui-input local="param"></ui-input>
        </div>
    </section>
</ui-section>
`,exports.style=`
:host { margin-left: 0; }
`,exports.$={container:"ui-section",label:"ui-label",content:".content",node:"ui-node",select:"ui-select",input:"ui-input",button:"ui-button"},exports.methods={async updateComponentList(e){const a=this;var l=e?await Editor.Message.request((0,utils_1.getMessageProtocolScene)(a.$this),"query-node",e):null;if(l){let t="",n="";l.__comps__.forEach(e=>{t+=`<option value="${e.cid}">${e.type}</option>`,e.cid===a._dump.value._componentId.value&&(n=e.type)}),a.$.select[0].innerHTML=t;l=e?await Editor.Message.request((0,utils_1.getMessageProtocolScene)(a.$this),"query-component-function-of-node",e):null;if(l&&n){let t="";l[n]&&l[n].forEach(e=>{t+=`<option value="${e}">${e}</option>`}),a.$.select[1].innerHTML=t}else a.$.select[1].innerHTML=""}else a.$.select[0].innerHTML="",a.$.select[1].innerHTML=""}},exports.update=update,exports.ready=ready;