"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionCreation = exports.LocationType = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
const vue_js_1 = require("vue/dist/vue.js");
const utils_build_1 = require("../../public/utils-build");
/**
 * 这里不用枚举，是为传入这个值给 vue
 */
exports.LocationType = {
    'extension.create_package.local': '0',
};
exports.ExtensionCreation = (0, vue_js_1.defineComponent)({
    name: 'ExtensionCreationApp',
    props: {
        preloadExtensionInfo: {
            type: Object,
            required: true,
        },
        author: { type: String, default: '' },
        showInManager: Boolean,
        showInFolder: Boolean,
    },
    data() {
        const currentExtension = 'extension';
        // 默认选择 extension 插件的 第一个插件模板, extension 一定有模板
        const currentTemplate = this.preloadExtensionInfo[currentExtension]?.templates[0];
        // 默认名称
        const defaultName = currentTemplate?.defaultName ?? (0, utils_build_1.getFallbackExtensionName)();
        return {
            LocationType: exports.LocationType,
            extensionInfoMap: this.preloadExtensionInfo,
            currentLocation: '0',
            name: defaultName,
            currentTemplate: currentTemplate,
            /** 当前选中的模板来自哪个插件 */
            currentExtension: currentExtension,
            editorVersion: (0, utils_build_1.getEditorVersion)(),
            extensionExist: false,
            timeoutId: {
                selectionScroll: null,
            },
            applying: false, // 模板生成中
        };
    },
    computed: {
        wrongName() {
            return (0, utils_build_1.isExtensionNameError)(this.name);
        },
        wrongAuthor() {
            return !this.author;
        },
        wrongEditorVersion() {
            return (0, utils_build_1.isEditorVersionError)(this.editorVersion);
        },
        distPath() {
            return (0, utils_build_1.getExtensionDist)(this.name);
        },
    },
    watch: {
        name(value, oldValue) {
            if (value !== oldValue) {
                this.updateExtensionIsExist();
            }
        },
        currentLocation(value, oldValue) {
            if (value !== oldValue) {
                this.updateExtensionIsExist();
            }
        },
    },
    methods: {
        /**
         * 选择模板
         * @param extensionName
         * @param template
         */
        selectTemplate(extensionName, template) {
            this.currentExtension = extensionName;
            this.currentTemplate = template;
            this.name = template.defaultName ?? (0, utils_build_1.getFallbackExtensionName)();
            // 确保模板出现在用户视野中
            if (this.timeoutId.selectionScroll) {
                window.clearTimeout(this.timeoutId.selectionScroll);
            }
            this.timeoutId.selectionScroll = window.setTimeout(() => {
                const templateEl = this.$refs.content?.querySelector(`[data-template-id="${template.id}"]`);
                if (templateEl) {
                    templateEl.scrollIntoView({
                        block: 'nearest',
                    });
                }
                this.timeoutId.selectionScroll = null;
            }, 0);
        },
        /**
         * 获取指定插件名的可用模板
         * @param extensionName
         * @param rawPath 传值时寻找匹配 rawPath 的模板，否则返回第一个模板（如果存在）
         * @returns
         */
        getAvailableTemplate(extensionName, rawPath) {
            // 寻找指定插件名注册进来的模板选项
            if (!this.extensionInfoMap[extensionName]) {
                return undefined;
            }
            const templates = this.extensionInfoMap[extensionName].templates;
            // rawPath 是插件在自身 package.json 中声明的 template 的路径（原始值）
            if (typeof rawPath === 'string') {
                const found = templates.find((item) => item.rawPath === rawPath);
                return found;
            }
            // rawPath 找不到，尝试返回第一个模板
            if (templates.length > 0) {
                return templates[0];
            }
            return undefined;
        },
        /**
         * 加载所有 creator 模块
         * @param options
         */
        async loadAllCreatorModule(options) {
            // 默认参数
            options = options || {};
            options.force = options.force || false;
            // 获取所有插件信息
            const extensionInfoMap = (await Editor.Message.request('extension', 'get-extension-info-map'));
            this.extensionInfoMap = {};
            // 遍历所有插件
            for (const key in extensionInfoMap) {
                // 已加载过的插件跳过
                if (!options.force && this.extensionInfoMap[key]) {
                    continue;
                }
                const info = extensionInfoMap[key];
                this.$set(this.extensionInfoMap, key, info);
            }
        },
        /**
         * 卸载所有 creator 模块
         * @param options
         */
        async unloadAllCreatorModule(info) {
            for (const key in this.extensionInfoMap) {
                if (info && info.name !== key) {
                    continue;
                }
                this.$delete(this.extensionInfoMap, key);
            }
        },
        /**
         * 插件启用时加载 creator 模块
         * @param info
         */
        async onPluginEnable(info) {
            await this.loadAllCreatorModule();
        },
        /**
         * 插件禁用时卸载 creator 模块
         * @param info
         */
        async onPluginDisable(info) {
            await this.unloadAllCreatorModule(info);
        },
        /**
         * 判断对象是否为空对象
         * @param obj
         * @returns
         */
        isEmptyObject(obj) {
            return Object.keys(obj).length === 0;
        },
        /**
         * 翻译
         * @param args
         * @returns
         */
        t(...args) {
            return Editor.I18n.t(...args);
        },
        /**
         * 拷贝插件模板到 tempDir，成功后拷贝内容到指定目录。
         * @returns
         */
        async apply() {
            if (this.applying) {
                throw new Error('template is applying, please wait for a moment');
            }
            this.applying = true;
            try {
                await Editor.Profile.setTemp('extension', utils_build_1.TempProfileKeys.author, this.author);
                await Editor.Profile.setTemp('extension', utils_build_1.TempProfileKeys.showInManager, this.showInManager);
                await Editor.Profile.setTemp('extension', utils_build_1.TempProfileKeys.showInFolder, this.showInFolder);
                const result = await Editor.Message.request('extension', 'create-extension-template', {
                    type: this.currentExtension,
                    templateId: this.currentTemplate.id,
                    dist: this.distPath,
                    author: this.author,
                    editorVersion: this.editorVersion,
                    name: this.name,
                    showInFolder: this.showInFolder,
                }, true);
                if (result.success) {
                    Editor.Task.addNotice({
                        title: this.name,
                        message: this.t('extension.create_package.create_extension_successful', {
                            name: this.name,
                            path: this.distPath,
                        }),
                        timeout: 5000,
                        type: 'success',
                    });
                    // 延迟 200 ms 才关闭面板，防止偶现的 showItemInFolder 没出现的问题
                    setTimeout(() => {
                        this.applying = false;
                        Editor.Panel.has('extension.create').then((r) => {
                            if (r) {
                                Editor.Panel.close('extension.create');
                            }
                        });
                    }, 200);
                }
                else {
                    this.applying = false;
                    Editor.Dialog.error(result.msg, {
                        title: `Creator Extension`,
                        detail: result.msg,
                    });
                    this.updateExtensionIsExist();
                }
            }
            catch (error) {
                this.applying = false;
                if (error instanceof Error) {
                    Editor.Dialog.error(error.message, {
                        title: error.name,
                        detail: error.stack,
                    });
                }
                this.updateExtensionIsExist();
            }
        },
        /**
         * 更新插件是否存在
         */
        updateExtensionIsExist() {
            this.extensionExist = this.name !== '' && (0, fs_1.existsSync)(this.distPath);
        },
    },
    template: (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../../static', '/template/create/index.html'), 'utf8'),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc291cmNlL3BhbmVscy9jcmVhdGUvYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLCtCQUF1QztBQUN2QywyQkFBOEM7QUFDOUMsNENBQTREO0FBRTVELDBEQU9rQztBQUlsQzs7R0FFRztBQUNVLFFBQUEsWUFBWSxHQUFHO0lBQ3hCLGdDQUFnQyxFQUFFLEdBQUc7Q0FDeEMsQ0FBQztBQUVXLFFBQUEsaUJBQWlCLEdBQUcsSUFBQSx3QkFBZSxFQUFDO0lBQzdDLElBQUksRUFBRSxzQkFBc0I7SUFFNUIsS0FBSyxFQUFFO1FBQ0gsb0JBQW9CLEVBQUU7WUFDbEIsSUFBSSxFQUFFLE1BQStCO1lBQ3JDLFFBQVEsRUFBRSxJQUFJO1NBQ2pCO1FBQ0QsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFO1FBQ3JDLGFBQWEsRUFBRSxPQUFPO1FBQ3RCLFlBQVksRUFBRSxPQUFPO0tBQ3hCO0lBRUQsSUFBSTtRQUNBLE1BQU0sZ0JBQWdCLEdBQUcsV0FBVyxDQUFDO1FBRXJDLDhDQUE4QztRQUM5QyxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUEwQixDQUFDO1FBQzNHLE9BQU87UUFDUCxNQUFNLFdBQVcsR0FBRyxlQUFlLEVBQUUsV0FBVyxJQUFJLElBQUEsc0NBQXdCLEdBQUUsQ0FBQztRQUUvRSxPQUFPO1lBQ0gsWUFBWSxFQUFaLG9CQUFZO1lBQ1osZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLG9CQUFtQztZQUMxRCxlQUFlLEVBQUUsR0FBRztZQUNwQixJQUFJLEVBQUUsV0FBVztZQUNqQixlQUFlLEVBQUUsZUFBZTtZQUNoQyxvQkFBb0I7WUFDcEIsZ0JBQWdCLEVBQUUsZ0JBQWdCO1lBRWxDLGFBQWEsRUFBRSxJQUFBLDhCQUFnQixH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dEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRTt3QkFDNUIsS0FBSyxFQUFFLG1CQUFtQjt3QkFDMUIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxHQUFHO3FCQUNyQixDQUFDLENBQUM7b0JBQ0gsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7aUJBQ2pDO2FBQ0o7WUFBQyxPQUFPLEtBQUssRUFBRTtnQkFDWixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztnQkFDdEIsSUFBSSxLQUFLLFlBQVksS0FBSyxFQUFFO29CQUN4QixNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFO3dCQUMvQixLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUk7d0JBQ2pCLE1BQU0sRUFBRSxLQUFLLENBQUMsS0FBSztxQkFDdEIsQ0FBQyxDQUFDO2lCQUNOO2dCQUNELElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO2FBQ2pDO1FBQ0wsQ0FBQztRQUVEOztXQUVHO1FBQ0gsc0JBQXNCO1lBQ2xCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLElBQUksS0FBSyxFQUFFLElBQUksSUFBQSxlQUFVLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hFLENBQUM7S0FDSjtJQUNELFFBQVEsRUFBRSxJQUFBLGlCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLGlCQUFpQixFQUFFLDZCQUE2QixDQUFDLEVBQUUsTUFBTSxDQUFDO0NBQ3BHLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGpvaW4sIG5vcm1hbGl6ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZXhpc3RzU3luYywgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgUHJvcFR5cGUsIGRlZmluZUNvbXBvbmVudCB9IGZyb20gJ3Z1ZS9kaXN0L3Z1ZS5qcyc7XG5pbXBvcnQgeyBFeHRlbnNpb25DcmVhdG9yLCBUZW1wbGF0ZU1hcCwgSW50ZXJuYWxFeHRlbnNpb25JbmZvIH0gZnJvbSAnLi4vLi4vcHVibGljL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBcbiAgICBUZW1wUHJvZmlsZUtleXMsIFxuICAgIGdldEV4dGVuc2lvbkRpc3QsXG4gICAgZ2V0RWRpdG9yVmVyc2lvbiwgXG4gICAgaXNFeHRlbnNpb25OYW1lRXJyb3IsIFxuICAgIGlzRWRpdG9yVmVyc2lvbkVycm9yLFxuICAgIGdldEZhbGxiYWNrRXh0ZW5zaW9uTmFtZSwgXG59IGZyb20gJy4uLy4uL3B1YmxpYy91dGlscy1idWlsZCc7XG5cbmV4cG9ydCB0eXBlIFRyYW5zbGF0aW9uUGFyYW1ldGVycyA9IFBhcmFtZXRlcnM8dHlwZW9mIEVkaXRvci5JMThuLnQ+O1xuXG4vKipcbiAqIOi/memHjOS4jeeUqOaemuS4vu+8jOaYr+S4uuS8oOWFpei/meS4quWAvOe7mSB2dWVcbiAqL1xuZXhwb3J0IGNvbnN0IExvY2F0aW9uVHlwZSA9IHtcbiAgICAnZXh0ZW5zaW9uLmNyZWF0ZV9wYWNrYWdlLmxvY2FsJzogJzAnLFxufTtcblxuZXhwb3J0IGNvbnN0IEV4dGVuc2lvbkNyZWF0aW9uID0gZGVmaW5lQ29tcG9uZW50KHtcbiAgICBuYW1lOiAnRXh0ZW5zaW9uQ3JlYXRpb25BcHAnLFxuXG4gICAgcHJvcHM6IHtcbiAgICAgICAgcHJlbG9hZEV4dGVuc2lvbkluZm86IHtcbiAgICAgICAgICAgIHR5cGU6IE9iamVjdCBhcyBQcm9wVHlwZTxUZW1wbGF0ZU1hcD4sXG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgYXV0aG9yOiB7IHR5cGU6IFN0cmluZywgZGVmYXVsdDogJycgfSxcbiAgICAgICAgc2hvd0luTWFuYWdlcjogQm9vbGVhbixcbiAgICAgICAgc2hvd0luRm9sZGVyOiBCb29sZWFuLFxuICAgIH0sXG5cbiAgICBkYXRhKCkge1xuICAgICAgICBjb25zdCBjdXJyZW50RXh0ZW5zaW9uID0gJ2V4dGVuc2lvbic7XG5cbiAgICAgICAgLy8g6buY6K6k6YCJ5oupIGV4dGVuc2lvbiDmj5Lku7bnmoQg56ys5LiA5Liq5o+S5Lu25qih5p2/LCBleHRlbnNpb24g5LiA5a6a5pyJ5qih5p2/XG4gICAgICAgIGNvbnN0IGN1cnJlbnRUZW1wbGF0ZSA9IHRoaXMucHJlbG9hZEV4dGVuc2lvbkluZm9bY3VycmVudEV4dGVuc2lvbl0/LnRlbXBsYXRlc1swXSBhcyBJbnRlcm5hbEV4dGVuc2lvbkluZm87XG4gICAgICAgIC8vIOm7mOiupOWQjeensFxuICAgICAgICBjb25zdCBkZWZhdWx0TmFtZSA9IGN1cnJlbnRUZW1wbGF0ZT8uZGVmYXVsdE5hbWUgPz8gZ2V0RmFsbGJhY2tFeHRlbnNpb25OYW1lKCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIExvY2F0aW9uVHlwZSxcbiAgICAgICAgICAgIGV4dGVuc2lvbkluZm9NYXA6IHRoaXMucHJlbG9hZEV4dGVuc2lvbkluZm8gYXMgVGVtcGxhdGVNYXAsXG4gICAgICAgICAgICBjdXJyZW50TG9jYXRpb246ICcwJyxcbiAgICAgICAgICAgIG5hbWU6IGRlZmF1bHROYW1lLFxuICAgICAgICAgICAgY3VycmVudFRlbXBsYXRlOiBjdXJyZW50VGVtcGxhdGUsXG4gICAgICAgICAgICAvKiog5b2T5YmN6YCJ5Lit55qE5qih5p2/5p2l6Ieq5ZOq5Liq5o+S5Lu2ICovXG4gICAgICAgICAgICBjdXJyZW50RXh0ZW5zaW9uOiBjdXJyZW50RXh0ZW5zaW9uLFxuXG4gICAgICAgICAgICBlZGl0b3JWZXJzaW9uOiBnZXRFZGl0b3JWZXJzaW9uKCksXG4gICAgICAgICAgICBleHRlbnNpb25FeGlzdDogZmFsc2UsXG5cbiAgICAgICAgICAgIHRpbWVvdXRJZDoge1xuICAgICAgICAgICAgICAgIHNlbGVjdGlvblNjcm9sbDogbnVsbCBhcyBudW1iZXIgfCBudWxsLFxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYXBwbHlpbmc6IGZhbHNlLCAvLyDmqKHmnb/nlJ/miJDkuK1cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgd3JvbmdOYW1lKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgcmV0dXJuIGlzRXh0ZW5zaW9uTmFtZUVycm9yKHRoaXMubmFtZSk7XG4gICAgICAgIH0sXG4gICAgICAgIHdyb25nQXV0aG9yKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgcmV0dXJuICF0aGlzLmF1dGhvcjtcbiAgICAgICAgfSxcbiAgICAgICAgd3JvbmdFZGl0b3JWZXJzaW9uKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgcmV0dXJuIGlzRWRpdG9yVmVyc2lvbkVycm9yKHRoaXMuZWRpdG9yVmVyc2lvbik7XG4gICAgICAgIH0sXG4gICAgICAgIGRpc3RQYXRoKCk6IHN0cmluZyB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0RXh0ZW5zaW9uRGlzdCh0aGlzLm5hbWUpO1xuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICB3YXRjaDoge1xuICAgICAgICBuYW1lKHZhbHVlLCBvbGRWYWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBvbGRWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlRXh0ZW5zaW9uSXNFeGlzdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjdXJyZW50TG9jYXRpb24odmFsdWUsIG9sZFZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IG9sZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVFeHRlbnNpb25Jc0V4aXN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfSxcblxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOmAieaLqeaooeadv1xuICAgICAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uTmFtZSBcbiAgICAgICAgICogQHBhcmFtIHRlbXBsYXRlIFxuICAgICAgICAgKi9cbiAgICAgICAgc2VsZWN0VGVtcGxhdGUoZXh0ZW5zaW9uTmFtZTogc3RyaW5nLCB0ZW1wbGF0ZTogSW50ZXJuYWxFeHRlbnNpb25JbmZvKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRFeHRlbnNpb24gPSBleHRlbnNpb25OYW1lO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50VGVtcGxhdGUgPSB0ZW1wbGF0ZTtcbiAgICAgICAgICAgIHRoaXMubmFtZSA9IHRlbXBsYXRlLmRlZmF1bHROYW1lID8/IGdldEZhbGxiYWNrRXh0ZW5zaW9uTmFtZSgpO1xuXG4gICAgICAgICAgICAvLyDnoa7kv53mqKHmnb/lh7rnjrDlnKjnlKjmiLfop4bph47kuK1cbiAgICAgICAgICAgIGlmICh0aGlzLnRpbWVvdXRJZC5zZWxlY3Rpb25TY3JvbGwpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dElkLnNlbGVjdGlvblNjcm9sbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnRpbWVvdXRJZC5zZWxlY3Rpb25TY3JvbGwgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGVtcGxhdGVFbCA9ICh0aGlzLiRyZWZzLmNvbnRlbnQgYXMgSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQpPy5xdWVyeVNlbGVjdG9yKFxuICAgICAgICAgICAgICAgICAgICBgW2RhdGEtdGVtcGxhdGUtaWQ9XCIke3RlbXBsYXRlLmlkfVwiXWAsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBpZiAodGVtcGxhdGVFbCkge1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZUVsLnNjcm9sbEludG9WaWV3KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrOiAnbmVhcmVzdCcsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXRJZC5zZWxlY3Rpb25TY3JvbGwgPSBudWxsO1xuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOiOt+WPluaMh+WumuaPkuS7tuWQjeeahOWPr+eUqOaooeadv1xuICAgICAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uTmFtZVxuICAgICAgICAgKiBAcGFyYW0gcmF3UGF0aCDkvKDlgLzml7blr7vmib7ljLnphY0gcmF3UGF0aCDnmoTmqKHmnb/vvIzlkKbliJnov5Tlm57nrKzkuIDkuKrmqKHmnb/vvIjlpoLmnpzlrZjlnKjvvIlcbiAgICAgICAgICogQHJldHVybnNcbiAgICAgICAgICovXG4gICAgICAgIGdldEF2YWlsYWJsZVRlbXBsYXRlKGV4dGVuc2lvbk5hbWU6IHN0cmluZywgcmF3UGF0aD86IHN0cmluZykge1xuICAgICAgICAgICAgLy8g5a+75om+5oyH5a6a5o+S5Lu25ZCN5rOo5YaM6L+b5p2l55qE5qih5p2/6YCJ6aG5XG4gICAgICAgICAgICBpZiAoIXRoaXMuZXh0ZW5zaW9uSW5mb01hcFtleHRlbnNpb25OYW1lXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZXMgPSB0aGlzLmV4dGVuc2lvbkluZm9NYXBbZXh0ZW5zaW9uTmFtZV0udGVtcGxhdGVzO1xuICAgICAgICAgICAgLy8gcmF3UGF0aCDmmK/mj5Lku7blnKjoh6rouqsgcGFja2FnZS5qc29uIOS4reWjsOaYjueahCB0ZW1wbGF0ZSDnmoTot6/lvoTvvIjljp/lp4vlgLzvvIlcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmF3UGF0aCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3VuZCA9IHRlbXBsYXRlcy5maW5kKChpdGVtKSA9PiBpdGVtLnJhd1BhdGggPT09IHJhd1BhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHJhd1BhdGgg5om+5LiN5Yiw77yM5bCd6K+V6L+U5Zue56ys5LiA5Liq5qih5p2/XG4gICAgICAgICAgICBpZiAodGVtcGxhdGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGVtcGxhdGVzWzBdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICog5Yqg6L295omA5pyJIGNyZWF0b3Ig5qih5Z2XXG4gICAgICAgICAqIEBwYXJhbSBvcHRpb25zIFxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgbG9hZEFsbENyZWF0b3JNb2R1bGUob3B0aW9ucz86IHsgZm9yY2U/OiBib29sZWFuOyB9KSB7XG4gICAgICAgICAgICAvLyDpu5jorqTlj4LmlbBcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICAgICAgb3B0aW9ucy5mb3JjZSA9IG9wdGlvbnMuZm9yY2UgfHwgZmFsc2U7XG5cbiAgICAgICAgICAgIC8vIOiOt+WPluaJgOacieaPkuS7tuS/oeaBr1xuICAgICAgICAgICAgY29uc3QgZXh0ZW5zaW9uSW5mb01hcCA9IChhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFxuICAgICAgICAgICAgICAgICdleHRlbnNpb24nLFxuICAgICAgICAgICAgICAgICdnZXQtZXh0ZW5zaW9uLWluZm8tbWFwJyxcbiAgICAgICAgICAgICkpIGFzIFRlbXBsYXRlTWFwO1xuXG4gICAgICAgICAgICB0aGlzLmV4dGVuc2lvbkluZm9NYXAgPSB7fTtcblxuICAgICAgICAgICAgLy8g6YGN5Y6G5omA5pyJ5o+S5Lu2XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBleHRlbnNpb25JbmZvTWFwKSB7XG4gICAgICAgICAgICAgICAgLy8g5bey5Yqg6L296L+H55qE5o+S5Lu26Lez6L+HXG4gICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLmZvcmNlICYmIHRoaXMuZXh0ZW5zaW9uSW5mb01hcFtrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBleHRlbnNpb25JbmZvTWFwW2tleV07XG4gICAgICAgICAgICAgICAgdGhpcy4kc2V0KHRoaXMuZXh0ZW5zaW9uSW5mb01hcCwga2V5LCBpbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICog5Y246L295omA5pyJIGNyZWF0b3Ig5qih5Z2XXG4gICAgICAgICAqIEBwYXJhbSBvcHRpb25zIFxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgdW5sb2FkQWxsQ3JlYXRvck1vZHVsZShpbmZvPzogRWRpdG9yLkludGVyZmFjZS5QYWNrYWdlSW5mbykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5leHRlbnNpb25JbmZvTWFwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGluZm8gJiYgaW5mby5uYW1lICE9PSBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy4kZGVsZXRlKHRoaXMuZXh0ZW5zaW9uSW5mb01hcCwga2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICog5o+S5Lu25ZCv55So5pe25Yqg6L29IGNyZWF0b3Ig5qih5Z2XXG4gICAgICAgICAqIEBwYXJhbSBpbmZvIFxuICAgICAgICAgKi9cbiAgICAgICAgYXN5bmMgb25QbHVnaW5FbmFibGUoaW5mbzogRWRpdG9yLkludGVyZmFjZS5QYWNrYWdlSW5mbykge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkQWxsQ3JlYXRvck1vZHVsZSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmj5Lku7bnpoHnlKjml7bljbjovb0gY3JlYXRvciDmqKHlnZdcbiAgICAgICAgICogQHBhcmFtIGluZm8gXG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBvblBsdWdpbkRpc2FibGUoaW5mbzogRWRpdG9yLkludGVyZmFjZS5QYWNrYWdlSW5mbykge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy51bmxvYWRBbGxDcmVhdG9yTW9kdWxlKGluZm8pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDliKTmlq3lr7nosaHmmK/lkKbkuLrnqbrlr7nosaFcbiAgICAgICAgICogQHBhcmFtIG9iaiBcbiAgICAgICAgICogQHJldHVybnMgXG4gICAgICAgICAqL1xuICAgICAgICBpc0VtcHR5T2JqZWN0KG9iajogb2JqZWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPT09IDA7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOe/u+ivkVxuICAgICAgICAgKiBAcGFyYW0gYXJncyBcbiAgICAgICAgICogQHJldHVybnMgXG4gICAgICAgICAqL1xuICAgICAgICB0KC4uLmFyZ3M6IFRyYW5zbGF0aW9uUGFyYW1ldGVycykge1xuICAgICAgICAgICAgcmV0dXJuIEVkaXRvci5JMThuLnQoLi4uYXJncyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOaLt+i0neaPkuS7tuaooeadv+WIsCB0ZW1wRGly77yM5oiQ5Yqf5ZCO5ou36LSd5YaF5a655Yiw5oyH5a6a55uu5b2V44CCXG4gICAgICAgICAqIEByZXR1cm5zXG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBhcHBseSgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmFwcGx5aW5nKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd0ZW1wbGF0ZSBpcyBhcHBseWluZywgcGxlYXNlIHdhaXQgZm9yIGEgbW9tZW50Jyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuYXBwbHlpbmcgPSB0cnVlO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuUHJvZmlsZS5zZXRUZW1wKCdleHRlbnNpb24nLCBUZW1wUHJvZmlsZUtleXMuYXV0aG9yLCB0aGlzLmF1dGhvcik7XG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlByb2ZpbGUuc2V0VGVtcCgnZXh0ZW5zaW9uJywgVGVtcFByb2ZpbGVLZXlzLnNob3dJbk1hbmFnZXIsIHRoaXMuc2hvd0luTWFuYWdlcik7XG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlByb2ZpbGUuc2V0VGVtcCgnZXh0ZW5zaW9uJywgVGVtcFByb2ZpbGVLZXlzLnNob3dJbkZvbGRlciwgdGhpcy5zaG93SW5Gb2xkZXIpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnZXh0ZW5zaW9uJywgJ2NyZWF0ZS1leHRlbnNpb24tdGVtcGxhdGUnLCB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IHRoaXMuY3VycmVudEV4dGVuc2lvbixcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVJZDogdGhpcy5jdXJyZW50VGVtcGxhdGUuaWQsXG4gICAgICAgICAgICAgICAgICAgIGRpc3Q6IHRoaXMuZGlzdFBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGF1dGhvcjogdGhpcy5hdXRob3IsXG4gICAgICAgICAgICAgICAgICAgIGVkaXRvclZlcnNpb246IHRoaXMuZWRpdG9yVmVyc2lvbixcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBzaG93SW5Gb2xkZXI6IHRoaXMuc2hvd0luRm9sZGVyLFxuICAgICAgICAgICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5UYXNrLmFkZE5vdGljZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogdGhpcy50KCdleHRlbnNpb24uY3JlYXRlX3BhY2thZ2UuY3JlYXRlX2V4dGVuc2lvbl9zdWNjZXNzZnVsJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiB0aGlzLmRpc3RQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lb3V0OiA1MDAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N1Y2Nlc3MnLFxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDlu7bov58gMjAwIG1zIOaJjeWFs+mXremdouadv++8jOmYsuatouWBtueOsOeahCBzaG93SXRlbUluRm9sZGVyIOayoeWHuueOsOeahOmXrumimFxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwbHlpbmcgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlBhbmVsLmhhcygnZXh0ZW5zaW9uLmNyZWF0ZScpLnRoZW4oKHIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuUGFuZWwuY2xvc2UoJ2V4dGVuc2lvbi5jcmVhdGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMjAwKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGx5aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5EaWFsb2cuZXJyb3IocmVzdWx0Lm1zZywge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGBDcmVhdG9yIEV4dGVuc2lvbmAsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IHJlc3VsdC5tc2csXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUV4dGVuc2lvbklzRXhpc3QoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwbHlpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuRGlhbG9nLmVycm9yKGVycm9yLm1lc3NhZ2UsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBlcnJvci5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBlcnJvci5zdGFjayxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlRXh0ZW5zaW9uSXNFeGlzdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmm7TmlrDmj5Lku7bmmK/lkKblrZjlnKhcbiAgICAgICAgICovXG4gICAgICAgIHVwZGF0ZUV4dGVuc2lvbklzRXhpc3QoKSB7XG4gICAgICAgICAgICB0aGlzLmV4dGVuc2lvbkV4aXN0ID0gdGhpcy5uYW1lICE9PSAnJyAmJiBleGlzdHNTeW5jKHRoaXMuZGlzdFBhdGgpO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgdGVtcGxhdGU6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL3N0YXRpYycsICcvdGVtcGxhdGUvY3JlYXRlL2luZGV4Lmh0bWwnKSwgJ3V0ZjgnKSxcbn0pO1xuIl19