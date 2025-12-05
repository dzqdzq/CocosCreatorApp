"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const utils_1=require("../utils"),dum_element_base_1=require("../dum-element-base");class Vec4 extends dum_element_base_1.DumpElementBase{type=["cc.Vec4","cc.Quat"];$x=null;$y=null;$z=null;$w=null;_listeners=["change"];parseAndSetData(u,t){return Object.keys(u).forEach(e=>{e&&e in t.value&&(t.value[e]=u[e],Reflect.has(t,"values"))&&t.values.forEach(t=>{t[e]=u[e]})}),!0}change(t,e){var u;t.target&&(u=t.target.getAttribute("local"),t=t.target.value,u)&&this.parseAndSetData({[u]:t},e)}template=`
        <ui-label slot="label"></ui-label>
        <ui-num-input preci="6" label="X" slot="content" local="x"></ui-num-input>
        <ui-num-input preci="6" label="Y" slot="content" local="y"> </ui-num-input>
        <ui-num-input preci="6" label="Z" slot="content" local="z"></ui-num-input>
        <ui-num-input preci="6" label="W" slot="content" local="w"></ui-num-input>
    `;style=`
        :host .content { flex-wrap: wrap; }
        :host .content::slotted(*) { flex: 0 0 calc(50% - 2px); }
        :host .content::slotted(ui-num-input:nth-child(-n+3)) { margin-bottom: 4px; }
        :host .content::slotted(ui-num-input:nth-child(even)) { margin-right: 4px; }
    `;mounted(t){t=t.querySelectorAll("ui-num-input");t&&(this.$x=t[0],this.$y=t[1],this.$z=t[2],this.$w=t[3])}ready(){super.ready()}update(t){super.update(t),this.$x&&(0,utils_1.setVecInput)(t,this.$x),this.$y&&(0,utils_1.setVecInput)(t,this.$y),this.$z&&(0,utils_1.setVecInput)(t,this.$z),this.$w&&(0,utils_1.setVecInput)(t,this.$w)}}exports.default=Vec4;