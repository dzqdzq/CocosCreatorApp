"use strict";async function update(){var e=await Editor.Message.request("process","query-process-tree",process.ppid);this.$.tree.tree=[function e(t){return t.showArrow=!1,t.children.forEach(e),t}(e)]}async function openDevToolById(e){await Editor.Message.request("process","open-panel-dev-tool",e)}function ready(){this.$.tree.setTemplate("text",'<span class="name"></span>'),this.$.tree.setTemplateInit("text",e=>{e.$name=e.querySelector(".name")}),this.$.tree.setRender("text",(e,t)=>{e.$name.innerHTML=t.detail.name,e.$name.setAttribute("title",t.detail.cmd)}),this.$.tree.setTemplate("right",'<span class="cpu"></span><span class="mem"></span><span class="pid"></span><span class="action"></span>'),this.$.tree.setTemplateInit("right",e=>{e.$cpu=e.querySelector("span.cpu"),e.$mem=e.querySelector("span.mem"),e.$pid=e.querySelector("span.pid"),e.$action=e.querySelector("span.action")}),this.$.tree.setRender("right",(e,t)=>{e.$cpu.innerHTML=t.detail.cpu,e.$mem.innerHTML=t.detail.memory,e.$pid.innerHTML=t.detail.pid,t.detail.panel&&(e.$action.innerHTML='<ui-icon value="dev-tools" class="devTool" style="font-size: 16px; cursor:pointer; margin-right:10px"></ui-icon>',e.$action.querySelector(".devTool").addEventListener("click",()=>{openDevToolById(t.detail.pid)},!1))});var e="";e+="span.action, span.cpu, span.mem, span.pid { display: inline-block; width: 60px; text-align: center; line-height: 28px }";this.$.tree.css="span.action, span.cpu, span.mem, span.pid { display: inline-block; width: 60px; text-align: center; line-height: 28px }.item > .section { overflow: hidden; }.item > .section > .text { line-height: 28px; overflow: hidden; text-overflow: ellipsis; }";const t=async()=>{await update.call(this),setTimeout(t,1e3)};t()}Object.defineProperty(exports,"__esModule",{value:!0}),exports.ready=exports.$=exports.style=exports.template=void 0,exports.template=`
<header>
    <ui-label class="name">Process Name</ui-label>
    <ui-label>CPU (%)</ui-label>
    <ui-label>MEM (MB)</ui-label>
    <ui-label>PID</ui-label>
    <ui-label>ACTION</ui-label>
</header>
<section>
    <ui-tree line-height="28"></ui-tree>
</section>
`,exports.style=`
:host { display: flex; flex-direction: column; padding: 10px; }
:host > header { display: flex; border-bottom: 1px solid var(--color-normal-border); padding: 0 10px; }
:host > header > ui-label { display: inline-block; width: 60px; text-align: center; }
:host > header > ui-label.name { flex: 1; text-align: left; }
:host > section { flex: 1; display: flex; }
:host > section > ui-tree { flex: 1; }
`,exports.$={tree:"ui-tree"},exports.ready=ready;