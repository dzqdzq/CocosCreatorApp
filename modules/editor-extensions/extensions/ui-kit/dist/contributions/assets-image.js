'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.element = void 0;
class element extends HTMLElement {
    constructor() {
        super();
        this._value = null;
        // 缓存 db url 根路径 db://assets 的磁盘路径信息
        this.dbInfos = {};
        const shadow = this.attachShadow({ mode: 'open' });
        // @ts-ignore
        this.shadowRoot.innerHTML = `<style></style><div class="ui-assets-image-wrap">
                                        <ui-image class="image" hidden></ui-image>
                                        <ui-icon class="icon" hidden></ui-icon>
                                     </div>`;
        this.$uiImage = this.shadowRoot?.querySelector('ui-image');
        this.$uiIcon = this.shadowRoot?.querySelector('ui-icon');
    }
    get value() {
        return this._value;
    }
    set value(val) {
        this._value = val;
        if (val) {
            this.setAttribute('value', val);
        }
    }
    /**
     * 插入文档流
     */
    connectedCallback() { }
    /**
     * 移除文档流
     */
    disconnectedCallback() { }
    /**
     * @description 监听的 attribute 修改
     */
    static get observedAttributes() {
        return [
            'value',
        ];
    }
    /**
     * @description 属性监听
     * @param attr
     * @param oldValue
     * @param newValue
     **/
    attributeChangedCallback(attr, oldValue, newValue) {
        switch (attr) {
            case 'value':
                if (newValue) {
                    this.resolveValue(newValue);
                }
                break;
            default:
                break;
        }
    }
    /**
     * @description
     * @param value
     * */
    async resolveValue(value) {
        if (!value) {
            return '';
        }
        if (value.startsWith('db://')) {
            value = await Editor.Message.request('asset-db', 'query-uuid', value);
        }
        const rootUuid = value.split('@').shift();
        if (Editor.Utils.UUID.isUUID(rootUuid)) {
            const asset = await Editor.Message.request('asset-db', 'query-asset-info', value);
            if (!asset) {
                return '';
            }
            const showImage = ['image', 'texture', 'sprite-frame', 'gltf-mesh'];
            const isImage = showImage.includes(asset.importer);
            if (isImage) {
                this._showImage(value);
            }
            else {
                this._showIcon(value);
            }
        }
        else {
            this._showIcon(value);
        }
    }
    /**
     * @description 显示 icon
     **/
    _showIcon(value) {
        this.$uiIcon.setAttribute('value', value);
        this.$uiIcon.removeAttribute('hidden');
        this.$uiImage.setAttribute('hidden', '');
    }
    /**
     * @description 显示 image
     **/
    _showImage(value) {
        this.$uiImage.setAttribute('value', value);
        this.$uiImage.removeAttribute('hidden');
        this.$uiIcon.setAttribute('hidden', '');
    }
}
exports.element = element;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXRzLWltYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2NvbnRyaWJ1dGlvbnMvYXNzZXRzLWltYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7O0FBQ2IsTUFBYSxPQUFRLFNBQVEsV0FBVztJQVFwQztRQUNJLEtBQUssRUFBRSxDQUFDO1FBUEosV0FBTSxHQUFrQixJQUFJLENBQUM7UUFDckMsb0NBQW9DO1FBQzVCLFlBQU8sR0FBRyxFQUFFLENBQUM7UUFNakIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFDO1FBQ2pELGFBQWE7UUFDYixJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsR0FBRzs7OzRDQUdRLENBQUM7UUFFckMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMzRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFFRCxJQUFJLEtBQUs7UUFDTCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDdkIsQ0FBQztJQUVELElBQUksS0FBSyxDQUFDLEdBQUc7UUFDVCxJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQztRQUNsQixJQUFJLEdBQUcsRUFBRTtZQUNMLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ25DO0lBQ0wsQ0FBQztJQUVEOztPQUVHO0lBQ0gsaUJBQWlCLEtBQUksQ0FBQztJQUV0Qjs7T0FFRztJQUNILG9CQUFvQixLQUFJLENBQUM7SUFFekI7O09BRUc7SUFDSCxNQUFNLEtBQUssa0JBQWtCO1FBQ3pCLE9BQU87WUFDSCxPQUFPO1NBQ1YsQ0FBQztJQUNOLENBQUM7SUFFRDs7Ozs7UUFLSTtJQUNKLHdCQUF3QixDQUFDLElBQVksRUFBRSxRQUFnQixFQUFFLFFBQWdCO1FBQ3JFLFFBQVEsSUFBSSxFQUFFO1lBQ1YsS0FBSyxPQUFPO2dCQUNSLElBQUksUUFBUSxFQUFFO29CQUNWLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7aUJBQy9CO2dCQUNELE1BQU07WUFDVjtnQkFDSSxNQUFNO1NBQ2I7SUFDTCxDQUFDO0lBRUQ7OztTQUdLO0lBQ0wsS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFVO1FBQ3pCLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDUixPQUFPLEVBQUUsQ0FBQztTQUNiO1FBRUQsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQzNCLEtBQUssR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDekU7UUFFRCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzFDLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ3BDLE1BQU0sS0FBSyxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xGLElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQ1IsT0FBTyxFQUFFLENBQUM7YUFDYjtZQUNELE1BQU0sU0FBUyxHQUFHLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDcEUsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbkQsSUFBSSxPQUFPLEVBQUU7Z0JBQ1QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUMxQjtpQkFBTTtnQkFDSCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3pCO1NBQ0o7YUFBTTtZQUNILElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDekI7SUFDTCxDQUFDO0lBRUQ7O1FBRUk7SUFDSixTQUFTLENBQUMsS0FBYTtRQUNuQixJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRDs7UUFFSTtJQUNKLFVBQVUsQ0FBQyxLQUFhO1FBQ3BCLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzQyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN4QyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDNUMsQ0FBQztDQUNKO0FBckhELDBCQXFIQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbmV4cG9ydCBjbGFzcyBlbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuXG4gICAgcHJpdmF0ZSBfdmFsdWU6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICAgIC8vIOe8k+WtmCBkYiB1cmwg5qC56Lev5b6EIGRiOi8vYXNzZXRzIOeahOejgeebmOi3r+W+hOS/oeaBr1xuICAgIHByaXZhdGUgZGJJbmZvcyA9IHt9O1xuICAgIHByaXZhdGUgJHVpSW1hZ2U6IGFueTtcbiAgICBwcml2YXRlICR1aUljb246IGFueTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICBjb25zdCBzaGFkb3cgPSB0aGlzLmF0dGFjaFNoYWRvdyh7bW9kZTogJ29wZW4nfSk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgdGhpcy5zaGFkb3dSb290LmlubmVySFRNTCA9IGA8c3R5bGU+PC9zdHlsZT48ZGl2IGNsYXNzPVwidWktYXNzZXRzLWltYWdlLXdyYXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktaW1hZ2UgY2xhc3M9XCJpbWFnZVwiIGhpZGRlbj48L3VpLWltYWdlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1pY29uIGNsYXNzPVwiaWNvblwiIGhpZGRlbj48L3VpLWljb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+YDtcblxuICAgICAgICB0aGlzLiR1aUltYWdlID0gdGhpcy5zaGFkb3dSb290Py5xdWVyeVNlbGVjdG9yKCd1aS1pbWFnZScpO1xuICAgICAgICB0aGlzLiR1aUljb24gPSB0aGlzLnNoYWRvd1Jvb3Q/LnF1ZXJ5U2VsZWN0b3IoJ3VpLWljb24nKTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICB9XG5cbiAgICBzZXQgdmFsdWUodmFsKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsO1xuICAgICAgICBpZiAodmFsKSB7XG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZSgndmFsdWUnLCB2YWwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5o+S5YWl5paH5qGj5rWBXG4gICAgICovXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7fVxuXG4gICAgLyoqXG4gICAgICog56e76Zmk5paH5qGj5rWBXG4gICAgICovXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7fVxuXG4gICAgLyoqXG4gICAgICogQGRlc2NyaXB0aW9uIOebkeWQrOeahCBhdHRyaWJ1dGUg5L+u5pS5XG4gICAgICovXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKTogc3RyaW5nW10ge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgJ3ZhbHVlJyxcbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzY3JpcHRpb24g5bGe5oCn55uR5ZCsXG4gICAgICogQHBhcmFtIGF0dHJcbiAgICAgKiBAcGFyYW0gb2xkVmFsdWVcbiAgICAgKiBAcGFyYW0gbmV3VmFsdWVcbiAgICAgKiovXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKGF0dHI6IHN0cmluZywgb2xkVmFsdWU6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBzd2l0Y2ggKGF0dHIpIHtcbiAgICAgICAgICAgIGNhc2UgJ3ZhbHVlJzpcbiAgICAgICAgICAgICAgICBpZiAobmV3VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNvbHZlVmFsdWUobmV3VmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgKiBAcGFyYW0gdmFsdWVcbiAgICAgKiAqL1xuICAgIGFzeW5jIHJlc29sdmVWYWx1ZSh2YWx1ZTogYW55KSB7XG4gICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZS5zdGFydHNXaXRoKCdkYjovLycpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXV1aWQnLCB2YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByb290VXVpZCA9IHZhbHVlLnNwbGl0KCdAJykuc2hpZnQoKTtcbiAgICAgICAgaWYgKEVkaXRvci5VdGlscy5VVUlELmlzVVVJRChyb290VXVpZCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIHZhbHVlKTtcbiAgICAgICAgICAgIGlmICghYXNzZXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBzaG93SW1hZ2UgPSBbJ2ltYWdlJywgJ3RleHR1cmUnLCAnc3ByaXRlLWZyYW1lJywgJ2dsdGYtbWVzaCddO1xuICAgICAgICAgICAgY29uc3QgaXNJbWFnZSA9IHNob3dJbWFnZS5pbmNsdWRlcyhhc3NldC5pbXBvcnRlcik7XG4gICAgICAgICAgICBpZiAoaXNJbWFnZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Nob3dJbWFnZSh2YWx1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Nob3dJY29uKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3Nob3dJY29uKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBkZXNjcmlwdGlvbiDmmL7npLogaWNvblxuICAgICAqKi9cbiAgICBfc2hvd0ljb24odmFsdWU6IHN0cmluZykge1xuICAgICAgICB0aGlzLiR1aUljb24uc2V0QXR0cmlidXRlKCd2YWx1ZScsIHZhbHVlKTtcbiAgICAgICAgdGhpcy4kdWlJY29uLnJlbW92ZUF0dHJpYnV0ZSgnaGlkZGVuJyk7XG4gICAgICAgIHRoaXMuJHVpSW1hZ2Uuc2V0QXR0cmlidXRlKCdoaWRkZW4nLCAnJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGRlc2NyaXB0aW9uIOaYvuekuiBpbWFnZVxuICAgICAqKi9cbiAgICBfc2hvd0ltYWdlKHZhbHVlOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy4kdWlJbWFnZS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdmFsdWUpO1xuICAgICAgICB0aGlzLiR1aUltYWdlLnJlbW92ZUF0dHJpYnV0ZSgnaGlkZGVuJyk7XG4gICAgICAgIHRoaXMuJHVpSWNvbi5zZXRBdHRyaWJ1dGUoJ2hpZGRlbicsICcnKTtcbiAgICB9XG59XG4iXX0=