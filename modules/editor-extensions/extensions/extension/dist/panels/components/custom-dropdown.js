"use strict";var __importDefault=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.CustomDropdown=exports.CustomDropdownItem=void 0;const vue_js_1=__importDefault(require("vue/dist/vue.js")),utils_dom_1=require("../../public/utils-dom"),optionTemplate=`
    <div
        class="custom-dropdown-item"
        :class="{
            active: active === true,
        }"
        @click="onItemClick"
    >
        <slot> {{ label }} </slot>
    </div>
`,dropdownTemplate=(exports.CustomDropdownItem=vue_js_1.default.extend({name:"CustomDropdownItem",inject:{customDropdown:{from:"customDropdown"}},props:{label:{type:String,default:void 0},active:{type:Boolean,default:void 0},onClick:{type:Function,default:void 0}},data(){return{}},methods:{getDropdownVm(){var t=this.customDropdown;if(null==t)throw new Error("injected customDropdown component not found");return t},onItemClick(t){this.getDropdownVm().updateVisible(!1),"function"==typeof this.onClick?this.onClick(t):this.$emit("click",t)}},template:optionTemplate}),`
    <div
        ref="dropdown"
        class="custom-dropdown"
        :class="{
            visible: sVisible,
            ['size-' + size]: true,
        }"
    >
        <ui-button-group class="custom-dropdown__content">
            <slot>
                <!-- dropdown content -->
            </slot>

            <ui-button tabindex="-1" class="custom-dropdown__trigger" @click="onIconClick">
                <slot name="icon">
                    <ui-icon value="arrow-triangle"></ui-icon>
                </slot>
            </ui-button>
        </ui-button-group>

        <div ref="overlay" class="custom-dropdown__overlay" :style="overlayStyle" :class="overlayClass">
            <slot name="overlay">
                <CustomDropdownItem
                    v-for="item in options"
                    :key="item.label"
                    class="custom-dropdown__option"
                    @click="onChildClick(item)"
                >
                    <ui-label :value="'i18n:extension.manager.'+item.label"></ui-label>
                </CustomDropdownItem>
            </slot>
        </div>
    </div>
`);exports.CustomDropdown=vue_js_1.default.extend({name:"CustomDropdown",components:{CustomDropdownItem:exports.CustomDropdownItem},provide(){return{customDropdown:this}},props:{visible:{type:Boolean,default:!1},trigger:{type:String,default:"click"},options:{type:Array,default:()=>[]},overlayStyle:{type:Object,default:void 0},overlayClass:{type:[String,Object,Array],default:void 0},size:{type:String,default:"default"}},data(){return{sVisible:this.visible}},computed:{},watch:{visible:{handler(t,e){this.sVisible=t},immediate:!0}},mounted(){document.body.addEventListener("click",this.onDocumentClick)},beforeDestroy(){document.body.removeEventListener("click",this.onDocumentClick)},methods:{updateVisible(t){t="boolean"==typeof t?t:!this.sVisible;this.sVisible=t,this.$emit("update:visible",t)},onIconClick(t){"click"===this.trigger&&this.updateVisible()},onChildClick(t){t.onClick?t.onClick(t):this.$emit("select",t)},onDocumentClick(t){"click"!==this.trigger||!0!==this.sVisible||(0,utils_dom_1.containsEventTarget)(this.$refs.dropdown,t)||this.updateVisible(!1)}},template:dropdownTemplate});