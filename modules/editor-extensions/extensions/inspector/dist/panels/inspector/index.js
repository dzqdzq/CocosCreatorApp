"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.methods=exports.template=exports.style=exports.$=void 0,exports.ready=ready,exports.close=close,require("./inspector-resize-preview");const extension_1=require("./extension");async function ready(){const e=this;Object.assign(e,{isLocked:!1,history:new History(e)}),(0,extension_1.start)(),(e.sceneIsReady||await Editor.Message.request("scene","query-is-ready"))&&e.sceneReady(),e.$.lock.addEventListener("click",()=>{e.setLocked(!e.isLocked,!0)})}function close(){}require("../../extension"),exports.$={content:".content",backward:".backward",forward:".forward",lock:".lock"},exports.style=`
:host {
    display: flex;
    flex-direction: column;
}
:host > .header {
    height: 28px;
    line-height: 28px;
    border-bottom: solid 1px var(--color-normal-border);
}
:host > .header > ui-icon {
    margin: 0 4px;
    cursor: pointer;
    transition: background-color 0.15s, color 0.15s;
    color: var(--color-default-contrast-emphasis);
}

:host > .header > .triangle {
    font-size: 16px;
    pointer-events: none;
    color: var(--color-normal-fill-weakest);
    border-radius: calc(var(--size-small-radius) * 1px);
}
:host > .header > .triangle:hover {
    background: var(--color-active-fill-emphasis);
}
:host > .header > .triangle[enable] {
    pointer-events: auto;
    color: var(--color-default-contrast-emphasis);
}
:host > .header > .triangle.backward {
    transform: rotate(90deg);
}
:host > .header > .triangle.forward {
    transform: rotate(-90deg);
}
:host > .header > .lock {
    float: right;
}
:host > .header > .lock:hover {
    color: var(--color-warn-fill);
}
:host > .header > .lock[value="pin"] {
    color: var(--color-warn-fill);
}

:host > ui-prop-split {
    flex: 1;
    overflow: hidden;
}
:host > ui-prop-split > .content {
    height: 100%;
}
`,exports.template=`
<header class="header">
    <ui-icon class="triangle backward" value="arrow-triangle" tooltip="i18n:inspector.backward_selection"></ui-icon>
    <ui-icon class="triangle forward"  value="arrow-triangle" tooltip="i18n:inspector.forward_selection"></ui-icon>
    <ui-icon class="lock" hidden value="unpin"></ui-icon>
</header>
<ui-prop-split position='38.2' indent='24px' min-limit='60px,85px'>
    <ui-panel class="content"></ui-panel>
</ui-prop-split>
`,exports.methods={noticeReloadInspector(){this.type="",this.update()},selected(){this.isLocked||this.update()},unselected(){this.isLocked||this.update()},async update(){var e=this;if(!e.__update_lock__){e.__update_lock__=!0,await new Promise(e=>{setTimeout(e,100)});var t=Editor.Selection.getLastSelectedType(),r=Editor.Selection.getSelected(t);if(t!==e.type||JSON.stringify(r)!==JSON.stringify(e.uuids))try{!1!==await e.$.content.canClose()&&(e.type=t,e.uuids=r,e.type||0!==e.uuids.length?(e.$.lock.removeAttribute("hidden"),e.$.content.setAttribute("src",(0,extension_1.queryType)(e.type)||""),e.$.content.setAttribute("type",e.type),e.$.content.setAttribute("sub-type",""),e.$.content.update(e.uuids,(0,extension_1.queryRendererMap)(e.type),(0,extension_1.queryDropConfig)(e.type),(0,extension_1.queryType)(),(0,extension_1.queryRendererMap)()),e.history.record()):(e.$.lock.setAttribute("hidden",""),e.$.content.setAttribute("src","")))}catch(e){console.error(e)}e.__update_lock__=!1}},sceneClose(){var e=this;e.isLocked&&"node"!==e.type||(e.uuids=[],e.$.content.setAttribute("src",""))},sceneReady(){var e=this;e.sceneIsReady=!0,e.isLocked&&"node"!==e.type||e.setLocked(!1,!0)},setLocked(e,t=!1){var r=this,e=(r.isLocked=e,r.isLocked?"pin":"unpin"),e=(r.$.lock.setAttribute("value",e),r.isLocked?"i18n:inspector.unpin":"i18n:inspector.pin");r.$.lock.setAttribute("tooltip",e),!r.isLocked&&t&&r.update()},isFocused(){try{return this.$.content.getRootNode().host.hasAttribute("focused")}catch(e){return console.error(e),!1}},undo(){var e=this;e.__update_lock__||e.isFocused()&&e.$.content.callMethod("undo")},redo(){var e=this;e.__update_lock__||e.isFocused()&&e.$.content.callMethod("redo")}};class History{constructor(e){this.allow=["node","asset"],this.current={type:"",uuids:[]},this.forwards=[],this.backwards=[],this.panel=null,(this.panel=e).$.forward.addEventListener("click",()=>{this.forward(),this.updateState()}),e.$.backward.addEventListener("click",()=>{this.backward(),this.updateState()})}record(){var{panel:e,allow:t,forwards:r,backwards:o,current:s}=this,{type:e,uuids:i}=e;0!==i.length&&t.includes(e)&&(t=JSON.stringify(i),s&&e===s.type&&t===JSON.stringify(s.uuids)||(o.unshift(s),r.length=0,this.current={type:e,uuids:i},30<o.length&&o.pop(),this.updateState()))}forward(){var{forwards:e,backwards:t,current:r}=this,t=(t.unshift(r),e.shift());t&&(this.current=t,this.reselect("forward")),this.updateState()}backward(){var{forwards:e,backwards:t,current:r}=this,e=(e.unshift(r),t.shift());e&&(this.current=e,this.reselect("backward")),this.updateState()}async reselect(e){var t=this.current["type"];if(t){if("node"===t){const o=[];for(const s of this.current.uuids){var r=await Editor.Message.request("scene","query-node",s);r&&(r.isScene||r.parent&&r.parent.value.uuid)&&o.push(s)}if(0===o.length)return void this[e]();this.current.uuids=o}const o=this.current["uuids"];Editor.Selection.clear(t),Editor.Selection.select(t,o)}else Editor.Selection.clear("node"),Editor.Selection.clear("asset")}rebase(){var{forwards:e,backwards:t}=this;e.length=0,t.length=0}updateState(){var{forwards:e,backwards:t,panel:r}=this;e.length?r.$.forward.setAttribute("enable",""):r.$.forward.removeAttribute("enable"),t.length?r.$.backward.setAttribute("enable",""):r.$.backward.removeAttribute("enable")}}