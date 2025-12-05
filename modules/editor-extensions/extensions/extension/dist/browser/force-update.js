"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forceUpdate = exports.setupContext = void 0;
const extension_sdk_1 = require("@editor/extension-sdk");
const semver_1 = __importDefault(require("semver"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = require("lodash");
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
    const { customSdkDomain, extensionPaths } = await config_1.readConfigs();
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
        const serverPkg = serverNameToEntity[pkgName];
        const pkgLocalPaths = nameToPaths[pkgName];
        const localPkgPathTypes = Object.keys(pkgLocalPaths);
        const isSelfUpdate = pkgName === utils_1.INTERNAL_EXTENSION_NAME;
        if (localPkgPathTypes.length < 1) {
            // 本地没有这个包，直接下载安装
            packagesShouldUpdate.set(pkgName, {
                name: pkgName,
                type: 'global',
                path: '',
                builtinPath: '',
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
            assertIsDefined(pkgPath);
            const pkg = packagePathToEntity[pkgPath];
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
                if (fs_extra_1.default.existsSync(dist) && lodash_1.has(packagePathToEntity, dist)) {
                    await Editor.Package.disable(info.name, {});
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9yY2UtdXBkYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2Jyb3dzZXIvZm9yY2UtdXBkYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHlEQUE0RTtBQUM1RSxvREFBNEI7QUFDNUIsd0RBQTBCO0FBRTFCLG1DQUE2QjtBQUU3Qiw2Q0FBK0M7QUFDL0MsbURBQTZFO0FBQzdFLDJDQUEwRDtBQWlCMUQsU0FBUyxlQUFlLENBQUksR0FBTSxFQUFFLE9BQWdCO0lBQ2hELElBQUksR0FBRyxLQUFLLFNBQVMsSUFBSSxHQUFHLEtBQUssSUFBSSxFQUFFO1FBQ25DLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxPQUFPLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLDhDQUE4QyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0tBQ2hIO0FBQ0wsQ0FBQztBQUVELDBCQUEwQjtBQUMxQixTQUFTLHFCQUFxQixDQUFDLElBQWtDO0lBQzdELE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7SUFDekMsTUFBTSxJQUFJLEdBQStDLEVBQUUsQ0FBQztJQUU1RCxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksRUFBRTtRQUNyQixjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztLQUMxQjtJQUVELE9BQU87UUFDSCxLQUFLLEVBQUUsY0FBYztRQUNyQixVQUFVLEVBQUUsSUFBSTtLQUNuQixDQUFDO0FBQ04sQ0FBQztBQUVELFNBQVMseUJBQXlCLENBQUMsUUFBdUI7SUFDdEQsTUFBTSxVQUFVLEdBQTBDLEVBQUUsQ0FBQztJQUM3RCxNQUFNLFdBQVcsR0FBeUQsRUFBRSxDQUFDO0lBQzdFLE1BQU0sU0FBUyxHQUFhLEVBQUUsQ0FBQztJQUUvQixLQUFL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SyxFQUFFO1FBQ1osT0FBTyxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO1FBQ3JELE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDeEI7QUFDTCxDQUFDO0FBNU5ELGtDQTROQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1hbmFnZXIsIElFeHRlbnNpb25MaXN0SXRlbVJlc3BvbnNlIH0gZnJvbSAnQGVkaXRvci9leHRlbnNpb24tc2RrJztcbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGhhcyB9IGZyb20gJ2xvZGFzaCc7XG5cbmltcG9ydCB7IHJlYWRDb25maWdzIH0gZnJvbSAnLi4vc2hhcmVkL2NvbmZpZyc7XG5pbXBvcnQgeyBFeHRlbnNpb25NYW5hZ2VyVGFiLCBTZWxmVXBkYXRlT3B0aW9ucyB9IGZyb20gJy4uL3B1YmxpYy9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgSU5URVJOQUxfRVhURU5TSU9OX05BTUUgfSBmcm9tICcuLi9wdWJsaWMvdXRpbHMnO1xuXG50eXBlIFBhY2thZ2VJbmZvID0gRWRpdG9yLkludGVyZmFjZS5QYWNrYWdlSW5mbztcbnR5cGUgUGFja2FnZVR5cGUgPSBFZGl0b3IuUGFja2FnZS5wYWNrYWdlVHlwZTtcbnR5cGUgUGFja2FnZUluZm9Ob3JtYWxpemVkID0gUGFja2FnZUluZm8gJiB7IHBrZ1R5cGU6IFBhY2thZ2VUeXBlIH07XG5cbnR5cGUgSW50ZXJuYWxQa2dTbmFwc2hvdCA9IHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgcGF0aDogc3RyaW5nO1xuICAgIGJ1aWx0aW5QYXRoOiBzdHJpbmc7XG4gICAgdHlwZTogUGFja2FnZVR5cGU7XG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIEZvcmNlVXBkYXRlT3B0aW9ucyB7XG4gICAgc2VsZlVwZGF0ZT86IChvcHRpb25zOiBTZWxmVXBkYXRlT3B0aW9ucykgPT4gUHJvbWlzZTx2b2lkPiB8IHZvaWQ7XG59XG5cbmZ1bmN0aW9uIGFzc2VydElzRGVmaW5lZDxUPih2YWw6IFQsIG1lc3NhZ2U/OiBzdHJpbmcpOiBhc3NlcnRzIHZhbCBpcyBOb25OdWxsYWJsZTxUPiB7XG4gICAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkIHx8IHZhbCA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IodHlwZW9mIG1lc3NhZ2UgPT09ICdzdHJpbmcnID8gbWVzc2FnZSA6IGBFeHBlY3RlZCAndmFsJyB0byBiZSBkZWZpbmVkLCBidXQgcmVjZWl2ZWQgJHt2YWx9YCk7XG4gICAgfVxufVxuXG4vLyBub3JtYWxpemUgZXh0ZW5zaW9uTGlzdFxuZnVuY3Rpb24gbm9ybWFsaXplTGlzdFJlc3BvbnNlKGxpc3Q6IElFeHRlbnNpb25MaXN0SXRlbVJlc3BvbnNlW10pIHtcbiAgICBjb25zdCBuYW1lc01heVVwZGF0ZSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGNvbnN0IGRhdGE6IFJlY29yZDxzdHJpbmcsIElFeHRlbnNpb25MaXN0SXRlbVJlc3BvbnNlPiA9IHt9O1xuXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIGxpc3QpIHtcbiAgICAgICAgbmFtZXNNYXlVcGRhdGUuYWRkKGl0ZW0ubmFtZSk7XG4gICAgICAgIGRhdGFbaXRlbS5uYW1lXSA9IGl0ZW07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZXM6IG5hbWVzTWF5VXBkYXRlLFxuICAgICAgICBleHRlbnNpb25zOiBkYXRhLFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUludGVybmFsUGFja2FnZXMocGFja2FnZXM6IFBhY2thZ2VJbmZvW10pIHtcbiAgICBjb25zdCBwYXRoVG9JbmZvOiBSZWNvcmQ8c3RyaW5nLCBQYWNrYWdlSW5mb05vcm1hbGl6ZWQ+ID0ge307XG4gICAgY29uc3QgbmFtZVRvUGF0aHM6IFJlY29yZDxzdHJpbmcsIFBhcnRpYWw8UmVjb3JkPFBhY2thZ2VUeXBlLCBzdHJpbmc+Pj4gPSB7fTtcbiAgICBjb25zdCBwYXRoRW50cnk6IHN0cmluZ1tdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHBrZyBvZiBwYWNrYWdlcykge1xuICAgICAgICBjb25zdCBwa2dOYW1lID0gcGtnLm5hbWU7XG4gICAgICAgIGNvbnN0IHBrZ1R5cGUgPSBFZGl0b3IuUGFja2FnZS5fX3Byb3RlY3RlZF9fLmNoZWNrVHlwZShwa2cucGF0aCk7XG5cbiAgICAgICAgcGF0aEVudHJ5LnB1c2gocGtnLnBhdGgpO1xuICAgICAgICBwYXRoVG9JbmZvW3BrZy5wYXRoXSA9IHtcbiAgICAgICAgICAgIC4uLnBrZyxcbiAgICAgICAgICAgIHBrZ1R5cGU6IHBrZ1R5cGUsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgbmFtZU1hcCA9IG5hbWVUb1BhdGhzW3BrZ05hbWVdID8/IChuYW1lVG9QYXRoc1twa2dOYW1lXSA9IHt9KTtcbiAgICAgICAgbmFtZU1hcFtwa2dUeXBlXSA9IHBrZy5wYXRoO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIC8qKiBwYWNrYWdlIHBhdGggbGlzdCAqL1xuICAgICAgICBwYWNrYWdlc0VudHJ5OiBwYXRoRW50cnksXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBwYWNrYWdlIGBwYXRoYCB0byBlbnRpdHlcbiAgICAgICAgICovXG4gICAgICAgIHBhY2thZ2VzOiBwYXRoVG9JbmZvLFxuICAgICAgICBuYW1lVG9QYXRocyxcbiAgICB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0dXBDb250ZXh0KCkge1xuICAgIGNvbnN0IHsgY3VzdG9tU2RrRG9tYWluLCBleHRlbnNpb25QYXRocyB9ID0gYXdhaXQgcmVhZENvbmZpZ3MoKTtcbiAgICBjb25zdCBlZGl0b3JWZXJzaW9uID0gRWRpdG9yLkFwcC52ZXJzaW9uO1xuXG4gICAgY29uc3Qgc2RrID0gbmV3IE1hbmFnZXIoe1xuICAgICAgICBleHRlbnNpb25QYXRoczogW2V4dGVuc2lvblBhdGhzLnByb2plY3QsIGV4dGVuc2lvblBhdGhzLmdsb2JhbF0sXG4gICAgICAgIGRvbWFpbjogY3VzdG9tU2RrRG9tYWluLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2RrLFxuICAgICAgICBlZGl0b3JWZXJzaW9uLFxuICAgICAgICBleHRlbnNpb25QYXRocyxcbiAgICB9O1xufVxuXG4vKipcbiAqIOW8uuWItuabtOaWsOafkOS6m+S+nei1lu+8jOS/neivgeWug+S7rOWni+e7iOaYr+acgOaWsOeJiOacrFxuICpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9jb2Nvcy8zZC10YXNrcy9pc3N1ZXMvMTUyODFcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZvcmNlVXBkYXRlKG9wdGlvbnM6IEZvcmNlVXBkYXRlT3B0aW9ucykge1xuICAgIGNvbnN0IHsgZWRpdG9yVmVyc2lvbiwgc2RrLCBleHRlbnNpb25QYXRocyB9ID0gYXdhaXQgc2V0dXBDb250ZXh0KCk7XG5cbiAgICBjb25zdCB7IHBhY2thZ2VzOiBzZXJ2ZXJFeHRlbnNpb25MaXN0IH0gPSBhd2FpdCBzZGsuZ2V0RXh0ZW5zaW9uTGlzdCh7XG4gICAgICAgIGU6IGVkaXRvclZlcnNpb24sXG4gICAgICAgIGxhYmVsOiBgJHtFeHRlbnNpb25NYW5hZ2VyVGFiLkZvcmNlZFVwZGF0ZX1gLFxuICAgICAgICBsYW5nOiBFZGl0b3IuSTE4bi5nZXRMYW5ndWFnZSgpLFxuICAgIH0pO1xuICAgIGNvbnN0IHsgbmFtZXM6IHNlcnZlck5hbWVzLCBleHRlbnNpb25zOiBzZXJ2ZXJOYW1lVG9FbnRpdHkgfSA9IG5vcm1hbGl6ZUxpc3RSZXNwb25zZShzZXJ2ZXJFeHRlbnNpb25MaXN0KTtcblxuICAgIGNvbnN0IGFsbFBhY2thZ2VzID0gYXdhaXQgRWRpdG9yLlBhY2thZ2UuZ2V0UGFja2FnZXMoKTtcbiAgICBjb25zdCB7IHBhY2thZ2VzOiBwYWNrYWdlUGF0aFRvRW50aXR5LCBuYW1lVG9QYXRocyB9ID0gbm9ybWFsaXplSW50ZXJuYWxQYWNrYWdlcyhhbGxQYWNrYWdlcyk7XG5cbiAgICAvKipcbiAgICAgKiDmiavmj4/mnKzlnLDmiYDmnInmj5Lku7bvvIzlr7vmib7pnIDopoHlvLrliLbkuIvovb3mm7TmlrDnmoTmj5Lku7bjgIJrZXk6IHBrZy5uYW1lXG4gICAgICovXG4gICAgY29uc3QgcGFja2FnZXNTaG91bGRVcGRhdGU6IE1hcDxzdHJpbmcsIEludGVybmFsUGtnU25hcHNob3Q+ID0gbmV3IE1hcCgpO1xuICAgIC8vIOaPkuS7tuWtmOWcqOWkmueJiOacrOaXtu+8jOWPr+S7pei3s+i/h+abtOaWsOeahOaPkuS7tuOAglxuICAgIC8vIOS4jemcgOimgeabtOaWsO+8jOS9humcgOimgeWQr+eUqOWIsOacgOaWsOeJiOacrO+8jOWboOatpOmcgOimgeiusOW9leaPkuS7tui3r+W+hOOAglxuICAgIGNvbnN0IHBhY2thZ2VTa2lwRG93bmxvYWQgPSBuZXcgTWFwPHN0cmluZywgeyBwYXRoOiBzdHJpbmc7IGVuYWJsZWQ6IGJvb2xlYW4gfT4oKTtcblxuICAgIGxldCBzZWxmVXBkYXRlQ29uZmlnOiBTZWxmVXBkYXRlT3B0aW9ucyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAgIGZvciAoY29uc3QgcGtnTmFtZSBvZiBzZXJ2ZXJOYW1lcykge1xuICAgICAgICBjb25zdCBzZXJ2ZXJQa2cgPSBzZXJ2ZXJOYW1lVG9FbnRpdHlbcGtnTmFtZV07XG4gICAgICAgIGNvbnN0IHBrZ0xvY2FsUGF0aHMgPSBuYW1lVG9QYXRoc1twa2dOYW1lXTtcbiAgICAgICAgY29uc3QgbG9jYWxQa2dQYXRoVHlwZXMgPSBPYmplY3Qua2V5cyhwa2dMb2NhbFBhdGhzKSBhcyBQYWNrYWdlVHlwZVtdO1xuICAgICAgICBjb25zdCBpc1NlbGZVcGRhdGUgPSBwa2dOYW1lID09PSBJTlRFUk5BTF9FWFRFTlNJT05fTkFNRTtcblxuICAgICAgICBpZiAobG9jYWxQa2dQYXRoVHlwZXMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgLy8g5pys5Zyw5rKh5pyJ6L+Z5Liq5YyF77yM55u05o6l5LiL6L295a6J6KOFXG4gICAgICAgICAgICBwYWNrYWdlc1Nob3VsZFVwZGF0ZS5zZXQocGtnTmFtZSwge1xuICAgICAgICAgICAgICAgIG5hbWU6IHBrZ05hbWUsXG4gICAgICAgICAgICAgICAgdHlwZTogJ2dsb2JhbCcsXG4gICAgICAgICAgICAgICAgcGF0aDogJycsXG4gICAgICAgICAgICAgICAgYnVpbHRpblBhdGg6ICcnLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOmBjeWOhuS4jeWQjOi3r+W+hOS4i+eahOWQjOWQjeaPkuS7tu+8jOWIhuaekOaYr+WQpumcgOimgeabtOaWsOaTjeS9nO+8mlxuICAgICAgICAvLyAxLiDkuIvovb3mlrDniYjlubbmm7TmlrAgMi4g55u05o6l5ZCv55So5pys5Zyw55qE5paw54mI5pysIDMuIOebtOaOpei3s+i/h1xuICAgICAgICBmb3IgKGNvbnN0IHBhdGhUeXBlIG9mIGxvY2FsUGtnUGF0aFR5cGVzKSB7XG4gICAgICAgICAgICBpZiAocGFja2FnZVNraXBEb3dubG9hZC5oYXMocGtnTmFtZSkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcGtnUGF0aCA9IHBrZ0xvY2FsUGF0aHNbcGF0aFR5cGVdO1xuICAgICAgICAgICAgLy8gYGxvY2FsUGtnUGF0aFR5cGVzYCBjYW1lcyBmcm9tIGBwa2dMb2NhbFBhdGhzYFxuICAgICAgICAgICAgYXNzZXJ0SXNEZWZpbmVkKHBrZ1BhdGgpO1xuXG4gICAgICAgICAgICBjb25zdCBwa2cgPSBwYWNrYWdlUGF0aFRvRW50aXR5W3BrZ1BhdGhdO1xuICAgICAgICAgICAgc3dpdGNoIChwYXRoVHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2NvdmVyJzpcbiAgICAgICAgICAgICAgICBjYXNlICdidWlsdGluJzpcbiAgICAgICAgICAgICAgICBjYXNlICdsb2NhbCc6IHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5a2Y5Zyo54mI5pysID49IOacjeWKoeerr+acgOaWsOeJiOacrO+8jOS4jeabtOaWsFxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VtdmVyLmd0ZShwa2cudmVyc2lvbiwgc2VydmVyUGtnLmxhdGVzdF92ZXJzaW9uKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5a2Y5Zyo5aSa54mI5pys77yI5pen54mIICsg5pyA5paw77yJ5pe277yM5LiN6ZyA6KaB5pu05pawXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50U25hcHNob3QgPSBwYWNrYWdlc1Nob3VsZFVwZGF0ZS5nZXQocGtnTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudFNuYXBzaG90ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWNrYWdlc1Nob3VsZFVwZGF0ZS5kZWxldGUocGtnTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOacieS4gOS4quacgOaWsOeJiOacrOS6hu+8jOWQjumdoueahOWwseS4jeeUqOWGjeWMuemFjeS6hlxuICAgICAgICAgICAgICAgICAgICAgICAgcGFja2FnZVNraXBEb3dubG9hZC5zZXQocGtnTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHBrZy5wYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOiusOW9lSBlbmFibGVkIOeKtuaAge+8jOaWueS+v+WQjue7remBjeWOhiAmIOWQr+eUqFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IHBrZy5lbmFibGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzU2VsZlVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOmcgOimgeabtOaWsOiHqui6q++8jOabtOaWsOmrmOeJiOacrOaPkuS7tueahOi3r+W+hO+8jOeUqOS6juWQjue7reWQr+eUqFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwa2cuZW5hYmxlICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGZVcGRhdGVDb25maWcgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWlsdEluUGF0aDogcGtnTG9jYWxQYXRocy5idWlsdGluID8/ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY3VycmVudFBhdGgg5Zyo5ZCO57ut6YGN5Y6G5Lit5pu05paw77yM5aaC5p6c5rKh5pyJ5bCx55WZ56m6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50UGF0aDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdJbnN0YWxsUGF0aDogcGtnLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwYWNrYWdlc1Nob3VsZFVwZGF0ZS5oYXMocGtnTmFtZSkgJiYgcGtnLmVuYWJsZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5ZCM5LiA5pe26Ze05pyA5aSa5Y+q5Lya5pyJ5LiA5LiqIGVuYWJsZSDnmoTniYjmnKzjgIJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOi/memHjOaKiumcgOimgeabtOaWsOeahOaPkuS7tueahCBzbmFwc2hvdCDmlbDmja7mjIflkJHlvZPliY3lkK/nlKjnmoTpgqPkuKrniYjmnKxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1NlbGZVcGRhdGUgJiYgc2VsZlVwZGF0ZUNvbmZpZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGZVcGRhdGVDb25maWcuY3VycmVudFBhdGggPSBwa2cucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc25hcHNob3QgPSBwYWNrYWdlc1Nob3VsZFVwZGF0ZS5nZXQocGtnTmFtZSkgYXMgSW50ZXJuYWxQa2dTbmFwc2hvdDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhY2thZ2VzU2hvdWxkVXBkYXRlLnNldChwa2dOYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnNuYXBzaG90LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBwa2cucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogcGtnLnBrZ1R5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHBhY2thZ2VzU2hvdWxkVXBkYXRlLnNldChwa2dOYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBwa2dOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogcGtnLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBwYXRoVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1aWx0aW5QYXRoOiBwa2dMb2NhbFBhdGhzLmJ1aWx0aW4gPz8gJycsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNhc2UgJ2dsb2JhbCc6XG4gICAgICAgICAgICAgICAgY2FzZSAnb3RoZXInOlxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIC8vIGlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHBhY2thZ2VzRG93bmxvYWRBcnIgPSBBcnJheS5mcm9tKHBhY2thZ2VzU2hvdWxkVXBkYXRlKTtcbiAgICBjb25zdCBkb3dubG9hZGVycyA9IHBhY2thZ2VzRG93bmxvYWRBcnIubWFwKChbLCBzbmFwc2hvdF0pID0+IHtcbiAgICAgICAgY29uc3QgeyBuYW1lOiBwa2dOYW1lIH0gPSBzbmFwc2hvdDtcblxuICAgICAgICByZXR1cm4gc2RrLmdldERvd25sb2FkZXIoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaW5zdGFsbFBhdGg6IGV4dGVuc2lvblBhdGhzLmdsb2JhbCxcbiAgICAgICAgICAgICAgICBuYW1lOiBwa2dOYW1lLFxuICAgICAgICAgICAgICAgIGU6IGVkaXRvclZlcnNpb24sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBlckRvd25sb2FkZWQ6IGFzeW5jIChpbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWFqOWxgOWGhee9ruebruW9leW3suacieaPkuS7tu+8jOemgeeUqOW5tuWPjeazqOWGjOOAglxuICAgICAgICAgICAgICAgICAgICAvLyBzZGsg5Zyo5a6J6KOF5pe25Lya5Yig6Zmk5bey5pyJ5o+S5Lu277yM6L+Z6YeM5LiN6ZyA6KaB5omL5Yqo5aSE55CGXG4gICAgICAgICAgICAgICAgICAgIGFzc2VydElzRGVmaW5lZChpbmZvLmluc3RhbGxQa2dQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzdCA9IGluZm8uaW5zdGFsbFBrZ1BhdGg7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGRpc3QpICYmIGhhcyhwYWNrYWdlUGF0aFRvRW50aXR5LCBkaXN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UuZGlzYWJsZShpbmZvLm5hbWUsIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLnVucmVnaXN0ZXIoZGlzdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgcGVySW5zdGFsbGVkOiBhc3luYyAoaW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnRJc0RlZmluZWQoaW5mby5pbnN0YWxsUGtnUGF0aCk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZm8ubmFtZSA9PT0gSU5URVJOQUxfRVhURU5TSU9OX05BTUUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGZVcGRhdGVDb25maWcgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFBhdGg6IHNuYXBzaG90LnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3SW5zdGFsbFBhdGg6IGluZm8uaW5zdGFsbFBrZ1BhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVpbHRJblBhdGg6IHNuYXBzaG90LmJ1aWx0aW5QYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLnJlZ2lzdGVyKGluZm8uaW5zdGFsbFBrZ1BhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UuZW5hYmxlKGluZm8uaW5zdGFsbFBrZ1BhdGgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICk7XG4gICAgfSk7XG5cbiAgICAvLyDlpITnkIbpnIDopoHkuIvovb3mm7TmlrDnmoTmianlsZVcbiAgICB0cnkge1xuICAgICAgICBjb25zdCB0YXNrcyA9IGF3YWl0IFByb21pc2UuYWxsU2V0dGxlZChkb3dubG9hZGVycy5tYXAoKGRvd25sb2FkZXIpID0+IGRvd25sb2FkZXIuZG93bmxvYWQoKSkpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhc2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB0YXNrID0gdGFza3NbaV07XG4gICAgICAgICAgICBpZiAodGFzay5zdGF0dXMgPT09ICdmdWxmaWxsZWQnKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRPRE86IGdldCBleHRyYSBkZXRhaWwgZnJvbSBzbmFwc2hvdCA/XG4gICAgICAgICAgICAvLyBjb25zdCBwYWNrYWdlU25hcHNob3QgPSBwYWNrYWdlc0Rvd25sb2FkQXJyW2ldO1xuXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKHRhc2sucmVhc29uKTtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH1cblxuICAgIC8vIOWkhOeQhumcgOimgeWQr+eUqOaWsOeJiOacrOeahOaJqeWxleOAguazqOaEj1xuICAgIGlmIChwYWNrYWdlU2tpcERvd25sb2FkLnNpemUgPiAwKSB7XG4gICAgICAgIGNvbnN0IGVudHJpZXMgPSBwYWNrYWdlU2tpcERvd25sb2FkLmVudHJpZXMoKTtcbiAgICAgICAgc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtuYW1lLCB7IGVuYWJsZWQsIHBhdGggfV0gb2YgZW50cmllcykge1xuICAgICAgICAgICAgICAgIGlmIChlbmFibGVkID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLmVuYWJsZShwYXRoKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBFeHRlbnNpb24gZW5hYmxlIGZhaWxlZC4gbmFtZSBcIiR7bmFtZX1cIiwgcGF0aCBcIiR7cGF0aH1cImApO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCAwKTtcbiAgICB9XG5cbiAgICAvLyDlpITnkIbmianlsZXnrqHnkIblmajnmoTlvLrliLboh6rmm7TmlrBcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNlbGZVcGRhdGVDb25maWcgPT09ICdvYmplY3QnICYmIHNlbGZVcGRhdGVDb25maWcgIT0gbnVsbCAmJiBvcHRpb25zLnNlbGZVcGRhdGUpIHtcbiAgICAgICAgICAgIGNvbnN0IF9zZWxmVXBkYXRlID0gb3B0aW9ucy5zZWxmVXBkYXRlO1xuICAgICAgICAgICAgY29uc3QgX2NvbmZpZyA9IHNlbGZVcGRhdGVDb25maWc7XG4gICAgICAgICAgICAvLyDov5nph4zms6jmhI/kuI3og73lpITnkIbmiJAgcHJvbWlzZe+8jOimgeaKiuiHquabtOaWsOeahOaTjeS9nOaUvuWIsCBuZXh0VGljayDljrvmiafooYzjgIJcbiAgICAgICAgICAgIC8vIOWQpuWImeS8muW9seWTjeW9k+WJjei/kOihjOeahOaJqeWxleeuoeeQhuWZqOeahOmAu+i+ke+8jOmAoOaIkOS4gOS6m+Wlh+aAqumXrumimOOAglxuICAgICAgICAgICAgc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8g5qC55o2u5omp5bGV566h55CG5Zmo5b2T5YmN55qE5byA5ZCv54q25oCB5Yik5pat5piv5ZCm6KaB6YeN5paw5byA5ZCvXG4gICAgICAgICAgICAgICAgY29uc3Qgc2hvdWxkTWFuYWdlclJlb3BlbiA9IGF3YWl0IEVkaXRvci5QYW5lbC5oYXMoJ2V4dGVuc2lvbi5tYW5hZ2VyJyk7XG4gICAgICAgICAgICAgICAgX3NlbGZVcGRhdGUoe1xuICAgICAgICAgICAgICAgICAgICAuLi5fY29uZmlnLFxuICAgICAgICAgICAgICAgICAgICByZW9wZW5QYW5lbDogc2hvdWxkTWFuYWdlclJlb3BlbixcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXh0ZW5zaW9uIGZvcmNlZCBzZWxmIHVwZGF0ZSBmYWlsZWQnKTtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfVxufVxuIl19