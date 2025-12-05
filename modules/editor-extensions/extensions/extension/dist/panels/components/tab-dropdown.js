"use strict";var __importDefault=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.TabDropdown=void 0;const vue_js_1=__importDefault(require("vue/dist/vue.js")),custom_dropdown_1=require("./custom-dropdown"),template=`
    <div ref="tab" class="tab-dropdown" :active="activeLabel === nativeLabel">
        <CustomDropdown v-if="children" :visible.sync="showDropdown">
            <ui-button class="tab-dropdown__btn" @click="onTabClick">
                <ui-label :value="'i18n:extension.manager.'+ presentLabel"></ui-label>
            </ui-button>

            <template #overlay="">
                <CustomDropdownItem
                    v-for="item in children"
                    :key="item.label"
                    :active="item.label === activeLabel"
                    class="option"
                    @click="onChildClick(item, $event)"
                >
                    <ui-label :value="'i18n:extension.manager.'+item.label"></ui-label>
                </CustomDropdownItem>
            </template>
        </CustomDropdown>

        <ui-button v-else class="tab-dropdown__btn" @click="onTabClick">
            <ui-label :value="'i18n:extension.manager.'+ label"></ui-label>
        </ui-button>
    </div>
`;exports.TabDropdown=vue_js_1.default.extend({name:"TabDropdown",components:{CustomDropdown:custom_dropdown_1.CustomDropdown,CustomDropdownItem:custom_dropdown_1.CustomDropdownItem},props:{activeLabel:{type:String,required:!0},label:{type:String,required:!0},children:{type:Array,default:void 0}},data(){return{showDropdown:!1,nativeLabel:this.label}},computed:{presentLabel(){return this.nativeLabel??this.label}},watch:{activeLabel:{handler(e,t){e!==this.label&&!this.isChildLabel(e)||(this.nativeLabel=e)},immediate:!0}},mounted(){},beforeDestroy(){},methods:{isChildLabel(t){var e=this.children;return!(!Array.isArray(e)||e.length<1)&&null!=e.find(e=>e.label===t)},onTabClick(){this.$emit("select",this.nativeLabel),this.toggleDropdown(!1)},onChildClick(e,t){this.nativeLabel=e.label,this.$emit("select",e.label)},toggleDropdown(e){this.showDropdown="boolean"==typeof e?e:!this.showDropdown}},template:template});