"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const dum_element_base_1=require("../dum-element-base");class Unknown extends dum_element_base_1.DumpElementBase{constructor(){super(...arguments),this.type=["Unknown"],this.$button=null,this._listeners=[],this.template=`
        <ui-label slot="label"></ui-label>
        <div slot="content" style="display: flex;">
            <span>Unknown Type</span>
            <ui-button class="blue" style="flex: 1;margin-left: 10px;">Reset</ui-button>
        </div>
    `,this.style=""}mounted(e){this.$button=e.querySelector("ui-button")}ready(){super.ready(),this.$button&&(this.$button.addEventListener("change",e=>e.stopPropagation()),this.$button.addEventListener("confirm",e=>{e.stopPropagation(),this.$parentElement&&this.$parentElement.dispatch("reset")}))}update(e){super.update(e),this.$parentElement&&this.$parentElement.removeAttribute("no-label")}}exports.default=Unknown;