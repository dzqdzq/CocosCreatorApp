"use strict";function update(e){var i=this;i._dump=e;const n=i.$this.renderInfo.panel;var t=i.$.label,t=(n.setLabel(e,t),i.$.numList);if(t.forEach(t=>{n.setVecInput(e,t)}),e.lock&&t[0].hasAttribute("hidden")&&t[1].hasAttribute("hidden")?t[2].setAttribute("no-margin",""):t[2].removeAttribute("no-margin"),e.lock){let t="";var o=e.value;for(const r of Object.keys(e.lock)){var l=r,u=e.lock[l];u&&u.default!==o[l]&&(u=Editor.I18n.t(u.message.replace("i18n:","")),t+=l.toUpperCase()+`: ${u} 
`)}t&&(i.$.icon.removeAttribute("hidden",""),i.$.icon.setAttribute("tooltip",t))}else i.$.icon.setAttribute("hidden","")}function ready(){}Object.defineProperty(exports,"__esModule",{value:!0}),exports.ready=exports.update=exports.$=exports.style=exports.template=exports.listeners=void 0,exports.listeners={change(t){var e=this;const i=t.target.getAttribute("local"),n=t.target.value;i&&i in e._dump.value&&(e._dump.value[i]=n,"values"in e._dump)&&e._dump.values.forEach(t=>{t[i]=n})}},exports.template=`
<ui-label slot="label"></ui-label>
<ui-icon slot="label" value="warn-triangle" hidden></ui-icon>
<ui-num-input preci="6" label="X" slot="content" local="x"></ui-num-input>
<ui-num-input preci="6" label="Y" slot="content" local="y"></ui-num-input>
<ui-num-input preci="6" label="Z" slot="content" local="z"></ui-num-input>
`,exports.style=`
::slotted(ui-icon) { 
    color: var(--color-warn-fill);
    position: absolute;
    left: -20px;
}
::slotted(ui-num-input[warn]) { opacity: .55; }

::slotted(ui-num-input:not(:first-of-type)){
    margin-left: 4px;
}
::slotted(ui-num-input[no-margin]){
    margin-left: 0;
}
`,exports.$={label:"ui-label",numList:"ui-num-input",icon:"ui-icon"},exports.update=update,exports.ready=ready;