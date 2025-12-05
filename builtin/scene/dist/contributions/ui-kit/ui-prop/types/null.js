"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const dum_element_base_1=require("../dum-element-base");class Null extends dum_element_base_1.DumpElementBase{type=["Null"];$button=null;_listeners=[];template=`
        <ui-label slot="label"></ui-label>
        <div slot="content" style="display: flex;">
            <span>Null</span>
            <ui-button class="blue" style="flex: 1;margin-left: 10px;">Create</ui-button>
        </div>
    `;style="";mounted(e){this.$button=e.querySelector("ui-button")}ready(){super.ready(),this.$button&&(this.$button.addEventListener("change",e=>e.stopPropagation()),this.$button.addEventListener("confirm",e=>{e.stopPropagation(),this.$parentElement&&this.$parentElement.dispatch("create")}))}update(e){super.update(e),this.$parentElement&&this.$parentElement.removeAttribute("no-label")}}exports.default=Null;