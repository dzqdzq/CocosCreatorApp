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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9yY2UtdXBkYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2Jyb3dzZXIvZm9yY2UtdXBkYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHlEQUE0RTtBQUM1RSxvREFBNEI7QUFDNUIsd0RBQTBCO0FBSTFCLDZDQUErQztBQUMvQyxtREFBNkU7QUFDN0UsMkNBQTBEO0FBa0IxRCxTQUFTLGVBQWUsQ0FBSSxHQUFNLEVBQUUsT0FBZ0I7SUFDaEQsSUFBSSxHQUFHLEtBQUssU0FBUyxJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUU7UUFDbkMsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsOENBQThDLEdBQUcsRUFBRSxDQUFDLENBQUM7S0FDaEg7QUFDTCxDQUFDO0FBRUQsMEJBQTBCO0FBQzFCLFNBQVMscUJBQXFCLENBQUMsSUFBa0M7SUFDN0QsTUFBTSxjQUFjLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztJQUN6QyxNQUFNLElBQUksR0FBK0MsRUFBRSxDQUFDO0lBRTVELEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxFQUFFO1FBQ3JCLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO0tBQzFCO0lBRUQsT0FBTztRQUNILEtBQUssRUFBRSxjQUFjO1FBQ3JCLFVBQVUsRUFBRSxJQUFJO0tBQ25CLENBQUM7QUFDTixDQUFDO0FBRUQsU0FBUyx5QkFBeUIsQ0FBQyxRQUF1QjtJQUN0RCxNQUFNLFVBQVUsR0FBc0QsRUFBRSxDQUFDO0lBQ3pFLE1BQU0sV0FBVyxHQUFpRixFQUFFLENBQUM7SUFDckcsTUFBTSxTQUFTLEdBQWEsRUFBRSxDQUFDO0lBRS9CLEtBQUssTUFBTSxHQUFHLElBQUksUUFBUSxFQUFFO1FBQ3hCLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDekIsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVqRSxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6QixVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHO1lBQ25CLEdBQUcsR0FBRztZQUNOLE9BQU8sRUFBRSxPQUFPO1NBQ25CLENBQUM7UUFFRixNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDcEUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7S0FDL0I7SUFFRCxPQUFPO1FBQ0gsd0JBQXdCO1FBQ3hCLGFBQWEsRUFBRSxTQUFTO1FBQ3hCOztXQUVHO1FBQ0gsUUFBUSxFQUFFLFVBQVU7UUFDcEIsV0FBVztLQUNkLENBQUM7QUFDTixDQUFDO0FBRU0sS0FBSyxVQUFVLFlBQVk7SUFDOUIsTUFBTSxFQUFFLGVBQWUsRUFBRSxjQUFjLEVBQUUsR0FBRyxNQUFNLG9CQUFXLEVBQUUsQ0FBQztJQUNoRSxNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztJQUV6QyxNQUFNLEdBQUcsR0FBRyxJQUFJLHVCQUFPLENBQUM7UUFDcEIsY0FBYyxFQUFFLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsTUFBTSxDQUFDO1FBQy9ELE1BQU0sRUFBRSxlQUFlO0tBQzFCLENBQUMsQ0FBQztJQUVILE9BQU87UUFDSCxHQUFHO1FBQ0gsYUFBYTtRQUNiLGNBQWM7S0FDakIsQ0FBQztBQUNOLENBQUM7QUFkRCxvQ0FjQztBQUVEOzs7O0dBSUc7QUFDSSxLQUFLLFVBQVUsV0FBVyxDQUFDLE9BQTJCO0lBQ3pELE1BQU0sRUFBRSxhQUFhLEVBQUUsR0FBRyxFQUFFLGNBQWMsRUFBRSxHQUFHLE1BQU0sWUFBWSxFQUFFLENBQUM7SUFFcEUsTUFBTSxFQUFFLFFBQVEsRUFBRSxtQkFBbUIsRUFBRSxHQUFHLE1BQU0sR0FBRyxDQUFDLGdCQUFnQixDQUFDO1FBQ2pFLENBQUMsRUFBRSxhQUFhO1FBQ2hCLEtBQUssRUFBRSxHQUFHLCtCQUFtQixDQUFDLFlBQVksRUFBRTtRQUM1QyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7S0FDbEMsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixFQUFFLEdBQUcscUJBQXFCLENBQUMsbUJBQW1CLENBQUMsQ0FBQztJQUUxRyxNQUFNLFdBQVcsR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDdkQsTUFBTSxFQUFFLFFBQVEsRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsR0FBRyx5QkFBeUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUU5Rjs7T0FFRztJQUNILE1BQU0sb0JBQW9CLEdBQXFDLElBQUksR0FBRyxFQUFFLENBQUM7SUFDekUsc0JBQXNCO0lBQ3RCLCtCQUErQjtJQUMvQixNQUFNLG1CQUFtQixHQUFHLElBQUksR0FBRyxFQUE4QyxDQUFDO0lBRWxGLElBQUksZ0JBQWdCLEdBQWtDLFNBQVMsQ0FBQztJQUVoRSxLQUFLLE1BQU0sT0FBTyxJQUFJLFdBQVcsRUFBRTtRQUMvQixJQUFJO1lBQ0EsTUFBTSxTQUFTLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUMsTUFBTSxhQUFhLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNqRCxNQUFNLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFrQixDQUFDO1lBQ3RFLE1BQU0sWUFBWSxHQUFHLE9BQU8sS0FBSywrQkFBdUIsQ0FBQztZQUV6RCxJQUFJLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQzlCLGlCQUFpQjtnQkFDakIsb0JBQW9CLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRTtvQkFDOUIsSUFBSSxFQUFFLE9BQU87b0JBQ2IsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsSUFBSSxFQUFFLEVBQUU7b0JBQ1IsV0FBVyxFQUFFLEVBQUU7b0JBQ2YsT0FBTyxFQUFFLEtBQUs7aUJBQ2pCLENBQUMsQ0FBQztnQkFDSCxTQUFTO2FBQ1o7WUFFRCwyQkFBMkI7WUFDM0IsbUNBQW1DO1lBQ25DLEtBQUssTUFBTSxRQUFRLElBQUksaUJBQWlCLEVBQUU7Z0JBQ3RDLElBQUksbUJBQW1CLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUNsQyxTQUFTO2lCQUNaO2dCQUVELE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDeEMsaURBQWlEO2dCQUNqRCxlQUFlLENBQUMsT0FBTyxFQUFFLDBCQUEwQixRQUFRLDBCQUEwQixDQUFDLENBQUM7Z0JBRXZGLE1BQU0sR0FBRyxHQUFHLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN6Qyw4Q0FBOEM7Z0JBQzlDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsNkJBQTZCLE9BQU8seUJBQXlCLENBQUMsQ0FBQztnQkFFcEYsUUFBUSxRQUFRLEVBQUU7b0JBQ2QsS0FBSyxPQUFPLENBQUM7b0JBQ2IsS0FBSyxTQUFTLENBQUM7b0JBQ2YsS0FBSyxPQUFPLENBQUMsQ0FBQzt3QkFDVixzQkFBc0I7d0JBQ3RCLElBQUksZ0JBQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsY0FBYyxDQUFDLEVBQUU7NEJBQ25ELHdCQUF3Qjs0QkFDeEIsTUFBTSxlQUFlLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDOzRCQUMxRCxJQUFJLGVBQWUsSUFBSSxJQUFJLEVBQUU7Z0NBQ3pCLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQzs2QkFDeEM7NEJBRUQsc0JBQXNCOzRCQUN0QixtQkFBbUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFO2dDQUM3QixJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUk7Z0NBQ2QsNEJBQTRCO2dDQUM1QixPQUFPLEVBQUUsR0FBRyxDQUFDLE1BQU07NkJBQ3RCLENBQUMsQ0FBQzs0QkFFSCxJQUFJLFlBQVksRUFBRTtnQ0FDZCwyQkFBMkI7Z0NBQzNCLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxJQUFJLEVBQUU7b0NBQ3JCLGdCQUFnQixHQUFHO3dDQUNmLFdBQVcsRUFBRSxhQUFhLENBQUMsT0FBTyxJQUFJLEVBQUU7d0NBQ3hDLCtCQUErQjt3Q0FDL0IsV0FBVyxFQUFFLEVBQUU7d0NBQ2YsY0FBYyxFQUFFLEdBQUcsQ0FBQyxJQUFJO3FDQUMzQixDQUFDO2lDQUNMOzZCQUNKOzRCQUVELFNBQVM7eUJBQ1o7d0JBRUQsdUNBQXVDO3dCQUN2QyxJQUFJLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLElBQUksRUFBRTs0QkFDMUQsMEJBQTBCOzRCQUMxQixxQ0FBcUM7NEJBQ3JDLElBQUksWUFBWSxJQUFJLGdCQUFnQixFQUFFO2dDQUNsQyxnQkFBZ0IsQ0FBQyxXQUFXLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQzs2QkFDM0M7aUNBQU07Z0NBQ0gsTUFBTSxRQUFRLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBd0IsQ0FBQztnQ0FFMUUsb0JBQW9CLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRTtvQ0FDOUIsR0FBRyxRQUFRO29DQUNYLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSTtvQ0FDZCxJQUFJLEVBQUUsR0FBRyxDQUFDLE9BQU87aUNBQ3BCLENBQUMsQ0FBQzs2QkFDTjs0QkFDRCxTQUFTO3lCQUNaO3dCQUVELG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUU7NEJBQzlCLElBQUksRUFBRSxPQUFPOzRCQUNiLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSTs0QkFDZCxJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsYUFBYSxDQUFDLE9BQU8sSUFBSSxFQUFFOzRCQUN4QyxPQUFPLEVBQUUsR0FBRyxDQUFDLE1BQU07eUJBQ3RCLENBQUMsQ0FBQzt3QkFFSCxNQUFNO3FCQUNUO29CQUVELEtBQUssUUFBUSxDQUFDO29CQUNkLEtBQUssT0FBTyxDQUFDO29CQUNiO3dCQUNJLFNBQVM7d0JBQ1QsTUFBTTtpQkFDYjthQUNKO1NBQ0o7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNaLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckIsU0FBUztTQUNaO0tBQ0o7SUFFRCxNQUFNLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztJQUM3RCxNQUFNLFdBQVcsR0FBRyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRTtRQUN6RCxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLFFBQVEsQ0FBQztRQUVuQyxPQUFPLEdBQUcsQ0FBQyxhQUFhLENBQ3BCO1lBQ0ksV0FBVyxFQUFFLGNBQWMsQ0FBQyxNQUFNO1lBQ2xDLElBQUksRUFBRSxPQUFPO1lBQ2IsQ0FBQyxFQUFFLGFBQWE7U0FDbkIsRUFDRDtZQUNJLGFBQWEsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUU7Z0JBQzFCLHFCQUFxQjtnQkFDckIsNEJBQTRCO2dCQUM1QixlQUFlLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUNyQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDO2dCQUNqQyxNQUFNLGtCQUFrQixHQUFHLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVyRCxJQUFJLGtCQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLGtCQUFrQixJQUFJLElBQUksRUFBRTtvQkFDbkQsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQ3ZDLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQ3pDO1lBQ0wsQ0FBQztZQUVELFlBQVksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUU7Z0JBQ3pCLGVBQWUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBRXJDLElBQUksSUFBSSxDQUFDLElBQUksS0FBSywrQkFBdUIsRUFBRTtvQkFDdkMsZ0JBQWdCLEdBQUc7d0JBQ2YsV0FBVyxFQUFFLFFBQVEsQ0FBQyxJQUFJO3dCQUMxQixjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWM7d0JBQ25DLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVztxQkFDcEMsQ0FBQztpQkFDTDtxQkFBTTtvQkFDSCxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztvQkFDbkQsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7aUJBQ3BEO1lBQ0wsQ0FBQztTQUNKLENBQ0osQ0FBQztJQUNOLENBQUMsQ0FBQyxDQUFDO0lBRUgsY0FBYztJQUNkLElBQUk7UUFDQSxNQUFNLEtBQUssR0FBRyxNQUFNLE9BQU8sQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMvRixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNuQyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEIsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLFdBQVcsRUFBRTtnQkFDN0IsU0FBUzthQUNaO1lBRUQseUNBQXlDO1lBQ3pDLGtEQUFrRDtZQUVsRCxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUM5QjtLQUNKO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDWixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3hCO0lBRUQsa0JBQWtCO0lBQ2xCLElBQUksbUJBQW1CLENBQUMsSUFBSSxHQUFHLENBQUMsRUFBRTtRQUM5QixNQUFNLE9BQU8sR0FBRyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM5QyxVQUFVLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDbEIsS0FBSyxNQUFNLENBQUMsSUFBSSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLElBQUksT0FBTyxFQUFFO2dCQUM3QyxJQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUU7b0JBQ2xCLFNBQVM7aUJBQ1o7Z0JBRUQsSUFBSTtvQkFDQSxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUNyQztnQkFBQyxPQUFPLEtBQUssRUFBRTtvQkFDWixPQUFPLENBQUMsS0FBSyxDQUFDLGtDQUFrQyxJQUFJLFlBQVksSUFBSSxHQUFHLENBQUMsQ0FBQztvQkFDekUsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDckIsU0FBUztpQkFDWjthQUNKO1FBQ0wsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ1Q7SUFFRCxnQkFBZ0I7SUFDaEIsSUFBSTtRQUNBLElBQUksT0FBTyxnQkFBZ0IsS0FBSyxRQUFRLElBQUksZ0JBQWdCLElBQUksSUFBSSxJQUFJLE9BQU8sQ0FBQyxVQUFVLEVBQUU7WUFDeEYsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQztZQUN2QyxNQUFNLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQztZQUNqQyw2Q0FBNkM7WUFDN0MsK0JBQStCO1lBQy9CLFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtnQkFDbEIsMEJBQTBCO2dCQUMxQixNQUFNLG1CQUFtQixHQUFHLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztnQkFDeEUsV0FBVyxDQUFDO29CQUNSLEdBQUcsT0FBTztvQkFDVixXQUFXLEVBQUUsbUJBQW1CO2lCQUNuQyxDQUFDLENBQUM7WUFDUCxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDVDtLQUNKO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDWixPQUFPLENBQUMsS0FBSyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7UUFDckQsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUN4QjtBQUNMLENBQUM7QUF6T0Qsa0NBeU9DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWFuYWdlciwgSUV4dGVuc2lvbkxpc3RJdGVtUmVzcG9uc2UgfSBmcm9tICdAZWRpdG9yL2V4dGVuc2lvbi1zZGsnO1xuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInO1xuaW1wb3J0IGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgaGFzIH0gZnJvbSAnbG9kYXNoJztcblxuaW1wb3J0IHsgcmVhZENvbmZpZ3MgfSBmcm9tICcuLi9zaGFyZWQvY29uZmlnJztcbmltcG9ydCB7IEV4dGVuc2lvbk1hbmFnZXJUYWIsIFNlbGZVcGRhdGVPcHRpb25zIH0gZnJvbSAnLi4vcHVibGljL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBJTlRFUk5BTF9FWFRFTlNJT05fTkFNRSB9IGZyb20gJy4uL3B1YmxpYy91dGlscyc7XG5cbnR5cGUgUGFja2FnZUluZm8gPSBFZGl0b3IuSW50ZXJmYWNlLlBhY2thZ2VJbmZvO1xudHlwZSBQYWNrYWdlVHlwZSA9IEVkaXRvci5QYWNrYWdlLnBhY2thZ2VUeXBlO1xudHlwZSBQYWNrYWdlSW5mb05vcm1hbGl6ZWQgPSBQYWNrYWdlSW5mbyAmIHsgcGtnVHlwZTogUGFja2FnZVR5cGUgfTtcblxudHlwZSBJbnRlcm5hbFBrZ1NuYXBzaG90ID0ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBwYXRoOiBzdHJpbmc7XG4gICAgYnVpbHRpblBhdGg6IHN0cmluZztcbiAgICB0eXBlOiBQYWNrYWdlVHlwZTtcbiAgICBlbmFibGVkOiBib29sZWFuO1xufTtcblxuZXhwb3J0IGludGVyZmFjZSBGb3JjZVVwZGF0ZU9wdGlvbnMge1xuICAgIHNlbGZVcGRhdGU/OiAob3B0aW9uczogU2VsZlVwZGF0ZU9wdGlvbnMpID0+IFByb21pc2U8dm9pZD4gfCB2b2lkO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRJc0RlZmluZWQ8VD4odmFsOiBULCBtZXNzYWdlPzogc3RyaW5nKTogYXNzZXJ0cyB2YWwgaXMgTm9uTnVsbGFibGU8VD4ge1xuICAgIGlmICh2YWwgPT09IHVuZGVmaW5lZCB8fCB2YWwgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHR5cGVvZiBtZXNzYWdlID09PSAnc3RyaW5nJyA/IG1lc3NhZ2UgOiBgRXhwZWN0ZWQgJ3ZhbCcgdG8gYmUgZGVmaW5lZCwgYnV0IHJlY2VpdmVkICR7dmFsfWApO1xuICAgIH1cbn1cblxuLy8gbm9ybWFsaXplIGV4dGVuc2lvbkxpc3RcbmZ1bmN0aW9uIG5vcm1hbGl6ZUxpc3RSZXNwb25zZShsaXN0OiBJRXh0ZW5zaW9uTGlzdEl0ZW1SZXNwb25zZVtdKSB7XG4gICAgY29uc3QgbmFtZXNNYXlVcGRhdGUgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBjb25zdCBkYXRhOiBSZWNvcmQ8c3RyaW5nLCBJRXh0ZW5zaW9uTGlzdEl0ZW1SZXNwb25zZT4gPSB7fTtcblxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBsaXN0KSB7XG4gICAgICAgIG5hbWVzTWF5VXBkYXRlLmFkZChpdGVtLm5hbWUpO1xuICAgICAgICBkYXRhW2l0ZW0ubmFtZV0gPSBpdGVtO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWVzOiBuYW1lc01heVVwZGF0ZSxcbiAgICAgICAgZXh0ZW5zaW9uczogZGF0YSxcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVJbnRlcm5hbFBhY2thZ2VzKHBhY2thZ2VzOiBQYWNrYWdlSW5mb1tdKSB7XG4gICAgY29uc3QgcGF0aFRvSW5mbzogUmVjb3JkPHN0cmluZywgUGFja2FnZUluZm9Ob3JtYWxpemVkIHwgdW5kZWZpbmVkPiA9IHt9O1xuICAgIGNvbnN0IG5hbWVUb1BhdGhzOiBSZWNvcmQ8c3RyaW5nLCBQYXJ0aWFsPFJlY29yZDxQYWNrYWdlVHlwZSwgc3RyaW5nIHwgdW5kZWZpbmVkPj4gfCB1bmRlZmluZWQ+ID0ge307XG4gICAgY29uc3QgcGF0aEVudHJ5OiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBwa2cgb2YgcGFja2FnZXMpIHtcbiAgICAgICAgY29uc3QgcGtnTmFtZSA9IHBrZy5uYW1lO1xuICAgICAgICBjb25zdCBwa2dUeXBlID0gRWRpdG9yLlBhY2thZ2UuX19wcm90ZWN0ZWRfXy5jaGVja1R5cGUocGtnLnBhdGgpO1xuXG4gICAgICAgIHBhdGhFbnRyeS5wdXNoKHBrZy5wYXRoKTtcbiAgICAgICAgcGF0aFRvSW5mb1twa2cucGF0aF0gPSB7XG4gICAgICAgICAgICAuLi5wa2csXG4gICAgICAgICAgICBwa2dUeXBlOiBwa2dUeXBlLFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IG5hbWVNYXAgPSBuYW1lVG9QYXRoc1twa2dOYW1lXSA/PyAobmFtZVRvUGF0aHNbcGtnTmFtZV0gPSB7fSk7XG4gICAgICAgIG5hbWVNYXBbcGtnVHlwZV0gPSBwa2cucGF0aDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICAvKiogcGFja2FnZSBwYXRoIGxpc3QgKi9cbiAgICAgICAgcGFja2FnZXNFbnRyeTogcGF0aEVudHJ5LFxuICAgICAgICAvKipcbiAgICAgICAgICogcGFja2FnZSBgcGF0aGAgdG8gZW50aXR5XG4gICAgICAgICAqL1xuICAgICAgICBwYWNrYWdlczogcGF0aFRvSW5mbyxcbiAgICAgICAgbmFtZVRvUGF0aHMsXG4gICAgfTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldHVwQ29udGV4dCgpIHtcbiAgICBjb25zdCB7IGN1c3RvbVNka0RvbWFpbiwgZXh0ZW5zaW9uUGF0aHMgfSA9IGF3YWl0IHJlYWRDb25maWdzKCk7XG4gICAgY29uc3QgZWRpdG9yVmVyc2lvbiA9IEVkaXRvci5BcHAudmVyc2lvbjtcblxuICAgIGNvbnN0IHNkayA9IG5ldyBNYW5hZ2VyKHtcbiAgICAgICAgZXh0ZW5zaW9uUGF0aHM6IFtleHRlbnNpb25QYXRocy5wcm9qZWN0LCBleHRlbnNpb25QYXRocy5nbG9iYWxdLFxuICAgICAgICBkb21haW46IGN1c3RvbVNka0RvbWFpbixcbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHNkayxcbiAgICAgICAgZWRpdG9yVmVyc2lvbixcbiAgICAgICAgZXh0ZW5zaW9uUGF0aHMsXG4gICAgfTtcbn1cblxuLyoqXG4gKiDlvLrliLbmm7TmlrDmn5Dkupvkvp3otZbvvIzkv53or4HlroPku6zlp4vnu4jmmK/mnIDmlrDniYjmnKxcbiAqXG4gKiBodHRwczovL2dpdGh1Yi5jb20vY29jb3MvM2QtdGFza3MvaXNzdWVzLzE1MjgxXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmb3JjZVVwZGF0ZShvcHRpb25zOiBGb3JjZVVwZGF0ZU9wdGlvbnMpIHtcbiAgICBjb25zdCB7IGVkaXRvclZlcnNpb24sIHNkaywgZXh0ZW5zaW9uUGF0aHMgfSA9IGF3YWl0IHNldHVwQ29udGV4dCgpO1xuXG4gICAgY29uc3QgeyBwYWNrYWdlczogc2VydmVyRXh0ZW5zaW9uTGlzdCB9ID0gYXdhaXQgc2RrLmdldEV4dGVuc2lvbkxpc3Qoe1xuICAgICAgICBlOiBlZGl0b3JWZXJzaW9uLFxuICAgICAgICBsYWJlbDogYCR7RXh0ZW5zaW9uTWFuYWdlclRhYi5Gb3JjZWRVcGRhdGV9YCxcbiAgICAgICAgbGFuZzogRWRpdG9yLkkxOG4uZ2V0TGFuZ3VhZ2UoKSxcbiAgICB9KTtcbiAgICBjb25zdCB7IG5hbWVzOiBzZXJ2ZXJOYW1lcywgZXh0ZW5zaW9uczogc2VydmVyTmFtZVRvRW50aXR5IH0gPSBub3JtYWxpemVMaXN0UmVzcG9uc2Uoc2VydmVyRXh0ZW5zaW9uTGlzdCk7XG5cbiAgICBjb25zdCBhbGxQYWNrYWdlcyA9IGF3YWl0IEVkaXRvci5QYWNrYWdlLmdldFBhY2thZ2VzKCk7XG4gICAgY29uc3QgeyBwYWNrYWdlczogcGFja2FnZVBhdGhUb0VudGl0eSwgbmFtZVRvUGF0aHMgfSA9IG5vcm1hbGl6ZUludGVybmFsUGFja2FnZXMoYWxsUGFja2FnZXMpO1xuXG4gICAgLyoqXG4gICAgICog5omr5o+P5pys5Zyw5omA5pyJ5o+S5Lu277yM5a+75om+6ZyA6KaB5by65Yi25LiL6L295pu05paw55qE5o+S5Lu244CCa2V5OiBwa2cubmFtZVxuICAgICAqL1xuICAgIGNvbnN0IHBhY2thZ2VzU2hvdWxkVXBkYXRlOiBNYXA8c3RyaW5nLCBJbnRlcm5hbFBrZ1NuYXBzaG90PiA9IG5ldyBNYXAoKTtcbiAgICAvLyDmj5Lku7blrZjlnKjlpJrniYjmnKzml7bvvIzlj6/ku6Xot7Pov4fmm7TmlrDnmoTmj5Lku7bjgIJcbiAgICAvLyDkuI3pnIDopoHmm7TmlrDvvIzkvYbpnIDopoHlkK/nlKjliLDmnIDmlrDniYjmnKzvvIzlm6DmraTpnIDopoHorrDlvZXmj5Lku7bot6/lvoTjgIJcbiAgICBjb25zdCBwYWNrYWdlU2tpcERvd25sb2FkID0gbmV3IE1hcDxzdHJpbmcsIHsgcGF0aDogc3RyaW5nOyBlbmFibGVkOiBib29sZWFuIH0+KCk7XG5cbiAgICBsZXQgc2VsZlVwZGF0ZUNvbmZpZzogU2VsZlVwZGF0ZU9wdGlvbnMgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgICBmb3IgKGNvbnN0IHBrZ05hbWUgb2Ygc2VydmVyTmFtZXMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNlcnZlclBrZyA9IHNlcnZlck5hbWVUb0VudGl0eVtwa2dOYW1lXTtcbiAgICAgICAgICAgIGNvbnN0IHBrZ0xvY2FsUGF0aHMgPSBuYW1lVG9QYXRoc1twa2dOYW1lXSA/PyB7fTtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsUGtnUGF0aFR5cGVzID0gT2JqZWN0LmtleXMocGtnTG9jYWxQYXRocykgYXMgUGFja2FnZVR5cGVbXTtcbiAgICAgICAgICAgIGNvbnN0IGlzU2VsZlVwZGF0ZSA9IHBrZ05hbWUgPT09IElOVEVSTkFMX0VYVEVOU0lPTl9OQU1FO1xuXG4gICAgICAgICAgICBpZiAobG9jYWxQa2dQYXRoVHlwZXMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgIC8vIOacrOWcsOayoeaciei/meS4quWMhe+8jOebtOaOpeS4i+i9veWuieijhVxuICAgICAgICAgICAgICAgIHBhY2thZ2VzU2hvdWxkVXBkYXRlLnNldChwa2dOYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHBrZ05hbWUsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdnbG9iYWwnLFxuICAgICAgICAgICAgICAgICAgICBwYXRoOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgYnVpbHRpblBhdGg6ICcnLFxuICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g6YGN5Y6G5LiN5ZCM6Lev5b6E5LiL55qE5ZCM5ZCN5o+S5Lu277yM5YiG5p6Q5piv5ZCm6ZyA6KaB5pu05paw5pON5L2c77yaXG4gICAgICAgICAgICAvLyAxLiDkuIvovb3mlrDniYjlubbmm7TmlrAgMi4g55u05o6l5ZCv55So5pys5Zyw55qE5paw54mI5pysIDMuIOebtOaOpei3s+i/h1xuICAgICAgICAgICAgZm9yIChjb25zdCBwYXRoVHlwZSBvZiBsb2NhbFBrZ1BhdGhUeXBlcykge1xuICAgICAgICAgICAgICAgIGlmIChwYWNrYWdlU2tpcERvd25sb2FkLmhhcyhwa2dOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBwa2dQYXRoID0gcGtnTG9jYWxQYXRoc1twYXRoVHlwZV07XG4gICAgICAgICAgICAgICAgLy8gYGxvY2FsUGtnUGF0aFR5cGVzYCBjYW1lcyBmcm9tIGBwa2dMb2NhbFBhdGhzYFxuICAgICAgICAgICAgICAgIGFzc2VydElzRGVmaW5lZChwa2dQYXRoLCBgY2Fubm90IGZpbmQgcGF0aCB0eXBlIFwiJHtwYXRoVHlwZX1cIiBpbiBwYWNrYWdlIGxvY2FsIHBhdGhzYCk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBwa2cgPSBwYWNrYWdlUGF0aFRvRW50aXR5W3BrZ1BhdGhdO1xuICAgICAgICAgICAgICAgIC8vIGVudGl0eSwgcGtnUGF0aCDpg73mnaXoh6ogbm9ybWFsaXplIOeahOe7k+aenOOAguS4jeWtmOWcqOaXtuS9nOW8guW4uOWkhOeQhlxuICAgICAgICAgICAgICAgIGFzc2VydElzRGVmaW5lZChwa2csIGBjYW5ub3QgZmluZCBwYWNrYWdlIHBhdGggXCIke3BrZ1BhdGh9XCIgaW4gcGFja2FnZSBlbnRpdHkgbWFwYCk7XG5cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHBhdGhUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NvdmVyJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnYnVpbHRpbic6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2xvY2FsJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5a2Y5Zyo54mI5pysID49IOacjeWKoeerr+acgOaWsOeJiOacrO+8jOS4jeabtOaWsFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbXZlci5ndGUocGtnLnZlcnNpb24sIHNlcnZlclBrZy5sYXRlc3RfdmVyc2lvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDlrZjlnKjlpJrniYjmnKzvvIjml6fniYggKyDmnIDmlrDvvInml7bvvIzkuI3pnIDopoHmm7TmlrBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50U25hcHNob3QgPSBwYWNrYWdlc1Nob3VsZFVwZGF0ZS5nZXQocGtnTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRTbmFwc2hvdCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhY2thZ2VzU2hvdWxkVXBkYXRlLmRlbGV0ZShwa2dOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDmnInkuIDkuKrmnIDmlrDniYjmnKzkuobvvIzlkI7pnaLnmoTlsLHkuI3nlKjlho3ljLnphY3kuoZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWNrYWdlU2tpcERvd25sb2FkLnNldChwa2dOYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHBrZy5wYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDorrDlvZUgZW5hYmxlZCDnirbmgIHvvIzmlrnkvr/lkI7nu63pgY3ljoYgJiDlkK/nlKhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogcGtnLmVuYWJsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1NlbGZVcGRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g6ZyA6KaB5pu05paw6Ieq6Lqr77yM5pu05paw6auY54mI5pys5o+S5Lu255qE6Lev5b6E77yM55So5LqO5ZCO57ut5ZCv55SoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwa2cuZW5hYmxlICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmVXBkYXRlQ29uZmlnID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1aWx0SW5QYXRoOiBwa2dMb2NhbFBhdGhzLmJ1aWx0aW4gPz8gJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY3VycmVudFBhdGgg5Zyo5ZCO57ut6YGN5Y6G5Lit5pu05paw77yM5aaC5p6c5rKh5pyJ5bCx55WZ56m6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFBhdGg6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0luc3RhbGxQYXRoOiBwa2cucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g55Sx5LqO5o+S5Lu25ZCv5Yqo5pe25bqP77yM5q2k5pe25Y+v6IO95rKh5pyJ5Lu75L2V5LiA5LiqIHBrZyDlpITkuo4gZW5hYmxlIOeKtuaAgVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhY2thZ2VzU2hvdWxkVXBkYXRlLmhhcyhwa2dOYW1lKSAmJiBwa2cuZW5hYmxlID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5ZCM5LiA5pe26Ze05pyA5aSa5Y+q5Lya5pyJ5LiA5LiqIGVuYWJsZSDnmoTniYjmnKzjgIJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDov5nph4zmiorpnIDopoHmm7TmlrDnmoTmj5Lku7bnmoQgc25hcHNob3Qg5pWw5o2u5oyH5ZCR5b2T5YmN5ZCv55So55qE6YKj5Liq54mI5pysXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzU2VsZlVwZGF0ZSAmJiBzZWxmVXBkYXRlQ29uZmlnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGZVcGRhdGVDb25maWcuY3VycmVudFBhdGggPSBwa2cucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzbmFwc2hvdCA9IHBhY2thZ2VzU2hvdWxkVXBkYXRlLmdldChwa2dOYW1lKSBhcyBJbnRlcm5hbFBrZ1NuYXBzaG90O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhY2thZ2VzU2hvdWxkVXBkYXRlLnNldChwa2dOYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5zbmFwc2hvdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHBrZy5wYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogcGtnLnBrZ1R5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcGFja2FnZXNTaG91bGRVcGRhdGUuc2V0KHBrZ05hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBwa2dOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHBrZy5wYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHBhdGhUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1aWx0aW5QYXRoOiBwa2dMb2NhbFBhdGhzLmJ1aWx0aW4gPz8gJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogcGtnLmVuYWJsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2dsb2JhbCc6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ290aGVyJzpcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHBhY2thZ2VzRG93bmxvYWRBcnIgPSBBcnJheS5mcm9tKHBhY2thZ2VzU2hvdWxkVXBkYXRlKTtcbiAgICBjb25zdCBkb3dubG9hZGVycyA9IHBhY2thZ2VzRG93bmxvYWRBcnIubWFwKChbLCBzbmFwc2hvdF0pID0+IHtcbiAgICAgICAgY29uc3QgeyBuYW1lOiBwa2dOYW1lIH0gPSBzbmFwc2hvdDtcblxuICAgICAgICByZXR1cm4gc2RrLmdldERvd25sb2FkZXIoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaW5zdGFsbFBhdGg6IGV4dGVuc2lvblBhdGhzLmdsb2JhbCxcbiAgICAgICAgICAgICAgICBuYW1lOiBwa2dOYW1lLFxuICAgICAgICAgICAgICAgIGU6IGVkaXRvclZlcnNpb24sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBlckRvd25sb2FkZWQ6IGFzeW5jIChpbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWFqOWxgOWGhee9ruebruW9leW3suacieaPkuS7tu+8jOemgeeUqOW5tuWPjeazqOWGjOOAglxuICAgICAgICAgICAgICAgICAgICAvLyBzZGsg5Zyo5a6J6KOF5pe25Lya5Yig6Zmk5bey5pyJ5o+S5Lu277yM6L+Z6YeM5LiN6ZyA6KaB5omL5Yqo5aSE55CGXG4gICAgICAgICAgICAgICAgICAgIGFzc2VydElzRGVmaW5lZChpbmZvLmluc3RhbGxQa2dQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzdCA9IGluZm8uaW5zdGFsbFBrZ1BhdGg7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBrZ0luc3RhbGxlZEluRGlzdCA9IHBhY2thZ2VQYXRoVG9FbnRpdHlbZGlzdF07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZGlzdCkgJiYgcGtnSW5zdGFsbGVkSW5EaXN0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5QYWNrYWdlLmRpc2FibGUoZGlzdCwge30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UudW5yZWdpc3RlcihkaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBwZXJJbnN0YWxsZWQ6IGFzeW5jIChpbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydElzRGVmaW5lZChpbmZvLmluc3RhbGxQa2dQYXRoKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5mby5uYW1lID09PSBJTlRFUk5BTF9FWFRFTlNJT05fTkFNRSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZlVwZGF0ZUNvbmZpZyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50UGF0aDogc25hcHNob3QucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdJbnN0YWxsUGF0aDogaW5mby5pbnN0YWxsUGtnUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWlsdEluUGF0aDogc25hcHNob3QuYnVpbHRpblBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UucmVnaXN0ZXIoaW5mby5pbnN0YWxsUGtnUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuUGFja2FnZS5lbmFibGUoaW5mby5pbnN0YWxsUGtnUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgKTtcbiAgICB9KTtcblxuICAgIC8vIOWkhOeQhumcgOimgeS4i+i9veabtOaWsOeahOaJqeWxlVxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHRhc2tzID0gYXdhaXQgUHJvbWlzZS5hbGxTZXR0bGVkKGRvd25sb2FkZXJzLm1hcCgoZG93bmxvYWRlcikgPT4gZG93bmxvYWRlci5kb3dubG9hZCgpKSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFza3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHRhc2sgPSB0YXNrc1tpXTtcbiAgICAgICAgICAgIGlmICh0YXNrLnN0YXR1cyA9PT0gJ2Z1bGZpbGxlZCcpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVE9ETzogZ2V0IGV4dHJhIGRldGFpbCBmcm9tIHNuYXBzaG90ID9cbiAgICAgICAgICAgIC8vIGNvbnN0IHBhY2thZ2VTbmFwc2hvdCA9IHBhY2thZ2VzRG93bmxvYWRBcnJbaV07XG5cbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGFzay5yZWFzb24pO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfVxuXG4gICAgLy8g5aSE55CG6ZyA6KaB5ZCv55So5paw54mI5pys55qE5omp5bGV44CC5rOo5oSPXG4gICAgaWYgKHBhY2thZ2VTa2lwRG93bmxvYWQuc2l6ZSA+IDApIHtcbiAgICAgICAgY29uc3QgZW50cmllcyA9IHBhY2thZ2VTa2lwRG93bmxvYWQuZW50cmllcygpO1xuICAgICAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgW25hbWUsIHsgZW5hYmxlZCwgcGF0aCB9XSBvZiBlbnRyaWVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVuYWJsZWQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhY2thZ2UuZW5hYmxlKHBhdGgpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEV4dGVuc2lvbiBlbmFibGUgZmFpbGVkLiBuYW1lIFwiJHtuYW1lfVwiLCBwYXRoIFwiJHtwYXRofVwiYCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDApO1xuICAgIH1cblxuICAgIC8vIOWkhOeQhuaJqeWxleeuoeeQhuWZqOeahOW8uuWItuiHquabtOaWsFxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2VsZlVwZGF0ZUNvbmZpZyA9PT0gJ29iamVjdCcgJiYgc2VsZlVwZGF0ZUNvbmZpZyAhPSBudWxsICYmIG9wdGlvbnMuc2VsZlVwZGF0ZSkge1xuICAgICAgICAgICAgY29uc3QgX3NlbGZVcGRhdGUgPSBvcHRpb25zLnNlbGZVcGRhdGU7XG4gICAgICAgICAgICBjb25zdCBfY29uZmlnID0gc2VsZlVwZGF0ZUNvbmZpZztcbiAgICAgICAgICAgIC8vIOi/memHjOazqOaEj+S4jeiDveWkhOeQhuaIkCBwcm9taXNl77yM6KaB5oqK6Ieq5pu05paw55qE5pON5L2c5pS+5YiwIG5leHRUaWNrIOWOu+aJp+ihjOOAglxuICAgICAgICAgICAgLy8g5ZCm5YiZ5Lya5b2x5ZON5b2T5YmN6L+Q6KGM55qE5omp5bGV566h55CG5Zmo55qE6YC76L6R77yM6YCg5oiQ5LiA5Lqb5aWH5oCq6Zeu6aKY44CCXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAvLyDmoLnmja7mianlsZXnrqHnkIblmajlvZPliY3nmoTlvIDlkK/nirbmgIHliKTmlq3mmK/lkKbopoHph43mlrDlvIDlkK9cbiAgICAgICAgICAgICAgICBjb25zdCBzaG91bGRNYW5hZ2VyUmVvcGVuID0gYXdhaXQgRWRpdG9yLlBhbmVsLmhhcygnZXh0ZW5zaW9uLm1hbmFnZXInKTtcbiAgICAgICAgICAgICAgICBfc2VsZlVwZGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIC4uLl9jb25maWcsXG4gICAgICAgICAgICAgICAgICAgIHJlb3BlblBhbmVsOiBzaG91bGRNYW5hZ2VyUmVvcGVuLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFeHRlbnNpb24gZm9yY2VkIHNlbGYgdXBkYXRlIGZhaWxlZCcpO1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICB9XG59XG4iXX0=