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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zb3VyY2UvcGFuZWwvdm0vZGlyZWN0aXZlcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDRDQUF1RTtBQUV2RSwwQ0FBd0I7QUFFeEI7O0dBRUc7QUFDVSxRQUFBLFVBQVUsR0FBYztJQUNqQyxRQUFRLENBQUMsRUFBK0IsRUFBRSxPQUFPLEVBQUUsS0FBSztRQUNwRCxFQUFFLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7UUFDeEIsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2hCLENBQUM7SUFDRCxNQUFNLENBQUMsRUFBK0IsRUFBRSxPQUFPLEVBQUUsS0FBSztRQUNsRCxFQUFFLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7UUFDeEIsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2hCLENBQUM7Q0FDSixDQUFDO0FBRVcsUUFBQSxTQUFTLEdBQWM7SUFDaEMsUUFBUSxDQUFDLEVBQUU7UUFDUCxJQUFBLGlCQUFRLEVBQUMsR0FBRyxFQUFFO1lBQ1YsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUM7UUFDakIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0osQ0FBQztBQUVXLFFBQUEsT0FBTyxHQUFpRDtJQUNqRSxRQUFRLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLO1FBQ3ZCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRztZQUFFLE9BQU87UUFDekIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUNELE1BQU0sQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLEtBQUs7UUFDckIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHO1lBQUUsT0FBTztRQUN6QixPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNoRCxDQUFDO0NBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpcmVjdGl2ZSwgT2JqZWN0RGlyZWN0aXZlLCBuZXh0VGljayB9IGZyb20gJ3Z1ZS9kaXN0L3Z1ZS5qcyc7XG5cbmV4cG9ydCAqIGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIHVzZSB3aXRoIGVsZW1lbnQgYDx1aS1wcm9wPmAuIHNldCBgdWktcHJvcC5kdW1wYCBhbmQgdGhlbiBjYWxsIGB1aS1wcm9wLnJlbmRlcmBcbiAqL1xuZXhwb3J0IGNvbnN0IFVpUHJvcER1bXA6IERpcmVjdGl2ZSA9IHtcbiAgICBpbnNlcnRlZChlbDogRWRpdG9yLlVJLkhUTUxDdXN0b21FbGVtZW50LCBiaW5kaW5nLCB2bm9kZSkge1xuICAgICAgICBlbC5kdW1wID0gYmluZGluZy52YWx1ZTtcbiAgICAgICAgZWwucmVuZGVyKCk7XG4gICAgfSxcbiAgICB1cGRhdGUoZWw6IEVkaXRvci5VSS5IVE1MQ3VzdG9tRWxlbWVudCwgYmluZGluZywgdm5vZGUpIHtcbiAgICAgICAgZWwuZHVtcCA9IGJpbmRpbmcudmFsdWU7XG4gICAgICAgIGVsLnJlbmRlcigpO1xuICAgIH0sXG59O1xuXG5leHBvcnQgY29uc3QgQXV0b0ZvY3VzOiBEaXJlY3RpdmUgPSB7XG4gICAgaW5zZXJ0ZWQoZWwpIHtcbiAgICAgICAgbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgZWwuZm9jdXM/LigpO1xuICAgICAgICB9KTtcbiAgICB9LFxufTtcblxuZXhwb3J0IGNvbnN0IFByb3BTZXQ6IE9iamVjdERpcmVjdGl2ZTxFZGl0b3IuVUkuSFRNTEN1c3RvbUVsZW1lbnQ+ID0ge1xuICAgIGluc2VydGVkKGVsLCBiaW5kaW5nLCB2bm9kZSkge1xuICAgICAgICBpZiAoIWJpbmRpbmcuYXJnKSByZXR1cm47XG4gICAgICAgIFJlZmxlY3Quc2V0KGVsLCBiaW5kaW5nLmFyZywgYmluZGluZy52YWx1ZSk7XG4gICAgfSxcbiAgICB1cGRhdGUoZWwsIGJpbmRpbmcsIHZub2RlKSB7XG4gICAgICAgIGlmICghYmluZGluZy5hcmcpIHJldHVybjtcbiAgICAgICAgUmVmbGVjdC5zZXQoZWwsIGJpbmRpbmcuYXJnLCBiaW5kaW5nLnZhbHVlKTtcbiAgICB9LFxufTtcbiJdfQ==