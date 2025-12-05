"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabDropdown = void 0;
const vue_1 = __importDefault(require("vue/dist/vue"));
const custom_dropdown_1 = require("./custom-dropdown");
const template = /* html */ `
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
`;
exports.TabDropdown = vue_1.default.extend({
    name: 'TabDropdown',
    components: {
        //
        CustomDropdown: custom_dropdown_1.CustomDropdown,
        CustomDropdownItem: custom_dropdown_1.CustomDropdownItem,
    },
    props: {
        activeLabel: {
            type: String,
            required: true,
        },
        label: {
            type: String,
            required: true,
        },
        children: {
            type: Array,
            default: undefined,
        },
    },
    data() {
        return {
            showDropdown: false,
            // 记录组件本地的选中状态
            nativeLabel: this.label,
        };
    },
    computed: {
        presentLabel() {
            return this.nativeLabel ?? this.label;
        },
    },
    watch: {
        activeLabel: {
            handler(val, oldVal) {
                if (val === this.label || this.isChildLabel(val)) {
                    this.nativeLabel = val;
                }
            },
            immediate: true,
        },
    },
    mounted() { },
    beforeDestroy() { },
    methods: {
        isChildLabel(label) {
            const children = this.children;
            if (!Array.isArray(children) || children.length < 1) {
                return false;
            }
            const found = children.find((child) => child.label === label);
            return found != null;
        },
        onTabClick() {
            this.$emit('select', this.nativeLabel);
            this.toggleDropdown(false);
        },
        onChildClick(child, event) {
            this.nativeLabel = child.label;
            this.$emit('select', child.label);
        },
        toggleDropdown(show) {
            this.showDropdown = typeof show === 'boolean' ? show : !this.showDropdown;
        },
    },
    template: template,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFiLWRyb3Bkb3duLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc291cmNlL3BhbmVscy9jb21wb25lbnRzL3RhYi1kcm9wZG93bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSx1REFBK0I7QUFNL0IsdURBQXVFO0FBRXZFLE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBd0IzQixDQUFDO0FBRVcsUUFBQSxXQUFXLEdBQUcsYUFBRyxDQUFDLE1BQU0sQ0FBQztJQUNsQyxJQUFJLEVBQUUsYUFBYTtJQUNuQixVQUFVLEVBQUU7UUFDUixFQUFFO1FBQ0YsY0FBYyxFQUFkLGdDQUFjO1FBQ2Qsa0JBQWtCLEVBQWxCLG9DQUFrQjtLQUNyQjtJQUNELEtBQUssRUFBRTtRQUNILFdBQVcsRUFBRTtZQUNULElBQUksRUFBRSxNQUF1QztZQUM3QyxRQUFRLEVBQUUsSUFBSTtTQUNqQjtRQUVELEtBQUssRUFBRTtZQUNILElBQUksRUFBRSxNQUF1QztZQUM3QyxRQUFRLEVBQUUsSUFBSTtTQUNqQjtRQUVELFFBQVEsRUFBRTtZQUNOLElBQUksRUFBRSxLQUE2QjtZQUNuQyxPQUFPLEVBQUUsU0FBUztTQUNyQjtLQUNKO0lBQ0QsSUFBSTtRQUNBLE9BQU87WUFDSCxZQUFZLEVBQUUsS0FBSztZQUNuQixjQUFjO1lBQ2QsV0FBVyxFQUFFLElBQUksQ0FBQyxLQUFLO1NBQzFCLENBQUM7SUFDTixDQUFDO0lBQ0QsUUFBUSxFQUFFO1FBQ04sWUFBWTtZQUNSLE9BQU8sSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQzFDLENBQUM7S0FDSjtJQUNELEtBQUssRUFBRTtRQUNILFdBQVcsRUFBRTtZQUNULE9BQU8sQ0FBQyxHQUFHLEVBQUUsTUFBTTtnQkFDZixJQUFJLEdBQUcsS0FBSyxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQzlDLElBQUksQ0FBQyxXQUFXLEdBQUcsR0FBRyxDQUFDO2lCQUMxQjtZQUNMLENBQUM7WUFDRCxTQUFTLEVBQUUsSUFBSTtTQUNsQjtLQUNKO0lBQ0QsT0FBTyxLQUFJLENBQUM7SUFDWixhQUFhLEtBQUksQ0FBQztJQUVsQixPQUFPLEVBQUU7UUFDTCxZQUFZLENBQUMsS0FBMEI7WUFDbkMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUMvQixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDakQsT0FBTyxLQUFLLENBQUM7YUFDaEI7WUFDRCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQyxDQUFDO1lBQzlELE9BQU8sS0FBSyxJQUFJLElBQUksQ0FBQztRQUN6QixDQUFDO1FBQ0QsVUFBVTtZQUNOLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFDRCxZQUFZLENBQUMsS0FBZSxFQUFFLEtBQVk7WUFDdEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO1lBQy9CLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBRUQsY0FBYyxDQUFDLElBQWM7WUFDekIsSUFBSSxDQUFDLFlBQVksR0FBRyxPQUFPLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQzlFLENBQUM7S0FDSjtJQUVELFFBQVEsRUFBRSxRQUFRO0NBQ3JCLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBWdWUgZnJvbSAndnVlL2Rpc3QvdnVlJztcbmltcG9ydCB0eXBlIHsgUHJvcFR5cGUgfSBmcm9tICd2dWUnO1xuXG5pbXBvcnQgdHlwZSB7IFRhYkVudHJ5LCBFeHRlbnNpb25NYW5hZ2VyVGFiIH0gZnJvbSAnLi4vLi4vcHVibGljL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBnZXRUYXJnZXRGcm9tRXZlbnQsIGVsZW1lbnRzQ29udGFpbnMgfSBmcm9tICcuLi8uLi9wdWJsaWMvdXRpbHMtZG9tJztcblxuaW1wb3J0IHsgQ3VzdG9tRHJvcGRvd24sIEN1c3RvbURyb3Bkb3duSXRlbSB9IGZyb20gJy4vY3VzdG9tLWRyb3Bkb3duJztcblxuY29uc3QgdGVtcGxhdGUgPSAvKiBodG1sICovIGBcbiAgICA8ZGl2IHJlZj1cInRhYlwiIGNsYXNzPVwidGFiLWRyb3Bkb3duXCIgOmFjdGl2ZT1cImFjdGl2ZUxhYmVsID09PSBuYXRpdmVMYWJlbFwiPlxuICAgICAgICA8Q3VzdG9tRHJvcGRvd24gdi1pZj1cImNoaWxkcmVuXCIgOnZpc2libGUuc3luYz1cInNob3dEcm9wZG93blwiPlxuICAgICAgICAgICAgPHVpLWJ1dHRvbiBjbGFzcz1cInRhYi1kcm9wZG93bl9fYnRuXCIgQGNsaWNrPVwib25UYWJDbGlja1wiPlxuICAgICAgICAgICAgICAgIDx1aS1sYWJlbCA6dmFsdWU9XCInaTE4bjpleHRlbnNpb24ubWFuYWdlci4nKyBwcmVzZW50TGFiZWxcIj48L3VpLWxhYmVsPlxuICAgICAgICAgICAgPC91aS1idXR0b24+XG5cbiAgICAgICAgICAgIDx0ZW1wbGF0ZSAjb3ZlcmxheT1cIlwiPlxuICAgICAgICAgICAgICAgIDxDdXN0b21Ecm9wZG93bkl0ZW1cbiAgICAgICAgICAgICAgICAgICAgdi1mb3I9XCJpdGVtIGluIGNoaWxkcmVuXCJcbiAgICAgICAgICAgICAgICAgICAgOmtleT1cIml0ZW0ubGFiZWxcIlxuICAgICAgICAgICAgICAgICAgICA6YWN0aXZlPVwiaXRlbS5sYWJlbCA9PT0gYWN0aXZlTGFiZWxcIlxuICAgICAgICAgICAgICAgICAgICBjbGFzcz1cIm9wdGlvblwiXG4gICAgICAgICAgICAgICAgICAgIEBjbGljaz1cIm9uQ2hpbGRDbGljayhpdGVtLCAkZXZlbnQpXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDx1aS1sYWJlbCA6dmFsdWU9XCInaTE4bjpleHRlbnNpb24ubWFuYWdlci4nK2l0ZW0ubGFiZWxcIj48L3VpLWxhYmVsPlxuICAgICAgICAgICAgICAgIDwvQ3VzdG9tRHJvcGRvd25JdGVtPlxuICAgICAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgPC9DdXN0b21Ecm9wZG93bj5cblxuICAgICAgICA8dWktYnV0dG9uIHYtZWxzZSBjbGFzcz1cInRhYi1kcm9wZG93bl9fYnRuXCIgQGNsaWNrPVwib25UYWJDbGlja1wiPlxuICAgICAgICAgICAgPHVpLWxhYmVsIDp2YWx1ZT1cIidpMThuOmV4dGVuc2lvbi5tYW5hZ2VyLicrIGxhYmVsXCI+PC91aS1sYWJlbD5cbiAgICAgICAgPC91aS1idXR0b24+XG4gICAgPC9kaXY+XG5gO1xuXG5leHBvcnQgY29uc3QgVGFiRHJvcGRvd24gPSBWdWUuZXh0ZW5kKHtcbiAgICBuYW1lOiAnVGFiRHJvcGRvd24nLFxuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgLy9cbiAgICAgICAgQ3VzdG9tRHJvcGRvd24sXG4gICAgICAgIEN1c3RvbURyb3Bkb3duSXRlbSxcbiAgICB9LFxuICAgIHByb3BzOiB7XG4gICAgICAgIGFjdGl2ZUxhYmVsOiB7XG4gICAgICAgICAgICB0eXBlOiBTdHJpbmcgYXMgUHJvcFR5cGU8RXh0ZW5zaW9uTWFuYWdlclRhYj4sXG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgfSxcblxuICAgICAgICBsYWJlbDoge1xuICAgICAgICAgICAgdHlwZTogU3RyaW5nIGFzIFByb3BUeXBlPEV4dGVuc2lvbk1hbmFnZXJUYWI+LFxuICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIH0sXG5cbiAgICAgICAgY2hpbGRyZW46IHtcbiAgICAgICAgICAgIHR5cGU6IEFycmF5IGFzIFByb3BUeXBlPFRhYkVudHJ5W10+LFxuICAgICAgICAgICAgZGVmYXVsdDogdW5kZWZpbmVkLFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgZGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNob3dEcm9wZG93bjogZmFsc2UsXG4gICAgICAgICAgICAvLyDorrDlvZXnu4Tku7bmnKzlnLDnmoTpgInkuK3nirbmgIFcbiAgICAgICAgICAgIG5hdGl2ZUxhYmVsOiB0aGlzLmxhYmVsLFxuICAgICAgICB9O1xuICAgIH0sXG4gICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgcHJlc2VudExhYmVsKCk6IHN0cmluZyB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uYXRpdmVMYWJlbCA/PyB0aGlzLmxhYmVsO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgd2F0Y2g6IHtcbiAgICAgICAgYWN0aXZlTGFiZWw6IHtcbiAgICAgICAgICAgIGhhbmRsZXIodmFsLCBvbGRWYWwpIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsID09PSB0aGlzLmxhYmVsIHx8IHRoaXMuaXNDaGlsZExhYmVsKHZhbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYXRpdmVMYWJlbCA9IHZhbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1tZWRpYXRlOiB0cnVlLFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgbW91bnRlZCgpIHt9LFxuICAgIGJlZm9yZURlc3Ryb3koKSB7fSxcblxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgaXNDaGlsZExhYmVsKGxhYmVsOiBFeHRlbnNpb25NYW5hZ2VyVGFiKSB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW47XG4gICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoY2hpbGRyZW4pIHx8IGNoaWxkcmVuLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBmb3VuZCA9IGNoaWxkcmVuLmZpbmQoKGNoaWxkKSA9PiBjaGlsZC5sYWJlbCA9PT0gbGFiZWwpO1xuICAgICAgICAgICAgcmV0dXJuIGZvdW5kICE9IG51bGw7XG4gICAgICAgIH0sXG4gICAgICAgIG9uVGFiQ2xpY2soKSB7XG4gICAgICAgICAgICB0aGlzLiRlbWl0KCdzZWxlY3QnLCB0aGlzLm5hdGl2ZUxhYmVsKTtcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlRHJvcGRvd24oZmFsc2UpO1xuICAgICAgICB9LFxuICAgICAgICBvbkNoaWxkQ2xpY2soY2hpbGQ6IFRhYkVudHJ5LCBldmVudDogRXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMubmF0aXZlTGFiZWwgPSBjaGlsZC5sYWJlbDtcbiAgICAgICAgICAgIHRoaXMuJGVtaXQoJ3NlbGVjdCcsIGNoaWxkLmxhYmVsKTtcbiAgICAgICAgfSxcblxuICAgICAgICB0b2dnbGVEcm9wZG93bihzaG93PzogYm9vbGVhbikge1xuICAgICAgICAgICAgdGhpcy5zaG93RHJvcGRvd24gPSB0eXBlb2Ygc2hvdyA9PT0gJ2Jvb2xlYW4nID8gc2hvdyA6ICF0aGlzLnNob3dEcm9wZG93bjtcbiAgICAgICAgfSxcbiAgICB9LFxuXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxufSk7XG4iXX0=