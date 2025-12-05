"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabDropdown = void 0;
const vue_js_1 = __importDefault(require("vue/dist/vue.js"));
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
exports.TabDropdown = vue_js_1.default.extend({
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFiLWRyb3Bkb3duLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc291cmNlL3BhbmVscy9jb21wb25lbnRzL3RhYi1kcm9wZG93bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw2REFBa0M7QUFNbEMsdURBQXVFO0FBRXZFLE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBd0IzQixDQUFDO0FBRVcsUUFBQSxXQUFXLEdBQUcsZ0JBQUcsQ0FBQyxNQUFNLENBQUM7SUFDbEMsSUFBSSxFQUFFLGFBQWE7SUFDbkIsVUFBVSxFQUFFO1FBQ1IsRUFBRTtRQUNGLGNBQWMsRUFBZCxnQ0FBYztRQUNkLGtCQUFrQixFQUFsQixvQ0FBa0I7S0FDckI7SUFDRCxLQUFLLEVBQUU7UUFDSCxXQUFXLEVBQUU7WUFDVCxJQUFJLEVBQUUsTUFBdUM7WUFDN0MsUUFBUSxFQUFFLElBQUk7U0FDakI7UUFFRCxLQUFLLEVBQUU7WUFDSCxJQUFJLEVBQUUsTUFBdUM7WUFDN0MsUUFBUSxFQUFFLElBQUk7U0FDakI7UUFFRCxRQUFRLEVBQUU7WUFDTixJQUFJLEVBQUUsS0FBNkI7WUFDbkMsT0FBTyxFQUFFLFNBQVM7U0FDckI7S0FDSjtJQUNELElBQUk7UUFDQSxPQUFPO1lBQ0gsWUFBWSxFQUFFLEtBQUs7WUFDbkIsY0FBYztZQUNkLFdBQVcsRUFBRSxJQUFJLENBQUMsS0FBSztTQUMxQixDQUFDO0lBQ04sQ0FBQztJQUNELFFBQVEsRUFBRTtRQUNOLFlBQVk7WUFDUixPQUFPLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztRQUMxQyxDQUFDO0tBQ0o7SUFDRCxLQUFLLEVBQUU7UUFDSCxXQUFXLEVBQUU7WUFDVCxPQUFPLENBQUMsR0FBRyxFQUFFLE1BQU07Z0JBQ2YsSUFBSSxHQUFHLEtBQUssSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUM5QyxJQUFJLENBQUMsV0FBVyxHQUFHLEdBQUcsQ0FBQztpQkFDMUI7WUFDTCxDQUFDO1lBQ0QsU0FBUyxFQUFFLElBQUk7U0FDbEI7S0FDSjtJQUNELE9BQU8sS0FBSSxDQUFDO0lBQ1osYUFBYSxLQUFJLENBQUM7SUFFbEIsT0FBTyxFQUFFO1FBQ0wsWUFBWSxDQUFDLEtBQTBCO1lBQ25DLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDL0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ2pELE9BQU8sS0FBSyxDQUFDO2FBQ2hCO1lBQ0QsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssS0FBSyxLQUFLLENBQUMsQ0FBQztZQUM5RCxPQUFPLEtBQUssSUFBSSxJQUFJLENBQUM7UUFDekIsQ0FBQztRQUNELFVBQVU7WUFDTixJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBQ0QsWUFBWSxDQUFDLEtBQWUsRUFBRSxLQUFZO1lBQ3RDLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztZQUMvQixJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUVELGNBQWMsQ0FBQyxJQUFjO1lBQ3pCLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxJQUFJLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQztRQUM5RSxDQUFDO0tBQ0o7SUFFRCxRQUFRLEVBQUUsUUFBUTtDQUNyQixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgVnVlIGZyb20gJ3Z1ZS9kaXN0L3Z1ZS5qcyc7XG5pbXBvcnQgdHlwZSB7IFByb3BUeXBlIH0gZnJvbSAndnVlJztcblxuaW1wb3J0IHR5cGUgeyBUYWJFbnRyeSwgRXh0ZW5zaW9uTWFuYWdlclRhYiB9IGZyb20gJy4uLy4uL3B1YmxpYy9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgZ2V0VGFyZ2V0RnJvbUV2ZW50LCBlbGVtZW50c0NvbnRhaW5zIH0gZnJvbSAnLi4vLi4vcHVibGljL3V0aWxzLWRvbSc7XG5cbmltcG9ydCB7IEN1c3RvbURyb3Bkb3duLCBDdXN0b21Ecm9wZG93bkl0ZW0gfSBmcm9tICcuL2N1c3RvbS1kcm9wZG93bic7XG5cbmNvbnN0IHRlbXBsYXRlID0gLyogaHRtbCAqLyBgXG4gICAgPGRpdiByZWY9XCJ0YWJcIiBjbGFzcz1cInRhYi1kcm9wZG93blwiIDphY3RpdmU9XCJhY3RpdmVMYWJlbCA9PT0gbmF0aXZlTGFiZWxcIj5cbiAgICAgICAgPEN1c3RvbURyb3Bkb3duIHYtaWY9XCJjaGlsZHJlblwiIDp2aXNpYmxlLnN5bmM9XCJzaG93RHJvcGRvd25cIj5cbiAgICAgICAgICAgIDx1aS1idXR0b24gY2xhc3M9XCJ0YWItZHJvcGRvd25fX2J0blwiIEBjbGljaz1cIm9uVGFiQ2xpY2tcIj5cbiAgICAgICAgICAgICAgICA8dWktbGFiZWwgOnZhbHVlPVwiJ2kxOG46ZXh0ZW5zaW9uLm1hbmFnZXIuJysgcHJlc2VudExhYmVsXCI+PC91aS1sYWJlbD5cbiAgICAgICAgICAgIDwvdWktYnV0dG9uPlxuXG4gICAgICAgICAgICA8dGVtcGxhdGUgI292ZXJsYXk9XCJcIj5cbiAgICAgICAgICAgICAgICA8Q3VzdG9tRHJvcGRvd25JdGVtXG4gICAgICAgICAgICAgICAgICAgIHYtZm9yPVwiaXRlbSBpbiBjaGlsZHJlblwiXG4gICAgICAgICAgICAgICAgICAgIDprZXk9XCJpdGVtLmxhYmVsXCJcbiAgICAgICAgICAgICAgICAgICAgOmFjdGl2ZT1cIml0ZW0ubGFiZWwgPT09IGFjdGl2ZUxhYmVsXCJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJvcHRpb25cIlxuICAgICAgICAgICAgICAgICAgICBAY2xpY2s9XCJvbkNoaWxkQ2xpY2soaXRlbSwgJGV2ZW50KVwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8dWktbGFiZWwgOnZhbHVlPVwiJ2kxOG46ZXh0ZW5zaW9uLm1hbmFnZXIuJytpdGVtLmxhYmVsXCI+PC91aS1sYWJlbD5cbiAgICAgICAgICAgICAgICA8L0N1c3RvbURyb3Bkb3duSXRlbT5cbiAgICAgICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICAgIDwvQ3VzdG9tRHJvcGRvd24+XG5cbiAgICAgICAgPHVpLWJ1dHRvbiB2LWVsc2UgY2xhc3M9XCJ0YWItZHJvcGRvd25fX2J0blwiIEBjbGljaz1cIm9uVGFiQ2xpY2tcIj5cbiAgICAgICAgICAgIDx1aS1sYWJlbCA6dmFsdWU9XCInaTE4bjpleHRlbnNpb24ubWFuYWdlci4nKyBsYWJlbFwiPjwvdWktbGFiZWw+XG4gICAgICAgIDwvdWktYnV0dG9uPlxuICAgIDwvZGl2PlxuYDtcblxuZXhwb3J0IGNvbnN0IFRhYkRyb3Bkb3duID0gVnVlLmV4dGVuZCh7XG4gICAgbmFtZTogJ1RhYkRyb3Bkb3duJyxcbiAgICBjb21wb25lbnRzOiB7XG4gICAgICAgIC8vXG4gICAgICAgIEN1c3RvbURyb3Bkb3duLFxuICAgICAgICBDdXN0b21Ecm9wZG93bkl0ZW0sXG4gICAgfSxcbiAgICBwcm9wczoge1xuICAgICAgICBhY3RpdmVMYWJlbDoge1xuICAgICAgICAgICAgdHlwZTogU3RyaW5nIGFzIFByb3BUeXBlPEV4dGVuc2lvbk1hbmFnZXJUYWI+LFxuICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIH0sXG5cbiAgICAgICAgbGFiZWw6IHtcbiAgICAgICAgICAgIHR5cGU6IFN0cmluZyBhcyBQcm9wVHlwZTxFeHRlbnNpb25NYW5hZ2VyVGFiPixcbiAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuXG4gICAgICAgIGNoaWxkcmVuOiB7XG4gICAgICAgICAgICB0eXBlOiBBcnJheSBhcyBQcm9wVHlwZTxUYWJFbnRyeVtdPixcbiAgICAgICAgICAgIGRlZmF1bHQ6IHVuZGVmaW5lZCxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGRhdGEoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzaG93RHJvcGRvd246IGZhbHNlLFxuICAgICAgICAgICAgLy8g6K6w5b2V57uE5Lu25pys5Zyw55qE6YCJ5Lit54q25oCBXG4gICAgICAgICAgICBuYXRpdmVMYWJlbDogdGhpcy5sYWJlbCxcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGNvbXB1dGVkOiB7XG4gICAgICAgIHByZXNlbnRMYWJlbCgpOiBzdHJpbmcge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmF0aXZlTGFiZWwgPz8gdGhpcy5sYWJlbDtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHdhdGNoOiB7XG4gICAgICAgIGFjdGl2ZUxhYmVsOiB7XG4gICAgICAgICAgICBoYW5kbGVyKHZhbCwgb2xkVmFsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbCA9PT0gdGhpcy5sYWJlbCB8fCB0aGlzLmlzQ2hpbGRMYWJlbCh2YWwpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmF0aXZlTGFiZWwgPSB2YWw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltbWVkaWF0ZTogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIG1vdW50ZWQoKSB7fSxcbiAgICBiZWZvcmVEZXN0cm95KCkge30sXG5cbiAgICBtZXRob2RzOiB7XG4gICAgICAgIGlzQ2hpbGRMYWJlbChsYWJlbDogRXh0ZW5zaW9uTWFuYWdlclRhYikge1xuICAgICAgICAgICAgY29uc3QgY2hpbGRyZW4gPSB0aGlzLmNoaWxkcmVuO1xuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGNoaWxkcmVuKSB8fCBjaGlsZHJlbi5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZm91bmQgPSBjaGlsZHJlbi5maW5kKChjaGlsZCkgPT4gY2hpbGQubGFiZWwgPT09IGxhYmVsKTtcbiAgICAgICAgICAgIHJldHVybiBmb3VuZCAhPSBudWxsO1xuICAgICAgICB9LFxuICAgICAgICBvblRhYkNsaWNrKCkge1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgnc2VsZWN0JywgdGhpcy5uYXRpdmVMYWJlbCk7XG4gICAgICAgICAgICB0aGlzLnRvZ2dsZURyb3Bkb3duKGZhbHNlKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25DaGlsZENsaWNrKGNoaWxkOiBUYWJFbnRyeSwgZXZlbnQ6IEV2ZW50KSB7XG4gICAgICAgICAgICB0aGlzLm5hdGl2ZUxhYmVsID0gY2hpbGQubGFiZWw7XG4gICAgICAgICAgICB0aGlzLiRlbWl0KCdzZWxlY3QnLCBjaGlsZC5sYWJlbCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9nZ2xlRHJvcGRvd24oc2hvdz86IGJvb2xlYW4pIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0Ryb3Bkb3duID0gdHlwZW9mIHNob3cgPT09ICdib29sZWFuJyA/IHNob3cgOiAhdGhpcy5zaG93RHJvcGRvd247XG4gICAgICAgIH0sXG4gICAgfSxcblxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcbn0pO1xuIl19