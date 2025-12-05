'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.close = exports.beforeClose = exports.ready = exports.listeners = exports.methods = exports.$ = exports.fonts = exports.template = exports.style = void 0;
const electron_1 = require("electron");
const fs_1 = require("fs");
const path_1 = require("path");
const extension_1 = require("./extension");
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
    async updateExtensionVisiable() {
        if (!vm)
            return;
        vm.extendsList = await extension_1.getConfig();
    },
};
exports.listeners = {
    /**
     * 窗口缩放时调用更新
     */
    resize() {
        manager?.update?.(true);
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
            extendsList: [],
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
            update(...rest) {
                window.cancelAnimationFrame(updateAnimationId);
                updateAnimationId = window.requestAnimationFrame(() => {
                    this.$refs.list?.renderList(...rest);
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
            onClearChange(item, event) {
                // 能够被点击，说明都是在显示状态下，所以这边 show 直接传 true，无需从配置里获取
                Editor.Profile.setConfig(item.name, item.key, { value: event.target.value, show: true }, 'global');
            },
        },
    });
    // 拓展配置
    Editor.Package.on('enable', async (pkg) => {
        extension_1.attach(pkg);
        panel.updateExtensionVisiable();
    });
    Editor.Package.on('disable', async (pkg) => {
        extension_1.detach(pkg);
        panel.updateExtensionVisiable();
    });
    extension_1.init();
    panel.updateExtensionVisiable();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvcGFuZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFFYix1Q0FBaUM7QUFDakMsMkJBQWtDO0FBQ2xDLCtCQUE0QjtBQUU1QiwyQ0FBOEU7QUFFOUUsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDdkMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO0FBQ2pDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztBQUU1QixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7QUFFckMsSUFBSSxLQUFLLEdBQVEsSUFBSSxDQUFDO0FBQ3RCLElBQUksRUFBRSxHQUFRLElBQUksQ0FBQztBQUNuQixJQUFJLGlCQUFpQixHQUFRLElBQUksQ0FBQztBQUVyQixRQUFBLEtBQUssR0FBRyxpQkFBWSxDQUFDLFdBQUksQ0FBQyxTQUFTLEVBQUUsbUJBQW1CLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUVuRSxRQUFBLFFBQVEsR0FBRyxpQkFBWSxDQUFDLFdBQUksQ0FBQyxTQUFTLEVBQUUsV0FBVyxFQUFFLHNCQUFzQixDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFFdEYsUUFBQSxLQUFLLEdBQUc7SUFDakI7UUFDSSxJQUFJLEVBQUUsU0FBUztLQUNsQjtDQUNKLENBQUM7QUFFVyxRQUFBLENBQUMsR0FBRztJQUNiLGVBQWUsRUFBRSxnQkFBZ0I7Q0FDcEMsQ0FBQztBQUVXLFFBQUEsT0FBTyxHQUFHO0lBQ25COzs7T0FHRztJQUNILE1BQU0sQ0FBQyxHQUFXO1FBQ2QsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNyQixPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDckIsQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBYztRQUN4QixJQUFJLElBQUksRUFBRTtZQUNOLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLGtCQUFrQixFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ3ZFO1FBQ0QsTUFBTSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQztJQUMxQixDQUFDO0lBRUQsS0FBSyxDQUFDLHVCQUF1QjtRQUN6QixJQUFJLENBQUMsRUFBRTtZQUFFLE9BQU87UUFDaEIsRUFBRSxDQUFDLFdBQVcsR0FBRyxNQUFNLHFCQUFTLEVBQUUsQ0FBQztJQUN2QyxDQUFDO0NBQ0osQ0FBQztBQUVXLFFBQUEsU0FBUyxHQUFHO0lBQ3JCOztPQUVHO0lBQ0gsTUFBTTtRQUNGLE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJO1FBQ0EsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3JCLENBQUM7Q0FDSixDQUFDO0FBRUssS0FBSyxVQUFVLEtBQUssQ0FBQyxJQUFhO0lBQ3JDLGFBQWE7SUFDYixLQUFLLEdBQUcsSUFBSSxDQUFDO0lBRWIsSUFBSSxJQUFJLEVBQUU7UUFDTixNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUN2RTtJQUVELE1BQU0sTUFBTSxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRWxFLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUV2QyxFQUFFLEdBQUcsSUFBSSxHQUFHLENBQUM7UUFDVCxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUM7UUFFNUIsVUFBVSxFQUFFO1lBQ1IsY0FBYyxFQUFFLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQztTQUMvQztRQUVELElBQUksRUFBRTtZQUNGLE1BQU0sRUFBRTtnQkFDSixXQUFXLEVBQUUsTUFBTSxDQUFDLFdBQVc7Z0JBQy9CLFFBQVEsRUFBRSxJQUFJO2dCQUNkLFVBQVUsRUFBRSxJQUFJLEdBQUcsQ0FBQztnQkFDcEIsVUFBVSxFQUFFLEtBQUs7Z0JBQ2pCLFdBQVcsRUFBRSxLQUFLO2FBQ3JCO1lBQ0QsV0FBVyxFQUFFLEVBQUU7U0FDbEI7UUFFRCxPQUFPO1lBQ0gsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2hCLENBQUM7UUFFRCxPQUFPLEVBQU87WUFDVixLQUFLLENBQUMsY0FBYyxDQUFDLElBQVksRUFBRSxLQUFrQjtnQkFDakQsYUFBYTtnQkFDYixNQUFNLEtBQUssR0FBRyxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ3pDLFFBQVEsSUFBSSxFQUFFO29CQUNWLEtBQUssT0FBTzt3QkFDUixNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUN0QixPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ2hCLE1BQU07b0JBQ1YsS0FBSyxhQUFhO3dCQUNkLE9BQU8sQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQzlCLE1BQU07b0JBQ1YsS0FBSyxZQUFZO3dCQUNiLE9BQU8sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQzdCLE1BQU07b0JBQ1YsS0FBSyxZQUFZO3dCQUNiLE9BQU8sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQzdCLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUNyRSxNQUFNO29CQUNWLEtBQUssU0FBUzt3QkFDVixnQkFBSyxDQUFDLFFBQVEsQ0FBQyxXQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsMEJBQTBCLENBQUMsQ0FBQyxDQUFDO3dCQUN0RSxNQUFNO2lCQUNiO1lBQ0wsQ0FBQztZQUVELE1BQU0sQ0FBQyxHQUFHLElBQVM7Z0JBQ2YsTUFBTSxDQUFDLG9CQUFvQixDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBQy9DLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLEVBQUU7b0JBQ2xELElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO2dCQUN6QyxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUM7WUFFRDs7O2VBR0c7WUFDSCxDQUFDLENBQUMsR0FBVztnQkFDVCxNQUFNLElBQUksR0FBRyxXQUFXLEdBQUcsRUFBRSxDQUFDO2dCQUM5QixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9CLENBQUM7WUFFRCxLQUFLLENBQUMsSUFBSTtnQkFDTjs7OzttQkFJRztnQkFDSCxNQUFNLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFFckIsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsZUFBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMzQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsZUFBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQy9DLENBQUM7WUFFRCxLQUFLLENBQUMsT0FBTztnQkFDVCxPQUFPO2dCQUNQLE1BQU0sSUFBSSxHQUFHLE1BQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFFekMsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ2xFLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7Z0JBQzdDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxVQUFVLElBQUksS0FBSyxDQUFDO2dCQUNwRCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMvQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7Z0JBRWxELE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3BCLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDOUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUMxQyxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbEQsQ0FBQztZQUNELGFBQWEsQ0FBQyxJQUF1QixFQUFFLEtBQVU7Z0JBQzdDLCtDQUErQztnQkFDL0MsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUMsRUFBRSxRQUFRLENBQUUsQ0FBQztZQUN0RyxDQUFDO1NBQ0o7S0FDSixDQUFDLENBQUM7SUFFSCxPQUFPO0lBQ1AsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxHQUFpQyxFQUFFLEVBQUU7UUFDcEUsa0JBQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNaLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO0lBQ3BDLENBQUMsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxHQUFpQyxFQUFFLEVBQUU7UUFDckUsa0JBQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNaLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO0lBQ3BDLENBQUMsQ0FBQyxDQUFDO0lBQ0gsZ0JBQWMsRUFBRSxDQUFDO0lBQ2pCLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO0FBQ3BDLENBQUM7QUF6SEQsc0JBeUhDO0FBRU0sS0FBSyxVQUFVLFdBQVcsS0FBSyxDQUFDO0FBQXZDLGtDQUF1QztBQUVoQyxLQUFLLFVBQVUsS0FBSztJQUN2QixnQkFBZ0I7SUFDaEIsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxQixNQUFNLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsZUFBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3ZELE1BQU0sQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxlQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQUxELHNCQUtDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBzaGVsbCB9IGZyb20gJ2VsZWN0cm9uJztcbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGxvZ1R5cGUsIElDb25zb2xlRXh0ZW5zaW9uIH0gZnJvbSAnLi4vQHR5cGVzL3ByaXRhdGUnO1xuaW1wb3J0IHthdHRhY2gsIGRldGFjaCwgaW5pdCBhcyBpbml0RXh0ZW5zaW9ucywgZ2V0Q29uZmlnfSBmcm9tICcuL2V4dGVuc2lvbic7XG5cbmNvbnN0IFZ1ZSA9IHJlcXVpcmUoJ3Z1ZS9kaXN0L3Z1ZS5qcycpO1xuVnVlLmNvbmZpZy5wcm9kdWN0aW9uVGlwID0gZmFsc2U7XG5WdWUuY29uZmlnLmRldnRvb2xzID0gZmFsc2U7XG5cbmNvbnN0IG1hbmFnZXIgPSByZXF1aXJlKCcuL21hbmFnZXInKTtcblxubGV0IHBhbmVsOiBhbnkgPSBudWxsO1xubGV0IHZtOiBhbnkgPSBudWxsO1xubGV0IHVwZGF0ZUFuaW1hdGlvbklkOiBhbnkgPSBudWxsO1xuXG5leHBvcnQgY29uc3Qgc3R5bGUgPSByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi9kaXN0L2luZGV4LmNzcycpLCAndXRmOCcpO1xuXG5leHBvcnQgY29uc3QgdGVtcGxhdGUgPSByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi9zdGF0aWMnLCAnL3RlbXBsYXRlL2luZGV4Lmh0bWwnKSwgJ3V0ZjgnKTtcblxuZXhwb3J0IGNvbnN0IGZvbnRzID0gW1xuICAgIHtcbiAgICAgICAgbmFtZTogJ2NvbnNvbGUnLFxuICAgIH0sXG5dO1xuXG5leHBvcnQgY29uc3QgJCA9IHtcbiAgICAnY29uc29sZS1wYW5lbCc6ICcuY29uc29sZS1wYW5lbCcsXG59O1xuXG5leHBvcnQgY29uc3QgbWV0aG9kcyA9IHtcbiAgICAvKipcbiAgICAgKiDliLfmlrDmmL7npLrpnaLmnb9cbiAgICAgKiDmn6Xor6Llr7nlupTpgInkuK3nmoTlr7nosaHnmoTkv6Hmga9cbiAgICAgKi9cbiAgICByZWNvcmQobG9nOiBzdHJpbmcpIHtcbiAgICAgICAgbWFuYWdlci5hZGRJdGVtKGxvZyk7XG4gICAgICAgIG1hbmFnZXIudXBkYXRlKCk7XG4gICAgfSxcblxuICAgIGFzeW5jIHJlZnJlc2godHlwZT86IGxvZ1R5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUpIHtcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5Qcm9maWxlLnNldENvbmZpZygnY29uc29sZScsICdwYW5lbC5maWx0ZXJUeXBlJywgdHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdm0/LnJlZnJlc2g/LigpO1xuICAgIH0sXG5cbiAgICBhc3luYyB1cGRhdGVFeHRlbnNpb25WaXNpYWJsZSgpIHtcbiAgICAgICAgaWYgKCF2bSkgcmV0dXJuO1xuICAgICAgICB2bS5leHRlbmRzTGlzdCA9IGF3YWl0IGdldENvbmZpZygpO1xuICAgIH0sXG59O1xuXG5leHBvcnQgY29uc3QgbGlzdGVuZXJzID0ge1xuICAgIC8qKlxuICAgICAqIOeql+WPo+e8qeaUvuaXtuiwg+eUqOabtOaWsFxuICAgICAqL1xuICAgIHJlc2l6ZSgpIHtcbiAgICAgICAgbWFuYWdlcj8udXBkYXRlPy4odHJ1ZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOeql+WPo+aYvuekuuaXtuiwg+eUqOabtOaWsFxuICAgICAqL1xuICAgIHNob3coKSB7XG4gICAgICAgIG1hbmFnZXIudXBkYXRlKCk7XG4gICAgfSxcbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkeSh0eXBlOiBsb2dUeXBlKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHBhbmVsID0gdGhpcztcblxuICAgIGlmICh0eXBlKSB7XG4gICAgICAgIGF3YWl0IEVkaXRvci5Qcm9maWxlLnNldENvbmZpZygnY29uc29sZScsICdwYW5lbC5maWx0ZXJUeXBlJywgdHlwZSk7XG4gICAgfVxuXG4gICAgY29uc3QgY29uZmlnID0gYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0Q29uZmlnKCdjb25zb2xlJywgJ3BhbmVsJyk7XG5cbiAgICBjb25zdCBzaXplID0gY29uZmlnLmZvbnRTaXplIC0gMCB8fCAxMjtcblxuICAgIHZtID0gbmV3IFZ1ZSh7XG4gICAgICAgIGVsOiBwYW5lbC4kWydjb25zb2xlLXBhbmVsJ10sXG5cbiAgICAgICAgY29tcG9uZW50czoge1xuICAgICAgICAgICAgJ2NvbnNvbGUtbGlzdCc6IHJlcXVpcmUoJy4vY29tcG9uZW50cy9saXN0JyksXG4gICAgICAgIH0sXG5cbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgdGFiYmFyOiB7XG4gICAgICAgICAgICAgICAgZGlzcGxheURhdGU6IGNvbmZpZy5kaXNwbGF5RGF0ZSxcbiAgICAgICAgICAgICAgICBmb250U2l6ZTogc2l6ZSxcbiAgICAgICAgICAgICAgICBsaW5lSGVpZ2h0OiBzaXplICogMixcbiAgICAgICAgICAgICAgICBmaWx0ZXJUeXBlOiAnYWxsJyxcbiAgICAgICAgICAgICAgICBmaWx0ZXJSZWdleDogZmFsc2UsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXh0ZW5kc0xpc3Q6IFtdLFxuICAgICAgICB9LFxuXG4gICAgICAgIG1vdW50ZWQoKSB7XG4gICAgICAgICAgICB0aGlzLmluaXQoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBtZXRob2RzOiA8YW55PntcbiAgICAgICAgICAgIGFzeW5jIG9uSGVhZGVyQ2hhbmdlKHR5cGU6IHN0cmluZywgZXZlbnQ6IEN1c3RvbUV2ZW50KSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gZXZlbnQ/LnRhcmdldD8udmFsdWUgPz8gJyc7XG4gICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NsZWFyJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5Mb2dnZXIuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hbmFnZXIuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdmaWx0ZXJSZWdleCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBtYW5hZ2VyLnNldEZpbHRlclJlZ2V4KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdmaWx0ZXJUZXh0JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hbmFnZXIuc2V0RmlsdGVyVGV4dCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZmlsdGVyVHlwZSc6XG4gICAgICAgICAgICAgICAgICAgICAgICBtYW5hZ2VyLnNldEZpbHRlclR5cGUodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlByb2ZpbGUuc2V0Q29uZmlnKCdjb25zb2xlJywgJ3BhbmVsLmZpbHRlclR5cGUnLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnb3BlbkxvZyc6XG4gICAgICAgICAgICAgICAgICAgICAgICBzaGVsbC5vcGVuUGF0aChqb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsICcuL2xvY2FsL2xvZ3MvcHJvamVjdC5sb2cnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICB1cGRhdGUoLi4ucmVzdDogYW55KSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHVwZGF0ZUFuaW1hdGlvbklkKTtcbiAgICAgICAgICAgICAgICB1cGRhdGVBbmltYXRpb25JZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiRyZWZzLmxpc3Q/LnJlbmRlckxpc3QoLi4ucmVzdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIOe/u+ivkVxuICAgICAgICAgICAgICogQHBhcmFtIGtleVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0KGtleTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGBjb25zb2xlLiR7a2V5fWA7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEVkaXRvci5JMThuLnQobmFtZSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBhc3luYyBpbml0KCkge1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIHJlZnJlc2gg6ZyA6KaB5pS+5Zyo5Lul5LiL5Lik5Liq5LmL5YmN77yMXG4gICAgICAgICAgICAgICAgICog5Zug5Li6IHJlY29yZCDkuZ/kvJrmnInovpPlh7rvvIxcbiAgICAgICAgICAgICAgICAgKiDlpoLmnpwgcmVmcmVzaCDmlL7lkI7pnaLkvJrlr7zoh7TliJ3lp4vmlbDmja7ovpPlh7rkuKTmrKFcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJlZnJlc2goKTtcblxuICAgICAgICAgICAgICAgIG1hbmFnZXIuc2V0VXBkYXRlRm4odGhpcy51cGRhdGUuYmluZCh0aGlzKSk7XG4gICAgICAgICAgICAgICAgRWRpdG9yLkxvZ2dlci5vbigncmVjb3JkJywgbWV0aG9kcy5yZWNvcmQpO1xuICAgICAgICAgICAgICAgIEVkaXRvci5Mb2dnZXIub24oJ2NsZWFyJywgbWV0aG9kcy5yZWZyZXNoKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGFzeW5jIHJlZnJlc2goKSB7XG4gICAgICAgICAgICAgICAgLy8g6I635Y+W5pWw5o2uXG4gICAgICAgICAgICAgICAgY29uc3QgbGlzdCA9IGF3YWl0IEVkaXRvci5Mb2dnZXIucXVlcnkoKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldENvbmZpZygnY29uc29sZScsICdwYW5lbCcpO1xuICAgICAgICAgICAgICAgIHRoaXMudGFiYmFyLmRpc3BsYXlEYXRlID0gY29uZmlnLmRpc3BsYXlEYXRlO1xuICAgICAgICAgICAgICAgIHRoaXMudGFiYmFyLmZpbHRlclR5cGUgPSBjb25maWcuZmlsdGVyVHlwZSB8fCAnYWxsJztcbiAgICAgICAgICAgICAgICB0aGlzLnRhYmJhci5mb250U2l6ZSA9IE51bWJlcihjb25maWcuZm9udFNpemUpO1xuICAgICAgICAgICAgICAgIHRoaXMudGFiYmFyLmxpbmVIZWlnaHQgPSB0aGlzLnRhYmJhci5mb250U2l6ZSAqIDI7XG5cbiAgICAgICAgICAgICAgICBtYW5hZ2VyLnJlc2V0KGxpc3QpO1xuICAgICAgICAgICAgICAgIG1hbmFnZXIuc2V0RmlsdGVyVHlwZSh0aGlzLnRhYmJhci5maWx0ZXJUeXBlKTtcbiAgICAgICAgICAgICAgICBtYW5hZ2VyLnNob3dEYXRlKHRoaXMudGFiYmFyLmRpc3BsYXlEYXRlKTtcbiAgICAgICAgICAgICAgICBtYW5hZ2VyLnNldExpbmVIZWlnaHQodGhpcy50YWJiYXIubGluZUhlaWdodCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25DbGVhckNoYW5nZShpdGVtOiBJQ29uc29sZUV4dGVuc2lvbiwgZXZlbnQ6IGFueSkge1xuICAgICAgICAgICAgICAgIC8vIOiDveWkn+iiq+eCueWHu++8jOivtOaYjumDveaYr+WcqOaYvuekuueKtuaAgeS4i++8jOaJgOS7pei/mei+uSBzaG93IOebtOaOpeS8oCB0cnVl77yM5peg6ZyA5LuO6YWN572u6YeM6I635Y+WXG4gICAgICAgICAgICAgICAgRWRpdG9yLlByb2ZpbGUuc2V0Q29uZmlnKGl0ZW0ubmFtZSwgaXRlbS5rZXksIHt2YWx1ZTogZXZlbnQudGFyZ2V0LnZhbHVlLCBzaG93OiB0cnVlfSwgJ2dsb2JhbCcgKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyDmi5PlsZXphY3nva5cbiAgICBFZGl0b3IuUGFja2FnZS5vbignZW5hYmxlJywgYXN5bmMgKHBrZzogRWRpdG9yLkludGVyZmFjZS5QYWNrYWdlSW5mbykgPT4ge1xuICAgICAgICBhdHRhY2gocGtnKTtcbiAgICAgICAgcGFuZWwudXBkYXRlRXh0ZW5zaW9uVmlzaWFibGUoKTtcbiAgICB9KTtcbiAgICBFZGl0b3IuUGFja2FnZS5vbignZGlzYWJsZScsIGFzeW5jIChwa2c6IEVkaXRvci5JbnRlcmZhY2UuUGFja2FnZUluZm8pID0+IHtcbiAgICAgICAgZGV0YWNoKHBrZyk7XG4gICAgICAgIHBhbmVsLnVwZGF0ZUV4dGVuc2lvblZpc2lhYmxlKCk7XG4gICAgfSk7XG4gICAgaW5pdEV4dGVuc2lvbnMoKTtcbiAgICBwYW5lbC51cGRhdGVFeHRlbnNpb25WaXNpYWJsZSgpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYmVmb3JlQ2xvc2UoKSB7IH1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsb3NlKCkge1xuICAgIC8vIOWPlua2iOS5i+WJjeebkeWQrOeahOaXpeW/l+WkhOeQhuS6i+S7tlxuICAgIG1hbmFnZXIuc2V0VXBkYXRlRm4obnVsbCk7XG4gICAgRWRpdG9yLkxvZ2dlci5yZW1vdmVMaXN0ZW5lcigncmVjb3JkJywgbWV0aG9kcy5yZWNvcmQpO1xuICAgIEVkaXRvci5Mb2dnZXIucmVtb3ZlTGlzdGVuZXIoJ2NsZWFyJywgbWV0aG9kcy5yZWZyZXNoKTtcbn1cbiJdfQ==