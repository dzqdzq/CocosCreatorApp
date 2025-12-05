"use strict";
// 原则上应该直接 import xx from 'vue'; 但是外围基本都是 from('vue/dist/vue.js') 这边只能保持一致
// 要不然会报错  $attrs is readonly & $listeners is readonly  https://github.com/vuejs/vue/issues/6698
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeparateBox = void 0;
// vue2 关于 ts 的写法指导： https://v2.cn.vuejs.org/v2/guide/typescript.html
const vue_js_1 = __importDefault(require("vue/dist/vue.js"));
exports.SeparateBox = vue_js_1.default.extend({
    name: 'SeparateBox',
    props: {
        initPos: {
            type: Number,
            default: 400,
        },
        showSeparate: {
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
            resizeObserver: null,
            clientHeight: 0,
            h_top: 0,
            clientYCache: 0,
        };
    },
    computed: {
        h_bottom() {
            return this.showSeparate
                ? this.clientHeight - this.h_top - this.separeteLineHeight
                : 0;
        },
    },
    watch: {
        showSeparate() {
            this.init();
        },
    },
    mounted() {
        this.init();
        this.resizeObserver = new ResizeObserver(([entry]) => {
            const { height } = entry.contentRect;
            const p = this.h_top / this.clientHeight;
            if (this.clientHeight !== height) {
                this.clientHeight = height;
                this.h_top = this.showSeparate ? Math.floor(height * p) : height;
            }
        });
        this.resizeObserver.observe(this.$el);
    },
    beforeDestroy() {
        this.resizeObserver && this.resizeObserver.disconnect();
    },
    methods: {
        init() {
            this.h_top = this.showSeparate
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
            class: 'separate-box',
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
            (this.showSeparate
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VwYXJhdGUtYm94LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2NvbXBvbmVudHMvc2VwYXJhdGUtYm94LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSwwRUFBMEU7QUFDMUUsZ0dBQWdHOzs7Ozs7QUFFaEcscUVBQXFFO0FBQ3JFLDZEQUEyQztBQUU5QixRQUFBLFdBQVcsR0FBRyxnQkFBRyxDQUFDLE1BQU0sQ0FBQztJQUNsQyxJQUFJLEVBQUUsYUFBYTtJQUNuQixLQUFLLEVBQUU7UUFDSCxPQUFPLEVBQUU7WUFDTCxJQUFJLEVBQUUsTUFBTTtZQUNaLE9BQU8sRUFBRSxHQUFHO1NBQ2Y7UUFDRCxZQUFZLEVBQUU7WUFDVixJQUFJLEVBQUUsT0FBTztZQUNiLE9BQU8sRUFBRSxJQUFJO1NBQ2hCO1FBQ0Qsa0JBQWtCLEVBQUU7WUFDaEIsSUFBSSxFQUFFLE1BQU07WUFDWixPQUFPLEVBQUUsRUFBRTtTQUNkO0tBQ0o7SUFDRCxJQUFJO1FBQ0EsT0FBTztZQUNILGNBQWMsRUFBRSxJQUFXO1lBQzNCLFlBQVksRUFBRSxDQUFDO1lBQ2YsS0FBSyxFQUFFLENBQUM7WUFDUixZQUFZLEVBQUUsQ0FBQztTQUNsQixDQUFDO0lBQ04sQ0FBQztJQUNELFFBQVEsRUFBRTtRQUNOLFFBQVE7WUFDSixPQUFPLElBQUksQ0FBQyxZQUFZO2dCQUNwQixDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxrQkFBa0I7Z0JBQzFELENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDWixDQUFDO0tBQ0o7SUFDRCxLQUFLLEVBQUU7UUFDSCxZQUFZO1lBQ1IsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2hCLENBQUM7S0FDSjtJQUNELE9BQU87UUFDSCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDWixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksY0FBYyxDQUFDLENBQUMs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LFVBQWlCLENBQUMsRUFBRSxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSTtxQkFDdEQ7b0JBQ0QsRUFBRSxFQUFFO3dCQUNBLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUzt3QkFDekIsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO3FCQUN4QjtpQkFBQyxDQUFDO2dCQUNQLENBQUMsQ0FBQyxJQUFJLENBQ1Q7WUFFRCxDQUFDLENBQUMsS0FBSyxFQUFFO2dCQUNMLEtBQUssRUFBRSxFQUFDLElBQUksRUFBRSxDQUFDLEVBQUM7Z0JBQ2hCLEtBQUssRUFBRSxFQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxFQUFDO2FBQ3RFLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFDLENBQUMsQ0FBQztTQUMxRCxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0osQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8g5Y6f5YiZ5LiK5bqU6K+l55u05o6lIGltcG9ydCB4eCBmcm9tICd2dWUnOyDkvYbmmK/lpJblm7Tln7rmnKzpg73mmK8gZnJvbSgndnVlL2Rpc3QvdnVlLmpzJykg6L+Z6L655Y+q6IO95L+d5oyB5LiA6Ie0XG4vLyDopoHkuI3nhLbkvJrmiqXplJkgICRhdHRycyBpcyByZWFkb25seSAmICRsaXN0ZW5lcnMgaXMgcmVhZG9ubHkgIGh0dHBzOi8vZ2l0aHViLmNvbS92dWVqcy92dWUvaXNzdWVzLzY2OThcblxuLy8gdnVlMiDlhbPkuo4gdHMg55qE5YaZ5rOV5oyH5a+877yaIGh0dHBzOi8vdjIuY24udnVlanMub3JnL3YyL2d1aWRlL3R5cGVzY3JpcHQuaHRtbFxuaW1wb3J0IFZ1ZSwge1ZOb2RlfSBmcm9tICd2dWUvZGlzdC92dWUuanMnOyBcblxuZXhwb3J0IGNvbnN0IFNlcGFyYXRlQm94ID0gVnVlLmV4dGVuZCh7XG4gICAgbmFtZTogJ1NlcGFyYXRlQm94JyxcbiAgICBwcm9wczoge1xuICAgICAgICBpbml0UG9zOiB7XG4gICAgICAgICAgICB0eXBlOiBOdW1iZXIsXG4gICAgICAgICAgICBkZWZhdWx0OiA0MDAsXG4gICAgICAgIH0sXG4gICAgICAgIHNob3dTZXBhcmF0ZToge1xuICAgICAgICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHNlcGFyZXRlTGluZUhlaWdodDoge1xuICAgICAgICAgICAgdHlwZTogTnVtYmVyLFxuICAgICAgICAgICAgZGVmYXVsdDogMTAsXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBkYXRhKCl7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNpemVPYnNlcnZlcjogbnVsbCBhcyBhbnksXG4gICAgICAgICAgICBjbGllbnRIZWlnaHQ6IDAsXG4gICAgICAgICAgICBoX3RvcDogMCxcbiAgICAgICAgICAgIGNsaWVudFlDYWNoZTogMCxcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGNvbXB1dGVkOiB7XG4gICAgICAgIGhfYm90dG9tKCk6IG51bWJlciB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zaG93U2VwYXJhdGUgXG4gICAgICAgICAgICAgICAgPyB0aGlzLmNsaWVudEhlaWdodCAtIHRoaXMuaF90b3AgLSB0aGlzLnNlcGFyZXRlTGluZUhlaWdodFxuICAgICAgICAgICAgICAgIDogMDtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHdhdGNoOiB7XG4gICAgICAgIHNob3dTZXBhcmF0ZSgpIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgbW91bnRlZCgpIHtcbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgICAgIHRoaXMucmVzaXplT2JzZXJ2ZXIgPSBuZXcgUmVzaXplT2JzZXJ2ZXIoKFtlbnRyeV0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHsgaGVpZ2h0IH0gPSBlbnRyeS5jb250ZW50UmVjdDtcbiAgICAgICAgICAgIGNvbnN0IHAgPSB0aGlzLmhfdG9wIC8gdGhpcy5jbGllbnRIZWlnaHQ7XG4gICAgICAgICAgICBpZiAodGhpcy5jbGllbnRIZWlnaHQgIT09IGhlaWdodCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xpZW50SGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgIHRoaXMuaF90b3AgPSB0aGlzLnNob3dTZXBhcmF0ZSA/IE1hdGguZmxvb3IoaGVpZ2h0ICogcCkgOiBoZWlnaHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnJlc2l6ZU9ic2VydmVyLm9ic2VydmUodGhpcy4kZWwpO1xuICAgIH0sXG4gICAgYmVmb3JlRGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy5yZXNpemVPYnNlcnZlciAmJiB0aGlzLnJlc2l6ZU9ic2VydmVyLmRpc2Nvbm5lY3QoKTsgIFxuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICBpbml0KCkge1xuICAgICAgICAgICAgdGhpcy5oX3RvcCA9IHRoaXMuc2hvd1NlcGFyYXRlIFxuICAgICAgICAgICAgICAgID8gTWF0aC5mbG9vcihNYXRoLm1pbih0aGlzLmluaXRQb3MsIHRoaXMuY2xpZW50SGVpZ2h0ICogMC44KSkgXG4gICAgICAgICAgICAgICAgOiB0aGlzLmNsaWVudEhlaWdodDtcbiAgICAgICAgfSxcbiAgICAgICAgbW91c2Vkb3duKGU6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB0aGlzLmNsaWVudFlDYWNoZSA9IGUuY2xpZW50WTtcbiAgICAgICAgfSxcbiAgICAgICAgbW91c2Vtb3ZlKGU6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNsaWVudFlDYWNoZSA9PT0gMCkgcmV0dXJuO1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBlLmNsaWVudFkgLSB0aGlzLmNsaWVudFlDYWNoZTtcbiAgICAgICAgICAgIHRoaXMuaF90b3AgKz0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLmNsaWVudFlDYWNoZSA9IGUuY2xpZW50WTtcbiAgICAgICAgICAgIHRoaXMuJGVtaXQoJ2NoYW5nZScsIHt0b3A6IHRoaXMuaF90b3B9KTtcbiAgICAgICAgfSxcbiAgICAgICAgbW91c2V1cCgpIHtcbiAgICAgICAgICAgIHRoaXMuY2xpZW50WUNhY2hlID0gMDtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHJlbmRlcihoKTogVk5vZGUge1xuICAgICAgICByZXR1cm4gaCgnZGl2Jywge1xuICAgICAgICAgICAgY2xhc3M6ICdzZXBhcmF0ZS1ib3gnLFxuICAgICAgICAgICAgb246IHtcbiAgICAgICAgICAgICAgICBtb3VzZW1vdmU6IHRoaXMubW91c2Vtb3ZlLFxuICAgICAgICAgICAgICAgIG1vdXNldXA6IHRoaXMubW91c2V1cCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhdHRyczoge1xuICAgICAgICAgICAgICAgICdkYXRhLWhlaWdodCc6IHRoaXMuY2xpZW50SGVpZ2h0LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSwgW1xuICAgICAgICAgICAgaCgnZGl2Jywge1xuICAgICAgICAgICAgICAgIHN0eWxlOiB7IGhlaWdodDogdGhpcy5oX3RvcCArICdweCd9LCBcbiAgICAgICAgICAgICAgICBhdHRyczogeydkYXRhLXNsb3QnOiAndG9wJ30sXG4gICAgICAgICAgICB9LCB0aGlzLiRzY29wZWRTbG90cy50b3A/Lih7aGVpZ2h0OiB0aGlzLmhfdG9wfSkpLFxuXG4gICAgICAgICAgICAodGhpcy5zaG93U2VwYXJhdGUgXG4gICAgICAgICAgICAgICAgPyBoKCdkaXYnLCB7IFxuICAgICAgICAgICAgICAgICAgICBjbGFzczogJ2xpbmUnLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLnNlcGFyZXRlTGluZUhlaWdodCArICdweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBbJy0taGVpZ2h0JyBhcyBhbnldOiB0aGlzLnNlcGFyZXRlTGluZUhlaWdodCArICdweCcsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIG9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtb3VzZWRvd246IHRoaXMubW91c2Vkb3duLFxuICAgICAgICAgICAgICAgICAgICAgICAgbW91c2V1cDogdGhpcy5tb3VzZXVwLFxuICAgICAgICAgICAgICAgICAgICB9fSkgXG4gICAgICAgICAgICAgICAgOiBudWxsXG4gICAgICAgICAgICApLFxuXG4gICAgICAgICAgICBoKCdkaXYnLCB7XG4gICAgICAgICAgICAgICAgc3R5bGU6IHtmbGV4OiAxfSxcbiAgICAgICAgICAgICAgICBhdHRyczogeydkYXRhLXNsb3QnOiAnYm90dG9tJywgJ2RhdGEtaGVpZ2h0JzogdGhpcy5oX2JvdHRvbSArICdweCd9LFxuICAgICAgICAgICAgfSwgdGhpcy4kc2NvcGVkU2xvdHMuYm90dG9tPy4oe2hlaWdodDogdGhpcy5oX2JvdHRvbX0pKSxcbiAgICAgICAgXSk7XG4gICAgfSxcbn0pOyJdfQ==