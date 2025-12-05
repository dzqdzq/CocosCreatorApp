"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const dum_element_base_1=require("../dum-element-base"),utils_1=require("../../utils"),utils_2=require("../utils");class ClickEvent extends dum_element_base_1.DumpElementBase{constructor(){super(...arguments),this.type=["cc.ClickEvent"],this.$section=null,this.$content=null,this.$node=null,this.$select=null,this.$input=null,this.$button=null,this._listeners=["change"],this.template=`
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
    `,this.style=":host { margin-left: 0; }"}parseAndSetData(t,e){return e.value.target.value.uuid=t.target.value.uuid,e.value._componentId.value=t._componentId.value,e.value.handler.value=t.handler.value,e.value.customEventData.value=t.customEventData.value,e.values&&e.values.forEach(e=>{e.target.value.uuid=t.target.value.uuid,e._componentId.value=t._componentId.value,e.handler.value=t.handler.value,e.customEventData.value=t.customEventData.value}),this.updateComponentList(e.value.target.value.uuid),!0}change(e,t){if(e.target){var n=e.target.getAttribute("local");const l=e.target.value;switch(n){case"node":t.value.target.value.uuid=l,"values"in t&&t.values.forEach(e=>{e.target.value.uuid=l}),this.updateComponentList(l);break;case"component":t.value._componentId.value=l,"values"in t&&t.values.forEach(e=>{e._componentId.value=l}),this.updateComponentList(t.value.target.value.uuid);break;case"function":t.value.handler.value=l,"values"in t&&t.values.forEach(e=>{e.handler.value=l});break;case"param":t.value.customEventData.value=l,"values"in t&&t.values.forEach(e=>{e.customEventData.value=l})}}}queryParentCacheExpend(e,t){var n="cache-expand";let l=e;for(;l;){if(l.hasAttribute(n))return l.getAttribute(n)||"";l=l.parentElement}return t}async updateComponentList(e){if(this.$parentElement&&this.$select){var l=e?await Editor.Message.request((0,utils_1.getMessageProtocolScene)(this.$parentElement),"query-node",e):null;if(l){let t="",n="";l.__comps__.forEach(e=>{t+=`<option value="${e.cid}">${e.type}</option>`,e.cid===this.$parentElement.dump.value._componentId.value&&(n=e.type)}),this.$select[0].innerHTML=t;l=e?await Editor.Message.request((0,utils_1.getMessageProtocolScene)(this.$parentElement),"query-component-function-of-node",e):null;if(l&&n){let t="";l[n]&&l[n].forEach(e=>{t+=`<option value="${e}">${e}</option>`}),this.$select[1].innerHTML=t}else this.$select[1].innerHTML=""}else this.$select[0].innerHTML="",this.$select[1].innerHTML=""}}mounted(e){this.$section=e.querySelector("ui-section"),this.$content=e.querySelector(".content"),this.$node=e.querySelector("ui-node"),this.$select=e.querySelectorAll("ui-select"),this.$input=e.querySelector("ui-input"),this.$button=e.querySelector("ui-button")}ready(){super.ready(),this.$button&&this.$node&&this.$button.addEventListener("click",()=>this.updateComponentList(this.$node.value))}update(e){var t,n;super.update(e),this.$parentElement&&this.$section&&this.$content&&this.$select&&this.$input&&this.$node&&(n=this.queryParentCacheExpend(this.$parentElement.parentElement,"root"),t=e.path||e.name+":"+e.type,this.$section.setAttribute("cache-expand",n+"-"+t),e.values&&1<e.values.length?this.$content.innerHTML='<div style="padding-left: 10px;">EventHandler do not support multiple selections</div>':((0,utils_2.setElementReadonly)(e,this.$node),(0,utils_2.setElementReadonly)(e,this.$select[0]),(0,utils_2.setElementReadonly)(e,this.$select[1]),(0,utils_2.setElementReadonly)(e,this.$input),e.value?(this.$node.value=e.value.target.value.uuid,this.$select[0].value=e.value._componentId.value,this.$select[1].value=e.value.handler.value,this.$input.value=e.value.customEventData.value,n=e.value.target.value.uuid,this.updateComponentList(n)):requestAnimationFrame(()=>this.$parentElement&&this.$parentElement.dispatch("reset"))))}}exports.default=ClickEvent;