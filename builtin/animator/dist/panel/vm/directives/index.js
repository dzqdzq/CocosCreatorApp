"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropSet = exports.AutoFocus = exports.UiPropDump = void 0;
const vue_js_1 = require("vue/dist/vue.js");
__exportStar(require("./utils"), exports);
/**
 * use with element `<ui-prop>`. set `ui-prop.dump` and then call `ui-prop.render`
 */
exports.UiPropDump = {
    inserted(el, binding, vnode) {
        el.dump = binding.value;
        el.render();
    },
    update(el, binding, vnode) {
        el.dump = binding.value;
        el.render();
    },
};
exports.AutoFocus = {
    inserted(el) {
        (0, vue_js_1.nextTick)(() => {
            el.focus?.();
        });
    },
};
exports.PropSet = {
    inserted(el, binding, vnode) {
        if (!binding.arg)
            return;
        Reflect.set(el, binding.arg, binding.value);
    },
    update(el, binding, vnode) {
        if (!binding.arg)
            return;
        Reflect.set(el, binding.arg, binding.value);
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zb3VyY2UvcGFuZWwvdm0vZGlyZWN0aXZlcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDRDQUF1RTtBQUd2RSwwQ0FBd0I7QUFFeEI7O0dBRUc7QUFDVSxRQUFBLFVBQVUsR0FBYztJQUNqQyxRQUFRLENBQUMsRUFBcUIsRUFBRSxPQUFPLEVBQUUsS0FBSztRQUMxQyxFQUFFLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7UUFDeEIsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2hCLENBQUM7SUFDRCxNQUFNLENBQUMsRUFBcUIsRUFBRSxPQUFPLEVBQUUsS0FBSztRQUN4QyxFQUFFLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7UUFDeEIsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2hCLENBQUM7Q0FDSixDQUFDO0FBRVcsUUFBQSxTQUFTLEdBQWM7SUFDaEMsUUFBUSxDQUFDLEVBQUU7UUFDUCxJQUFBLGlCQUFRLEVBQUMsR0FBRyxFQUFFO1lBQ1YsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUM7UUFDakIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0osQ0FBQztBQUVXLFFBQUEsT0FBTyxHQUF1QztJQUN2RCxRQUFRLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLO1FBQ3ZCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRztZQUFFLE9BQU87UUFDekIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUNELE1BQU0sQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLEtBQUs7UUFDckIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHO1lBQUUsT0FBTztRQUN6QixPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNoRCxDQUFDO0NBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpcmVjdGl2ZSwgT2JqZWN0RGlyZWN0aXZlLCBuZXh0VGljayB9IGZyb20gJ3Z1ZS9kaXN0L3Z1ZS5qcyc7XG5pbXBvcnQgeyBIVE1MQ3VzdG9tRWxlbWVudCB9IGZyb20gJy4uLy4uLy4uLy4uL0B0eXBlcy9wcml2YXRlJztcblxuZXhwb3J0ICogZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogdXNlIHdpdGggZWxlbWVudCBgPHVpLXByb3A+YC4gc2V0IGB1aS1wcm9wLmR1bXBgIGFuZCB0aGVuIGNhbGwgYHVpLXByb3AucmVuZGVyYFxuICovXG5leHBvcnQgY29uc3QgVWlQcm9wRHVtcDogRGlyZWN0aXZlID0ge1xuICAgIGluc2VydGVkKGVsOiBIVE1MQ3VzdG9tRWxlbWVudCwgYmluZGluZywgdm5vZGUpIHtcbiAgICAgICAgZWwuZHVtcCA9IGJpbmRpbmcudmFsdWU7XG4gICAgICAgIGVsLnJlbmRlcigpO1xuICAgIH0sXG4gICAgdXBkYXRlKGVsOiBIVE1MQ3VzdG9tRWxlbWVudCwgYmluZGluZywgdm5vZGUpIHtcbiAgICAgICAgZWwuZHVtcCA9IGJpbmRpbmcudmFsdWU7XG4gICAgICAgIGVsLnJlbmRlcigpO1xuICAgIH0sXG59O1xuXG5leHBvcnQgY29uc3QgQXV0b0ZvY3VzOiBEaXJlY3RpdmUgPSB7XG4gICAgaW5zZXJ0ZWQoZWwpIHtcbiAgICAgICAgbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgZWwuZm9jdXM/LigpO1xuICAgICAgICB9KTtcbiAgICB9LFxufTtcblxuZXhwb3J0IGNvbnN0IFByb3BTZXQ6IE9iamVjdERpcmVjdGl2ZTxIVE1MQ3VzdG9tRWxlbWVudD4gPSB7XG4gICAgaW5zZXJ0ZWQoZWwsIGJpbmRpbmcsIHZub2RlKSB7XG4gICAgICAgIGlmICghYmluZGluZy5hcmcpIHJldHVybjtcbiAgICAgICAgUmVmbGVjdC5zZXQoZWwsIGJpbmRpbmcuYXJnLCBiaW5kaW5nLnZhbHVlKTtcbiAgICB9LFxuICAgIHVwZGF0ZShlbCwgYmluZGluZywgdm5vZGUpIHtcbiAgICAgICAgaWYgKCFiaW5kaW5nLmFyZykgcmV0dXJuO1xuICAgICAgICBSZWZsZWN0LnNldChlbCwgYmluZGluZy5hcmcsIGJpbmRpbmcudmFsdWUpO1xuICAgIH0sXG59O1xuIl19