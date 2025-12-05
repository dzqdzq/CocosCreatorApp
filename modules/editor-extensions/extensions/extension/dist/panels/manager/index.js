'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const fs_1 = require("fs");
const path_1 = require("path");
const vue_js_1 = __importDefault(require("vue/dist/vue.js"));
const app_1 = require("./app");
const sdk_1 = require("./sdk");
const store_1 = require("./store");
const event_bus_1 = require("./event-bus");
const Panel = Editor.Panel.define({
    style: (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../manager.css'), 'utf8'),
    template: `<div class="extension"></div>`,
    $: {
        container: '.extension',
    },
    methods: {
        search(name) {
            if (!this.vm) {
                return;
            }
            if (typeof name !== 'string' && typeof name !== 'boolean') {
                return;
            }
            // FIXME: 不应将 vue 作为事件总线。后续考虑引入 rxjs 来处理
            this.vm.$emit(event_bus_1.INTERNAL_EVENTS.search, name);
        },
        selectPackage(packagePath) {
            // TODO: 在“创建扩展“面板内创建扩展并勾选“在扩展管理器中显示”时，自动在 manager 中定位显示，并加上高亮提醒
        },
    },
    async ready(params = {}) {
        const { extensionPaths, sdk } = await (0, sdk_1.generateSdk)();
        // 为了在组件间保持一致，顶层做一个独立的 provider 组件，所有子组件都走 inject 来使用
        const store = (0, store_1.createStore)(sdk);
        store.startupParams.value = params;
        this.vm?.$destroy();
        const vm = new vue_js_1.default({
            name: 'ExtensionManagerProvider',
            setup(props, ctx) {
                (0, store_1.useProvideStore)(store);
                (0, sdk_1.useProvideExtensionPaths)(extensionPaths);
                (0, sdk_1.useProvideSdk)(sdk);
                return {};
            },
            render(h) {
                return h(app_1.PanelApp, {
                    ref: 'app',
                });
            },
        }).$mount(this.$.container);
        this.vm = vm;
    },
    async close() {
        this.vm?.$destroy();
        delete this.vm;
        if (app_1.updateExtensionOption.isReRegister) {
            await Editor.Package.unregister(app_1.updateExtensionOption.path);
            await Editor.Package.register(app_1.updateExtensionOption.path);
            await Editor.Package.enable(app_1.updateExtensionOption.path);
        }
    },
});
module.exports = Panel;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL21hbmFnZXIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7O0FBRWIsMkJBQTRDO0FBQzVDLCtCQUF3RDtBQUN4RCw2REFBK0M7QUFHL0MsK0JBQXdEO0FBQ3hELCtCQUE2RTtBQUM3RSxtQ0FBdUQ7QUFDdkQsMkNBQThDO0FBTTlDLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQzlCLEtBQUssRUFBRSxJQUFBLGlCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLG1CQUFtQixDQUFDLEVBQUUsTUFBTSxDQUFDO0lBQ2pFLFFBQVEsRUFBRSwrQkFBK0I7SUFDekMsQ0FBQyxFQUFFO1FBQ0MsU0FBUyxFQUFFLFlBQVk7S0FDMUI7SUFDRCxPQUFPLEVBQUU7UUFDTCxNQUFNLENBQWtCLElBQXVCO1lBQzNDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFO2dCQUNWLE9BQU87YUFDVjtZQUNELElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLE9BQU8sSUFBSSxLQUFLLFNBQVMsRUFBRTtnQkFDdkQsT0FBTzthQUNWO1lBQ0Qsd0NBQXdDO1lBQ3hDLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLDJCQUFlLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFDRCxhQUFhLENBQUMsV0FBbUI7WUFDN0IsZ0VBQWdFO1FBQ3BFLENBQUM7S0FDSjtJQUNELEtBQUssQ0FBQyxLQUFLLENBQWtCLFNBQXdDLEVBQUU7UUFDbkUsTUFBTSxFQUFFLGNBQWMsRUFBRSxHQUFHLEVBQUUsR0FBRyxNQUFNLElBQUEsaUJBQVcsR0FBRSxDQUFDO1FBRXBELHFEQUFxRDtRQUNyRCxNQUFNLEtBQUssR0FBRyxJQUFBLG1CQUFXLEVBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDO1FBRW5DLElBQUksQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUM7UUFDcEIsTUFBTSxFQUFFLEdBQUcsSUFBSSxnQkFBRyxDQUFDO1lBQ2YsSUFBSSxFQUFFLDBCQUEwQjtZQUNoQyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUc7Z0JBQ1osSUFBQSx1QkFBZSxFQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUV2QixJQUFBLDhCQUF3QixFQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUN6QyxJQUFBLG1CQUFhLEVBQUMsR0FBRyxDQUFDLENBQUM7Z0JBRW5CLE9BQU8sRUFBRSxDQUFDO1lBQ2QsQ0FBQztZQUNELE1BQU0sQ0FBQyxDQUFDO2dCQUNKLE9BQU8sQ0FBQyxDQUFDLGNBQVEsRUFBRTtvQkFDZixHQUFHLEVBQUUsS0FBSztpQkFDYixDQUFDLENBQUM7WUFDUCxDQUFDO1NBQ0osQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRTVCLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO0lBQ2pCLENBQUM7SUFDRCxLQUFLLENBQUMsS0FBSztRQUNQLElBQUksQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUM7UUFDcEIsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBRWYsSUFBSSwyQkFBcUIsQ0FBQyxZQUFZLEVBQUU7WUFDcEMsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQywyQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1RCxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLDJCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFELE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsMkJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDM0Q7SUFFTCxDQUFDO0NBQ0osQ0FBQyxDQUFDO0FBRUgsaUJBQVMsS0FBSyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyByZWFkRmlsZVN5bmMsIHN0YXRTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgam9pbiwgYmFzZW5hbWUsIHBhcnNlLCBub3JtYWxpemUgfSBmcm9tICdwYXRoJztcbmltcG9ydCBWdWUsIHsgcHJvdmlkZSB9IGZyb20gJ3Z1ZS9kaXN0L3Z1ZS5qcyc7XG5cbmltcG9ydCB0eXBlIHsgTWFuYWdlclN0YXJ0dXBQYXJhbXMgfSBmcm9tICcuLi8uLi9wdWJsaWMvaW50ZXJmYWNlJztcbmltcG9ydCB7IFBhbmVsQXBwLCB1cGRhdGVFeHRlbnNpb25PcHRpb24gfSBmcm9tICcuL2FwcCc7XG5pbXBvcnQgeyBnZW5lcmF0ZVNkaywgdXNlUHJvdmlkZUV4dGVuc2lvblBhdGhzLCB1c2VQcm92aWRlU2RrIH0gZnJvbSAnLi9zZGsnO1xuaW1wb3J0IHsgY3JlYXRlU3RvcmUsIHVzZVByb3ZpZGVTdG9yZSB9IGZyb20gJy4vc3RvcmUnO1xuaW1wb3J0IHsgSU5URVJOQUxfRVZFTlRTIH0gZnJvbSAnLi9ldmVudC1idXMnO1xuXG50eXBlIFBhbmVsVGhpcyA9IFJlY29yZDxzdHJpbmcsIGFueT4gJiB7XG4gICAgdm0/OiBJbnN0YW5jZVR5cGU8dHlwZW9mIFZ1ZT47XG59O1xuXG5jb25zdCBQYW5lbCA9IEVkaXRvci5QYW5lbC5kZWZpbmUoe1xuICAgIHN0eWxlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi9tYW5hZ2VyLmNzcycpLCAndXRmOCcpLFxuICAgIHRlbXBsYXRlOiBgPGRpdiBjbGFzcz1cImV4dGVuc2lvblwiPjwvZGl2PmAsXG4gICAgJDoge1xuICAgICAgICBjb250YWluZXI6ICcuZXh0ZW5zaW9uJyxcbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgc2VhcmNoKHRoaXM6IFBhbmVsVGhpcywgbmFtZT86IHN0cmluZyB8IGJvb2xlYW4pIHtcbiAgICAgICAgICAgIGlmICghdGhpcy52bSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycgJiYgdHlwZW9mIG5hbWUgIT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEZJWE1FOiDkuI3lupTlsIYgdnVlIOS9nOS4uuS6i+S7tuaAu+e6v+OAguWQjue7reiAg+iZkeW8leWFpSByeGpzIOadpeWkhOeQhlxuICAgICAgICAgICAgdGhpcy52bS4kZW1pdChJTlRFUk5BTF9FVkVOVFMuc2VhcmNoLCBuYW1lKTtcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0UGFja2FnZShwYWNrYWdlUGF0aDogc3RyaW5nKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiDlnKjigJzliJvlu7rmianlsZXigJzpnaLmnb/lhoXliJvlu7rmianlsZXlubbli77pgInigJzlnKjmianlsZXnrqHnkIblmajkuK3mmL7npLrigJ3ml7bvvIzoh6rliqjlnKggbWFuYWdlciDkuK3lrprkvY3mmL7npLrvvIzlubbliqDkuIrpq5jkuq7mj5DphpJcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGFzeW5jIHJlYWR5KHRoaXM6IFBhbmVsVGhpcywgcGFyYW1zOiBQYXJ0aWFsPE1hbmFnZXJTdGFydHVwUGFyYW1zPiA9IHt9KSB7XG4gICAgICAgIGNvbnN0IHsgZXh0ZW5zaW9uUGF0aHMsIHNkayB9ID0gYXdhaXQgZ2VuZXJhdGVTZGsoKTtcblxuICAgICAgICAvLyDkuLrkuoblnKjnu4Tku7bpl7Tkv53mjIHkuIDoh7TvvIzpobblsYLlgZrkuIDkuKrni6znq4vnmoQgcHJvdmlkZXIg57uE5Lu277yM5omA5pyJ5a2Q57uE5Lu26YO96LWwIGluamVjdCDmnaXkvb/nlKhcbiAgICAgICAgY29uc3Qgc3RvcmUgPSBjcmVhdGVTdG9yZShzZGspO1xuICAgICAgICBzdG9yZS5zdGFydHVwUGFyYW1zLnZhbHVlID0gcGFyYW1zO1xuXG4gICAgICAgIHRoaXMudm0/LiRkZXN0cm95KCk7XG4gICAgICAgIGNvbnN0IHZtID0gbmV3IFZ1ZSh7XG4gICAgICAgICAgICBuYW1lOiAnRXh0ZW5zaW9uTWFuYWdlclByb3ZpZGVyJyxcbiAgICAgICAgICAgIHNldHVwKHByb3BzLCBjdHgpIHtcbiAgICAgICAgICAgICAgICB1c2VQcm92aWRlU3RvcmUoc3RvcmUpO1xuXG4gICAgICAgICAgICAgICAgdXNlUHJvdmlkZUV4dGVuc2lvblBhdGhzKGV4dGVuc2lvblBhdGhzKTtcbiAgICAgICAgICAgICAgICB1c2VQcm92aWRlU2RrKHNkayk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge307XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVuZGVyKGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaChQYW5lbEFwcCwge1xuICAgICAgICAgICAgICAgICAgICByZWY6ICdhcHAnLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSkuJG1vdW50KHRoaXMuJC5jb250YWluZXIpO1xuXG4gICAgICAgIHRoaXMudm0gPSB2bTtcbiAgICB9LFxuICAgIGFzeW5jIGNsb3NlKHRoaXM6IFBhbmVsVGhpcykge1xuICAgICAgICB0aGlzLnZtPy4kZGVzdHJveSgpO1xuICAgICAgICBkZWxldGUgdGhpcy52bTtcblxuICAgICAgICBpZiAodXBkYXRlRXh0ZW5zaW9uT3B0aW9uLmlzUmVSZWdpc3Rlcikge1xuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UudW5yZWdpc3Rlcih1cGRhdGVFeHRlbnNpb25PcHRpb24ucGF0aCk7XG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuUGFja2FnZS5yZWdpc3Rlcih1cGRhdGVFeHRlbnNpb25PcHRpb24ucGF0aCk7XG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuUGFja2FnZS5lbmFibGUodXBkYXRlRXh0ZW5zaW9uT3B0aW9uLnBhdGgpO1xuICAgICAgICB9XG5cbiAgICB9LFxufSk7XG5cbmV4cG9ydCA9IFBhbmVsO1xuIl19