'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.close = exports.ready = exports.listeners = exports.methods = exports.$ = exports.template = exports.style = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const home_1 = require("./components/home");
const Vue = require('vue/dist/vue.js');
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel = null;
let vm = null;
exports.style = (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../dist/preview.css'), 'utf8');
exports.template = '<div class="container"></div>';
exports.$ = {
    container: '.container',
};
exports.methods = {
    /**
     * 选中了某个物体
     * @param type 选中物体的类型
     * @param uuid 选中物体的 uuid
     */
    selected(type, uuid) {
        if (!vm || panel.hidden || type !== 'asset') {
            return;
        }
        vm.select(uuid);
    },
    /**
     * 取消选中了某个物体
     * @param type 选中物体的类型
     * @param uuid 选中物体的 uuid
     */
    unselected(type, uuid) {
        if (!vm || type !== 'asset') {
            return;
        }
        vm.unselect(uuid);
    },
    /**
     * 文件夹有变动
     * @param uuid 资源 资源
     */
    changed(uuid) {
        if (!vm || panel.hidden) {
            return;
        }
        if (vm.uuid === uuid) {
            // 当前刷新
            vm.select(uuid);
        }
    },
    /**
     * 刷新显示
     */
    refresh() {
        const uuids = Editor.Selection.getSelected('asset');
        if (uuids[0]) {
            vm && vm.select(uuids[0]);
        }
    },
};
exports.listeners = {
    show() {
        exports.methods.refresh();
    },
};
/**
 * 面板就绪
 */
async function ready() {
    // @ts-ignore
    panel = this;
    vm?.$destroy();
    vm = new home_1.AssetsPreviewHomeVM();
    vm.$mount(panel.$.container);
    exports.methods.refresh();
}
exports.ready = ready;
function close() {
    vm?.$destroy();
    vm = null;
    panel = null;
}
exports.close = close;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL3ByZXZpZXcvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYix1Q0FBd0M7QUFDeEMsK0JBQTRCO0FBQzVCLDRDQUF3RDtBQUd4RCxNQUFNLEdBQUcsR0FBbUIsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDdkQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO0FBQ2pDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztBQUU1QixJQUFJLEtBQUssR0FBUSxJQUFJLENBQUM7QUFDdEIsSUFBSSxFQUFFLEdBQVEsSUFBSSxDQUFDO0FBRU4sUUFBQSxLQUFLLEdBQUcsSUFBQSx1QkFBWSxFQUFDLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSwyQkFBMkIsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRTNFLFFBQUEsUUFBUSxHQUFHLCtCQUErQixDQUFDO0FBRTNDLFFBQUEsQ0FBQyxHQUFHO0lBQ2IsU0FBUyxFQUFFLFlBQVk7Q0FDMUIsQ0FBQztBQUVXLFFBQUEsT0FBTyxHQUFHO0lBQ25COzs7O09BSUc7SUFDSCxRQUFRLENBQUMsSUFBWSxFQUFFLElBQVk7UUFDL0IsSUFBSSxDQUFDLEVBQUUsSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLElBQUksS0FBSyxPQUFPLEVBQUU7WUFDekMsT0FBTztTQUNWO1FBRUQsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFVBQVUsQ0FBQyxJQUFZLEVBQUUsSUFBWTtRQUNqQyxJQUFJLENBQUMsRUFBRSxJQUFJLElBQUksS0FBSyxPQUFPLEVBQUU7WUFDekIsT0FBTztTQUNWO1FBRUQsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QixDQUFDO0lBQ0Q7OztPQUdHO0lBQ0gsT0FBTyxDQUFDLElBQVk7UUFDaEIsSUFBSSxDQUFDLEVBQUUsSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFO1lBQ3JCLE9BQU87U0FDVjtRQUVELElBQUksRUFBRSxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUU7WUFDbEIsT0FBTztZQUNQLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDbkI7SUFDTCxDQUFDO0lBQ0Q7O09BRUc7SUFDSCxPQUFPO1FBQ0gsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEQsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDVixFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUM3QjtJQUNMLENBQUM7Q0FDSixDQUFDO0FBRVcsUUFBQSxTQUFTLEdBQUc7SUFDckIsSUFBSTtRQUNBLGVBQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUN0QixDQUFDO0NBQ0osQ0FBQztBQUVGOztHQUVHO0FBQ0ksS0FBSyxVQUFVLEtBQUs7SUFDdkIsYUFBYTtJQUNiLEtBQUssR0FBRyxJQUFJLENBQUM7SUFFYixFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUM7SUFDZixFQUFFLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO0lBQy9CLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUU3QixlQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDdEIsQ0FBQztBQVRELHNCQVNDO0FBRUQsU0FBZ0IsS0FBSztJQUNqQixFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUM7SUFDZixFQUFFLEdBQUcsSUFBSSxDQUFDO0lBQ1YsS0FBSyxHQUFHLElBQUksQ0FBQztBQUNqQixDQUFDO0FBSkQsc0JBSUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IEFzc2V0c1ByZXZpZXdIb21lVk0gfSBmcm9tICcuL2NvbXBvbmVudHMvaG9tZSc7XG5cbmltcG9ydCB0eXBlIHsgVnVlQ29uc3RydWN0b3IgfSBmcm9tICd2dWUnO1xuY29uc3QgVnVlOiBWdWVDb25zdHJ1Y3RvciA9IHJlcXVpcmUoJ3Z1ZS9kaXN0L3Z1ZS5qcycpO1xuVnVlLmNvbmZpZy5wcm9kdWN0aW9uVGlwID0gZmFsc2U7XG5WdWUuY29uZmlnLmRldnRvb2xzID0gZmFsc2U7XG5cbmxldCBwYW5lbDogYW55ID0gbnVsbDtcbmxldCB2bTogYW55ID0gbnVsbDtcblxuZXhwb3J0IGNvbnN0IHN0eWxlID0gcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vZGlzdC9wcmV2aWV3LmNzcycpLCAndXRmOCcpO1xuXG5leHBvcnQgY29uc3QgdGVtcGxhdGUgPSAnPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiPjwvZGl2Pic7XG5cbmV4cG9ydCBjb25zdCAkID0ge1xuICAgIGNvbnRhaW5lcjogJy5jb250YWluZXInLFxufTtcblxuZXhwb3J0IGNvbnN0IG1ldGhvZHMgPSB7XG4gICAgLyoqXG4gICAgICog6YCJ5Lit5LqG5p+Q5Liq54mp5L2TXG4gICAgICogQHBhcmFtIHR5cGUg6YCJ5Lit54mp5L2T55qE57G75Z6LXG4gICAgICogQHBhcmFtIHV1aWQg6YCJ5Lit54mp5L2T55qEIHV1aWRcbiAgICAgKi9cbiAgICBzZWxlY3RlZCh0eXBlOiBzdHJpbmcsIHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAoIXZtIHx8IHBhbmVsLmhpZGRlbiB8fCB0eXBlICE9PSAnYXNzZXQnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2bS5zZWxlY3QodXVpZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOWPlua2iOmAieS4reS6huafkOS4queJqeS9k1xuICAgICAqIEBwYXJhbSB0eXBlIOmAieS4reeJqeS9k+eahOexu+Wei1xuICAgICAqIEBwYXJhbSB1dWlkIOmAieS4reeJqeS9k+eahCB1dWlkXG4gICAgICovXG4gICAgdW5zZWxlY3RlZCh0eXBlOiBzdHJpbmcsIHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAoIXZtIHx8IHR5cGUgIT09ICdhc3NldCcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZtLnVuc2VsZWN0KHV1aWQpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5paH5Lu25aS55pyJ5Y+Y5YqoXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQIOi1hOa6kFxuICAgICAqL1xuICAgIGNoYW5nZWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmICghdm0gfHwgcGFuZWwuaGlkZGVuKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodm0udXVpZCA9PT0gdXVpZCkge1xuICAgICAgICAgICAgLy8g5b2T5YmN5Yi35pawXG4gICAgICAgICAgICB2bS5zZWxlY3QodXVpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWIt+aWsOaYvuekulxuICAgICAqL1xuICAgIHJlZnJlc2goKSB7XG4gICAgICAgIGNvbnN0IHV1aWRzID0gRWRpdG9yLlNlbGVjdGlvbi5nZXRTZWxlY3RlZCgnYXNzZXQnKTtcbiAgICAgICAgaWYgKHV1aWRzWzBdKSB7XG4gICAgICAgICAgICB2bSAmJiB2bS5zZWxlY3QodXVpZHNbMF0pO1xuICAgICAgICB9XG4gICAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCBsaXN0ZW5lcnMgPSB7XG4gICAgc2hvdygpIHtcbiAgICAgICAgbWV0aG9kcy5yZWZyZXNoKCk7XG4gICAgfSxcbn07XG5cbi8qKlxuICog6Z2i5p2/5bCx57uqXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkeSgpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcGFuZWwgPSB0aGlzO1xuXG4gICAgdm0/LiRkZXN0cm95KCk7XG4gICAgdm0gPSBuZXcgQXNzZXRzUHJldmlld0hvbWVWTSgpO1xuICAgIHZtLiRtb3VudChwYW5lbC4kLmNvbnRhaW5lcik7XG5cbiAgICBtZXRob2RzLnJlZnJlc2goKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsb3NlKCkge1xuICAgIHZtPy4kZGVzdHJveSgpO1xuICAgIHZtID0gbnVsbDtcbiAgICBwYW5lbCA9IG51bGw7XG59Il19