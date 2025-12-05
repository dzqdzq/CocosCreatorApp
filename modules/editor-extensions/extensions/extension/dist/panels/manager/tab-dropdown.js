"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabDropdown = void 0;
const vue_1 = __importDefault(require("vue/dist/vue"));
const utils_dom_1 = require("../../public/utils-dom");
const template = /* html */ `
    <div
        ref="tab"
        class="tab"
        :active="activeLabel === nativeLabel"
        :class="{
            hide: !showDropdown,
        }"
    >
        <div v-if="children" class="layout">
            <div class="header" @click="onTabClick">
                <div class="text">
                    <div class="label">
                        <ui-label :value="'i18n:extension.manager.'+ presentLabel"></ui-label>
                    </div>
                </div>
                <div class="icon" @click.stop="toggleDropdown()">
                    <ui-icon value="arrow-triangle"></ui-icon>
                </div>
            </div>
            <div class="select">
                <div v-for="item in children" :key="item.label" class="option" @click="onChildClick(item, $event)">
                    <ui-label :value="'i18n:extension.manager.'+item.label"></ui-label>
                </div>
            </div>
        </div>
        <div v-else class="layout" @click="onTabClick">
            <ui-label :value="'i18n:extension.manager.'+ label"></ui-label>
        </div>
    </div>
`;
exports.TabDropdown = vue_1.default.extend({
    name: 'TabDropdown',
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
    mounted() {
        document.body.addEventListener('click', this.onDocumentClick);
    },
    beforeDestroy() {
        document.body.removeEventListener('click', this.onDocumentClick);
    },
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
            this.toggleDropdown(false);
        },
        toggleDropdown(show) {
            this.showDropdown = typeof show === 'boolean' ? show : !this.showDropdown;
        },
        onDocumentClick(e) {
            const target = utils_dom_1.getTargetFromEvent(e);
            // TODO: 如果下拉框之后挂载到 body 上，这里还需要处理
            if (!utils_dom_1.elementsContains(this.$refs.tab, target)) {
                this.showDropdown = false;
            }
        },
    },
    template: template,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFiLWRyb3Bkb3duLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc291cmNlL3BhbmVscy9tYW5hZ2VyL3RhYi1kcm9wZG93bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSx1REFBK0I7QUFJL0Isc0RBQThFO0FBRTlFLE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBOEIzQixDQUFDO0FBRVcsUUFBQSxXQUFXLEdBQUcsYUFBRyxDQUFDLE1BQU0sQ0FBQztJQUNsQyxJQUFJLEVBQUUsYUFBYTtJQUNuQixLQUFLLEVBQUU7UUFDSCxXQUFXLEVBQUU7WUFDVCxJQUFJLEVBQUUsTUFBdUM7WUFDN0MsUUFBUSxFQUFFLElBQUk7U0FDakI7UUFFRCxLQUFLLEVBQUU7WUFDSCxJQUFJLEVBQUUsTUFBdUM7WUFDN0MsUUFBUSxFQUFFLElBQUk7U0FDakI7UUFFRCxRQUFRLEVBQUU7WUFDTixJQUFJLEVBQUUsS0FBNkI7WUFDbkMsT0FBTyxFQUFFLFNBQVM7U0FDckI7S0FDSjtJQUNELElBQUk7UUFDQSxPQUFPO1lBQ0gsWUFBWSxFQUFFLEtBQUs7WUFDbkIsY0FBYztZQUNkLFdBQVcsRUFBRSxJQUFJLENBQUMsS0FBSztTQUMxQixDQUFDO0lBQ04sQ0FBQztJQUNELFFBQVEsRUFBRTtRQUNOLFlBQVk7WUFDUixPQUFPLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztRQUMxQyxDQUFDO0tBQ0o7SUFDRCxLQUFLLEVBQUU7UUFDSCxXQUFXLEVBQUU7WUFDVCxPQUFPLENBQUMsR0FBRyxFQUFFLE1BQU07Z0JBQ2YsSUFBSSxHQUFHLEtBQUssSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUM5QyxJQUFJLENBQUMsV0FBVyxHQUFHLEdBQUcsQ0FBQztpQkFDMUI7WUFDTCxDQUFDO1lBQ0QsU0FBUyxFQUFFLElBQUk7U0FDbEI7S0FDSjtJQUNELE9BQU87UUFDSCxRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUNELGFBQWE7UUFDVCxRQUFRLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVELE9BQU8sRUFBRTtRQUNMLFlBQVksQ0FBQyxLQUEwQjtZQUNuQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQy9CLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUNqRCxPQUFPLEtBQUssQ0FBQzthQUNoQjtZQUNELE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDLENBQUM7WUFDOUQsT0FBTyxLQUFLLElBQUksSUFBSSxDQUFDO1FBQ3pCLENBQUM7UUFDRCxVQUFVO1lBQ04sSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUNELFlBQVksQ0FBQyxLQUFlLEVBQUUsS0FBWTtZQUN0QyxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7WUFDL0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2xDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVELGNBQWMsQ0FBQyxJQUFjO1lBQ3pCLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxJQUFJLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQztRQUM5RSxDQUFDO1FBRUQsZUFBZSxDQUFDLENBQWE7WUFDekIsTUFBTSxNQUFNLEdBQUcsOEJBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckMsa0NBQWtDO1lBQ2xDLElBQUksQ0FBQyw0QkFBZ0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQWtCLEVBQUUsTUFBTSxDQUFDLEVBQUU7Z0JBQzFELElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO2FBQzdCO1FBQ0wsQ0FBQztLQUNKO0lBRUQsUUFBUSxFQUFFLFFBQVE7Q0FDckIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFZ1ZSBmcm9tICd2dWUvZGlzdC92dWUnO1xuaW1wb3J0IHR5cGUgeyBQcm9wVHlwZSB9IGZyb20gJ3Z1ZSc7XG5cbmltcG9ydCB0eXBlIHsgVGFiRW50cnksIEV4dGVuc2lvbk1hbmFnZXJUYWIgfSBmcm9tICcuLi8uLi9wdWJsaWMvaW50ZXJmYWNlJztcbmltcG9ydCB7IGdldFRhcmdldEZyb21FdmVudCwgZWxlbWVudHNDb250YWlucyB9IGZyb20gJy4uLy4uL3B1YmxpYy91dGlscy1kb20nO1xuXG5jb25zdCB0ZW1wbGF0ZSA9IC8qIGh0bWwgKi8gYFxuICAgIDxkaXZcbiAgICAgICAgcmVmPVwidGFiXCJcbiAgICAgICAgY2xhc3M9XCJ0YWJcIlxuICAgICAgICA6YWN0aXZlPVwiYWN0aXZlTGFiZWwgPT09IG5hdGl2ZUxhYmVsXCJcbiAgICAgICAgOmNsYXNzPVwie1xuICAgICAgICAgICAgaGlkZTogIXNob3dEcm9wZG93bixcbiAgICAgICAgfVwiXG4gICAgPlxuICAgICAgICA8ZGl2IHYtaWY9XCJjaGlsZHJlblwiIGNsYXNzPVwibGF5b3V0XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyXCIgQGNsaWNrPVwib25UYWJDbGlja1wiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJsYWJlbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWxhYmVsIDp2YWx1ZT1cIidpMThuOmV4dGVuc2lvbi5tYW5hZ2VyLicrIHByZXNlbnRMYWJlbFwiPjwvdWktbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJpY29uXCIgQGNsaWNrLnN0b3A9XCJ0b2dnbGVEcm9wZG93bigpXCI+XG4gICAgICAgICAgICAgICAgICAgIDx1aS1pY29uIHZhbHVlPVwiYXJyb3ctdHJpYW5nbGVcIj48L3VpLWljb24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzZWxlY3RcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IHYtZm9yPVwiaXRlbSBpbiBjaGlsZHJlblwiIDprZXk9XCJpdGVtLmxhYmVsXCIgY2xhc3M9XCJvcHRpb25cIiBAY2xpY2s9XCJvbkNoaWxkQ2xpY2soaXRlbSwgJGV2ZW50KVwiPlxuICAgICAgICAgICAgICAgICAgICA8dWktbGFiZWwgOnZhbHVlPVwiJ2kxOG46ZXh0ZW5zaW9uLm1hbmFnZXIuJytpdGVtLmxhYmVsXCI+PC91aS1sYWJlbD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiB2LWVsc2UgY2xhc3M9XCJsYXlvdXRcIiBAY2xpY2s9XCJvblRhYkNsaWNrXCI+XG4gICAgICAgICAgICA8dWktbGFiZWwgOnZhbHVlPVwiJ2kxOG46ZXh0ZW5zaW9uLm1hbmFnZXIuJysgbGFiZWxcIj48L3VpLWxhYmVsPlxuICAgICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbmA7XG5cbmV4cG9ydCBjb25zdCBUYWJEcm9wZG93biA9IFZ1ZS5leHRlbmQoe1xuICAgIG5hbWU6ICdUYWJEcm9wZG93bicsXG4gICAgcHJvcHM6IHtcbiAgICAgICAgYWN0aXZlTGFiZWw6IHtcbiAgICAgICAgICAgIHR5cGU6IFN0cmluZyBhcyBQcm9wVHlwZTxFeHRlbnNpb25NYW5hZ2VyVGFiPixcbiAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuXG4gICAgICAgIGxhYmVsOiB7XG4gICAgICAgICAgICB0eXBlOiBTdHJpbmcgYXMgUHJvcFR5cGU8RXh0ZW5zaW9uTWFuYWdlclRhYj4sXG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgfSxcblxuICAgICAgICBjaGlsZHJlbjoge1xuICAgICAgICAgICAgdHlwZTogQXJyYXkgYXMgUHJvcFR5cGU8VGFiRW50cnlbXT4sXG4gICAgICAgICAgICBkZWZhdWx0OiB1bmRlZmluZWQsXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBkYXRhKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2hvd0Ryb3Bkb3duOiBmYWxzZSxcbiAgICAgICAgICAgIC8vIOiusOW9lee7hOS7tuacrOWcsOeahOmAieS4reeKtuaAgVxuICAgICAgICAgICAgbmF0aXZlTGFiZWw6IHRoaXMubGFiZWwsXG4gICAgICAgIH07XG4gICAgfSxcbiAgICBjb21wdXRlZDoge1xuICAgICAgICBwcmVzZW50TGFiZWwoKTogc3RyaW5nIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5hdGl2ZUxhYmVsID8/IHRoaXMubGFiZWw7XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICB3YXRjaDoge1xuICAgICAgICBhY3RpdmVMYWJlbDoge1xuICAgICAgICAgICAgaGFuZGxlcih2YWwsIG9sZFZhbCkge1xuICAgICAgICAgICAgICAgIGlmICh2YWwgPT09IHRoaXMubGFiZWwgfHwgdGhpcy5pc0NoaWxkTGFiZWwodmFsKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hdGl2ZUxhYmVsID0gdmFsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbW1lZGlhdGU6IHRydWUsXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBtb3VudGVkKCkge1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5vbkRvY3VtZW50Q2xpY2spO1xuICAgIH0sXG4gICAgYmVmb3JlRGVzdHJveSgpIHtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMub25Eb2N1bWVudENsaWNrKTtcbiAgICB9LFxuXG4gICAgbWV0aG9kczoge1xuICAgICAgICBpc0NoaWxkTGFiZWwobGFiZWw6IEV4dGVuc2lvbk1hbmFnZXJUYWIpIHtcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkcmVuID0gdGhpcy5jaGlsZHJlbjtcbiAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShjaGlsZHJlbikgfHwgY2hpbGRyZW4ubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gY2hpbGRyZW4uZmluZCgoY2hpbGQpID0+IGNoaWxkLmxhYmVsID09PSBsYWJlbCk7XG4gICAgICAgICAgICByZXR1cm4gZm91bmQgIT0gbnVsbDtcbiAgICAgICAgfSxcbiAgICAgICAgb25UYWJDbGljaygpIHtcbiAgICAgICAgICAgIHRoaXMuJGVtaXQoJ3NlbGVjdCcsIHRoaXMubmF0aXZlTGFiZWwpO1xuICAgICAgICAgICAgdGhpcy50b2dnbGVEcm9wZG93bihmYWxzZSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uQ2hpbGRDbGljayhjaGlsZDogVGFiRW50cnksIGV2ZW50OiBFdmVudCkge1xuICAgICAgICAgICAgdGhpcy5uYXRpdmVMYWJlbCA9IGNoaWxkLmxhYmVsO1xuICAgICAgICAgICAgdGhpcy4kZW1pdCgnc2VsZWN0JywgY2hpbGQubGFiZWwpO1xuICAgICAgICAgICAgdGhpcy50b2dnbGVEcm9wZG93bihmYWxzZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9nZ2xlRHJvcGRvd24oc2hvdz86IGJvb2xlYW4pIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd0Ryb3Bkb3duID0gdHlwZW9mIHNob3cgPT09ICdib29sZWFuJyA/IHNob3cgOiAhdGhpcy5zaG93RHJvcGRvd247XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25Eb2N1bWVudENsaWNrKGU6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGdldFRhcmdldEZyb21FdmVudChlKTtcbiAgICAgICAgICAgIC8vIFRPRE86IOWmguaenOS4i+aLieahhuS5i+WQjuaMgui9veWIsCBib2R5IOS4iu+8jOi/memHjOi/mOmcgOimgeWkhOeQhlxuICAgICAgICAgICAgaWYgKCFlbGVtZW50c0NvbnRhaW5zKHRoaXMuJHJlZnMudGFiIGFzIEhUTUxFbGVtZW50LCB0YXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93RHJvcGRvd24gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9LFxuXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxufSk7XG4iXX0=