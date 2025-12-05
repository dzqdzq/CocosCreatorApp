"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forceUpdate = exports.setupContext = void 0;
const extension_sdk_1 = require("@editor/extension-sdk");
const semver_1 = __importDefault(require("semver"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const config_1 = require("../shared/config");
const interface_1 = require("../public/interface");
const utils_1 = require("../public/utils");
function assertIsDefined(val, message) {
    if (val === undefined || val === null) {
        throw new Error(typeof message === 'string' ? message : `Expected 'val' to be defined, but received ${val}`);
    }
}
// normalize extensionList
function normalizeListResponse(list) {
    const namesMayUpdate = new Set();
    const data = {};
    for (const item of list) {
        namesMayUpdate.add(item.name);
        data[item.name] = item;
    }
    return {
        names: namesMayUpdate,
        extensions: data,
    };
}
function normalizeInternalPackages(packages) {
    const pathToInfo = {};
    const nameToPaths = {};
    const pathEntry = [];
    for (const pkg of packages) {
        const pkgName = pkg.name;
        const pkgType = Editor.Package.__protected__.checkType(pkg.path);
        pathEntry.push(pkg.path);
        pathToInfo[pkg.path] = {
            ...pkg,
            pkgType: pkgType,
        };
        const nameMap = nameToPaths[pkgName] ?? (nameToPaths[pkgName] = {});
        nameMap[pkgType] = pkg.path;
    }
    return {
        /** package path list */
        packagesEntry: pathEntry,
        /**
         * package `path` to entity
         */
        packages: pathToInfo,
        nameToPaths,
    };
}
async function setupContext() {
    const { customSdkDomain, extensionPaths } = await (0, config_1.readConfigs)();
    const editorVersion = Editor.App.version;
    const sdk = new extension_sdk_1.Manager({
        extensionPaths: [extensionPaths.project, extensionPaths.global],
        domain: customSdkDomain,
    });
    return {
        sdk,
        editorVersion,
        extensionPaths,
    };
}
exports.setupContext = setupContext;
/**
 * 强制更新某些依赖，保证它们始终是最新版本
 *
 * https://github.com/cocos/3d-tasks/issues/15281
 */
async function forceUpdate(options) {
    const { editorVersion, sdk, extensionPaths } = await setupContext();
    const { packages: serverExtensionList } = await sdk.getExtensionList({
        e: editorVersion,
        label: `${interface_1.ExtensionManagerTab.ForcedUpdate}`,
        lang: Editor.I18n.getLanguage(),
    });
    const { names: serverNames, extensions: serverNameToEntity } = normalizeListResponse(serverExtensionList);
    const allPackages = await Editor.Package.getPackages();
    const { packages: packagePathToEntity, nameToPaths } = normalizeInternalPackages(allPackages);
    /**
     * 扫描本地所有插件，寻找需要强制下载更新的插件。key: pkg.name
     */
    const packagesShouldUpdate = new Map();
    // 插件存在多版本时，可以跳过更新的插件。
    // 不需要更新，但需要启用到最新版本，因此需要记录插件路径。
    const packageSkipDownload = new Map();
    let selfUpdateConfig = undefined;
    for (const pkgName of serverNames) {
        try {
            const serverPkg = serverNameToEntity[pkgName];
            const pkgLocalPaths = nameToPaths[pkgName] ?? {};
            const localPkgPathTypes = Object.keys(pkgLocalPaths);
            const isSelfUpdate = pkgName === utils_1.INTERNAL_EXTENSION_NAME;
            if (localPkgPathTypes.length < 1) {
                // 本地没有这个包，直接下载安装
                packagesShouldUpdate.set(pkgName, {
                    name: pkgName,
                    type: 'global',
                    path: '',
                    builtinPath: '',
                    enabled: false,
                });
                continue;
            }
            // 遍历不同路径下的同名插件，分析是否需要更新操作：
            // 1. 下载新版并更新 2. 直接启用本地的新版本 3. 直接跳过
            for (const pathType of localPkgPathTypes) {
                if (packageSkipDownload.has(pkgName)) {
                    continue;
                }
                const pkgPath = pkgLocalPaths[pathType];
                // `localPkgPathTypes` cames from `pkgLocalPaths`
                assertIsDefined(pkgPath, `cannot find path type "${pathType}" in package local paths`);
                const pkg = packagePathToEntity[pkgPath];
                // entity, pkgPath 都来自 normalize 的结果。不存在时作异常处理
                assertIsDefined(pkg, `cannot find package path "${pkgPath}" in package entity map`);
                switch (pathType) {
                    case 'cover':
                    case 'builtin':
                    case 'local': {
                        // 存在版本 >= 服务端最新版本，不更新
                        if (semver_1.default.gte(pkg.version, serverPkg.latest_version)) {
                            // 存在多版本（旧版 + 最新）时，不需要更新
                            const currentSnapshot = packagesShouldUpdate.get(pkgName);
                            if (currentSnapshot != null) {
                                packagesShouldUpdate.delete(pkgName);
                            }
                            // 有一个最新版本了，后面的就不用再匹配了
                            packageSkipDownload.set(pkgName, {
                                path: pkg.path,
                                // 记录 enabled 状态，方便后续遍历 & 启用
                                enabled: pkg.enable,
                            });
                            if (isSelfUpdate) {
                                // 需要更新自身，更新高版本插件的路径，用于后续启用
                                if (pkg.enable !== true) {
                                    selfUpdateConfig = {
                                        builtInPath: pkgLocalPaths.builtin ?? '',
                                        // currentPath 在后续遍历中更新，如果没有就留空
                                        currentPath: '',
                                        newInstallPath: pkg.path,
                                    };
                                }
                            }
                            continue;
                        }
                        // 由于插件启动时序，此时可能没有任何一个 pkg 处于 enable 状态
                        if (packagesShouldUpdate.has(pkgName) && pkg.enable === true) {
                            // 同一时间最多只会有一个 enable 的版本。
                            // 这里把需要更新的插件的 snapshot 数据指向当前启用的那个版本
                            if (isSelfUpdate && selfUpdateConfig) {
                                selfUpdateConfig.currentPath = pkg.path;
                            }
                            else {
                                const snapshot = packagesShouldUpdate.get(pkgName);
                                packagesShouldUpdate.set(pkgName, {
                                    ...snapshot,
                                    path: pkg.path,
                                    type: pkg.pkgType,
                                });
                            }
                            continue;
                        }
                        packagesShouldUpdate.set(pkgName, {
                            name: pkgName,
                            path: pkg.path,
                            type: pathType,
                            builtinPath: pkgLocalPaths.builtin ?? '',
                            enabled: pkg.enable,
                        });
                        break;
                    }
                    case 'global':
                    case 'other':
                    default:
                        // ignore
                        break;
                }
            }
        }
        catch (error) {
            console.error(error);
            continue;
        }
    }
    const packagesDownloadArr = Array.from(packagesShouldUpdate);
    const downloaders = packagesDownloadArr.map(([, snapshot]) => {
        const { name: pkgName } = snapshot;
        return sdk.getDownloader({
            installPath: extensionPaths.global,
            name: pkgName,
            e: editorVersion,
        }, {
            perDownloaded: async (info) => {
                // 全局内置目录已有插件，禁用并反注册。
                // sdk 在安装时会删除已有插件，这里不需要手动处理
                assertIsDefined(info.installPkgPath);
                const dist = info.installPkgPath;
                const pkgInstalledInDist = packagePathToEntity[dist];
                if (fs_extra_1.default.existsSync(dist) && pkgInstalledInDist != null) {
                    await Editor.Package.disable(dist, {});
                    await Editor.Package.unregister(dist);
                }
            },
            perInstalled: async (info) => {
                assertIsDefined(info.installPkgPath);
                if (info.name === utils_1.INTERNAL_EXTENSION_NAME) {
                    selfUpdateConfig = {
                        currentPath: snapshot.path,
                        newInstallPath: info.installPkgPath,
                        builtInPath: snapshot.builtinPath,
                    };
                }
                else {
                    await Editor.Package.register(info.installPkgPath);
                    await Editor.Package.enable(info.installPkgPath);
                }
            },
        });
    });
    // 处理需要下载更新的扩展
    try {
        const tasks = await Promise.allSettled(downloaders.map((downloader) => downloader.download()));
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            if (task.status === 'fulfilled') {
                continue;
            }
            // TODO: get extra detail from snapshot ?
            // const packageSnapshot = packagesDownloadArr[i];
            console.error(task.reason);
        }
    }
    catch (error) {
        console.error(error);
    }
    // 处理需要启用新版本的扩展。注意
    if (packageSkipDownload.size > 0) {
        const entries = packageSkipDownload.entries();
        setTimeout(async () => {
            for (const [name, { enabled, path }] of entries) {
                if (enabled === true) {
                    continue;
                }
                try {
                    await Editor.Package.enable(path);
                }
                catch (error) {
                    console.error(`Extension enable failed. name "${name}", path "${path}"`);
                    console.error(error);
                    continue;
                }
            }
        }, 0);
    }
    // 处理扩展管理器的强制自更新
    try {
        if (typeof selfUpdateConfig === 'object' && selfUpdateConfig != null && options.selfUpdate) {
            const _selfUpdate = options.selfUpdate;
            const _config = selfUpdateConfig;
            // 这里注意不能处理成 promise，要把自更新的操作放到 nextTick 去执行。
            // 否则会影响当前运行的扩展管理器的逻辑，造成一些奇怪问题。
            setTimeout(async () => {
                // 根据扩展管理器当前的开启状态判断是否要重新开启
                const shouldManagerReopen = await Editor.Panel.has('extension.manager');
                _selfUpdate({
                    ..._config,
                    reopenPanel: shouldManagerReopen,
                });
            }, 0);
        }
    }
    catch (error) {
        console.error('Extension forced self update failed');
        console.error(error);
    }
}
exports.forceUpdate = forceUpdate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9yY2UtdXBkYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2Jyb3dzZXIvZm9yY2UtdXBkYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHlEQUE0RTtBQUM1RSxvREFBNEI7QUFDNUIsd0RBQTBCO0FBSTFCLDZDQUErQztBQUMvQyxtREFBNkU7QUFDN0UsMkNBQTBEO0FBa0IxRCxTQUFTLGVBQWUsQ0FBSSxHQUFNLEVBQUUsT0FBZ0I7SUFDaEQsSUFBSSxHQUFHLEtBQUssU0FBUyxJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUU7UUFDbkMsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsOENBQThDLEdBQUcsRUFBRSxDQUFDLENBQUM7S0FDaEg7QUFDTCxDQUFDO0FBRUQsMEJBQTBCO0FBQzFCLFNBQVMscUJBQXFCLENBQUMsSUFBa0M7SUFDN0QsTUFBTSxjQUFjLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztJQUN6QyxNQUFNLElBQUksR0FBK0MsRUFBRSxDQUFDO0lBRTVELEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxFQUFFO1FBQ3JCLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO0tBQzFCO0lBRUQsT0FBTztRQUNILEtBQUssRUFBRSxjQUFjO1FBQ3JCLFVBQVUsRUFBRSxJQUFJO0tBQ25CLENBQUM7QUFDTixDQUFDO0FBRUQsU0FBUyx5QkFBeUIsQ0FBQyxRQUF1QjtJQUN0RCxNQUFNLFVBQVUsR0FBc0QsRUFBRSxDQUFDO0lBQ3pFLE1BQU0sV0FBVyxHQUFpRixFQUFFLENBQUM7SUFDckcsTUFBTSxTQUFTLEdBQWEsRUFBRSxDQUFDO0lBRS9CLEtBQUssTUFBTSxHQUFHLElB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TyxHQUFHLGdCQUFnQixDQUFDO1lBQ2pDLDZDQUE2QztZQUM3QywrQkFBK0I7WUFDL0IsVUFBVSxDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUNsQiwwQkFBMEI7Z0JBQzFCLE1BQU0sbUJBQW1CLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUN4RSxXQUFXLENBQUM7b0JBQ1IsR0FBRyxPQUFPO29CQUNWLFdBQVcsRUFBRSxtQkFBbUI7aUJBQ25DLENBQUMsQ0FBQztZQUNQLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUNUO0tBQ0o7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNaLE9BQU8sQ0FBQyxLQUFLLENBQUMscUNBQXFDLENBQUMsQ0FBQztRQUNyRCxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3hCO0FBQ0wsQ0FBQztBQXpPRCxrQ0F5T0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNYW5hZ2VyLCBJRXh0ZW5zaW9uTGlzdEl0ZW1SZXNwb25zZSB9IGZyb20gJ0BlZGl0b3IvZXh0ZW5zaW9uLXNkayc7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBoYXMgfSBmcm9tICdsb2Rhc2gnO1xuXG5pbXBvcnQgeyByZWFkQ29uZmlncyB9IGZyb20gJy4uL3NoYXJlZC9jb25maWcnO1xuaW1wb3J0IHsgRXh0ZW5zaW9uTWFuYWdlclRhYiwgU2VsZlVwZGF0ZU9wdGlvbnMgfSBmcm9tICcuLi9wdWJsaWMvaW50ZXJmYWNlJztcbmltcG9ydCB7IElOVEVSTkFMX0VYVEVOU0lPTl9OQU1FIH0gZnJvbSAnLi4vcHVibGljL3V0aWxzJztcblxudHlwZSBQYWNrYWdlSW5mbyA9IEVkaXRvci5JbnRlcmZhY2UuUGFja2FnZUluZm87XG50eXBlIFBhY2thZ2VUeXBlID0gRWRpdG9yLlBhY2thZ2UucGFja2FnZVR5cGU7XG50eXBlIFBhY2thZ2VJbmZvTm9ybWFsaXplZCA9IFBhY2thZ2VJbmZvICYgeyBwa2dUeXBlOiBQYWNrYWdlVHlwZSB9O1xuXG50eXBlIEludGVybmFsUGtnU25hcHNob3QgPSB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIHBhdGg6IHN0cmluZztcbiAgICBidWlsdGluUGF0aDogc3RyaW5nO1xuICAgIHR5cGU6IFBhY2thZ2VUeXBlO1xuICAgIGVuYWJsZWQ6IGJvb2xlYW47XG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIEZvcmNlVXBkYXRlT3B0aW9ucyB7XG4gICAgc2VsZlVwZGF0ZT86IChvcHRpb25zOiBTZWxmVXBkYXRlT3B0aW9ucykgPT4gUHJvbWlzZTx2b2lkPiB8IHZvaWQ7XG59XG5cbmZ1bmN0aW9uIGFzc2VydElzRGVmaW5lZDxUPih2YWw6IFQsIG1lc3NhZ2U/OiBzdHJpbmcpOiBhc3NlcnRzIHZhbCBpcyBOb25OdWxsYWJsZTxUPiB7XG4gICAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkIHx8IHZhbCA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IodHlwZW9mIG1lc3NhZ2UgPT09ICdzdHJpbmcnID8gbWVzc2FnZSA6IGBFeHBlY3RlZCAndmFsJyB0byBiZSBkZWZpbmVkLCBidXQgcmVjZWl2ZWQgJHt2YWx9YCk7XG4gICAgfVxufVxuXG4vLyBub3JtYWxpemUgZXh0ZW5zaW9uTGlzdFxuZnVuY3Rpb24gbm9ybWFsaXplTGlzdFJlc3BvbnNlKGxpc3Q6IElFeHRlbnNpb25MaXN0SXRlbVJlc3BvbnNlW10pIHtcbiAgICBjb25zdCBuYW1lc01heVVwZGF0ZSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGNvbnN0IGRhdGE6IFJlY29yZDxzdHJpbmcsIElFeHRlbnNpb25MaXN0SXRlbVJlc3BvbnNlPiA9IHt9O1xuXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIGxpc3QpIHtcbiAgICAgICAgbmFtZXNNYXlVcGRhdGUuYWRkKGl0ZW0ubmFtZSk7XG4gICAgICAgIGRhdGFbaXRlbS5uYW1lXSA9IGl0ZW07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZXM6IG5hbWVzTWF5VXBkYXRlLFxuICAgICAgICBleHRlbnNpb25zOiBkYXRhLFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUludGVybmFsUGFja2FnZXMocGFja2FnZXM6IFBhY2thZ2VJbmZvW10pIHtcbiAgICBjb25zdCBwYXRoVG9JbmZvOiBSZWNvcmQ8c3RyaW5nLCBQYWNrYWdlSW5mb05vcm1hbGl6ZWQgfCB1bmRlZmluZWQ+ID0ge307XG4gICAgY29uc3QgbmFtZVRvUGF0aHM6IFJlY29yZDxzdHJpbmcsIFBhcnRpYWw8UmVjb3JkPFBhY2thZ2VUeXBlLCBzdHJpbmcgfCB1bmRlZmluZWQ+PiB8IHVuZGVmaW5lZD4gPSB7fTtcbiAgICBjb25zdCBwYXRoRW50cnk6IHN0cmluZ1tdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHBrZyBvZiBwYWNrYWdlcykge1xuICAgICAgICBjb25zdCBwa2dOYW1lID0gcGtnLm5hbWU7XG4gICAgICAgIGNvbnN0IHBrZ1R5cGUgPSBFZGl0b3IuUGFja2FnZS5fX3Byb3RlY3RlZF9fLmNoZWNrVHlwZShwa2cucGF0aCk7XG5cbiAgICAgICAgcGF0aEVudHJ5LnB1c2gocGtnLnBhdGgpO1xuICAgICAgICBwYXRoVG9JbmZvW3BrZy5wYXRoXSA9IHtcbiAgICAgICAgICAgIC4uLnBrZyxcbiAgICAgICAgICAgIHBrZ1R5cGU6IHBrZ1R5cGUsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgbmFtZU1hcCA9IG5hbWVUb1BhdGhzW3BrZ05hbWVdID8/IChuYW1lVG9QYXRoc1twa2dOYW1lXSA9IHt9KTtcbiAgICAgICAgbmFtZU1hcFtwa2dUeXBlXSA9IHBrZy5wYXRoO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIC8qKiBwYWNrYWdlIHBhdGggbGlzdCAqL1xuICAgICAgICBwYWNrYWdlc0VudHJ5OiBwYXRoRW50cnksXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBwYWNrYWdlIGBwYXRoYCB0byBlbnRpdHlcbiAgICAgICAgICovXG4gICAgICAgIHBhY2thZ2VzOiBwYXRoVG9JbmZvLFxuICAgICAgICBuYW1lVG9QYXRocyxcbiAgICB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0dXBDb250ZXh0KCkge1xuICAgIGNvbnN0IHsgY3VzdG9tU2RrRG9tYWluLCBleHRlbnNpb25QYXRocyB9ID0gYXdhaXQgcmVhZENvbmZpZ3MoKTtcbiAgICBjb25zdCBlZGl0b3JWZXJzaW9uID0gRWRpdG9yLkFwcC52ZXJzaW9uO1xuXG4gICAgY29uc3Qgc2RrID0gbmV3IE1hbmFnZXIoe1xuICAgICAgICBleHRlbnNpb25QYXRoczogW2V4dGVuc2lvblBhdGhzLnByb2plY3QsIGV4dGVuc2lvblBhdGhzLmdsb2JhbF0sXG4gICAgICAgIGRvbWFpbjogY3VzdG9tU2RrRG9tYWluLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2RrLFxuICAgICAgICBlZGl0b3JWZXJzaW9uLFxuICAgICAgICBleHRlbnNpb25QYXRocyxcbiAgICB9O1xufVxuXG4vKipcbiAqIOW8uuWItuabtOaWsOafkOS6m+S+nei1lu+8jOS/neivgeWug+S7rOWni+e7iOaYr+acgOaWsOeJiOacrFxuICpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9jb2Nvcy8zZC10YXNrcy9pc3N1ZXMvMTUyODFcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZvcmNlVXBkYXRlKG9wdGlvbnM6IEZvcmNlVXBkYXRlT3B0aW9ucykge1xuICAgIGNvbnN0IHsgZWRpdG9yVmVyc2lvbiwgc2RrLCBleHRlbnNpb25QYXRocyB9ID0gYXdhaXQgc2V0dXBDb250ZXh0KCk7XG5cbiAgICBjb25zdCB7IHBhY2thZ2VzOiBzZXJ2ZXJFeHRlbnNpb25MaXN0IH0gPSBhd2FpdCBzZGsuZ2V0RXh0ZW5zaW9uTGlzdCh7XG4gICAgICAgIGU6IGVkaXRvclZlcnNpb24sXG4gICAgICAgIGxhYmVsOiBgJHtFeHRlbnNpb25NYW5hZ2VyVGFiLkZvcmNlZFVwZGF0ZX1gLFxuICAgICAgICBsYW5nOiBFZGl0b3IuSTE4bi5nZXRMYW5ndWFnZSgpLFxuICAgIH0pO1xuICAgIGNvbnN0IHsgbmFtZXM6IHNlcnZlck5hbWVzLCBleHRlbnNpb25zOiBzZXJ2ZXJOYW1lVG9FbnRpdHkgfSA9IG5vcm1hbGl6ZUxpc3RSZXNwb25zZShzZXJ2ZXJFeHRlbnNpb25MaXN0KTtcblxuICAgIGNvbnN0IGFsbFBhY2thZ2VzID0gYXdhaXQgRWRpdG9yLlBhY2thZ2UuZ2V0UGFja2FnZXMoKTtcbiAgICBjb25zdCB7IHBhY2thZ2VzOiBwYWNrYWdlUGF0aFRvRW50aXR5LCBuYW1lVG9QYXRocyB9ID0gbm9ybWFsaXplSW50ZXJuYWxQYWNrYWdlcyhhbGxQYWNrYWdlcyk7XG5cbiAgICAvKipcbiAgICAgKiDmiavmj4/mnKzlnLDmiYDmnInmj5Lku7bvvIzlr7vmib7pnIDopoHlvLrliLbkuIvovb3mm7TmlrDnmoTmj5Lku7bjgIJrZXk6IHBrZy5uYW1lXG4gICAgICovXG4gICAgY29uc3QgcGFja2FnZXNTaG91bGRVcGRhdGU6IE1hcDxzdHJpbmcsIEludGVybmFsUGtnU25hcHNob3Q+ID0gbmV3IE1hcCgpO1xuICAgIC8vIOaPkuS7tuWtmOWcqOWkmueJiOacrOaXtu+8jOWPr+S7pei3s+i/h+abtOaWsOeahOaPkuS7tuOAglxuICAgIC8vIOS4jemcgOimgeabtOaWsO+8jOS9humcgOimgeWQr+eUqOWIsOacgOaWsOeJiOacrO+8jOWboOatpOmcgOimgeiusOW9leaPkuS7tui3r+W+hOOAglxuICAgIGNvbnN0IHBhY2thZ2VTa2lwRG93bmxvYWQgPSBuZXcgTWFwPHN0cmluZywgeyBwYXRoOiBzdHJpbmc7IGVuYWJsZWQ6IGJvb2xlYW4gfT4oKTtcblxuICAgIGxldCBzZWxmVXBkYXRlQ29uZmlnOiBTZWxmVXBkYXRlT3B0aW9ucyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAgIGZvciAoY29uc3QgcGtnTmFtZSBvZiBzZXJ2ZXJOYW1lcykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2VydmVyUGtnID0gc2VydmVyTmFtZVRvRW50aXR5W3BrZ05hbWVdO1xuICAgICAgICAgICAgY29uc3QgcGtnTG9jYWxQYXRocyA9IG5hbWVUb1BhdGhzW3BrZ05hbWVdID8/IHt9O1xuICAgICAgICAgICAgY29uc3QgbG9jYWxQa2dQYXRoVHlwZXMgPSBPYmplY3Qua2V5cyhwa2dMb2NhbFBhdGhzKSBhcyBQYWNrYWdlVHlwZVtdO1xuICAgICAgICAgICAgY29uc3QgaXNTZWxmVXBkYXRlID0gcGtnTmFtZSA9PT0gSU5URVJOQUxfRVhURU5TSU9OX05BTUU7XG5cbiAgICAgICAgICAgIGlmIChsb2NhbFBrZ1BhdGhUeXBlcy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgLy8g5pys5Zyw5rKh5pyJ6L+Z5Liq5YyF77yM55u05o6l5LiL6L295a6J6KOFXG4gICAgICAgICAgICAgICAgcGFja2FnZXNTaG91bGRVcGRhdGUuc2V0KHBrZ05hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogcGtnTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2dsb2JhbCcsXG4gICAgICAgICAgICAgICAgICAgIHBhdGg6ICcnLFxuICAgICAgICAgICAgICAgICAgICBidWlsdGluUGF0aDogJycsXG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDpgY3ljobkuI3lkIzot6/lvoTkuIvnmoTlkIzlkI3mj5Lku7bvvIzliIbmnpDmmK/lkKbpnIDopoHmm7TmlrDmk43kvZzvvJpcbiAgICAgICAgICAgIC8vIDEuIOS4i+i9veaWsOeJiOW5tuabtOaWsCAyLiDnm7TmjqXlkK/nlKjmnKzlnLDnmoTmlrDniYjmnKwgMy4g55u05o6l6Lez6L+HXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHBhdGhUeXBlIG9mIGxvY2FsUGtnUGF0aFR5cGVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhY2thZ2VTa2lwRG93bmxvYWQuaGFzKHBrZ05hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IHBrZ1BhdGggPSBwa2dMb2NhbFBhdGhzW3BhdGhUeXBlXTtcbiAgICAgICAgICAgICAgICAvLyBgbG9jYWxQa2dQYXRoVHlwZXNgIGNhbWVzIGZyb20gYHBrZ0xvY2FsUGF0aHNgXG4gICAgICAgICAgICAgICAgYXNzZXJ0SXNEZWZpbmVkKHBrZ1BhdGgsIGBjYW5ub3QgZmluZCBwYXRoIHR5cGUgXCIke3BhdGhUeXBlfVwiIGluIHBhY2thZ2UgbG9jYWwgcGF0aHNgKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHBrZyA9IHBhY2thZ2VQYXRoVG9FbnRpdHlbcGtnUGF0aF07XG4gICAgICAgICAgICAgICAgLy8gZW50aXR5LCBwa2dQYXRoIOmDveadpeiHqiBub3JtYWxpemUg55qE57uT5p6c44CC5LiN5a2Y5Zyo5pe25L2c5byC5bi45aSE55CGXG4gICAgICAgICAgICAgICAgYXNzZXJ0SXNEZWZpbmVkKHBrZywgYGNhbm5vdCBmaW5kIHBhY2thZ2UgcGF0aCBcIiR7cGtnUGF0aH1cIiBpbiBwYWNrYWdlIGVudGl0eSBtYXBgKTtcblxuICAgICAgICAgICAgICAgIHN3aXRjaCAocGF0aFR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnY292ZXInOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICdidWlsdGluJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbG9jYWwnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlrZjlnKjniYjmnKwgPj0g5pyN5Yqh56uv5pyA5paw54mI5pys77yM5LiN5pu05pawXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VtdmVyLmd0ZShwa2cudmVyc2lvbiwgc2VydmVyUGtnLmxhdGVzdF92ZXJzaW9uKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWtmOWcqOWkmueJiOacrO+8iOaXp+eJiCArIOacgOaWsO+8ieaXtu+8jOS4jemcgOimgeabtOaWsFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRTbmFwc2hvdCA9IHBhY2thZ2VzU2hvdWxkVXBkYXRlLmdldChwa2dOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudFNuYXBzaG90ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFja2FnZXNTaG91bGRVcGRhdGUuZGVsZXRlKHBrZ05hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOacieS4gOS4quacgOaWsOeJiOacrOS6hu+8jOWQjumdoueahOWwseS4jeeUqOWGjeWMuemFjeS6hlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhY2thZ2VTa2lwRG93bmxvYWQuc2V0KHBrZ05hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogcGtnLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOiusOW9lSBlbmFibGVkIOeKtuaAge+8jOaWueS+v+WQjue7remBjeWOhiAmIOWQr+eUqFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBwa2cuZW5hYmxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzU2VsZlVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDpnIDopoHmm7TmlrDoh6rouqvvvIzmm7TmlrDpq5jniYjmnKzmj5Lku7bnmoTot6/lvoTvvIznlKjkuo7lkI7nu63lkK/nlKhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBrZy5lbmFibGUgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGZVcGRhdGVDb25maWcgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVpbHRJblBhdGg6IHBrZ0xvY2FsUGF0aHMuYnVpbHRpbiA/PyAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjdXJyZW50UGF0aCDlnKjlkI7nu63pgY3ljobkuK3mm7TmlrDvvIzlpoLmnpzmsqHmnInlsLHnlZnnqbpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50UGF0aDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3SW5zdGFsbFBhdGg6IHBrZy5wYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDnlLHkuo7mj5Lku7blkK/liqjml7bluo/vvIzmraTml7blj6/og73msqHmnInku7vkvZXkuIDkuKogcGtnIOWkhOS6jiBlbmFibGUg54q25oCBXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFja2FnZXNTaG91bGRVcGRhdGUuaGFzKHBrZ05hbWUpICYmIHBrZy5lbmFibGUgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDlkIzkuIDml7bpl7TmnIDlpJrlj6rkvJrmnInkuIDkuKogZW5hYmxlIOeahOeJiOacrOOAglxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOi/memHjOaKiumcgOimgeabtOaWsOeahOaPkuS7tueahCBzbmFwc2hvdCDmlbDmja7mjIflkJHlvZPliY3lkK/nlKjnmoTpgqPkuKrniYjmnKxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNTZWxmVXBkYXRlICYmIHNlbGZVcGRhdGVDb25maWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZlVwZGF0ZUNvbmZpZy5jdXJyZW50UGF0aCA9IHBrZy5wYXRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNuYXBzaG90ID0gcGFja2FnZXNTaG91bGRVcGRhdGUuZ2V0KHBrZ05hbWUpIGFzIEludGVybmFsUGtnU25hcHNob3Q7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFja2FnZXNTaG91bGRVcGRhdGUuc2V0KHBrZ05hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnNuYXBzaG90LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogcGtnLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBwa2cucGtnVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWNrYWdlc1Nob3VsZFVwZGF0ZS5zZXQocGtnTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHBrZ05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogcGtnLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogcGF0aFR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVpbHRpblBhdGg6IHBrZ0xvY2FsUGF0aHMuYnVpbHRpbiA/PyAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBwa2cuZW5hYmxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZ2xvYmFsJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnb3RoZXInOlxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgcGFja2FnZXNEb3dubG9hZEFyciA9IEFycmF5LmZyb20ocGFja2FnZXNTaG91bGRVcGRhdGUpO1xuICAgIGNvbnN0IGRvd25sb2FkZXJzID0gcGFja2FnZXNEb3dubG9hZEFyci5tYXAoKFssIHNuYXBzaG90XSkgPT4ge1xuICAgICAgICBjb25zdCB7IG5hbWU6IHBrZ05hbWUgfSA9IHNuYXBzaG90O1xuXG4gICAgICAgIHJldHVybiBzZGsuZ2V0RG93bmxvYWRlcihcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpbnN0YWxsUGF0aDogZXh0ZW5zaW9uUGF0aHMuZ2xvYmFsLFxuICAgICAgICAgICAgICAgIG5hbWU6IHBrZ05hbWUsXG4gICAgICAgICAgICAgICAgZTogZWRpdG9yVmVyc2lvbixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGVyRG93bmxvYWRlZDogYXN5bmMgKGluZm8pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5YWo5bGA5YaF572u55uu5b2V5bey5pyJ5o+S5Lu277yM56aB55So5bm25Y+N5rOo5YaM44CCXG4gICAgICAgICAgICAgICAgICAgIC8vIHNkayDlnKjlronoo4Xml7bkvJrliKDpmaTlt7LmnInmj5Lku7bvvIzov5nph4zkuI3pnIDopoHmiYvliqjlpITnkIZcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0SXNEZWZpbmVkKGluZm8uaW5zdGFsbFBrZ1BhdGgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXN0ID0gaW5mby5pbnN0YWxsUGtnUGF0aDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGtnSW5zdGFsbGVkSW5EaXN0ID0gcGFja2FnZVBhdGhUb0VudGl0eVtkaXN0XTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhkaXN0KSAmJiBwa2dJbnN0YWxsZWRJbkRpc3QgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UuZGlzYWJsZShkaXN0LCB7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuUGFja2FnZS51bnJlZ2lzdGVyKGRpc3QpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIHBlckluc3RhbGxlZDogYXN5bmMgKGluZm8pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0SXNEZWZpbmVkKGluZm8uaW5zdGFsbFBrZ1BhdGgpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmZvLm5hbWUgPT09IElOVEVSTkFMX0VYVEVOU0lPTl9OQU1FKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmVXBkYXRlQ29uZmlnID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYXRoOiBzbmFwc2hvdC5wYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0luc3RhbGxQYXRoOiBpbmZvLmluc3RhbGxQa2dQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1aWx0SW5QYXRoOiBzbmFwc2hvdC5idWlsdGluUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuUGFja2FnZS5yZWdpc3RlcihpbmZvLmluc3RhbGxQa2dQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLmVuYWJsZShpbmZvLmluc3RhbGxQa2dQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICApO1xuICAgIH0pO1xuXG4gICAgLy8g5aSE55CG6ZyA6KaB5LiL6L295pu05paw55qE5omp5bGVXG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdGFza3MgPSBhd2FpdCBQcm9taXNlLmFsbFNldHRsZWQoZG93bmxvYWRlcnMubWFwKChkb3dubG9hZGVyKSA9PiBkb3dubG9hZGVyLmRvd25sb2FkKCkpKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0YXNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgdGFzayA9IHRhc2tzW2ldO1xuICAgICAgICAgICAgaWYgKHRhc2suc3RhdHVzID09PSAnZnVsZmlsbGVkJykge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUT0RPOiBnZXQgZXh0cmEgZGV0YWlsIGZyb20gc25hcHNob3QgP1xuICAgICAgICAgICAgLy8gY29uc3QgcGFja2FnZVNuYXBzaG90ID0gcGFja2FnZXNEb3dubG9hZEFycltpXTtcblxuICAgICAgICAgICAgY29uc29sZS5lcnJvcih0YXNrLnJlYXNvbik7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICB9XG5cbiAgICAvLyDlpITnkIbpnIDopoHlkK/nlKjmlrDniYjmnKznmoTmianlsZXjgILms6jmhI9cbiAgICBpZiAocGFja2FnZVNraXBEb3dubG9hZC5zaXplID4gMCkge1xuICAgICAgICBjb25zdCBlbnRyaWVzID0gcGFja2FnZVNraXBEb3dubG9hZC5lbnRyaWVzKCk7XG4gICAgICAgIHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBbbmFtZSwgeyBlbmFibGVkLCBwYXRoIH1dIG9mIGVudHJpZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoZW5hYmxlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuUGFja2FnZS5lbmFibGUocGF0aCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRXh0ZW5zaW9uIGVuYWJsZSBmYWlsZWQuIG5hbWUgXCIke25hbWV9XCIsIHBhdGggXCIke3BhdGh9XCJgKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMCk7XG4gICAgfVxuXG4gICAgLy8g5aSE55CG5omp5bGV566h55CG5Zmo55qE5by65Yi26Ieq5pu05pawXG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZWxmVXBkYXRlQ29uZmlnID09PSAnb2JqZWN0JyAmJiBzZWxmVXBkYXRlQ29uZmlnICE9IG51bGwgJiYgb3B0aW9ucy5zZWxmVXBkYXRlKSB7XG4gICAgICAgICAgICBjb25zdCBfc2VsZlVwZGF0ZSA9IG9wdGlvbnMuc2VsZlVwZGF0ZTtcbiAgICAgICAgICAgIGNvbnN0IF9jb25maWcgPSBzZWxmVXBkYXRlQ29uZmlnO1xuICAgICAgICAgICAgLy8g6L+Z6YeM5rOo5oSP5LiN6IO95aSE55CG5oiQIHByb21pc2XvvIzopoHmioroh6rmm7TmlrDnmoTmk43kvZzmlL7liLAgbmV4dFRpY2sg5Y675omn6KGM44CCXG4gICAgICAgICAgICAvLyDlkKbliJnkvJrlvbHlk43lvZPliY3ov5DooYznmoTmianlsZXnrqHnkIblmajnmoTpgLvovpHvvIzpgKDmiJDkuIDkupvlpYfmgKrpl67popjjgIJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIOagueaNruaJqeWxleeuoeeQhuWZqOW9k+WJjeeahOW8gOWQr+eKtuaAgeWIpOaWreaYr+WQpuimgemHjeaWsOW8gOWQr1xuICAgICAgICAgICAgICAgIGNvbnN0IHNob3VsZE1hbmFnZXJSZW9wZW4gPSBhd2FpdCBFZGl0b3IuUGFuZWwuaGFzKCdleHRlbnNpb24ubWFuYWdlcicpO1xuICAgICAgICAgICAgICAgIF9zZWxmVXBkYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgLi4uX2NvbmZpZyxcbiAgICAgICAgICAgICAgICAgICAgcmVvcGVuUGFuZWw6IHNob3VsZE1hbmFnZXJSZW9wZW4sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0V4dGVuc2lvbiBmb3JjZWQgc2VsZiB1cGRhdGUgZmFpbGVkJyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH1cbn1cbiJdfQ==