"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const fs_1 = require("fs");
const path_1 = require("path");
const semver_1 = require("semver");
const DistVue = require('vue/dist/vue');
DistVue.config.productionTip = false;
DistVue.config.devtools = false;
const panelDataMap = new WeakMap();
const TempKeyMap = {
    author: 'create_package_author',
    showInManager: 'create_package_show_in_manager',
    showInFolder: 'create_package_show_in_folder',
};
/**
 * 这里不用枚举，是为传入这个值给 vue
 */
const LocationType = {
    'extension.create_package.local': '0',
};
module.exports = Editor.Panel.define({
    template: '<div id="app"></div>',
    style: fs_1.readFileSync(path_1.join(__dirname, '../../create.css'), 'utf8'),
    $: {
        app: '#app',
    },
    async ready() {
        const extensionInfoMap = await Editor.Message.request('extension', 'get-extension-info-map');
        const author = await Editor.Profile.getTemp('extension', TempKeyMap.author) || 'Cocos Creator';
        const tempShowInManager = await Editor.Profile.getTemp('extension', TempKeyMap.showInManager);
        const showInManager = tempShowInManager === null ? true : Boolean(tempShowInManager);
        const tempShowInFolder = await Editor.Profile.getTemp('extension', TempKeyMap.showInFolder);
        const showInFolder = tempShowInFolder === null ? true : Boolean(tempShowInFolder);
        const vm = new DistVue({
            name: 'ExtensionCreationApp',
            data: {
                extensionInfoMap,
                currentLocation: '0',
                LocationType,
                name: `simple-${Date.now()}`,
                // 默认选择 extension 插件的 第一个插件模板,extension 一定有模板
                currentTemplate: extensionInfoMap['extension'].templates[0],
                /** 当前选中的模板来自哪个插件 */
                currentExtension: 'extension',
                author,
                showInManager,
                showInFolder,
                editorVersion: `>=${Editor.App.version}`,
                extensionExist: false,
            },
            template: fs_1.readFileSync(path_1.join(__dirname, '../../../static', '/template/create/index.html'), 'utf8'),
            el: this.$.app,
            methods: {
                async loadAllCreatorModule(options) {
                    const newExtensionInfoMap = await Editor.Message.request('extension', 'get-extension-info-map');
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
                    await Editor.Profile.setTemp('extension', TempKeyMap.author, this.author);
                    await Editor.Profile.setTemp('extension', TempKeyMap.showInManager, this.showInManager);
                    await Editor.Profile.setTemp('extension', TempKeyMap.showInFolder, this.showInFolder);
                    const buildModulePath = this.currentTemplate.creator ?? extensionInfoMap['extension'].templates[0].creator;
                    try {
                        const buildModule = require(buildModulePath);
                        const result = await buildModule.methods.create({
                            'author': this.author,
                            'dist': this.distPath,
                            'editorVersion': this.editorVersion,
                            'name': this.name,
                            'template': this.currentTemplate,
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
                                Editor.Panel.has('extension.create').then((r) => {
                                    if (r) {
                                        Editor.Panel.close('extension.create');
                                    }
                                });
                            }, 200);
                        }
                        else if (result.error) {
                            Editor.Dialog.error(result.error.message, {
                                title: result.error.name,
                                detail: result.error.stack,
                            });
                            this.updateExtensionIsExist();
                        }
                    }
                    catch (error) {
                        if (error instanceof Error) {
                            Editor.Dialog.error(error.message, {
                                'title': error.name,
                                'detail': error.stack,
                            });
                        }
                        this.updateExtensionIsExist();
                    }
                },
                updateExtensionIsExist() {
                    this.extensionExist = this.name !== '' && fs_1.existsSync(this.distPath);
                },
            },
            computed: {
                wrongName() {
                    const patt = new RegExp('^(?:@[a-z0-9-*~][a-z0-9-*._~]*/)?[a-z0-9-~][a-z0-9-._~]*$');
                    const includePoint = /[.]/g;
                    return !patt.test(this.name) || includePoint.test(this.name);
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
        });
        vm.loadAllCreatorModule({ force: true });
        function onExtensionEnable(info) {
            vm.onPluginEnable(info);
        }
        function onExtensionDisable(info) {
            vm.onPluginDisable(info);
        }
        Editor.Package.__protected__.on('enable', onExtensionEnable);
        Editor.Package.__protected__.on('disable', onExtensionDisable);
        panelDataMap.set(this, {
            onExtensionDisable,
            onExtensionEnable,
            async releaseAllCreatorModule() {
                vm.unloadAllCreatorModule({ force: true });
            },
        });
    },
    async close() {
        const info = panelDataMap.get(this);
        await info.releaseAllCreatorModule();
        Editor.Package.__protected__.removeListener('enable', info.onExtensionEnable);
        Editor.Package.__protected__.removeListener('disable', info.onExtensionDisable);
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL2NyZWF0ZS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHVDQUFpQztBQUNqQywyQkFBOEM7QUFDOUMsK0JBQTRCO0FBQzVCLG1DQUFrRDtBQUlsRCxNQUFNLE9BQU8sR0FBZSxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDcEQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO0FBQ3JDLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztBQUNoQyxNQUFNLFlBQVksR0FBRyxJQUFJLE9BQU8sRUFBd00sQ0FBQztBQUV6TyxNQUFNLFVBQVUsR0FBRztJQUNmLE1BQU0sRUFBRSx1QkFBdUI7SUFDL0IsYUFBYSxFQUFFLGdDQUFnQztJQUMvQyxZQUFZLEVBQUUsK0JBQStCO0NBQ2hELENBQUM7QUFFRjs7R0FFRztBQUNILE1BQU0sWUFBWSxHQUFHO0lBQ2pCLGdDQUFnQyxFQUFFLEdBQUc7Q0FDeEMsQ0FBQztBQUNGLE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7SUFDakMsUUFBUSxFQUFFLHNCQUFzQjtJQUNoQyxLQUFLLEVBQUUsaUJBQVksQ0FBQyxXQUFJLENBQUMsU0FBUyxFQUFFLGtCQUFrQixDQUFDLEVBQUUsTUFBTSxDQUFDO0lBQ2hFLENBQUMsRUFBRTtRQUNDLEdBQUcsRUFBRSxNQUFNO0tBQ2Q7SUFFRCxLQUFLLENBQUMsS0FBSztRQUNQLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsd0JBQXdCLENBQWdCLENBQUM7UUFDNUcsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsVUFBVSxDQUFDLE1BQU0s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QyxJQUFJLENBQUMsQ0FBQztRQUM1QixDQUFDO1FBQ0QsU0FBUyxrQkFBa0IsQ0FBQyxJQUFrQztZQUMxRCxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFDRCxNQUFNLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDN0QsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQy9ELFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFO1lBQ25CLGtCQUFrQjtZQUNsQixpQkFBaUI7WUFDakIsS0FBSyxDQUFDLHVCQUF1QjtnQkFDekIsRUFBRSxDQUFDLHNCQUFzQixDQUFDLEVBQUMsS0FBSyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7WUFDN0MsQ0FBQztTQUNKLENBQUMsQ0FBQztJQUVQLENBQUM7SUFDRCxLQUFLLENBQUMsS0FBSztRQUNQLE1BQU0sSUFBSSxHQUFHLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFFLENBQUM7UUFDckMsTUFBTSxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUNyQyxNQUFNLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzlFLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFFcEYsQ0FBQztDQUNKLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHNoZWxsIH0gZnJvbSAnZWxlY3Ryb24nO1xuaW1wb3J0IHsgZXhpc3RzU3luYywgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgY29lcmNlLCBzYXRpc2ZpZXMsIHZhbGlkIH0gZnJvbSAnc2VtdmVyJztcbmltcG9ydCB0eXBlIFZ1ZSBmcm9tICd2dWUnO1xuaW1wb3J0IHsgRXh0ZW5zaW9uQ3JlYXRvciwgVGVtcGxhdGVNYXAgfSBmcm9tICcuLi8uLi9wdWJsaWMvaW50ZXJmYWNlJztcblxuY29uc3QgRGlzdFZ1ZTogdHlwZW9mIFZ1ZSA9IHJlcXVpcmUoJ3Z1ZS9kaXN0L3Z1ZScpO1xuRGlzdFZ1ZS5jb25maWcucHJvZHVjdGlvblRpcCA9IGZhbHNlO1xuRGlzdFZ1ZS5jb25maWcuZGV2dG9vbHMgPSBmYWxzZTtcbmNvbnN0IHBhbmVsRGF0YU1hcCA9IG5ldyBXZWFrTWFwPGFueSwge29uRXh0ZW5zaW9uRW5hYmxlOiAocGFja2FnZUluZm86IEVkaXRvci5JbnRlcmZhY2UuUGFja2FnZUluZm8pID0+IHZvaWQsIG9uRXh0ZW5zaW9uRGlzYWJsZTogKHBhY2thZ2VJbmZvOiBFZGl0b3IuSW50ZXJmYWNlLlBhY2thZ2VJbmZvKSA9PiB2b2lkLCByZWxlYXNlQWxsQ3JlYXRvck1vZHVsZTogKCkgPT4gUHJvbWlzZTx2b2lkPn0+KCk7XG50eXBlIFRyYW5zbGF0aW9uUGFyYW1ldGVycyA9IFBhcmFtZXRlcnM8dHlwZW9mIEVkaXRvci5JMThuLnQ+O1xuY29uc3QgVGVtcEtleU1hcCA9IHtcbiAgICBhdXRob3I6ICdjcmVhdGVfcGFja2FnZV9hdXRob3InLFxuICAgIHNob3dJbk1hbmFnZXI6ICdjcmVhdGVfcGFja2FnZV9zaG93X2luX21hbmFnZXInLFxuICAgIHNob3dJbkZvbGRlcjogJ2NyZWF0ZV9wYWNrYWdlX3Nob3dfaW5fZm9sZGVyJyxcbn07XG5cbi8qKlxuICog6L+Z6YeM5LiN55So5p6a5Li+77yM5piv5Li65Lyg5YWl6L+Z5Liq5YC857uZIHZ1ZSBcbiAqL1xuY29uc3QgTG9jYXRpb25UeXBlID0ge1xuICAgICdleHRlbnNpb24uY3JlYXRlX3BhY2thZ2UubG9jYWwnOiAnMCcsXG59O1xubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3IuUGFuZWwuZGVmaW5lKHtcbiAgICB0ZW1wbGF0ZTogJzxkaXYgaWQ9XCJhcHBcIj48L2Rpdj4nLFxuICAgIHN0eWxlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi9jcmVhdGUuY3NzJyksICd1dGY4JyksXG4gICAgJDoge1xuICAgICAgICBhcHA6ICcjYXBwJyxcbiAgICB9LFxuICAgIFxuICAgIGFzeW5jIHJlYWR5KCkge1xuICAgICAgICBjb25zdCBleHRlbnNpb25JbmZvTWFwID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnZXh0ZW5zaW9uJywgJ2dldC1leHRlbnNpb24taW5mby1tYXAnKSBhcyBUZW1wbGF0ZU1hcDtcbiAgICAgICAgY29uc3QgYXV0aG9yID0gYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0VGVtcCgnZXh0ZW5zaW9uJywgVGVtcEtleU1hcC5hdXRob3IpIHx8ICdDb2NvcyBDcmVhdG9yJztcbiAgICAgICAgY29uc3QgdGVtcFNob3dJbk1hbmFnZXIgPSBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRUZW1wKCdleHRlbnNpb24nLCBUZW1wS2V5TWFwLnNob3dJbk1hbmFnZXIpO1xuICAgICAgICBjb25zdCBzaG93SW5NYW5hZ2VyID0gdGVtcFNob3dJbk1hbmFnZXIgPT09IG51bGwgPyB0cnVlIDogQm9vbGVhbih0ZW1wU2hvd0luTWFuYWdlcik7XG4gICAgICAgIGNvbnN0IHRlbXBTaG93SW5Gb2xkZXIgPSBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRUZW1wKCdleHRlbnNpb24nLCBUZW1wS2V5TWFwLnNob3dJbkZvbGRlcik7XG4gICAgICAgIGNvbnN0IHNob3dJbkZvbGRlciA9IHRlbXBTaG93SW5Gb2xkZXIgPT09IG51bGwgPyB0cnVlIDogQm9vbGVhbih0ZW1wU2hvd0luRm9sZGVyKTtcbiAgICAgICAgY29uc3Qgdm0gPSBuZXcgRGlzdFZ1ZSh7XG4gICAgICAgICAgICBuYW1lOiAnRXh0ZW5zaW9uQ3JlYXRpb25BcHAnLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIGV4dGVuc2lvbkluZm9NYXAsXG4gICAgICAgICAgICAgICAgY3VycmVudExvY2F0aW9uOiAnMCcsXG4gICAgICAgICAgICAgICAgTG9jYXRpb25UeXBlLFxuICAgICAgICAgICAgICAgIG5hbWU6IGBzaW1wbGUtJHtEYXRlLm5vdygpfWAsXG4gICAgICAgICAgICAgICAgLy8g6buY6K6k6YCJ5oupIGV4dGVuc2lvbiDmj5Lku7bnmoQg56ys5LiA5Liq5o+S5Lu25qih5p2/LGV4dGVuc2lvbiDkuIDlrprmnInmqKHmnb9cbiAgICAgICAgICAgICAgICBjdXJyZW50VGVtcGxhdGU6IGV4dGVuc2lvbkluZm9NYXBbJ2V4dGVuc2lvbiddLnRlbXBsYXRlc1swXSxcbiAgICAgICAgICAgICAgICAvKiog5b2T5YmN6YCJ5Lit55qE5qih5p2/5p2l6Ieq5ZOq5Liq5o+S5Lu2ICovXG4gICAgICAgICAgICAgICAgY3VycmVudEV4dGVuc2lvbjogJ2V4dGVuc2lvbicsXG4gICAgICAgICAgICAgICAgYXV0aG9yLFxuICAgICAgICAgICAgICAgIHNob3dJbk1hbmFnZXIsXG4gICAgICAgICAgICAgICAgc2hvd0luRm9sZGVyLFxuICAgICAgICAgICAgICAgIGVkaXRvclZlcnNpb246IGA+PSR7RWRpdG9yLkFwcC52ZXJzaW9ufWAsXG4gICAgICAgICAgICAgICAgZXh0ZW5zaW9uRXhpc3Q6IGZhbHNlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMnLCAnL3RlbXBsYXRlL2NyZWF0ZS9pbmRleC5odG1sJyksICd1dGY4JyksXG4gICAgICAgICAgICBlbDogdGhpcy4kLmFwcCBhcyBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgIG1ldGhvZHM6IHtcbiAgICAgICAgICAgICAgICBhc3luYyBsb2FkQWxsQ3JlYXRvck1vZHVsZSggb3B0aW9ucz86IHtmb3JjZT86IGJvb2xlYW4sIGluZm8/OiBFZGl0b3IuSW50ZXJmYWNlLlBhY2thZ2VJbmZvfSl7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0V4dGVuc2lvbkluZm9NYXAgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdleHRlbnNpb24nLCAnZ2V0LWV4dGVuc2lvbi1pbmZvLW1hcCcpIGFzIFRlbXBsYXRlTWFwIDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9hZGVkQ3JlYXRvcjogU2V0PHN0cmluZz4gPSBuZXcgU2V0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG5ld0V4dGVuc2lvbkluZm9NYXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zPy5mb3JjZSB8fCAhdGhpcy5leHRlbnNpb25JbmZvTWFwW2tleV0pe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBuZXdFeHRlbnNpb25JbmZvTWFwW2tleV0udGVtcGxhdGVzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZUluZm8gPSBuZXdFeHRlbnNpb25JbmZvTWFwW2tleV0udGVtcGxhdGVzW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRlbXBsYXRlSW5mby5jcmVhdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWxvYWRlZENyZWF0b3IuaGFzKHRlbXBsYXRlSW5mby5jcmVhdG9yKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY3JlYXRvciA9IHJlcXVpcmUodGVtcGxhdGVJbmZvLmNyZWF0b3IpIGFzIEV4dGVuc2lvbkNyZWF0b3I7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNyZWF0b3IubG9hZD8uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW2V4dGVuc2lvbl06IExvYWQgZXh0ZW5zaW9uIGNyZWF0b3Igd2l0aCBuYW1lICR7dGVtcGxhdGVJbmZvLm5hbWV9IGZhaWxlZGAsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGVkQ3JlYXRvci5hZGQodGVtcGxhdGVJbmZvLmNyZWF0b3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXh0ZW5zaW9uSW5mb01hcCA9IG5ld0V4dGVuc2lvbkluZm9NYXA7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBhc3luYyB1bmxvYWRBbGxDcmVhdG9yTW9kdWxlKG9wdGlvbnM/OiB7Zm9yY2U/OiBib29sZWFuLCBpbmZvPzogRWRpdG9yLkludGVyZmFjZS5QYWNrYWdlSW5mb30pe1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsb2FkZWRDcmVhdG9yOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5leHRlbnNpb25JbmZvTWFwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucz8uZm9yY2UgfHwgb3B0aW9ucz8uaW5mbz8ubmFtZSA9PT0ga2V5KXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5leHRlbnNpb25JbmZvTWFwW2tleV0udGVtcGxhdGVzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZUluZm8gPSB0aGlzLmV4dGVuc2lvbkluZm9NYXBba2V5XS50ZW1wbGF0ZXNbaW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGVtcGxhdGVJbmZvLmNyZWF0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbG9hZGVkQ3JlYXRvci5oYXModGVtcGxhdGVJbmZvLmNyZWF0b3IpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjcmVhdG9yID0gcmVxdWlyZSh0ZW1wbGF0ZUluZm8uY3JlYXRvcikgYXMgRXh0ZW5zaW9uQ3JlYXRvcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY3JlYXRvci51bmxvYWQ/LigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtleHRlbnNpb25dOiBMb2FkIGV4dGVuc2lvbiBjcmVhdG9yIHdpdGggbmFtZSAke3RlbXBsYXRlSW5mby5uYW1lfSBmYWlsZWRgLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRlZENyZWF0b3IuYWRkKHRlbXBsYXRlSW5mby5jcmVhdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucz8uaW5mbz8ubmFtZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLiRkZWxldGUodGhpcy5leHRlbnNpb25JbmZvTWFwLCBvcHRpb25zPy5pbmZvPy5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYXN5bmMgb25QbHVnaW5FbmFibGUoaW5mbzogRWRpdG9yLkludGVyZmFjZS5QYWNrYWdlSW5mbyl7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZEFsbENyZWF0b3JNb2R1bGUoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGFzeW5jIG9uUGx1Z2luRGlzYWJsZShpbmZvOiBFZGl0b3IuSW50ZXJmYWNlLlBhY2thZ2VJbmZvKXtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy51bmxvYWRBbGxDcmVhdG9yTW9kdWxlKHtpbmZvfSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBpc0VtcHR5T2JqZWN0KG9iajogb2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA9PT0gMDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHQoLi4uYXJnczogVHJhbnNsYXRpb25QYXJhbWV0ZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBFZGl0b3IuSTE4bi50KC4uLmFyZ3MpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICog5ou36LSd5o+S5Lu25qih5p2/5YiwdGVtcERpcu+8jOaIkOWKn+WQjuaLt+i0neWGheWuueWIsOaMh+WumuebruW9leOAglxuICAgICAgICAgICAgICAgICAqIEByZXR1cm5zIFxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGFzeW5jIGFwcGx5KCkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuUHJvZmlsZS5zZXRUZW1wKCdleHRlbnNpb24nLCBUZW1wS2V5TWFwLmF1dGhvciwgdGhpcy5hdXRob3IpO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuUHJvZmlsZS5zZXRUZW1wKCdleHRlbnNpb24nLCBUZW1wS2V5TWFwLnNob3dJbk1hbmFnZXIsIHRoaXMuc2hvd0luTWFuYWdlcik7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5Qcm9maWxlLnNldFRlbXAoJ2V4dGVuc2lvbicsIFRlbXBLZXlNYXAuc2hvd0luRm9sZGVyLCB0aGlzLnNob3dJbkZvbGRlcik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJ1aWxkTW9kdWxlUGF0aCA9IHRoaXMuY3VycmVudFRlbXBsYXRlLmNyZWF0b3IgPz8gZXh0ZW5zaW9uSW5mb01hcFsnZXh0ZW5zaW9uJ10udGVtcGxhdGVzWzBdLmNyZWF0b3IhO1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBidWlsZE1vZHVsZSA9IHJlcXVpcmUoYnVpbGRNb2R1bGVQYXRoKSBhcyBFeHRlbnNpb25DcmVhdG9yO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBidWlsZE1vZHVsZS5tZXRob2RzLmNyZWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2F1dGhvcic6IHRoaXMuYXV0aG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkaXN0JzogdGhpcy5kaXN0UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZWRpdG9yVmVyc2lvbic6IHRoaXMuZWRpdG9yVmVyc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmFtZSc6IHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAndGVtcGxhdGUnOiB0aGlzLmN1cnJlbnRUZW1wbGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UucmVnaXN0ZXIodGhpcy5kaXN0UGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlRhc2suYWRkTm90aWNlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogdGhpcy50KCdleHRlbnNpb24uY3JlYXRlX3BhY2thZ2UuY3JlYXRlX2V4dGVuc2lvbl9zdWNjZXNzZnVsJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogdGhpcy5kaXN0UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ6IDUwMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdWNjZXNzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNob3dJbkZvbGRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmZpbGVEaXNwbGF5ZWRUb0ZvbGRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hlbGwuc2hvd0l0ZW1JbkZvbGRlcihyZXN1bHQuZmlsZURpc3BsYXllZFRvRm9sZGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoZWxsLnNob3dJdGVtSW5Gb2xkZXIodGhpcy5kaXN0UGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDlu7bov58gMjAwIG1zIOaJjeWFs+mXremdouadv++8jOmYsuatouWBtueOsOeahCBzaG93SXRlbUluRm9sZGVyIOayoeWHuueOsOeahOmXrumimFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuUGFuZWwuaGFzKCdleHRlbnNpb24uY3JlYXRlJykudGhlbigocikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuUGFuZWwuY2xvc2UoJ2V4dGVuc2lvbi5jcmVhdGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMjAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzdWx0LmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLkRpYWxvZy5lcnJvcihyZXN1bHQuZXJyb3IubWVzc2FnZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogcmVzdWx0LmVycm9yLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDogcmVzdWx0LmVycm9yLnN0YWNrLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlRXh0ZW5zaW9uSXNFeGlzdCgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5EaWFsb2cuZXJyb3IoZXJyb3IubWVzc2FnZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndGl0bGUnOiBlcnJvci5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGV0YWlsJzogZXJyb3Iuc3RhY2ssXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUV4dGVuc2lvbklzRXhpc3QoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB1cGRhdGVFeHRlbnNpb25Jc0V4aXN0KCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmV4dGVuc2lvbkV4aXN0ID0gdGhpcy5uYW1lICE9PSAnJyAmJiBleGlzdHNTeW5jKHRoaXMuZGlzdFBhdGgpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgICAgICAgICB3cm9uZ05hbWUoKTogYm9vbGVhbiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhdHQgPSBuZXcgUmVnRXhwKCdeKD86QFthLXowLTktKn5dW2EtejAtOS0qLl9+XSovKT9bYS16MC05LX5dW2EtejAtOS0uX35dKiQnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5jbHVkZVBvaW50ID0gL1suXS9nO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gIXBhdHQudGVzdCh0aGlzLm5hbWUpIHx8IGluY2x1ZGVQb2ludC50ZXN0KHRoaXMubmFtZSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB3cm9uZ0F1dGhvcigpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICF0aGlzLmF1dGhvcjtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHdyb25nRWRpdG9yVmVyc2lvbigpOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICF2YWxpZChjb2VyY2UodGhpcy5lZGl0b3JWZXJzaW9uKSkgfHwgc2F0aXNmaWVzKHZhbGlkKGNvZXJjZSh0aGlzLmVkaXRvclZlcnNpb24pKSB8fCAnJywgJzwgMy4wLjAnKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGRpc3RQYXRoKCk6IHN0cmluZyB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBqb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsICdleHRlbnNpb25zJywgdGhpcy5uYW1lKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHdhdGNoOiB7XG4gICAgICAgICAgICAgICAgbmFtZSh2YWx1ZSwgb2xkVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBvbGRWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVFeHRlbnNpb25Jc0V4aXN0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGN1cnJlbnRMb2NhdGlvbih2YWx1ZSwgb2xkVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBvbGRWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVFeHRlbnNpb25Jc0V4aXN0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIHZtLmxvYWRBbGxDcmVhdG9yTW9kdWxlKHtmb3JjZTogdHJ1ZX0pO1xuICAgICAgICBmdW5jdGlvbiBvbkV4dGVuc2lvbkVuYWJsZShpbmZvOiBFZGl0b3IuSW50ZXJmYWNlLlBhY2thZ2VJbmZvKXtcbiAgICAgICAgICAgIHZtLm9uUGx1Z2luRW5hYmxlKGluZm8pO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG9uRXh0ZW5zaW9uRGlzYWJsZShpbmZvOiBFZGl0b3IuSW50ZXJmYWNlLlBhY2thZ2VJbmZvKXtcbiAgICAgICAgICAgIHZtLm9uUGx1Z2luRGlzYWJsZShpbmZvKTtcbiAgICAgICAgfVxuICAgICAgICBFZGl0b3IuUGFja2FnZS5fX3Byb3RlY3RlZF9fLm9uKCdlbmFibGUnLCBvbkV4dGVuc2lvbkVuYWJsZSk7XG4gICAgICAgIEVkaXRvci5QYWNrYWdlLl9fcHJvdGVjdGVkX18ub24oJ2Rpc2FibGUnLCBvbkV4dGVuc2lvbkRpc2FibGUpOyAgICAgICAgXG4gICAgICAgIHBhbmVsRGF0YU1hcC5zZXQodGhpcywge1xuICAgICAgICAgICAgb25FeHRlbnNpb25EaXNhYmxlLFxuICAgICAgICAgICAgb25FeHRlbnNpb25FbmFibGUsXG4gICAgICAgICAgICBhc3luYyByZWxlYXNlQWxsQ3JlYXRvck1vZHVsZSgpe1xuICAgICAgICAgICAgICAgIHZtLnVubG9hZEFsbENyZWF0b3JNb2R1bGUoe2ZvcmNlOiB0cnVlfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgIH0sXG4gICAgYXN5bmMgY2xvc2UoKXtcbiAgICAgICAgY29uc3QgaW5mbyA9IHBhbmVsRGF0YU1hcC5nZXQodGhpcykhO1xuICAgICAgICBhd2FpdCBpbmZvLnJlbGVhc2VBbGxDcmVhdG9yTW9kdWxlKCk7XG4gICAgICAgIEVkaXRvci5QYWNrYWdlLl9fcHJvdGVjdGVkX18ucmVtb3ZlTGlzdGVuZXIoJ2VuYWJsZScsIGluZm8ub25FeHRlbnNpb25FbmFibGUpO1xuICAgICAgICBFZGl0b3IuUGFja2FnZS5fX3Byb3RlY3RlZF9fLnJlbW92ZUxpc3RlbmVyKCdkaXNhYmxlJywgaW5mby5vbkV4dGVuc2lvbkRpc2FibGUpO1xuXG4gICAgfSxcbn0pO1xuIl19