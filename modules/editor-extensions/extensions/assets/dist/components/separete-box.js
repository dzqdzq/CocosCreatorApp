"use strict";
// 原则上应该直接 import xx from 'vue'; 但是外围基本都是 from('vue/dist/vue.js') 这边只能保持一致
// 要不然会报错  $attrs is readonly & $listeners is readonly  https://github.com/vuejs/vue/issues/6698
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// vue2 关于 ts 的写法指导： https://v2.cn.vuejs.org/v2/guide/typescript.html
const vue_js_1 = __importDefault(require("vue/dist/vue.js"));
exports.default = vue_js_1.default.extend({
    name: 'SepareteBox',
    props: {
        initPos: {
            type: Number,
            default: 400,
        },
        showSeparete: {
            type: Boolean,
            default: true,
        },
        separeteLineHeight: {
            type: Number,
            default: 10,
        },
    },
    data() {
        return {
            clientHeight: 0,
            h_top: 0,
            clientYCache: 0,
        };
    },
    computed: {
        h_bottom() {
            return this.showSeparete
                ? this.clientHeight - this.h_top - this.separeteLineHeight
                : 0;
        },
    },
    watch: {
        showSeparete() {
            this.init();
        },
    },
    mounted() {
        this.init();
        // @ts-ignore
        this.resizeObserver = new ResizeObserver(([entry]) => {
            const { height } = entry.contentRect;
            const p = this.h_top / this.clientHeight;
            if (this.clientHeight !== height) {
                this.clientHeight = height;
                this.h_top = this.showSeparete ? Math.floor(height * p) : height;
            }
        });
        // @ts-ignore
        this.resizeObserver.observe(this.$el);
    },
    beforeDestroy() {
        // @ts-ignore
        this.resizeObserver.disconnect();
    },
    methods: {
        init() {
            this.h_top = this.showSeparete
                ? Math.floor(Math.min(this.initPos, this.clientHeight * 0.8))
                : this.clientHeight;
        },
        mousedown(e) {
            e.stopPropagation();
            this.clientYCache = e.clientY;
        },
        mousemove(e) {
            if (this.clientYCache === 0)
                return;
            const value = e.clientY - this.clientYCache;
            this.h_top += value;
            this.clientYCache = e.clientY;
            this.$emit('change', { top: this.h_top });
        },
        mouseup() {
            this.clientYCache = 0;
        },
    },
    render(h) {
        return h('div', {
            class: 'separete-box',
            on: {
                mousemove: this.mousemove,
                mouseup: this.mouseup,
            },
            attrs: {
                'data-height': this.clientHeight,
            },
        }, [
            h('div', {
                style: { height: this.h_top + 'px' },
                attrs: { 'data-slot': 'top' },
            }, this.$scopedSlots.top?.({ height: this.h_top })),
            (this.showSeparete
                ? h('div', {
                    class: 'line',
                    style: {
                        height: this.separeteLineHeight + 'px',
                        ['--height']: this.separeteLineHeight + 'px',
                    },
                    on: {
                        mousedown: this.mousedown,
                        mouseup: this.mouseup,
                    }
                })
                : null),
            h('div', {
                style: { flex: 1 },
                attrs: { 'data-slot': 'bottom', 'data-height': this.h_bottom + 'px' },
            }, this.$scopedSlots.bottom?.({ height: this.h_bottom })),
        ]);
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VwYXJldGUtYm94LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2NvbXBvbmVudHMvc2VwYXJldGUtYm94LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSwwRUFBMEU7QUFDMUUsZ0dBQWdHOzs7OztBQUVoRyxxRUFBcUU7QUFDckUsNkRBQTJDO0FBRTNDLGtCQUFlLGdCQUFHLENBQUMsTUFBTSxDQUFDO0lBQ3RCLElBQUksRUFBRSxhQUFhO0lBQ25CLEtBQUssRUFBRTtRQUNILE9BQU8sRUFBRTtZQUNMLElBQUksRUFBRSxNQUFNO1lBQ1osT0FBTyxFQUFFLEdBQUc7U0FDZjtRQUNELFlBQVksRUFBRTtZQUNWLElBQUksRUFBRSxPQUFPO1lBQ2IsT0FBTyxFQUFFLElBQUk7U0FDaEI7UUFDRCxrQkFBa0IsRUFBRTtZQUNoQixJQUFJLEVBQUUsTUFBTTtZQUNaLE9BQU8sRUFBRSxFQUFFO1NBQ2Q7S0FDSjtJQUNELElBQUk7UUFDQSxPQUFPO1lBQ0gsWUFBWSxFQUFFLENBQUM7WUFDZixLQUFLLEVBQUUsQ0FBQztZQUNSLFlBQVksRUFBRSxDQUFDO1NBQ2xCLENBQUM7SUFDTixDQUFDO0lBQ0QsUUFBUSxFQUFFO1FBQ04sUUFBUTtZQUNKLE9BQU8sSUFBSSxDQUFDLFlBQVk7Z0JBQ3BCLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLGtCQUFrQjtnQkFDMUQsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNaLENBQUM7S0FDSjtJQUNELEtBQUssRUFBRTtRQUNILFlBQVk7WUFDUixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDaEIsQ0FBQztLQUNKO0lBQ0QsT0FBTztRQUNILElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNaLGFBQWE7UUFDYixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksY0FBYyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFO1lBQ2pELE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztZQUN6QyxJQUFJLElBQUksQ0FBQyxZQUFZLEtBQUssTUFBTSxFQUFFO2dCQUM5QixJQUFJLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQztnQkFDM0IsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO2FBQ3BFO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDSCxhQUFhO1FBQ2IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFDRCxhQUFhO1FBQ1QsYUFBYTtRQUNiLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDckMsQ0FBQztJQUNELE9BQU8sRUFBRTtRQUNMLElBQUk7WUFDQSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZO2dCQUMxQixDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUMsQ0FBQztnQkFDN0QsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDNUIsQ0FBQztRQUNELFNBQVMsQ0FBQyxDQUFhO1lBQ25CLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDbEMsQ0FBQztRQUNELFNBQVMsQ0FBQyxDQUFhO1lBQ25CLElBQUksSUFBSSxDQUFDLFlBQVksS0FBSyxDQUFDO2dCQUFFLE9BQU87WUFDcEMsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQzVDLElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztZQUM5QixJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxFQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFDLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsT0FBTztZQUNILElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLENBQUM7S0FDSjtJQUNELE1BQU0sQ0FBQyxDQUFDO1FBQ0osT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFO1lBQ1osS0FBSyxFQUFFLGNBQWM7WUFDckIsRUFBRSxFQUFFO2dCQUNBLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztnQkFDekIsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO2FBQ3hCO1lBQ0QsS0FBSyxFQUFFO2dCQUNILGFBQWEsRUFBRSxJQUFJLENBQUMsWUFBWTthQUNuQztTQUNKLEVBQUU7WUFDQyxDQUFDLENBQUMsS0FBSyxFQUFFO2dCQUNMLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksRUFBQztnQkFDbkMsS0FBSyxFQUFFLEVBQUMsV0FBVyxFQUFFLEtBQUssRUFBQzthQUM5QixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBQyxDQUFDLENBQUM7WUFFakQsQ0FBQyxJQUFJLENBQUMsWUFBWTtnQkFDZCxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRTtvQkFDUCxLQUFLLEVBQUUsTUFBTTtvQkFDYixLQUFLLEVBQUU7d0JBQ0gsTUFBTSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJO3dCQUN0QyxDQUFDLFVBQWlCLENBQUMsRUFBRSxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSTtxQkFDdEQ7b0JBQ0QsRUFBRSxFQUFFO3dCQUNBLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUzt3QkFDekIsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO3FCQUN4QjtpQkFBQyxDQUFDO2dCQUNQLENBQUMsQ0FBQyxJQUFJLENBQ1Q7WUFFRCxDQUFDLENBQUMsS0FBSyxFQUFFO2dCQUNMLEtBQUssRUFBRSxFQUFDLElBQUksRUFBRSxDQUFDLEVBQUM7Z0JBQ2hCLEtBQUssRUFBRSxFQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxFQUFDO2FBQ3RFLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFDLENBQUMsQ0FBQztTQUMxRCxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0osQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8g5Y6f5YiZ5LiK5bqU6K+l55u05o6lIGltcG9ydCB4eCBmcm9tICd2dWUnOyDkvYbmmK/lpJblm7Tln7rmnKzpg73mmK8gZnJvbSgndnVlL2Rpc3QvdnVlLmpzJykg6L+Z6L655Y+q6IO95L+d5oyB5LiA6Ie0XG4vLyDopoHkuI3nhLbkvJrmiqXplJkgICRhdHRycyBpcyByZWFkb25seSAmICRsaXN0ZW5lcnMgaXMgcmVhZG9ubHkgIGh0dHBzOi8vZ2l0aHViLmNvbS92dWVqcy92dWUvaXNzdWVzLzY2OThcblxuLy8gdnVlMiDlhbPkuo4gdHMg55qE5YaZ5rOV5oyH5a+877yaIGh0dHBzOi8vdjIuY24udnVlanMub3JnL3YyL2d1aWRlL3R5cGVzY3JpcHQuaHRtbFxuaW1wb3J0IFZ1ZSwge1ZOb2RlfSBmcm9tICd2dWUvZGlzdC92dWUuanMnOyBcblxuZXhwb3J0IGRlZmF1bHQgVnVlLmV4dGVuZCh7XG4gICAgbmFtZTogJ1NlcGFyZXRlQm94JyxcbiAgICBwcm9wczoge1xuICAgICAgICBpbml0UG9zOiB7XG4gICAgICAgICAgICB0eXBlOiBOdW1iZXIsXG4gICAgICAgICAgICBkZWZhdWx0OiA0MDAsXG4gICAgICAgIH0sXG4gICAgICAgIHNob3dTZXBhcmV0ZToge1xuICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHNlcGFyZXRlTGluZUhlaWdodDoge1xuICAgICAgICAgICAgdHlwZTogTnVtYmVyLFxuICAgICAgICAgICAgZGVmYXVsdDogMTAsXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBkYXRhKCl7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjbGllbnRIZWlnaHQ6IDAsXG4gICAgICAgICAgICBoX3RvcDogMCxcbiAgICAgICAgICAgIGNsaWVudFlDYWNoZTogMCxcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGNvbXB1dGVkOiB7XG4gICAgICAgIGhfYm90dG9tKCk6IG51bWJlciB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zaG93U2VwYXJldGUgXG4gICAgICAgICAgICAgICAgPyB0aGlzLmNsaWVudEhlaWdodCAtIHRoaXMuaF90b3AgLSB0aGlzLnNlcGFyZXRlTGluZUhlaWdodFxuICAgICAgICAgICAgICAgIDogMDtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHdhdGNoOiB7XG4gICAgICAgIHNob3dTZXBhcmV0ZSgpIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgbW91bnRlZCgpIHtcbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgdGhpcy5yZXNpemVPYnNlcnZlciA9IG5ldyBSZXNpemVPYnNlcnZlcigoW2VudHJ5XSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBoZWlnaHQgfSA9IGVudHJ5LmNvbnRlbnRSZWN0O1xuICAgICAgICAgICAgY29uc3QgcCA9IHRoaXMuaF90b3AgLyB0aGlzLmNsaWVudEhlaWdodDtcbiAgICAgICAgICAgIGlmICh0aGlzLmNsaWVudEhlaWdodCAhPT0gaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGllbnRIZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgdGhpcy5oX3RvcCA9IHRoaXMuc2hvd1NlcGFyZXRlID8gTWF0aC5mbG9vcihoZWlnaHQgKiBwKSA6IGhlaWdodDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgdGhpcy5yZXNpemVPYnNlcnZlci5vYnNlcnZlKHRoaXMuJGVsKTtcbiAgICB9LFxuICAgIGJlZm9yZURlc3Ryb3koKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgdGhpcy5yZXNpemVPYnNlcnZlci5kaXNjb25uZWN0KCk7ICBcbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgaW5pdCgpIHtcbiAgICAgICAgICAgIHRoaXMuaF90b3AgPSB0aGlzLnNob3dTZXBhcmV0ZSBcbiAgICAgICAgICAgICAgICA/IE1hdGguZmxvb3IoTWF0aC5taW4odGhpcy5pbml0UG9zLCB0aGlzLmNsaWVudEhlaWdodCAqIDAuOCkpIFxuICAgICAgICAgICAgICAgIDogdGhpcy5jbGllbnRIZWlnaHQ7XG4gICAgICAgIH0sXG4gICAgICAgIG1vdXNlZG93bihlOiBNb3VzZUV2ZW50KSB7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgdGhpcy5jbGllbnRZQ2FjaGUgPSBlLmNsaWVudFk7XG4gICAgICAgIH0sXG4gICAgICAgIG1vdXNlbW92ZShlOiBNb3VzZUV2ZW50KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jbGllbnRZQ2FjaGUgPT09IDApIHJldHVybjtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gZS5jbGllbnRZIC0gdGhpcy5jbGllbnRZQ2FjaGU7XG4gICAgICAgICAgICB0aGlzLmhfdG9wICs9IHZhbHVlO1xuICAgICAgICAgICAgdGhpcy5jbGllbnRZQ2FjaGUgPSBlLmNsaWVudFk7XG4gICAgICAgICAgICB0aGlzLiRlbWl0KCdjaGFuZ2UnLCB7dG9wOiB0aGlzLmhfdG9wfSk7XG4gICAgICAgIH0sXG4gICAgICAgIG1vdXNldXAoKSB7XG4gICAgICAgICAgICB0aGlzLmNsaWVudFlDYWNoZSA9IDA7XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICByZW5kZXIoaCk6IFZOb2RlIHtcbiAgICAgICAgcmV0dXJuIGgoJ2RpdicsIHtcbiAgICAgICAgICAgIGNsYXNzOiAnc2VwYXJldGUtYm94JyxcbiAgICAgICAgICAgIG9uOiB7XG4gICAgICAgICAgICAgICAgbW91c2Vtb3ZlOiB0aGlzLm1vdXNlbW92ZSxcbiAgICAgICAgICAgICAgICBtb3VzZXVwOiB0aGlzLm1vdXNldXAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXR0cnM6IHtcbiAgICAgICAgICAgICAgICAnZGF0YS1oZWlnaHQnOiB0aGlzLmNsaWVudEhlaWdodCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sIFtcbiAgICAgICAgICAgIGgoJ2RpdicsIHtcbiAgICAgICAgICAgICAgICBzdHlsZTogeyBoZWlnaHQ6IHRoaXMuaF90b3AgKyAncHgnfSwgXG4gICAgICAgICAgICAgICAgYXR0cnM6IHsnZGF0YS1zbG90JzogJ3RvcCd9LFxuICAgICAgICAgICAgfSwgdGhpcy4kc2NvcGVkU2xvdHMudG9wPy4oe2hlaWdodDogdGhpcy5oX3RvcH0pKSxcblxuICAgICAgICAgICAgKHRoaXMuc2hvd1NlcGFyZXRlIFxuICAgICAgICAgICAgICAgID8gaCgnZGl2JywgeyBcbiAgICAgICAgICAgICAgICAgICAgY2xhc3M6ICdsaW5lJyxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogdGhpcy5zZXBhcmV0ZUxpbmVIZWlnaHQgKyAncHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgWyctLWhlaWdodCcgYXMgYW55XTogdGhpcy5zZXBhcmV0ZUxpbmVIZWlnaHQgKyAncHgnLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbW91c2Vkb3duOiB0aGlzLm1vdXNlZG93bixcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdXNldXA6IHRoaXMubW91c2V1cCxcbiAgICAgICAgICAgICAgICAgICAgfX0pIFxuICAgICAgICAgICAgICAgIDogbnVsbFxuICAgICAgICAgICAgKSxcblxuICAgICAgICAgICAgaCgnZGl2Jywge1xuICAgICAgICAgICAgICAgIHN0eWxlOiB7ZmxleDogMX0sXG4gICAgICAgICAgICAgICAgYXR0cnM6IHsnZGF0YS1zbG90JzogJ2JvdHRvbScsICdkYXRhLWhlaWdodCc6IHRoaXMuaF9ib3R0b20gKyAncHgnfSxcbiAgICAgICAgICAgIH0sIHRoaXMuJHNjb3BlZFNsb3RzLmJvdHRvbT8uKHtoZWlnaHQ6IHRoaXMuaF9ib3R0b219KSksXG4gICAgICAgIF0pO1xuICAgIH0sXG59KTsiXX0=