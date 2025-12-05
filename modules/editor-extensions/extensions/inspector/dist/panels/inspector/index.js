"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.close=exports.ready=exports.methods=exports.template=exports.style=exports.$=void 0,require("./inspector-resize-preview");const extension_1=require("./extension");async function ready(){const e=this;Object.assign(e,{isLocked:!1,history:new History(e)}),(0,extension_1.start)(),(e.sceneIsReady||await Editor.Message.request("scene","query-is-ready"))&&e.sceneReady(),e.$.lock.addEventListener("click",()=>{e.setLocked(!e.isLocked,!0)}),e.alignProp=new AlignProp(e.$.content,e.$.alignStyle)}function close(){this.alignProp.close()}require("../../extension"),exports.$={alignStyle:"#align-style",content:".content",backward:".backward",forward:".forward",lock:".lock"},exports.style=`
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
:host > .content {
    flex: 1;
}
`,exports.template=`
<style id="align-style"></style>
<header class="header">
    <ui-icon class="triangle backward" value="arrow-triangle" tooltip="i18n:inspector.backward_selection"></ui-icon>
    <ui-icon class="triangle forward"  value="arrow-triangle" tooltip="i18n:inspector.forward_selection"></ui-icon>
    <ui-icon class="lock" hidden value="unpin"></ui-icon>
</header>
<ui-panel class="content"></ui-panel>
`,exports.methods={selected(){this.isLocked||this.update()},unselected(){this.isLocked||this.update()},async update(){var e=this;if(!e.__update_lock__){e.__update_lock__=!0,await new Promise(e=>{setTimeout(e,100)});var t=Editor.Selection.getLastSelectedType(),i=Editor.Selection.getSelected(t);if(t!==e.type||JSON.stringify(i)!==JSON.stringify(e.uuids))try{!1!==await e.$.content.canClose()&&(e.type=t,e.uuids=i,e.type||0!==e.uuids.length?(e.$.lock.removeAttribute("hidden"),e.$.content.setAttribute("src",(0,extension_1.queryType)(e.type)||""),e.$.content.setAttribute("type",e.type),e.$.content.setAttribute("sub-type",""),e.$.content.update(e.uuids,(0,extension_1.queryRendererMap)(e.type),(0,extension_1.queryDropConfig)(e.type),(0,extension_1.queryType)(),(0,extension_1.queryRendererMap)()),e.history.record()):(e.$.lock.setAttribute("hidden",""),e.$.content.setAttribute("src","")))}catch(e){console.error(e)}e.__update_lock__=!1}},sceneClose(){var e=this;e.isLocked&&"node"!==e.type||(e.uuids=[],e.$.content.setAttribute("src",""))},sceneReady(){var e=this;e.sceneIsReady=!0,e.isLocked&&"node"!==e.type||e.setLocked(!1,!0)},setLocked(e,t=!1){var i=this,e=(i.isLocked=e,i.isLocked?"pin":"unpin"),e=(i.$.lock.setAttribute("value",e),i.isLocked?"i18n:inspector.unpin":"i18n:inspector.pin");i.$.lock.setAttribute("tooltip",e),!i.isLocked&&t&&i.update()},isFocused(){try{return this.$.content.getRootNode().host.hasAttribute("focused")}catch(e){return console.error(e),!1}},undo(){var e=this;e.__update_lock__||e.isFocused()&&e.$.content.callMethod("undo")},redo(){var e=this;e.__update_lock__||e.isFocused()&&e.$.content.callMethod("redo")}},exports.ready=ready,exports.close=close;class History{constructor(e){this.allow=["node","asset"],this.current={type:"",uuids:[]},this.forwards=[],this.backwards=[],this.panel=null,(this.panel=e).$.forward.addEventListener("click",()=>{this.forward(),this.updateState()}),e.$.backward.addEventListener("click",()=>{this.backward(),this.updateState()})}record(){var{panel:e,allow:t,forwards:i,backwards:r,current:s}=this,{type:e,uuids:o}=e;0!==o.length&&t.includes(e)&&(t=JSON.stringify(o),s&&e===s.type&&t===JSON.stringify(s.uuids)||(r.unshift(s),i.length=0,this.current={type:e,uuids:o},30<r.length&&r.pop(),this.updateState()))}forward(){var{forwards:e,backwards:t,current:i}=this,t=(t.unshift(i),e.shift());t&&(this.current=t,this.reselect("forward")),this.updateState()}backward(){var{forwards:e,backwards:t,current:i}=this,e=(e.unshift(i),t.shift());e&&(this.current=e,this.reselect("backward")),this.updateState()}async reselect(e){var t=this.current["type"];if(t){if("node"===t){const r=[];for(const s of this.current.uuids){var i=await Editor.Message.request("scene","query-node",s);i&&(i.isScene||i.parent&&i.parent.value.uuid)&&r.push(s)}if(0===r.length)return void this[e]();this.current.uuids=r}const r=this.current["uuids"];Editor.Selection.clear(t),Editor.Selection.select(t,r)}else Editor.Selection.clear("node"),Editor.Selection.clear("asset")}rebase(){var{forwards:e,backwards:t}=this;e.length=0,t.length=0}updateState(){var{forwards:e,backwards:t,panel:i}=this;e.length?i.$.forward.setAttribute("enable",""):i.$.forward.removeAttribute("enable"),t.length?i.$.backward.setAttribute("enable",""):i.$.backward.removeAttribute("enable")}}class AlignProp{get contentWidthRatio(){return this.ratio}set contentWidthRatio(e){this.ratio=e,this.update()}get contentWidth(){return(this.$container.clientWidth-this.adjustPaddingLeft)*this.contentWidthRatio}constructor(e,t){this.ratio=.618,this.adjustPaddingLeft=24,this.$container=e,this.$style=t,this.resizeObserver=new window.ResizeObserver(()=>{this.update()}),this.resizeObserver.observe(this.$container),this.uiPropResizeWidthBind=this.uiPropResizeWidth.bind(this),this.$container.addEventListener("ui-kit:resize-prop-width",this.uiPropResizeWidthBind)}update(){window.cancelAnimationFrame(this.animationFrameId),this.animationFrameId=window.requestAnimationFrame(()=>{this.$style.innerHTML=`
            :host { 
                --ui-prop-resize-hover-display: block;
                --ui-prop-margin-left: 20px; 
                --ui-prop-margin-right: 20px; 
                --ui-prop-label-width-min: 60px;
                --ui-prop-content-width: ${this.contentWidth}px;
                --left-width: calc(100% - var(--ui-prop-content-width)); 
            }`})}uiPropResizeWidth(e){e.stopPropagation(),e.detail&&(this.contentWidthRatio=e.detail.contentWidthRatio)}close(){this.resizeObserver&&(this.resizeObserver.disconnect(),this.resizeObserver=void 0),this.$container.removeEventListener("ui-kit:resize-prop-width",this.uiPropResizeWidthBind)}}