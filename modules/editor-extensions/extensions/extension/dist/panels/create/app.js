"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionCreation = exports.LocationType = exports.TempProfileKeys = void 0;
const vue_js_1 = require("vue/dist/vue.js");
const electron_1 = require("electron");
const fs_1 = require("fs");
const path_1 = require("path");
const semver_1 = require("semver");
exports.TempProfileKeys = Object.freeze({
    author: 'create_package_author',
    showInManager: 'create_package_show_in_manager',
    showInFolder: 'create_package_show_in_folder',
});
/**
 * 这里不用枚举，是为传入这个值给 vue
 */
exports.LocationType = {
    'extension.create_package.local': '0',
};
// 插件名称作为文件夹名称，需要校验非法字符
const invalidFolderNamePattern = /[<>:"|?*]/;
// 插件名称需符合的规范
const extensionNamePattern = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
const getFallbackExtensionName = () => `extension-${Date.now()}`;
exports.ExtensionCreation = vue_js_1.defineComponent({
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
        // 默认选择 extension 插件的 第一个插件模板,extension 一定有模板
        const currentTemplate = this.preloadExtensionInfo[currentExtension]?.templates[0];
        const defaultName = currentTemplate?.defaultName ?? getFallbackExtensionName();
        return {
            LocationType: exports.LocationType,
            extensionInfoMap: this.preloadExtensionInfo,
            currentLocation: '0',
            name: defaultName,
            currentTemplate: currentTemplate,
            /** 当前选中的模板来自哪个插件 */
            currentExtension: currentExtension,
            editorVersion: `>=${Editor.App.version}`,
            extensionExist: false,
            timeoutId: {
                selectionScroll: null,
            },
            applying: false, // 模板生成中
        };
    },
    computed: {
        wrongName() {
            const name = this.name;
            const includePoint = /[.]/g;
            return invalidFolderNamePattern.test(name) || !extensionNamePattern.test(name) || includePoint.test(name);
        },
        wrongAuthor() {
            return !this.author;
        },
        wrongEditorVersion() {
            return !semver_1.valid(semver_1.coerce(this.editorVersion)) || semver_1.satisfies(semver_1.valid(semver_1.coerce(this.editorVersion)) || '', '< 3.0.0');
        },
        distPath() {
            return path_1.join(Editor.Project.path, 'extensions', this.name);
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
        selectTemplate(extensionName, template) {
            this.currentExtension = extensionName;
            this.currentTemplate = template;
            this.name = template.defaultName ?? getFallbackExtensionName();
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
         *
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
        async loadAllCreatorModule(options) {
            const newExtensionInfoMap = (await Editor.Message.request('extension', 'get-extension-info-map'));
            const loadedCreator = new Set();
            for (const key in newExtensionInfoMap) {
                if (options?.force || !this.extensionInfoMap[key]) {
                    for (let index = 0; index < newExtensionInfoMap[key].templates.length; index++) {
                        const templateInfo = newExtensionInfoMap[key].templates[index];
                        if (templateInfo.creator) {
                            if (!loadedCreator.has(templateInfo.creator)) {
                                try {
                                    const creator = require(templateInfo.creator);
                                    await creator.load?.();
                                }
                                catch (error) {
                                    console.error(`[extension]: Load extension creator with name ${templateInfo.name} failed`, error);
                                }
                                loadedCreator.add(templateInfo.creator);
                            }
                        }
                    }
                }
            }
            this.extensionInfoMap = newExtensionInfoMap;
        },
        async unloadAllCreatorModule(options) {
            const loadedCreator = new Set();
            for (const key in this.extensionInfoMap) {
                if (options?.force || options?.info?.name === key) {
                    for (let index = 0; index < this.extensionInfoMap[key].templates.length; index++) {
                        const templateInfo = this.extensionInfoMap[key].templates[index];
                        if (templateInfo.creator) {
                            if (!loadedCreator.has(templateInfo.creator)) {
                                try {
                                    const creator = require(templateInfo.creator);
                                    await creator.unload?.();
                                }
                                catch (error) {
                                    console.error(`[extension]: Load extension creator with name ${templateInfo.name} failed`, error);
                                }
                                loadedCreator.add(templateInfo.creator);
                            }
                        }
                    }
                }
            }
            if (options?.info?.name) {
                this.$delete(this.extensionInfoMap, options?.info?.name);
            }
        },
        async onPluginEnable(info) {
            await this.loadAllCreatorModule();
        },
        async onPluginDisable(info) {
            await this.unloadAllCreatorModule({ info });
        },
        isEmptyObject(obj) {
            return Object.keys(obj).length === 0;
        },
        t(...args) {
            return Editor.I18n.t(...args);
        },
        /**
         * 拷贝插件模板到tempDir，成功后拷贝内容到指定目录。
         * @returns
         */
        async apply() {
            if (this.applying) {
                throw new Error('template is applying, please wait for a moment');
            }
            this.applying = true;
            try {
                await Editor.Profile.setTemp('extension', exports.TempProfileKeys.author, this.author);
                await Editor.Profile.setTemp('extension', exports.TempProfileKeys.showInManager, this.showInManager);
                await Editor.Profile.setTemp('extension', exports.TempProfileKeys.showInFolder, this.showInFolder);
                const buildModulePath = this.currentTemplate?.creator ?? this.extensionInfoMap['extension'].templates[0].creator;
                const buildModule = require(buildModulePath);
                const result = await buildModule.methods.create({
                    author: this.author,
                    dist: this.distPath,
                    editorVersion: this.editorVersion,
                    name: this.name,
                    template: this.currentTemplate,
                });
                if (result.success) {
                    await Editor.Package.register(this.distPath);
                    Editor.Task.addNotice({
                        title: this.name,
                        message: this.t('extension.create_package.create_extension_successful', {
                            name: this.name,
                            path: this.distPath,
                        }),
                        timeout: 5000,
                        type: 'success',
                    });
                    if (this.showInFolder) {
                        if (result.fileDisplayedToFolder) {
                            electron_1.shell.showItemInFolder(result.fileDisplayedToFolder);
                        }
                        else {
                            electron_1.shell.showItemInFolder(this.distPath);
                        }
                    }
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
                else if (result.error) {
                    this.applying = false;
                    Editor.Dialog.error(result.error.message, {
                        title: result.error.name,
                        detail: result.error.stack,
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
        updateExtensionIsExist() {
            this.extensionExist = this.name !== '' && fs_1.existsSync(this.distPath);
        },
    },
    template: fs_1.readFileSync(path_1.join(__dirname, '../../../static', '/template/create/index.html'), 'utf8'),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc291cmNlL3BhbmVscy9jcmVhdGUvYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDRDQUE0RDtBQUM1RCx1Q0FBaUM7QUFDakMsMkJBQThDO0FBQzlDLCtCQUE0QjtBQUM1QixtQ0FBa0Q7QUFLckMsUUFBQSxlQUFlLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUN6QyxNQUFNLEVBQUUsdUJBQXVCO0lBQy9CLGFBQWEsRUFBRSxnQ0FBZ0M7SUFDL0MsWUFBWSxFQUFFLCtCQUErQjtDQUNoRCxDQUFDLENBQUM7QUFFSDs7R0FFRztBQUNVLFFBQUEsWUFBWSxHQUFHO0lBQ3hCLGdDQUFnQyxFQUFFLEdBQUc7Q0FDeEMsQ0FBQztBQUVGLHVCQUF1QjtBQUN2QixNQUFNLHdCQUF3QixHQUFHLFdBQVcsQ0FBQztBQUM3QyxhQUFhO0FBQ2IsTUFBTSxvQkFBb0IsR0FBRyw0REFBNEQsQ0FBQztBQUUxRixNQUFNLHdCQUF3QixHQUFHLEdBQUcsRUFBRSxDQUFDLGFBQWEsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUM7QUFFcEQsUUFBQSxpQkFBaUIsR0FBRyx3QkFBZSxDQUFDO0lBQzdDLElBQUksRUFBRSxzQkFBc0I7SUFDNUIsS0FBSyxFQUFFO1FBQ0gsb0JBQW9CLEVBQUU7WUFDbEIsSUFBSSxFQUFFLE1BQStCO1lBQ3JDLFFBQVEsRUFBRSxJQUFJO1NBQ2pCO1FBQ0QsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFO1FBQ3JDLGFBQWEsRUFBRSxPQUFPO1FBQ3RCLFlBQVksRUFBRSxPQUFPO0tBQ3hCO0lBQ0QsSUFBSTtRQUNBLE1BQU0sZ0JBQWdCLEdBQUcsV0FBVyxDQUFDO1FBQ3JDLDZDQUE2QztRQUM3QyxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsZ0JBQWdCLENBQUMsRUFB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RUFBRSxHQUFHLENBQUMsQ0FBQztpQkFDWDtxQkFBTSxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUU7b0JBQ3JCLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO29CQUN0QixNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRTt3QkFDdEMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSTt3QkFDeEIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSztxQkFDN0IsQ0FBQyxDQUFDO29CQUNILElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO2lCQUNqQzthQUNKO1lBQUMsT0FBTyxLQUFLLEVBQUU7Z0JBQ1osSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7Z0JBQ3RCLElBQUksS0FBSyxZQUFZLEtBQUssRUFBRTtvQkFDeEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRTt3QkFDL0IsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJO3dCQUNqQixNQUFNLEVBQUUsS0FBSyxDQUFDLEtBQUs7cUJBQ3RCLENBQUMsQ0FBQztpQkFDTjtnQkFDRCxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQzthQUNqQztRQUNMLENBQUM7UUFDRCxzQkFBc0I7WUFDbEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsSUFBSSxLQUFLLEVBQUUsSUFBSSxlQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hFLENBQUM7S0FDSjtJQUNELFFBQVEsRUFBRSxpQkFBWSxDQUFDLFdBQUksQ0FBQyxTQUFTLEVBQUUsaUJBQWlCLEVBQUUsNkJBQTZCLENBQUMsRUFBRSxNQUFNLENBQUM7Q0FDcEcsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUHJvcFR5cGUsIGRlZmluZUNvbXBvbmVudCB9IGZyb20gJ3Z1ZS9kaXN0L3Z1ZS5qcyc7XG5pbXBvcnQgeyBzaGVsbCB9IGZyb20gJ2VsZWN0cm9uJztcbmltcG9ydCB7IGV4aXN0c1N5bmMsIHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGNvZXJjZSwgc2F0aXNmaWVzLCB2YWxpZCB9IGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgeyBFeHRlbnNpb25DcmVhdG9yLCBUZW1wbGF0ZU1hcCwgSW50ZXJuYWxFeHRlbnNpb25JbmZvIH0gZnJvbSAnLi4vLi4vcHVibGljL2ludGVyZmFjZSc7XG5cbmV4cG9ydCB0eXBlIFRyYW5zbGF0aW9uUGFyYW1ldGVycyA9IFBhcmFtZXRlcnM8dHlwZW9mIEVkaXRvci5JMThuLnQ+O1xuXG5leHBvcnQgY29uc3QgVGVtcFByb2ZpbGVLZXlzID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgYXV0aG9yOiAnY3JlYXRlX3BhY2thZ2VfYXV0aG9yJyxcbiAgICBzaG93SW5NYW5hZ2VyOiAnY3JlYXRlX3BhY2thZ2Vfc2hvd19pbl9tYW5hZ2VyJyxcbiAgICBzaG93SW5Gb2xkZXI6ICdjcmVhdGVfcGFja2FnZV9zaG93X2luX2ZvbGRlcicsXG59KTtcblxuLyoqXG4gKiDov5nph4zkuI3nlKjmnprkuL7vvIzmmK/kuLrkvKDlhaXov5nkuKrlgLznu5kgdnVlXG4gKi9cbmV4cG9ydCBjb25zdCBMb2NhdGlvblR5cGUgPSB7XG4gICAgJ2V4dGVuc2lvbi5jcmVhdGVfcGFja2FnZS5sb2NhbCc6ICcwJyxcbn07XG5cbi8vIOaPkuS7tuWQjeensOS9nOS4uuaWh+S7tuWkueWQjeensO+8jOmcgOimgeagoemqjOmdnuazleWtl+esplxuY29uc3QgaW52YWxpZEZvbGRlck5hbWVQYXR0ZXJuID0gL1s8PjpcInw/Kl0vO1xuLy8g5o+S5Lu25ZCN56ew6ZyA56ym5ZCI55qE6KeE6IyDXG5jb25zdCBleHRlbnNpb25OYW1lUGF0dGVybiA9IC9eKD86QFthLXowLTktKn5dW2EtejAtOS0qLl9+XSpcXC8pP1thLXowLTktfl1bYS16MC05LS5ffl0qJC87XG5cbmNvbnN0IGdldEZhbGxiYWNrRXh0ZW5zaW9uTmFtZSA9ICgpID0+IGBleHRlbnNpb24tJHtEYXRlLm5vdygpfWA7XG5cbmV4cG9ydCBjb25zdCBFeHRlbnNpb25DcmVhdGlvbiA9IGRlZmluZUNvbXBvbmVudCh7XG4gICAgbmFtZTogJ0V4dGVuc2lvbkNyZWF0aW9uQXBwJyxcbiAgICBwcm9wczoge1xuICAgICAgICBwcmVsb2FkRXh0ZW5zaW9uSW5mbzoge1xuICAgICAgICAgICAgdHlwZTogT2JqZWN0IGFzIFByb3BUeXBlPFRlbXBsYXRlTWFwPixcbiAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBhdXRob3I6IHsgdHlwZTogU3RyaW5nLCBkZWZhdWx0OiAnJyB9LFxuICAgICAgICBzaG93SW5NYW5hZ2VyOiBCb29sZWFuLFxuICAgICAgICBzaG93SW5Gb2xkZXI6IEJvb2xlYW4sXG4gICAgfSxcbiAgICBkYXRhKCkge1xuICAgICAgICBjb25zdCBjdXJyZW50RXh0ZW5zaW9uID0gJ2V4dGVuc2lvbic7XG4gICAgICAgIC8vIOm7mOiupOmAieaLqSBleHRlbnNpb24g5o+S5Lu255qEIOesrOS4gOS4quaPkuS7tuaooeadvyxleHRlbnNpb24g5LiA5a6a5pyJ5qih5p2/XG4gICAgICAgIGNvbnN0IGN1cnJlbnRUZW1wbGF0ZSA9IHRoaXMucHJlbG9hZEV4dGVuc2lvbkluZm9bY3VycmVudEV4dGVuc2lvbl0/LnRlbXBsYXRlc1swXSBhcyBJbnRlcm5hbEV4dGVuc2lvbkluZm87XG4gICAgICAgIGNvbnN0IGRlZmF1bHROYW1lID0gY3VycmVudFRlbXBsYXRlPy5kZWZhdWx0TmFtZSA/PyBnZXRGYWxsYmFja0V4dGVuc2lvbk5hbWUoKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgTG9jYXRpb25UeXBlLFxuICAgICAgICAgICAgZXh0ZW5zaW9uSW5mb01hcDogdGhpcy5wcmVsb2FkRXh0ZW5zaW9uSW5mbyBhcyBUZW1wbGF0ZU1hcCxcbiAgICAgICAgICAgIGN1cnJlbnRMb2NhdGlvbjogJzAnLFxuICAgICAgICAgICAgbmFtZTogZGVmYXVsdE5hbWUsXG4gICAgICAgICAgICBjdXJyZW50VGVtcGxhdGU6IGN1cnJlbnRUZW1wbGF0ZSxcbiAgICAgICAgICAgIC8qKiDlvZPliY3pgInkuK3nmoTmqKHmnb/mnaXoh6rlk6rkuKrmj5Lku7YgKi9cbiAgICAgICAgICAgIGN1cnJlbnRFeHRlbnNpb246IGN1cnJlbnRFeHRlbnNpb24sXG5cbiAgICAgICAgICAgIGVkaXRvclZlcnNpb246IGA+PSR7RWRpdG9yLkFwcC52ZXJzaW9ufWAsXG4gICAgICAgICAgICBleHRlbnNpb25FeGlzdDogZmFsc2UsXG5cbiAgICAgICAgICAgIHRpbWVvdXRJZDoge1xuICAgICAgICAgICAgICAgIHNlbGVjdGlvblNjcm9sbDogbnVsbCBhcyBudW1iZXIgfCBudWxsLFxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYXBwbHlpbmc6IGZhbHNlLCAvLyDmqKHmnb/nlJ/miJDkuK1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGNvbXB1dGVkOiB7XG4gICAgICAgIHdyb25nTmFtZSgpOiBib29sZWFuIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLm5hbWU7XG4gICAgICAgICAgICBjb25zdCBpbmNsdWRlUG9pbnQgPSAvWy5dL2c7XG4gICAgICAgICAgICByZXR1cm4gaW52YWxpZEZvbGRlck5hbWVQYXR0ZXJuLnRlc3QobmFtZSkgfHwgIWV4dGVuc2lvbk5hbWVQYXR0ZXJuLnRlc3QobmFtZSkgfHwgaW5jbHVkZVBvaW50LnRlc3QobmFtZSk7XG4gICAgICAgIH0sXG4gICAgICAgIHdyb25nQXV0aG9yKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgcmV0dXJuICF0aGlzLmF1dGhvcjtcbiAgICAgICAgfSxcbiAgICAgICAgd3JvbmdFZGl0b3JWZXJzaW9uKCk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgcmV0dXJuICF2YWxpZChjb2VyY2UodGhpcy5lZGl0b3JWZXJzaW9uKSkgfHwgc2F0aXNmaWVzKHZhbGlkKGNvZXJjZSh0aGlzLmVkaXRvclZlcnNpb24pKSB8fCAnJywgJzwgMy4wLjAnKTtcbiAgICAgICAgfSxcbiAgICAgICAgZGlzdFBhdGgoKTogc3RyaW5nIHtcbiAgICAgICAgICAgIHJldHVybiBqb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsICdleHRlbnNpb25zJywgdGhpcy5uYW1lKTtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHdhdGNoOiB7XG4gICAgICAgIG5hbWUodmFsdWUsIG9sZFZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IG9sZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVFeHRlbnNpb25Jc0V4aXN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGN1cnJlbnRMb2NhdGlvbih2YWx1ZSwgb2xkVmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gb2xkVmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUV4dGVuc2lvbklzRXhpc3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9LFxuXG4gICAgbWV0aG9kczoge1xuICAgICAgICBzZWxlY3RUZW1wbGF0ZShleHRlbnNpb25OYW1lOiBzdHJpbmcsIHRlbXBsYXRlOiBJbnRlcm5hbEV4dGVuc2lvbkluZm8pIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEV4dGVuc2lvbiA9IGV4dGVuc2lvbk5hbWU7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRUZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgICAgICAgICAgdGhpcy5uYW1lID0gdGVtcGxhdGUuZGVmYXVsdE5hbWUgPz8gZ2V0RmFsbGJhY2tFeHRlbnNpb25OYW1lKCk7XG5cbiAgICAgICAgICAgIC8vIOehruS/neaooeadv+WHuueOsOWcqOeUqOaIt+inhumHjuS4rVxuICAgICAgICAgICAgaWYgKHRoaXMudGltZW91dElkLnNlbGVjdGlvblNjcm9sbCkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy50aW1lb3V0SWQuc2VsZWN0aW9uU2Nyb2xsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMudGltZW91dElkLnNlbGVjdGlvblNjcm9sbCA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZUVsID0gKHRoaXMuJHJlZnMuY29udGVudCBhcyBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCk/LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgICAgICAgICAgIGBbZGF0YS10ZW1wbGF0ZS1pZD1cIiR7dGVtcGxhdGUuaWR9XCJdYCxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGlmICh0ZW1wbGF0ZUVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlRWwuc2Nyb2xsSW50b1ZpZXcoe1xuICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2s6ICduZWFyZXN0JyxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMudGltZW91dElkLnNlbGVjdGlvblNjcm9sbCA9IG51bGw7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSBleHRlbnNpb25OYW1lXG4gICAgICAgICAqIEBwYXJhbSByYXdQYXRoIOS8oOWAvOaXtuWvu+aJvuWMuemFjSByYXdQYXRoIOeahOaooeadv++8jOWQpuWImei/lOWbnuesrOS4gOS4quaooeadv++8iOWmguaenOWtmOWcqO+8iVxuICAgICAgICAgKiBAcmV0dXJuc1xuICAgICAgICAgKi9cbiAgICAgICAgZ2V0QXZhaWxhYmxlVGVtcGxhdGUoZXh0ZW5zaW9uTmFtZTogc3RyaW5nLCByYXdQYXRoPzogc3RyaW5nKSB7XG4gICAgICAgICAgICAvLyDlr7vmib7mjIflrprmj5Lku7blkI3ms6jlhozov5vmnaXnmoTmqKHmnb/pgInpoblcbiAgICAgICAgICAgIGlmICghdGhpcy5leHRlbnNpb25JbmZvTWFwW2V4dGVuc2lvbk5hbWVdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlcyA9IHRoaXMuZXh0ZW5zaW9uSW5mb01hcFtleHRlbnNpb25OYW1lXS50ZW1wbGF0ZXM7XG4gICAgICAgICAgICAvLyByYXdQYXRoIOaYr+aPkuS7tuWcqOiHqui6qyBwYWNrYWdlLmpzb24g5Lit5aOw5piO55qEIHRlbXBsYXRlIOeahOi3r+W+hO+8iOWOn+Wni+WAvO+8iVxuICAgICAgICAgICAgaWYgKHR5cGVvZiByYXdQYXRoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gdGVtcGxhdGVzLmZpbmQoKGl0ZW0pID0+IGl0ZW0ucmF3UGF0aCA9PT0gcmF3UGF0aCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gcmF3UGF0aCDmib7kuI3liLDvvIzlsJ3or5Xov5Tlm57nrKzkuIDkuKrmqKHmnb9cbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZXNbMF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9LFxuICAgICAgICBhc3luYyBsb2FkQWxsQ3JlYXRvck1vZHVsZShvcHRpb25zPzogeyBmb3JjZT86IGJvb2xlYW47IGluZm8/OiBFZGl0b3IuSW50ZXJmYWNlLlBhY2thZ2VJbmZvIH0pIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld0V4dGVuc2lvbkluZm9NYXAgPSAoYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcbiAgICAgICAgICAgICAgICAnZXh0ZW5zaW9uJyxcbiAgICAgICAgICAgICAgICAnZ2V0LWV4dGVuc2lvbi1pbmZvLW1hcCcsXG4gICAgICAgICAgICApKSBhcyBUZW1wbGF0ZU1hcDtcbiAgICAgICAgICAgIGNvbnN0IGxvYWRlZENyZWF0b3I6IFNldDxzdHJpbmc+ID0gbmV3IFNldCgpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbmV3RXh0ZW5zaW9uSW5mb01hcCkge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zPy5mb3JjZSB8fCAhdGhpcy5leHRlbnNpb25JbmZvTWFwW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IG5ld0V4dGVuc2lvbkluZm9NYXBba2V5XS50ZW1wbGF0ZXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZUluZm8gPSBuZXdFeHRlbnNpb25JbmZvTWFwW2tleV0udGVtcGxhdGVzW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0ZW1wbGF0ZUluZm8uY3JlYXRvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbG9hZGVkQ3JlYXRvci5oYXModGVtcGxhdGVJbmZvLmNyZWF0b3IpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjcmVhdG9yID0gcmVxdWlyZSh0ZW1wbGF0ZUluZm8uY3JlYXRvcikgYXMgRXh0ZW5zaW9uQ3JlYXRvcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNyZWF0b3IubG9hZD8uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBbZXh0ZW5zaW9uXTogTG9hZCBleHRlbnNpb24gY3JlYXRvciB3aXRoIG5hbWUgJHt0ZW1wbGF0ZUluZm8ubmFtZX0gZmFpbGVkYCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGVkQ3JlYXRvci5hZGQodGVtcGxhdGVJbmZvLmNyZWF0b3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZXh0ZW5zaW9uSW5mb01hcCA9IG5ld0V4dGVuc2lvbkluZm9NYXA7XG4gICAgICAgIH0sXG4gICAgICAgIGFzeW5jIHVubG9hZEFsbENyZWF0b3JNb2R1bGUob3B0aW9ucz86IHsgZm9yY2U/OiBib29sZWFuOyBpbmZvPzogRWRpdG9yLkludGVyZmFjZS5QYWNrYWdlSW5mbyB9KSB7XG4gICAgICAgICAgICBjb25zdCBsb2FkZWRDcmVhdG9yOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMuZXh0ZW5zaW9uSW5mb01hcCkge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zPy5mb3JjZSB8fCBvcHRpb25zPy5pbmZvPy5uYW1lID09PSBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMuZXh0ZW5zaW9uSW5mb01hcFtrZXldLnRlbXBsYXRlcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlSW5mbyA9IHRoaXMuZXh0ZW5zaW9uSW5mb01hcFtrZXldLnRlbXBsYXRlc1tpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGVtcGxhdGVJbmZvLmNyZWF0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWxvYWRlZENyZWF0b3IuaGFzKHRlbXBsYXRlSW5mby5jcmVhdG9yKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY3JlYXRvciA9IHJlcXVpcmUodGVtcGxhdGVJbmZvLmNyZWF0b3IpIGFzIHVua25vd24gYXMgRXh0ZW5zaW9uQ3JlYXRvcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNyZWF0b3IudW5sb2FkPy4oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYFtleHRlbnNpb25dOiBMb2FkIGV4dGVuc2lvbiBjcmVhdG9yIHdpdGggbmFtZSAke3RlbXBsYXRlSW5mby5uYW1lfSBmYWlsZWRgLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkZWRDcmVhdG9yLmFkZCh0ZW1wbGF0ZUluZm8uY3JlYXRvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9wdGlvbnM/LmluZm8/Lm5hbWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiRkZWxldGUodGhpcy5leHRlbnNpb25JbmZvTWFwLCBvcHRpb25zPy5pbmZvPy5uYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgYXN5bmMgb25QbHVnaW5FbmFibGUoaW5mbzogRWRpdG9yLkludGVyZmFjZS5QYWNrYWdlSW5mbykge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkQWxsQ3JlYXRvck1vZHVsZSgpO1xuICAgICAgICB9LFxuICAgICAgICBhc3luYyBvblBsdWdpbkRpc2FibGUoaW5mbzogRWRpdG9yLkludGVyZmFjZS5QYWNrYWdlSW5mbykge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy51bmxvYWRBbGxDcmVhdG9yTW9kdWxlKHsgaW5mbyB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgaXNFbXB0eU9iamVjdChvYmo6IG9iamVjdCkge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAwO1xuICAgICAgICB9LFxuICAgICAgICB0KC4uLmFyZ3M6IFRyYW5zbGF0aW9uUGFyYW1ldGVycykge1xuICAgICAgICAgICAgcmV0dXJuIEVkaXRvci5JMThuLnQoLi4uYXJncyk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDmi7fotJ3mj5Lku7bmqKHmnb/liLB0ZW1wRGly77yM5oiQ5Yqf5ZCO5ou36LSd5YaF5a655Yiw5oyH5a6a55uu5b2V44CCXG4gICAgICAgICAqIEByZXR1cm5zXG4gICAgICAgICAqL1xuICAgICAgICBhc3luYyBhcHBseSgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmFwcGx5aW5nKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd0ZW1wbGF0ZSBpcyBhcHBseWluZywgcGxlYXNlIHdhaXQgZm9yIGEgbW9tZW50Jyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuYXBwbHlpbmcgPSB0cnVlO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuUHJvZmlsZS5zZXRUZW1wKCdleHRlbnNpb24nLCBUZW1wUHJvZmlsZUtleXMuYXV0aG9yLCB0aGlzLmF1dGhvcik7XG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlByb2ZpbGUuc2V0VGVtcCgnZXh0ZW5zaW9uJywgVGVtcFByb2ZpbGVLZXlzLnNob3dJbk1hbmFnZXIsIHRoaXMuc2hvd0luTWFuYWdlcik7XG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlByb2ZpbGUuc2V0VGVtcCgnZXh0ZW5zaW9uJywgVGVtcFByb2ZpbGVLZXlzLnNob3dJbkZvbGRlciwgdGhpcy5zaG93SW5Gb2xkZXIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ1aWxkTW9kdWxlUGF0aCA9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRlbXBsYXRlPy5jcmVhdG9yID8/IHRoaXMuZXh0ZW5zaW9uSW5mb01hcFsnZXh0ZW5zaW9uJ10udGVtcGxhdGVzWzBdLmNyZWF0b3IhO1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ1aWxkTW9kdWxlID0gcmVxdWlyZShidWlsZE1vZHVsZVBhdGgpIGFzIHVua25vd24gYXMgRXh0ZW5zaW9uQ3JlYXRvcjtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGJ1aWxkTW9kdWxlLm1ldGhvZHMuY3JlYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgYXV0aG9yOiB0aGlzLmF1dGhvcixcbiAgICAgICAgICAgICAgICAgICAgZGlzdDogdGhpcy5kaXN0UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yVmVyc2lvbjogdGhpcy5lZGl0b3JWZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlOiB0aGlzLmN1cnJlbnRUZW1wbGF0ZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UucmVnaXN0ZXIodGhpcy5kaXN0UGF0aCk7XG5cbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlRhc2suYWRkTm90aWNlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiB0aGlzLnQoJ2V4dGVuc2lvbi5jcmVhdGVfcGFja2FnZS5jcmVhdGVfZXh0ZW5zaW9uX3N1Y2Nlc3NmdWwnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHRoaXMuZGlzdFBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ6IDUwMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3VjY2VzcycsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNob3dJbkZvbGRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5maWxlRGlzcGxheWVkVG9Gb2xkZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGVsbC5zaG93SXRlbUluRm9sZGVyKHJlc3VsdC5maWxlRGlzcGxheWVkVG9Gb2xkZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGVsbC5zaG93SXRlbUluRm9sZGVyKHRoaXMuZGlzdFBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g5bu26L+fIDIwMCBtcyDmiY3lhbPpl63pnaLmnb/vvIzpmLLmraLlgbbnjrDnmoQgc2hvd0l0ZW1JbkZvbGRlciDmsqHlh7rnjrDnmoTpl67pophcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGx5aW5nID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5QYW5lbC5oYXMoJ2V4dGVuc2lvbi5jcmVhdGUnKS50aGVuKChyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlBhbmVsLmNsb3NlKCdleHRlbnNpb24uY3JlYXRlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDIwMCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXN1bHQuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBseWluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuRGlhbG9nLmVycm9yKHJlc3VsdC5lcnJvci5tZXNzYWdlLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogcmVzdWx0LmVycm9yLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IHJlc3VsdC5lcnJvci5zdGFjayxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlRXh0ZW5zaW9uSXNFeGlzdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hcHBseWluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5EaWFsb2cuZXJyb3IoZXJyb3IubWVzc2FnZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGVycm9yLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IGVycm9yLnN0YWNrLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVFeHRlbnNpb25Jc0V4aXN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHVwZGF0ZUV4dGVuc2lvbklzRXhpc3QoKSB7XG4gICAgICAgICAgICB0aGlzLmV4dGVuc2lvbkV4aXN0ID0gdGhpcy5uYW1lICE9PSAnJyAmJiBleGlzdHNTeW5jKHRoaXMuZGlzdFBhdGgpO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgdGVtcGxhdGU6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL3N0YXRpYycsICcvdGVtcGxhdGUvY3JlYXRlL2luZGV4Lmh0bWwnKSwgJ3V0ZjgnKSxcbn0pO1xuIl19