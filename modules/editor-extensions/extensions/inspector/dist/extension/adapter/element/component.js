'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementInspectorComponent = void 0;
const element_1 = require("../../element");
/**
 * 负责 XML 渲染解析的对象
 * 负责桥接用户代码和实际解析方法
 * 主要功能是 decode 函数
 *
 */
class ElementInspectorComponent {
    render(comp) {
        return [this.createElement('label', { value: '' }, {})];
    }
    createElement(type, attrs, events, children) {
        const elem = new element_1.VirtualElement(type);
        elem.attrs = JSON.parse(JSON.stringify(attrs));
        for (const name in events) {
            elem.addEventListener(name, events[name]);
        }
        children?.forEach(child => elem.appendChild(child));
        return elem;
    }
    decode(comp, elem) {
        // 获取组件绑定的 virtual element 对象
        const virtual = new element_1.VirtualElement('inspector-root');
        // 拿到 “数据” 对象
        const children = this.render(comp);
        children.forEach(child => virtual.appendChild(child));
        // let result = weakMap.get(comp);
        if (elem) {
            elem.apply(virtual);
        }
        else {
            elem = virtual;
        }
        // weakMap.set(comp, result);
        return elem;
    }
}
exports.ElementInspectorComponent = ElementInspectorComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc291cmNlL2V4dGVuc2lvbi9hZGFwdGVyL2VsZW1lbnQvY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7O0FBSWIsMkNBQStDO0FBRS9DOzs7OztHQUtHO0FBQ0gsTUFBYSx5QkFBeUI7SUFFbEMsTUFBTSxDQUFDLElBQWU7UUFDbEIsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUVELGFBQWEsQ0FBQyxJQUFZLEVBQUUsS0FBOEIsRUFBRSxNQUFpRCxFQUFFLFFBQTJCO1FBQ3RJLE1BQU0sSUFBSSxHQUFHLElBQUksd0JBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQy9DLEtBQUssTUFBTSxJQUFJLElBQUksTUFBTSxFQUFFO1lBQ3ZCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDN0M7UUFDRCxRQUFRLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3BELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxNQUFNLENBQUMsSUFBZSxFQUFFLElBQXFCO1FBRXpDLDZCQUE2QjtRQUM3QixNQUFNLE9BQU8sR0FBRyxJQUFJLHdCQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUVyRCxhQUFhO1FBQ2IsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuQyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRXRELGtDQUFrQztRQUNsQyxJQUFJLElBQUksRUFBRTtZQUNOLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDdkI7YUFBTTtZQUNILElBQUksR0FBRyxPQUFPLENBQUM7U0FDbEI7UUFDRCw2QkFBNkI7UUFFN0IsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztDQUNKO0FBbkNELDhEQW1DQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHR5cGUgeyBJSW5zcGVjdG9yQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vc2NlbmUvYmFzZSc7XG5pbXBvcnQgdHlwZSB7IENvbXBvbmVudCB9IGZyb20gJ2NjJztcbmltcG9ydCB7IFZpcnR1YWxFbGVtZW50IH0gZnJvbSAnLi4vLi4vZWxlbWVudCc7XG5cbi8qKlxuICog6LSf6LSjIFhNTCDmuLLmn5Pop6PmnpDnmoTlr7nosaFcbiAqIOi0n+i0o+ahpeaOpeeUqOaIt+S7o+eggeWSjOWunumZheino+aekOaWueazlVxuICog5Li76KaB5Yqf6IO95pivIGRlY29kZSDlh73mlbBcbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBFbGVtZW50SW5zcGVjdG9yQ29tcG9uZW50IGltcGxlbWVudHMgSUluc3BlY3RvckNvbXBvbmVudCB7XG5cbiAgICByZW5kZXIoY29tcDogQ29tcG9uZW50KTogVmlydHVhbEVsZW1lbnRbXSB7XG4gICAgICAgIHJldHVybiBbdGhpcy5jcmVhdGVFbGVtZW50KCdsYWJlbCcsIHsgdmFsdWU6ICcnIH0sIHt9KV07XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCh0eXBlOiBzdHJpbmcsIGF0dHJzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSwgZXZlbnRzOiB7W2tleTogc3RyaW5nXTogKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnkgfSwgY2hpbGRyZW4/OiBWaXJ0dWFsRWxlbWVudFtdKTogVmlydHVhbEVsZW1lbnQge1xuICAgICAgICBjb25zdCBlbGVtID0gbmV3IFZpcnR1YWxFbGVtZW50KHR5cGUpO1xuICAgICAgICBlbGVtLmF0dHJzID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShhdHRycykpO1xuICAgICAgICBmb3IgKGNvbnN0IG5hbWUgaW4gZXZlbnRzKSB7XG4gICAgICAgICAgICBlbGVtLmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgZXZlbnRzW25hbWVdKTtcbiAgICAgICAgfVxuICAgICAgICBjaGlsZHJlbj8uZm9yRWFjaChjaGlsZCA9PiBlbGVtLmFwcGVuZENoaWxkKGNoaWxkKSk7XG4gICAgICAgIHJldHVybiBlbGVtO1xuICAgIH1cblxuICAgIGRlY29kZShjb21wOiBDb21wb25lbnQsIGVsZW0/OiBWaXJ0dWFsRWxlbWVudCk6IFZpcnR1YWxFbGVtZW50IHtcblxuICAgICAgICAvLyDojrflj5bnu4Tku7bnu5HlrprnmoQgdmlydHVhbCBlbGVtZW50IOWvueixoVxuICAgICAgICBjb25zdCB2aXJ0dWFsID0gbmV3IFZpcnR1YWxFbGVtZW50KCdpbnNwZWN0b3Itcm9vdCcpO1xuXG4gICAgICAgIC8vIOaLv+WIsCDigJzmlbDmja7igJ0g5a+56LGhXG4gICAgICAgIGNvbnN0IGNoaWxkcmVuID0gdGhpcy5yZW5kZXIoY29tcCk7XG4gICAgICAgIGNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4gdmlydHVhbC5hcHBlbmRDaGlsZChjaGlsZCkpO1xuXG4gICAgICAgIC8vIGxldCByZXN1bHQgPSB3ZWFrTWFwLmdldChjb21wKTtcbiAgICAgICAgaWYgKGVsZW0pIHtcbiAgICAgICAgICAgIGVsZW0uYXBwbHkodmlydHVhbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGVtID0gdmlydHVhbDtcbiAgICAgICAgfVxuICAgICAgICAvLyB3ZWFrTWFwLnNldChjb21wLCByZXN1bHQpO1xuXG4gICAgICAgIHJldHVybiBlbGVtO1xuICAgIH1cbn0iXX0=