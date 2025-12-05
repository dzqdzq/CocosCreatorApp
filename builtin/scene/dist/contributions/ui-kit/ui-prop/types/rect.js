"use strict";function update(t){var e=this;e._dump=t;const l=e.$this.renderInfo.panel;var i=e.$.label;l.setLabel(t,i);const n=t.value;i=e.$.numList;i[0].value=n.x,t.values&&t.values.some(e=>e.x!==n.x)?i[0].invalid=!0:i[0].invalid=!1,i[1].value=n.y,t.values&&t.values.some(e=>e.y!==n.y)?i[1].invalid=!0:i[1].invalid=!1,i[2].value=n.width,t.values&&t.values.some(e=>e.width!==n.width)?i[2].invalid=!0:i[2].invalid=!1,i[3].value=n.height,t.values&&t.values.some(e=>e.height!==n.height)?i[3].invalid=!0:i[3].invalid=!1,i.forEach(e=>{l.setReadonly(t,e)})}function ready(){}Object.defineProperty(exports,"__esModule",{value:!0}),exports.ready=exports.update=exports.$=exports.style=exports.template=exports.listeners=void 0,exports.listeners={change(e){var t=this;const l=e.target.getAttribute("local"),i=e.target.value;l&&l in t._dump.value&&(t._dump.value[l]=i,"values"in t._dump)&&t._dump.values.forEach(e=>{e[l]=i})}},exports.template=`
<ui-label slot="label"></ui-label>
<ui-num-input preci="6" label="X" slot="content" local="x"></ui-num-input>
<ui-num-input preci="6" label="Y" slot="content" local="y"></ui-num-input>
<ui-num-input preci="6" label="W" slot="content" local="width"></ui-num-input>
<ui-num-input preci="6" label="H" slot="content" local="height"></ui-num-input>
`,exports.style=`
:host .content { flex-wrap: wrap; }
:host .content::slotted(*) { flex: 0 0 calc(50% - 2px); }
:host .content::slotted(ui-num-input:nth-child(-n+3)) { margin-bottom: 4px; }
:host .content::slotted(ui-num-input:nth-child(even)) { margin-right: 4px; }
`,exports.$={label:"ui-label",numList:"ui-num-input"},exports.update=update,exports.ready=ready;