'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.close = exports.beforeClose = exports.ready = exports.listeners = exports.methods = exports.$ = exports.fonts = exports.template = exports.style = void 0;
const electron_1 = require("electron");
const fs_1 = require("fs");
const path_1 = require("path");
const Vue = require('vue/dist/vue.js');
Vue.config.productionTip = false;
Vue.config.devtools = false;
const manager = require('./manager');
let panel = null;
let vm = null;
let updateAnimationId = null;
exports.style = fs_1.readFileSync(path_1.join(__dirname, '../dist/index.css'), 'utf8');
exports.template = fs_1.readFileSync(path_1.join(__dirname, '../static', '/template/index.html'), 'utf8');
exports.fonts = [
    {
        name: 'console',
    },
];
exports.$ = {
    'console-panel': '.console-panel',
};
exports.methods = {
    /**
     * 刷新显示面板
     * 查询对应选中的对象的信息
     */
    record(log) {
        manager.addItem(log);
        manager.update();
    },
    async refresh(type) {
        if (type) {
            await Editor.Profile.setConfig('console', 'panel.filterType', type);
        }
        await vm?.refresh?.();
    },
};
exports.listeners = {
    /**
     * 窗口缩放时调用更新
     */
    resize() {
        manager?.update?.();
    },
    /**
     * 窗口显示时调用更新
     */
    show() {
        manager.update();
    },
};
async function ready(type) {
    // @ts-ignore
    panel = this;
    if (type) {
        await Editor.Profile.setConfig('console', 'panel.filterType', type);
    }
    const config = await Editor.Profile.getConfig('console', 'panel');
    const size = config.fontSize - 0 || 12;
    vm = new Vue({
        el: panel.$['console-panel'],
        components: {
            'console-list': require('./components/list'),
        },
        data: {
            tabbar: {
                displayDate: config.displayDate,
                fontSize: size,
                lineHeight: size * 2,
                filterType: 'all',
                filterRegex: false,
            },
        },
        mounted() {
            this.init();
        },
        methods: {
            async onHeaderChange(type, event) {
                // @ts-ignore
                const value = event?.target?.value ?? '';
                switch (type) {
                    case 'clear':
                        Editor.Logger.clear();
                        manager.clear();
                        break;
                    case 'filterRegex':
                        manager.setFilterRegex(value);
                        break;
                    case 'filterText':
                        manager.setFilterText(value);
                        break;
                    case 'filterType':
                        manager.setFilterType(value);
                        await Editor.Profile.setConfig('console', 'panel.filterType', value);
                        break;
                    case 'openLog':
                        electron_1.shell.openPath(path_1.join(Editor.Project.path, './local/logs/project.log'));
                        break;
                }
            },
            update() {
                window.cancelAnimationFrame(updateAnimationId);
                updateAnimationId = window.requestAnimationFrame(() => {
                    this.$refs.list?.renderList();
                });
            },
            /**
             * 翻译
             * @param key
             */
            t(key) {
                const name = `console.${key}`;
                return Editor.I18n.t(name);
            },
            async init() {
                /**
                 * refresh 需要放在以下两个之前，
                 * 因为 record 也会有输出，
                 * 如果 refresh 放后面会导致初始数据输出两次
                 */
                await this.refresh();
                manager.setUpdateFn(this.update.bind(this));
                Editor.Logger.on('record', exports.methods.record);
                Editor.Logger.on('clear', exports.methods.refresh);
            },
            async refresh() {
                // 获取数据
                const list = await Editor.Logger.query();
                const config = await Editor.Profile.getConfig('console', 'panel');
                this.tabbar.displayDate = config.displayDate;
                this.tabbar.filterType = config.filterType || 'all';
                this.tabbar.fontSize = Number(config.fontSize);
                this.tabbar.lineHeight = this.tabbar.fontSize * 2;
                manager.reset(list);
                manager.setFilterType(this.tabbar.filterType);
                manager.showDate(this.tabbar.displayDate);
                manager.setLineHeight(this.tabbar.lineHeight);
            },
        },
    });
}
exports.ready = ready;
async function beforeClose() { }
exports.beforeClose = beforeClose;
async function close() {
    // 取消之前监听的日志处理事件
    manager.setUpdateFn(null);
    Editor.Logger.removeListener('record', exports.methods.record);
    Editor.Logger.removeListener('clear', exports.methods.refresh);
}
exports.close = close;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvcGFuZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYix1Q0FBaUM7QUFDakMsMkJBQWtDO0FBQ2xDLCtCQUE0QjtBQUc1QixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUN2QyxHQUFHLENBQUMsTUFBTSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7QUFDakMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBRTVCLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUVyQyxJQUFJLEtBQUssR0FBUSxJQUFJLENBQUM7QUFDdEIsSUFBSSxFQUFFLEdBQVEsSUFBSSxDQUFDO0FBQ25CLElBQUksaUJBQWlCLEdBQVEsSUFBSSxDQUFDO0FBRXJCLFFBQUEsS0FBSyxHQUFHLGlCQUFZLENBQUMsV0FBSSxDQUFDLFNBQVMsRUFBRSxtQkFBbUIsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRW5FLFFBQUEsUUFBUSxHQUFHLGlCQUFZLENBQUMsV0FBSSxDQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsc0JBQXNCLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUV0RixRQUFBLEtBQUssR0FBRztJQUNqQjtRQUNJLElBQUksRUFBRSxTQUFTO0tBQ2xCO0NBQ0osQ0FBQztBQUVXLFFBQUEsQ0FBQyxHQUFHO0lBQ2IsZUFBZSxFQUFFLGdCQUFnQjtDQUNwQyxDQUFDO0FBRVcsUUFBQSxPQUFPLEdBQUc7SUFDbkI7OztPQUdHO0lBQ0gsTUFBTSxDQUFDLEdBQVc7UUFDZCxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JCLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNyQixDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFjO1FB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SUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO2dCQUVsRCxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNwQixPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQzlDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDMUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2xELENBQUM7U0FDSjtLQUNKLENBQUMsQ0FBQztBQUNQLENBQUM7QUF4R0Qsc0JBd0dDO0FBRU0sS0FBSyxVQUFVLFdBQVcsS0FBSyxDQUFDO0FBQXZDLGtDQUF1QztBQUVoQyxLQUFLLFVBQVUsS0FBSztJQUN2QixnQkFBZ0I7SUFDaEIsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxQixNQUFNLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsZUFBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3ZELE1BQU0sQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxlQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQUxELHNCQUtDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBzaGVsbCB9IGZyb20gJ2VsZWN0cm9uJztcbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGxvZ1R5cGUgfSBmcm9tICcuLi9AdHlwZXMvcHJpdGF0ZSc7XG5cbmNvbnN0IFZ1ZSA9IHJlcXVpcmUoJ3Z1ZS9kaXN0L3Z1ZS5qcycpO1xuVnVlLmNvbmZpZy5wcm9kdWN0aW9uVGlwID0gZmFsc2U7XG5WdWUuY29uZmlnLmRldnRvb2xzID0gZmFsc2U7XG5cbmNvbnN0IG1hbmFnZXIgPSByZXF1aXJlKCcuL21hbmFnZXInKTtcblxubGV0IHBhbmVsOiBhbnkgPSBudWxsO1xubGV0IHZtOiBhbnkgPSBudWxsO1xubGV0IHVwZGF0ZUFuaW1hdGlvbklkOiBhbnkgPSBudWxsO1xuXG5leHBvcnQgY29uc3Qgc3R5bGUgPSByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi9kaXN0L2luZGV4LmNzcycpLCAndXRmOCcpO1xuXG5leHBvcnQgY29uc3QgdGVtcGxhdGUgPSByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi9zdGF0aWMnLCAnL3RlbXBsYXRlL2luZGV4Lmh0bWwnKSwgJ3V0ZjgnKTtcblxuZXhwb3J0IGNvbnN0IGZvbnRzID0gW1xuICAgIHtcbiAgICAgICAgbmFtZTogJ2NvbnNvbGUnLFxuICAgIH0sXG5dO1xuXG5leHBvcnQgY29uc3QgJCA9IHtcbiAgICAnY29uc29sZS1wYW5lbCc6ICcuY29uc29sZS1wYW5lbCcsXG59O1xuXG5leHBvcnQgY29uc3QgbWV0aG9kcyA9IHtcbiAgICAvKipcbiAgICAgKiDliLfmlrDmmL7npLrpnaLmnb9cbiAgICAgKiDmn6Xor6Llr7nlupTpgInkuK3nmoTlr7nosaHnmoTkv6Hmga9cbiAgICAgKi9cbiAgICByZWNvcmQobG9nOiBzdHJpbmcpIHtcbiAgICAgICAgbWFuYWdlci5hZGRJdGVtKGxvZyk7XG4gICAgICAgIG1hbmFnZXIudXBkYXRlKCk7XG4gICAgfSxcblxuICAgIGFzeW5jIHJlZnJlc2godHlwZT86IGxvZ1R5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUpIHtcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5Qcm9maWxlLnNldENvbmZpZygnY29uc29sZScsICdwYW5lbC5maWx0ZXJUeXBlJywgdHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdm0/LnJlZnJlc2g/LigpO1xuICAgIH0sXG59O1xuXG5leHBvcnQgY29uc3QgbGlzdGVuZXJzID0ge1xuICAgIC8qKlxuICAgICAqIOeql+WPo+e8qeaUvuaXtuiwg+eUqOabtOaWsFxuICAgICAqL1xuICAgIHJlc2l6ZSgpIHtcbiAgICAgICAgbWFuYWdlcj8udXBkYXRlPy4oKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog56qX5Y+j5pi+56S65pe26LCD55So5pu05pawXG4gICAgICovXG4gICAgc2hvdygpIHtcbiAgICAgICAgbWFuYWdlci51cGRhdGUoKTtcbiAgICB9LFxufTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWR5KHR5cGU6IGxvZ1R5cGUpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcGFuZWwgPSB0aGlzO1xuXG4gICAgaWYgKHR5cGUpIHtcbiAgICAgICAgYXdhaXQgRWRpdG9yLlByb2ZpbGUuc2V0Q29uZmlnKCdjb25zb2xlJywgJ3BhbmVsLmZpbHRlclR5cGUnLCB0eXBlKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb25maWcgPSBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRDb25maWcoJ2NvbnNvbGUnLCAncGFuZWwnKTtcblxuICAgIGNvbnN0IHNpemUgPSBjb25maWcuZm9udFNpemUgLSAwIHx8IDEyO1xuXG4gICAgdm0gPSBuZXcgVnVlKHtcbiAgICAgICAgZWw6IHBhbmVsLiRbJ2NvbnNvbGUtcGFuZWwnXSxcblxuICAgICAgICBjb21wb25lbnRzOiB7XG4gICAgICAgICAgICAnY29uc29sZS1saXN0JzogcmVxdWlyZSgnLi9jb21wb25lbnRzL2xpc3QnKSxcbiAgICAgICAgfSxcblxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICB0YWJiYXI6IHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5RGF0ZTogY29uZmlnLmRpc3BsYXlEYXRlLFxuICAgICAgICAgICAgICAgIGZvbnRTaXplOiBzaXplLFxuICAgICAgICAgICAgICAgIGxpbmVIZWlnaHQ6IHNpemUgKiAyLFxuICAgICAgICAgICAgICAgIGZpbHRlclR5cGU6ICdhbGwnLFxuICAgICAgICAgICAgICAgIGZpbHRlclJlZ2V4OiBmYWxzZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG5cbiAgICAgICAgbW91bnRlZCgpIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG1ldGhvZHM6IDxhbnk+e1xuICAgICAgICAgICAgYXN5bmMgb25IZWFkZXJDaGFuZ2UodHlwZTogc3RyaW5nLCBldmVudDogQ3VzdG9tRXZlbnQpIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBldmVudD8udGFyZ2V0Py52YWx1ZSA/PyAnJztcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnY2xlYXInOlxuICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLkxvZ2dlci5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFuYWdlci5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2ZpbHRlclJlZ2V4JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hbmFnZXIuc2V0RmlsdGVyUmVnZXgodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2ZpbHRlclRleHQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgbWFuYWdlci5zZXRGaWx0ZXJUZXh0KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdmaWx0ZXJUeXBlJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hbmFnZXIuc2V0RmlsdGVyVHlwZSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuUHJvZmlsZS5zZXRDb25maWcoJ2NvbnNvbGUnLCAncGFuZWwuZmlsdGVyVHlwZScsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdvcGVuTG9nJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoZWxsLm9wZW5QYXRoKGpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJy4vbG9jYWwvbG9ncy9wcm9qZWN0LmxvZycpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHVwZGF0ZSgpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodXBkYXRlQW5pbWF0aW9uSWQpO1xuICAgICAgICAgICAgICAgIHVwZGF0ZUFuaW1hdGlvbklkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJHJlZnMubGlzdD8ucmVuZGVyTGlzdCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDnv7vor5FcbiAgICAgICAgICAgICAqIEBwYXJhbSBrZXlcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdChrZXk6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBgY29uc29sZS4ke2tleX1gO1xuICAgICAgICAgICAgICAgIHJldHVybiBFZGl0b3IuSTE4bi50KG5hbWUpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiByZWZyZXNoIOmcgOimgeaUvuWcqOS7peS4i+S4pOS4quS5i+WJje+8jFxuICAgICAgICAgICAgICAgICAqIOWboOS4uiByZWNvcmQg5Lmf5Lya5pyJ6L6T5Ye677yMXG4gICAgICAgICAgICAgICAgICog5aaC5p6cIHJlZnJlc2gg5pS+5ZCO6Z2i5Lya5a+86Ie05Yid5aeL5pWw5o2u6L6T5Ye65Lik5qyhXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoKCk7XG5cbiAgICAgICAgICAgICAgICBtYW5hZ2VyLnNldFVwZGF0ZUZuKHRoaXMudXBkYXRlLmJpbmQodGhpcykpO1xuICAgICAgICAgICAgICAgIEVkaXRvci5Mb2dnZXIub24oJ3JlY29yZCcsIG1ldGhvZHMucmVjb3JkKTtcbiAgICAgICAgICAgICAgICBFZGl0b3IuTG9nZ2VyLm9uKCdjbGVhcicsIG1ldGhvZHMucmVmcmVzaCk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBhc3luYyByZWZyZXNoKCkge1xuICAgICAgICAgICAgICAgIC8vIOiOt+WPluaVsOaNrlxuICAgICAgICAgICAgICAgIGNvbnN0IGxpc3QgPSBhd2FpdCBFZGl0b3IuTG9nZ2VyLnF1ZXJ5KCk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBjb25maWcgPSBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRDb25maWcoJ2NvbnNvbGUnLCAncGFuZWwnKTtcbiAgICAgICAgICAgICAgICB0aGlzLnRhYmJhci5kaXNwbGF5RGF0ZSA9IGNvbmZpZy5kaXNwbGF5RGF0ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnRhYmJhci5maWx0ZXJUeXBlID0gY29uZmlnLmZpbHRlclR5cGUgfHwgJ2FsbCc7XG4gICAgICAgICAgICAgICAgdGhpcy50YWJiYXIuZm9udFNpemUgPSBOdW1iZXIoY29uZmlnLmZvbnRTaXplKTtcbiAgICAgICAgICAgICAgICB0aGlzLnRhYmJhci5saW5lSGVpZ2h0ID0gdGhpcy50YWJiYXIuZm9udFNpemUgKiAyO1xuXG4gICAgICAgICAgICAgICAgbWFuYWdlci5yZXNldChsaXN0KTtcbiAgICAgICAgICAgICAgICBtYW5hZ2VyLnNldEZpbHRlclR5cGUodGhpcy50YWJiYXIuZmlsdGVyVHlwZSk7XG4gICAgICAgICAgICAgICAgbWFuYWdlci5zaG93RGF0ZSh0aGlzLnRhYmJhci5kaXNwbGF5RGF0ZSk7XG4gICAgICAgICAgICAgICAgbWFuYWdlci5zZXRMaW5lSGVpZ2h0KHRoaXMudGFiYmFyLmxpbmVIZWlnaHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGJlZm9yZUNsb3NlKCkgeyB9XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbG9zZSgpIHtcbiAgICAvLyDlj5bmtojkuYvliY3nm5HlkKznmoTml6Xlv5flpITnkIbkuovku7ZcbiAgICBtYW5hZ2VyLnNldFVwZGF0ZUZuKG51bGwpO1xuICAgIEVkaXRvci5Mb2dnZXIucmVtb3ZlTGlzdGVuZXIoJ3JlY29yZCcsIG1ldGhvZHMucmVjb3JkKTtcbiAgICBFZGl0b3IuTG9nZ2VyLnJlbW92ZUxpc3RlbmVyKCdjbGVhcicsIG1ldGhvZHMucmVmcmVzaCk7XG59XG4iXX0=