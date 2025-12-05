"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsEventTarget = exports.elementsContains = exports.getTargetFromEvent = exports.inShadowRoot = void 0;
function inShadowRoot(e) {
    const target = e.target;
    return e.composed && target.shadowRoot != null;
}
exports.inShadowRoot = inShadowRoot;
function getTargetFromEvent(e) {
    const target = e.target;
    // 在 shadow dom 内需要通过 composedPath 来获取实际的路径
    if (e.composed && target.shadowRoot) {
        return (e.composedPath?.()[0] ?? target);
    }
    return target;
}
exports.getTargetFromEvent = getTargetFromEvent;
function elementsContains(elements, target) {
    if (Array.isArray(elements)) {
        // 任意一个包含就行
        return elements.some((el) => {
            return el != null && el.contains(target);
        });
    }
    return elements != null && elements.contains(target);
}
exports.elementsContains = elementsContains;
/**
 * 测试 `event.target` 是否是 element 的子元素
 */
function containsEventTarget(element, event) {
    if (!inShadowRoot(event)) {
        return elementsContains(getTargetFromEvent(event), element);
    }
    const elements = event.composedPath();
    for (const el of elements) {
        if (!(el instanceof Element)) {
            continue;
        }
        if (elementsContains(element, el)) {
            return true;
        }
    }
    return false;
}
exports.containsEventTarget = containsEventTarget;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMtZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3B1YmxpYy91dGlscy1kb20udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsU0FBZ0IsWUFBWSxDQUFDLENBQVE7SUFDakMsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQXFCLENBQUM7SUFDdkMsT0FBTyxDQUFDLENBQUMsUUFBUSxJQUFJLE1BQU0sQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDO0FBQ25ELENBQUM7QUFIRCxvQ0FHQztBQUVELFNBQWdCLGtCQUFrQixDQUFDLENBQVE7SUFDdkMsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQXFCLENBQUM7SUFFdkMsMkNBQTJDO0lBQzNDLElBQUksQ0FBQyxDQUFDLFFBQVEsSUFBSSxNQUFNLENBQUMsVUFBVSxFQUFFO1FBQ2pDLE9BQU8sQ0FBQyxDQUFDLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxNQUFNLENBQWdCLENBQUM7S0FDM0Q7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNsQixDQUFDO0FBVEQsZ0RBU0M7QUFFRCxTQUFnQixnQkFBZ0IsQ0FBQyxRQUFtRCxFQUFFLE1BQWU7SUFDakcsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ3pCLFdBQVc7UUFDWCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRTtZQUN4QixPQUFPLEVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3QyxDQUFDLENBQUMsQ0FBQztLQUNOO0lBQ0QsT0FBTyxRQUFRLElBQUksSUFBSSxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDekQsQ0FBQztBQVJELDRDQVFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQixtQkFBbUIsQ0FBQyxPQUFnQixFQUFFLEtBQVk7SUFDOUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUN0QixPQUFPLGdCQUFnQixDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQy9EO0lBRUQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFlBQVksRUFBbUIsQ0FBQztJQUN2RCxLQUFLLE1BQU0sRUFBRSxJQUFJLFFBQVEsRUFBRTtRQUN2QixJQUFJLENBQUMsQ0FBQyxFQUFFLFlBQVksT0FBTyxDQUFDLEVBQUU7WUFDMUIsU0FBUztTQUNaO1FBQ0QsSUFBSSxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUU7WUFDL0IsT0FBTyxJQUFJLENBQUM7U0FDZjtLQUNKO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDakIsQ0FBQztBQWZELGtEQWVDIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IHR5cGUgQXJyYXlPclNpbmdsZTxUPiA9IFQgfCBUW107XG5cbmV4cG9ydCBmdW5jdGlvbiBpblNoYWRvd1Jvb3QoZTogRXZlbnQpIHtcbiAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICByZXR1cm4gZS5jb21wb3NlZCAmJiB0YXJnZXQuc2hhZG93Um9vdCAhPSBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGFyZ2V0RnJvbUV2ZW50KGU6IEV2ZW50KSB7XG4gICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG5cbiAgICAvLyDlnKggc2hhZG93IGRvbSDlhoXpnIDopoHpgJrov4cgY29tcG9zZWRQYXRoIOadpeiOt+WPluWunumZheeahOi3r+W+hFxuICAgIGlmIChlLmNvbXBvc2VkICYmIHRhcmdldC5zaGFkb3dSb290KSB7XG4gICAgICAgIHJldHVybiAoZS5jb21wb3NlZFBhdGg/LigpWzBdID8/IHRhcmdldCkgYXMgSFRNTEVsZW1lbnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhcmdldDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRzQ29udGFpbnMoZWxlbWVudHM6IEFycmF5T3JTaW5nbGU8RWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQ+LCB0YXJnZXQ6IEVsZW1lbnQpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShlbGVtZW50cykpIHtcbiAgICAgICAgLy8g5Lu75oSP5LiA5Liq5YyF5ZCr5bCx6KGMXG4gICAgICAgIHJldHVybiBlbGVtZW50cy5zb21lKChlbCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGVsICE9IG51bGwgJiYgZWwuY29udGFpbnModGFyZ2V0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBlbGVtZW50cyAhPSBudWxsICYmIGVsZW1lbnRzLmNvbnRhaW5zKHRhcmdldCk7XG59XG5cbi8qKlxuICog5rWL6K+VIGBldmVudC50YXJnZXRgIOaYr+WQpuaYryBlbGVtZW50IOeahOWtkOWFg+e0oFxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbnNFdmVudFRhcmdldChlbGVtZW50OiBFbGVtZW50LCBldmVudDogRXZlbnQpIHtcbiAgICBpZiAoIWluU2hhZG93Um9vdChldmVudCkpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnRzQ29udGFpbnMoZ2V0VGFyZ2V0RnJvbUV2ZW50KGV2ZW50KSwgZWxlbWVudCk7XG4gICAgfVxuXG4gICAgY29uc3QgZWxlbWVudHMgPSBldmVudC5jb21wb3NlZFBhdGgoKSBhcyBIVE1MRWxlbWVudFtdO1xuICAgIGZvciAoY29uc3QgZWwgb2YgZWxlbWVudHMpIHtcbiAgICAgICAgaWYgKCEoZWwgaW5zdGFuY2VvZiBFbGVtZW50KSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVsZW1lbnRzQ29udGFpbnMoZWxlbWVudCwgZWwpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG4iXX0=