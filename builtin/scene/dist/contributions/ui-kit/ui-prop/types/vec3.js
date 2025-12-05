"use strict";function update(e){var t=this;t._dump=e;const u=t.$this.renderInfo.panel;var n=t.$.label,n=(u.setLabel(e,n),t.$.numList);n.forEach(t=>{u.setVecInput(e,t)}),e.lock&&n[0].hasAttribute("hidden")&&n[1].hasAttribute("hidden")?n[2].setAttribute("no-margin",""):n[2].removeAttribute("no-margin")}function ready(){}Object.defineProperty(exports,"__esModule",{value:!0}),exports.ready=exports.update=exports.$=exports.style=exports.template=exports.listeners=void 0,exports.listeners={change(t){var e=this;const u=t.target.getAttribute("local"),n=t.target.value;u&&u in e._dump.value&&(e._dump.value[u]=n,"values"in e._dump)&&e._dump.values.forEach(t=>{t[u]=n})}},exports.template=`
<ui-label slot="label"></ui-label>
<ui-num-input preci="6" label="X" slot="content" local="x"></ui-num-input>
<ui-num-input preci="6" label="Y" slot="content" local="y"></ui-num-input>
<ui-num-input preci="6" label="Z" slot="content" local="z"></ui-num-input>
`,exports.style=`
::slotted(ui-num-input[warn]) { opacity: .55; }

::slotted(ui-num-input:not(:first-of-type)){
    margin-left: 4px;
}
::slotted(ui-num-input[no-margin]){
    margin-left: 0;
}
`,exports.$={label:"ui-label",numList:"ui-num-input"},exports.update=update,exports.ready=ready;