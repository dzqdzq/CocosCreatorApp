"use strict";function data(){return{isOpen:!1,label:""}}function mounted(){const t=this;t.label||(t.label=t.options.find(e=>e.name===t.value)?.label)}Object.defineProperty(exports,"__esModule",{value:!0}),exports.methods=exports.watch=exports.computed=exports.props=exports.template=exports.name=void 0,exports.data=data,exports.mounted=mounted,exports.name="view-select",exports.template=`
<div class="view-select-container" tabindex="-1"
    @mousedown.prevent
    @focus.prevent="activate()"
    @blur.prevent="deActivate()"
    @keyup.esc="deActivate()"
>
    <div class="view-select" @click="toggle">
        <input type="hidden" :value="value">
        <div class="label">
            <span v-show="!value" id="placeholder">{{ placeholder }}</span>
            <span v-show="value">{{ label }}</span>
        </div>
        <ui-icon class="arrow-triangle" value="arrow-triangle"></ui-icon>
    </div>
    <div v-show="isOpen" class="options">
        <ul>
            <li
                v-for="(item, index) in options"
                :key="index"
                :class="{ selected: value === item.name, separator: '__separator__' === item.name }"
                @click.stop="selectItem(item)"
            >
                {{ item.label }}
            </li>
            <li v-show="options.length === 0">
                <span class="no_options"><slot name="noOptions"></slot></span>
            </li>
        </ul>
    </div>
</div>
`,exports.props={disable:{type:Boolean,default:!1},options:{type:Array,default(){return[]}},value:{type:[String,Number],default:""},placeholder:{type:String,default:""}},exports.computed={},exports.watch={value(t){this.label=this.options.find(e=>e.name===t)?.label},options(e){const t=this;let s=e.find(e=>e.name===t.value);s?t.label=s?.label:(s=e[0],this.selectItem(e[0]))}},exports.methods={toggle(){var e=this;e.isOpen?e.deActivate():e.activate()},activate(){var e=this;e.isOpen||(e.isOpen=!0,e.$el.focus())},deActivate(){var e=this;e.isOpen&&(e.isOpen=!1,e.$el.blur())},selectItem(e){this.$emit("change",e.name),this.isOpen=!1}};