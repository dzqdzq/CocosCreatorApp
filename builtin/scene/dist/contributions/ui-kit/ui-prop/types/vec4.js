"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const utils_1=require("../utils"),dum_element_base_1=require("../dum-element-base");class Vec4 extends dum_element_base_1.DumpElementBase{type=["cc.Vec4","cc.Quat"];$x=null;$y=null;$z=null;$w=null;tempValue=null;_listeners=["change"];parseAndSetData(l,t){return this.tempValue=Object.assign(this.tempValue||{},l),Object.keys(l).forEach(e=>{e&&e in t.value&&(t.value[e]=l[e],Reflect.has(t,"values"))&&t.values.forEach(t=>{t[e]=l[e]})}),!0}change(t,e){var l;t.target&&(l=t.target.getAttribute("local"),t=t.target.value,l)&&this.parseAndSetData({[l]:t},e)}template=`
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
    `;mounted(t){t=t.querySelectorAll("ui-num-input");t&&(this.$x=t[0],this.$y=t[1],this.$z=t[2],this.$w=t[3])}ready(){super.ready()}setValue(t,e,l){var u=l.value[e],e=this.tempValue?this.tempValue[e]:void 0;void 0!==e&&void 0!==u&&e!==u?t.dispatch("change"):(0,utils_1.setVecInput)(l,t)}update(t){super.update(t),this.$x&&this.setValue(this.$x,"x",t),this.$y&&this.setValue(this.$y,"y",t),this.$z&&this.setValue(this.$z,"z",t),this.$w&&this.setValue(this.$w,"w",t),this.tempValue=null}}exports.default=Vec4;