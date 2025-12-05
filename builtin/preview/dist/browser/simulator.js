"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSimulator = exports.writeSettingFile = void 0;
const path_1 = require("path");
const ejs_1 = __importDefault(require("ejs"));
const fs_extra_1 = require("fs-extra");
const child_process_1 = require("child_process");
const tree_kill_1 = __importDefault(require("tree-kill"));
const builtin_module_provider_1 = require("@editor/lib-programming/dist/builtin-module-provider");
const ccbuild_1 = require("@cocos/ccbuild");
const simulator_utils_1 = require("./simulator-utils");
const preview_manager_1 = require("./preview-manager");
const preview_settings_1 = require("./preview-settings");
var ResolutionPolicy;
(function (ResolutionPolicy) {
    ResolutionPolicy[ResolutionPolicy["ResolutionExactFit"] = 0] = "ResolutionExactFit";
    ResolutionPolicy[ResolutionPolicy["ResolutionNoBorder"] = 1] = "ResolutionNoBorder";
    ResolutionPolicy[ResolutionPolicy["ResolutionShowAll"] = 2] = "ResolutionShowAll";
    ResolutionPolicy[ResolutionPolicy["ResolutionFixedHeight"] = 3] = "ResolutionFixedHeight";
    ResolutionPolicy[ResolutionPolicy["ResolutionFixedWidth"] = 4] = "ResolutionFixedWidth";
})(ResolutionPolicy || (ResolutionPolicy = {}));
let simulatorProcess; // 标识模拟器预览进程是否存在
function stopSimulatorProcess() {
    if (simulatorProcess && typeof simulatorProcess.pid === 'number') {
        (0, tree_kill_1.default)(simulatorProcess.pid);
        simulatorProcess = null;
    }
}
async function generatePreviewData() {
    // 模拟器预览不需要 launchScene 数据
    const data = await preview_settings_1.previewSettingsManager.querySettingsData('simulator');
    if (!(data && data.settings)) {
        throw new Error('构建 settings 出错');
    }
    // 启动场景
    let previewSceneJson;
    const previewScene = await Editor.Profile.getConfig('preview', 'general.start_scene');
    if (previewScene === 'current_scene') {
        previewSceneJson = await Editor.Message.request('scene', 'query-scene-json');
    }
    else {
        const previewScenePath = await Editor.Message.request('asset-db', 'query-path', previewScene);
        previewSceneJson = await (0, fs_extra_1.readFile)(previewScenePath, 'utf8');
    }
    // 模拟器预览不显示插屏，加快启动速度
    data.settings.splashScreen.totalTime = 0;
    const globalInternalLibrary = await Editor.Message.request('asset-db', 'query-global-internal-library');
    if (globalInternalLibrary) {
        // 由于原生模拟器预览加载文件默认走的文件系统，会导致当数据库默认导入地址不放在 library 内时会有问题。
        // 3.8.5 支持了内置资源导入到全局目录，所以此处利用远程 bundle 的机制，
        // 将所有 bundle 设置为 remote bundle，再通过预览服务器拿到正确的资源信息
        // TODO 此方式会导致 bundle 脚本的内容变为浏览器预览的格式版本，由于预览阶段都是空脚本，暂未发现问题
        data.settings.assets.server = (await preview_manager_1.browserPreviewManager.queryPreviewUrl()) + '/';
        data.settings.assets.remoteBundles = data.settings.assets.projectBundles;
    }
    return {
        previewSceneJson,
        settings: data.settings,
        bundleConfigs: data.bundleConfigs,
    };
}
async function writeSettingFile(dstDir) {
    const data = await generatePreviewData();
    (0, fs_extra_1.ensureDirSync)((0, path_1.join)(dstDir, 'src'));
    await (0, fs_extra_1.writeFile)((0, path_1.join)(dstDir, 'src/settings.json'), JSON.stringify(data.settings, undefined, 2));
    for (let i = 0; i < data.bundleConfigs.length; ++i) {
        const config = data.bundleConfigs[i];
        const bundleDir = (0, path_1.join)(dstDir, 'assets', config.name);
        (0, fs_extra_1.ensureDirSync)(bundleDir);
        // 删除 importBase 和 nativeBase，使用 generalBase
        // @ts-ignore
        delete config.importBase;
        // @ts-ignore
        delete config.nativeBase;
        await (0, fs_extra_1.writeFile)((0, path_1.join)(bundleDir, 'cc.config.json'), JSON.stringify(config, undefined, 2));
        // TODO: 目前的实现跟 web 预览一样，一次性加载所有脚本
        const bundleEntry = [];
        if (config.name === 'main') {
            bundleEntry.push('cce:/internal/x/prerequisite-imports');
        }
        const bundleIndexJsSource = await ejs_1.default.renderFile((0, path_1.join)(__dirname, '../../static/simulator/bundleIndex.ejs'), {
            bundleName: config.name,
            bundleEntry,
        });
        await (0, fs_extra_1.writeFile)((0, path_1.join)(bundleDir, 'index.js'), bundleIndexJsSource, 'utf8');
    }
}
exports.writeSettingFile = writeSettingFile;
let firstMetrics = false;
async function runSimulator(onCompleted) {
    var _a, _b, _c, _d;
    firstMetrics = true;
    // 关闭模拟器
    stopSimulatorProcess();
    // 获取模拟器偏好设置
    const preference = await (0, simulator_utils_1.getSimulatorPreference)();
    // 路径处理
    const isDarwin = process.platform === 'darwin';
    const jsEnginePath = await (0, simulator_utils_1.getJsEnginePath)();
    const nativeEnginePath = await (0, simulator_utils_1.getNativeEnginePath)();
    const simulatorRoot = (0, path_1.join)(nativeEnginePath, isDarwin ? 'simulator/Release/SimulatorApp-Mac.app' : 'simulator/Release');
    const simulatorResources = isDarwin ? (0, path_1.join)(simulatorRoot, 'Contents/Resources') : simulatorRoot;
    const executableSimulator = isDarwin ? (0, path_1.join)(simulatorRoot, 'Contents/MacOS/SimulatorApp-Mac') : (0, path_1.join)(simulatorRoot, 'SimulatorApp-Win32.exe');
    (0, fs_extra_1.ensureDirSync)((0, path_1.join)(simulatorResources, 'jsb-adapter'));
    (0, fs_extra_1.ensureDirSync)((0, path_1.join)(simulatorResources, 'src/cocos-js'));
    // 清空缓存
    await (0, fs_extra_1.emptyDir)((0, path_1.join)(simulatorResources, 'assets'));
    const autoCleanCache = await Editor.Profile.getConfig('preview', 'preview.auto_clean_cache');
    if (autoCleanCache) {
        await (0, fs_extra_1.emptyDir)((0, path_1.join)(simulatorResources, 'gamecaches'));
    }
    // 根据偏好设置的模块配置，生成 cc.js 到 static/simulator/cocos-js 目录
    // TODO: 使用 QUICK_COMPILE 编译 engine
    const ccModuleFile = (0, path_1.join)(simulatorResources, 'src/cocos-js/cc.js');
    const cceCodeQualityFile = (0, path_1.join)(simulatorResources, 'src/builtin/cce.code-quality.cr.js');
    const cceEnvFile = (0, path_1.join)(simulatorResources, 'src/builtin/cce.env.js');
    (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(ccModuleFile));
    (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(cceCodeQualityFile));
    const statsQuery = await ccbuild_1.StatsQuery.create(jsEnginePath);
    const ccEnvConstants = statsQuery.constantManager.genCCEnvConstants({
        mode: 'PREVIEW',
        platform: 'NATIVE',
        flags: {
            DEBUG: true,
        },
    });
    const features = (_b = (_a = (await Editor.Message.request('engine', 'query-engine-modules-profile'))) === null || _a === void 0 ? void 0 : _a.includeModules) !== null && _b !== void 0 ? _b : [];
    const featureUnits = statsQuery.getUnitsOfFeatures(features);
    const { code: indexMod } = await ccbuild_1.buildEngine.transform(statsQuery.evaluateIndexModuleSource(featureUnits, (moduleName) => moduleName), 'system');
    const builtinModuleProvider = await builtin_module_provider_1.BuiltinModuleProvider.create({ format: 'systemjs' });
    await Promise.all([
        // TODO: 移除 builtinModuleProvider 依赖
        builtinModuleProvider.addBuildTimeConstantsMod(ccEnvConstants),
    ]);
    await (0, fs_extra_1.writeFile)(ccModuleFile, indexMod, 'utf8');
    await (0, fs_extra_1.writeFile)(cceEnvFile, builtinModuleProvider.modules['cc/env'], 'utf8');
    // 拷贝文件
    const toCopy = [
        // 拷贝 jsb-adapter
        {
            src: (0, path_1.join)(jsEnginePath, 'bin/adapter/native/web-adapter.js'),
            dest: (0, path_1.join)(simulatorResources, 'jsb-adapter/web-adapter.js'),
            isDir: false,
        },
        {
            src: (0, path_1.join)(jsEnginePath, 'bin/adapter/native/engine-adapter.js'),
            dest: (0, path_1.join)(simulatorResources, 'jsb-adapter/engine-adapter.js'),
            isDir: false,
        },
        // 拷贝 engine, import-map.json
        {
            src: (0, path_1.join)(jsEnginePath, 'bin/native-preview'),
            dest: (0, path_1.join)(simulatorResources, 'src/cocos-js'),
            isDir: true,
        },
        {
            src: (0, path_1.join)(__dirname, '../../static/simulator/import-map.json'),
            dest: (0, path_1.join)(simulatorResources, 'src/import-map.json'),
            isDir: false,
        },
        {
            src: (0, path_1.join)(__dirname, '../../static/simulator/system.bundle.js'),
            dest: (0, path_1.join)(simulatorResources, 'src/system.bundle.js'),
            isDir: false,
        },
        {
            src: (0, path_1.join)(__dirname, '../../static/simulator/polyfills.bundle.js'),
            dest: (0, path_1.join)(simulatorResources, 'src/polyfills.bundle.js'),
            isDir: false,
        },
        {
            src: (0, path_1.join)(Editor.Project.tmpDir, 'asset-db/effect/effect.bin'),
            dest: (0, path_1.join)(simulatorResources, 'src/effect.bin'),
            isDir: false,
        },
    ];
    toCopy.forEach(item => {
        if ((0, fs_extra_1.pathExistsSync)(item.src)) {
            if (item.isDir) {
                (0, simulator_utils_1.copyDirSync)(item.src, item.dest);
            }
            else {
                (0, fs_extra_1.copyFileSync)(item.src, item.dest);
            }
        }
    });
    // 写入 settings.js
    await writeSettingFile(simulatorResources);
    // 写入初始场景数据
    const data = await generatePreviewData();
    let previewSceneJsonPath = (0, path_1.join)(simulatorResources, 'preview-scene.json');
    previewSceneJsonPath = (0, simulator_utils_1.formatPath)(previewSceneJsonPath);
    await (0, fs_extra_1.writeFile)(previewSceneJsonPath, data.previewSceneJson, 'utf8');
    // 生成 main.js
    const previewPort = await Editor.Message.request('server', 'query-port');
    const previewIp = await Editor.Message.request('preview', 'get-preview-ip');
    const mainJsSource = await ejs_1.default.renderFile((0, path_1.join)(__dirname, '../../static/simulator/main.ejs'), {
        libraryPath: (0, simulator_utils_1.formatPath)((0, path_1.join)(Editor.Project.path, 'library')),
        waitForConnect: preference.waitForConnect,
        projectPath: (0, simulator_utils_1.formatPath)(Editor.Project.path),
        previewIp,
        previewPort,
        packImportMapURL: '/scripting/x/import-map.json',
        packResolutionDetailMapURL: '/scripting/x/resolution-detail-map.json',
    });
    await (0, fs_extra_1.writeFile)((0, path_1.join)(simulatorResources, 'main.js'), mainJsSource, 'utf8');
    // 生成 application.js
    const hasPhysicsAmmo = features.includes('physics-ammo');
    const projectData = await Editor.Profile.getProject('project', 'general.designResolution');
    let resolutionPolicy;
    if (projectData.fitWidth && projectData.fitHeight) {
        resolutionPolicy = ResolutionPolicy.ResolutionShowAll;
    }
    else if (projectData.fitWidth && !projectData.fitHeight) {
        resolutionPolicy = ResolutionPolicy.ResolutionFixedWidth;
    }
    else if (!projectData.fitWidth && projectData.fitHeight) {
        resolutionPolicy = ResolutionPolicy.ResolutionFixedHeight;
    }
    else {
        resolutionPolicy = ResolutionPolicy.ResolutionNoBorder;
    }
    const designResolution = {
        width: projectData.width,
        height: projectData.height,
        resolutionPolicy,
    };
    const appJsSource = await ejs_1.default.renderFile((0, path_1.join)(__dirname, '../../static/simulator/application.ejs'), {
        hasPhysicsAmmo,
        previewSceneJsonPath,
        libraryPath: (0, simulator_utils_1.formatPath)((0, path_1.join)(Editor.Project.path, 'library')),
        projectPath: (0, simulator_utils_1.formatPath)(Editor.Project.path),
        designResolution,
        previewIp,
        previewPort,
    });
    await (0, fs_extra_1.writeFile)((0, path_1.join)(simulatorResources, 'src/application.js'), appJsSource, 'utf8');
    // 根据偏好设置，更新模拟器配置文件
    await (0, simulator_utils_1.generateSimulatorConfig)();
    // 运行模拟器
    // environment
    // TODO: 初始化环境变量
    // env = {
    //     COCOS_FRAMEWORKS: Path.join(cocosRoot, '../'),
    //     COCOS_X_ROOT: cocosRoot,
    //     COCOS_CONSOLE_ROOT: cocosConsoleRoot,
    //     NDK_ROOT: ndkRoot,
    //     ANDROID_SDK_ROOT: androidSDKRoot
    // };
    // // format environment string
    // envStr = '';
    // for (let k in env) {
    //     if (envStr !== '') {
    //         envStr += ';';
    //     }
    //     envStr += `${k}=${env[k]}`;
    // }
    // let args = ['-workdir', simulatorResources, '-writable-path', simulatorResources, '-console', 'false', '--env', envStr];
    const args = ['-workdir', simulatorResources, '-writable-path', simulatorResources, '-console', 'false'];
    simulatorProcess = (0, child_process_1.spawn)(executableSimulator, args);
    // 打开模拟器调试器
    if (preference.showDebugPanel) {
        setTimeout(() => {
            Editor.Panel.open('preview.debugger');
        }, 1000);
    }
    // 监听模拟器进程的输出
    simulatorProcess.on('close', () => {
        Editor.Panel.close('preview.debugger');
    });
    (_c = simulatorProcess.stdout) === null || _c === void 0 ? void 0 : _c.on('data', data => {
        if (firstMetrics && onCompleted) {
            firstMetrics = false;
            onCompleted();
        }
        console.log(data.toString ? data.toString() : data);
    });
    (_d = simulatorProcess.stderr) === null || _d === void 0 ? void 0 : _d.on('data', data => {
        console.error(data.toString ? data.toString() : data);
    });
    simulatorProcess.on('error', data => {
        console.error(data.toString ? data.toString() : data);
    });
}
exports.runSimulator = runSimulator;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltdWxhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2Jyb3dzZXIvc2ltdWxhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLCtCQUFxQztBQUNyQyw4Q0FBc0I7QUFDdEIsdUNBQXNHO0FBQ3RHLGlEQUFvRDtBQUNwRCwwREFBaUM7QUFDakMsa0dBQTZGO0FBQzdGLDRDQUF5RDtBQUN6RCx1REFBbUo7QUFDbkosdURBQTBEO0FBQzFELHlEQUE0RDtBQUU1RCxJQUFLLGdCQU1KO0FBTkQsV0FBSyxnQkFBZ0I7SUFDakIsbUZBQWtCLENBQUE7SUFDbEIsbUZBQWtCLENBQUE7SUFDbEIsaUZBQWlCLENBQUE7SUFDakIseUZBQXFCLENBQUE7SUFDckIsdUZBQW9CLENBQUE7QUFDeEIsQ0FBQyxFQU5JLGdCQUFnQixLQUFoQixnQkFBZ0IsUUFNcEI7QUFDRCxJQUFJLGdCQUFxQyxDQUFDLENBQUMsZ0JBQWdCO0FBRTNELFNBQVMsb0JBQW9CO0lBQ3pCLElBQUksZ0JBQWdCLElBQUksT0FBTyxnQkFBZ0IsQ0FBQyxHQUFHLEtBQUssUUFBUSxFQUFFO1FBQzlELElBQUEsbUJBQVEsRUFBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMvQixnQkFBZ0IsR0FBRyxJQUFJLENBQUM7S0FDM0I7QUFDTCxDQUFDO0FBRUQsS0FBSyxVQUFVLG1CQUFtQjtJQUM5QiwwQkFBMEI7SUFDMUIsTUFBTSxJQUFJLEdBQUcsTUFBTSx5Q0FBc0IsQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUV6RSxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztLQUNyQztJQUVELE9BQU87SUFDUCxJQUFJLGdCQUF3QixDQUFDO0lBQzdCLE1BQU0sWUFBWSxHQUFHLE1BQU0sTUFBTSxDQUFD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SUFBSSxDQUFDLENBQUM7SUFDMUQsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBbk5ELG9DQW1OQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRpcm5hbWUsIGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCBFanMgZnJvbSAnZWpzJztcbmltcG9ydCB7IHdyaXRlRmlsZSwgY29weUZpbGVTeW5jLCBlbnN1cmVEaXJTeW5jLCBlbXB0eURpciwgcmVhZEZpbGUsIHBhdGhFeGlzdHNTeW5jIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgQ2hpbGRQcm9jZXNzLCBzcGF3biB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHRyZWVLaWxsIGZyb20gJ3RyZWUta2lsbCc7XG5pbXBvcnQgeyBCdWlsdGluTW9kdWxlUHJvdmlkZXIgfSBmcm9tICdAZWRpdG9yL2xpYi1wcm9ncmFtbWluZy9kaXN0L2J1aWx0aW4tbW9kdWxlLXByb3ZpZGVyJztcbmltcG9ydCB7IGJ1aWxkRW5naW5lLCBTdGF0c1F1ZXJ5IH0gZnJvbSAnQGNvY29zL2NjYnVpbGQnO1xuaW1wb3J0IHsgY29weURpclN5bmMsIGZvcm1hdFBhdGgsIGdlbmVyYXRlU2ltdWxhdG9yQ29uZmlnLCBnZXRKc0VuZ2luZVBhdGgsIGdldE5hdGl2ZUVuZ2luZVBhdGgsIGdldFNpbXVsYXRvclByZWZlcmVuY2UgfSBmcm9tICcuL3NpbXVsYXRvci11dGlscyc7XG5pbXBvcnQgeyBicm93c2VyUHJldmlld01hbmFnZXIgfSBmcm9tICcuL3ByZXZpZXctbWFuYWdlcic7XG5pbXBvcnQgeyBwcmV2aWV3U2V0dGluZ3NNYW5hZ2VyIH0gZnJvbSAnLi9wcmV2aWV3LXNldHRpbmdzJztcblxuZW51bSBSZXNvbHV0aW9uUG9saWN5IHtcbiAgICBSZXNvbHV0aW9uRXhhY3RGaXQsXG4gICAgUmVzb2x1dGlvbk5vQm9yZGVyLFxuICAgIFJlc29sdXRpb25TaG93QWxsLFxuICAgIFJlc29sdXRpb25GaXhlZEhlaWdodCxcbiAgICBSZXNvbHV0aW9uRml4ZWRXaWR0aCxcbn1cbmxldCBzaW11bGF0b3JQcm9jZXNzOiBDaGlsZFByb2Nlc3MgfCBudWxsOyAvLyDmoIfor4bmqKHmi5/lmajpooTop4jov5vnqIvmmK/lkKblrZjlnKhcblxuZnVuY3Rpb24gc3RvcFNpbXVsYXRvclByb2Nlc3MoKSB7XG4gICAgaWYgKHNpbXVsYXRvclByb2Nlc3MgJiYgdHlwZW9mIHNpbXVsYXRvclByb2Nlc3MucGlkID09PSAnbnVtYmVyJykge1xuICAgICAgICB0cmVlS2lsbChzaW11bGF0b3JQcm9jZXNzLnBpZCk7XG4gICAgICAgIHNpbXVsYXRvclByb2Nlc3MgPSBudWxsO1xuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVQcmV2aWV3RGF0YSgpIHtcbiAgICAvLyDmqKHmi5/lmajpooTop4jkuI3pnIDopoEgbGF1bmNoU2NlbmUg5pWw5o2uXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHByZXZpZXdTZXR0aW5nc01hbmFnZXIucXVlcnlTZXR0aW5nc0RhdGEoJ3NpbXVsYXRvcicpO1xuXG4gICAgaWYgKCEoZGF0YSAmJiBkYXRhLnNldHRpbmdzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+aehOW7uiBzZXR0aW5ncyDlh7rplJknKTtcbiAgICB9XG5cbiAgICAvLyDlkK/liqjlnLrmma9cbiAgICBsZXQgcHJldmlld1NjZW5lSnNvbjogc3RyaW5nO1xuICAgIGNvbnN0IHByZXZpZXdTY2VuZSA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldENvbmZpZygncHJldmlldycsICdnZW5lcmFsLnN0YXJ0X3NjZW5lJyk7XG4gICAgaWYgKHByZXZpZXdTY2VuZSA9PT0gJ2N1cnJlbnRfc2NlbmUnKSB7XG4gICAgICAgIHByZXZpZXdTY2VuZUpzb24gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1zY2VuZS1qc29uJyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zdCBwcmV2aWV3U2NlbmVQYXRoID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktcGF0aCcsIHByZXZpZXdTY2VuZSkgYXMgc3RyaW5nO1xuICAgICAgICBwcmV2aWV3U2NlbmVKc29uID0gYXdhaXQgcmVhZEZpbGUocHJldmlld1NjZW5lUGF0aCwgJ3V0ZjgnKTtcbiAgICB9XG4gICAgLy8g5qih5ouf5Zmo6aKE6KeI5LiN5pi+56S65o+S5bGP77yM5Yqg5b+r5ZCv5Yqo6YCf5bqmXG4gICAgZGF0YS5zZXR0aW5ncy5zcGxhc2hTY3JlZW4hLnRvdGFsVGltZSA9IDA7XG4gICAgY29uc3QgZ2xvYmFsSW50ZXJuYWxMaWJyYXJ5ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktZ2xvYmFsLWludGVybmFsLWxpYnJhcnknKTtcbiAgICBpZiAoZ2xvYmFsSW50ZXJuYWxMaWJyYXJ5KSB7XG4gICAgICAgIC8vIOeUseS6juWOn+eUn+aooeaLn+WZqOmihOiniOWKoOi9veaWh+S7tum7mOiupOi1sOeahOaWh+S7tuezu+e7n++8jOS8muWvvOiHtOW9k+aVsOaNruW6k+m7mOiupOWvvOWFpeWcsOWdgOS4jeaUvuWcqCBsaWJyYXJ5IOWGheaXtuS8muaciemXrumimOOAglxuICAgICAgICAvLyAzLjguNSDmlK/mjIHkuoblhoXnva7otYTmupDlr7zlhaXliLDlhajlsYDnm67lvZXvvIzmiYDku6XmraTlpITliKnnlKjov5znqIsgYnVuZGxlIOeahOacuuWItu+8jFxuICAgICAgICAvLyDlsIbmiYDmnIkgYnVuZGxlIOiuvue9ruS4uiByZW1vdGUgYnVuZGxl77yM5YaN6YCa6L+H6aKE6KeI5pyN5Yqh5Zmo5ou/5Yiw5q2j56Gu55qE6LWE5rqQ5L+h5oGvXG4gICAgICAgIC8vIFRPRE8g5q2k5pa55byP5Lya5a+86Ie0IGJ1bmRsZSDohJrmnKznmoTlhoXlrrnlj5jkuLrmtY/op4jlmajpooTop4jnmoTmoLzlvI/niYjmnKzvvIznlLHkuo7pooTop4jpmLbmrrXpg73mmK/nqbrohJrmnKzvvIzmmoLmnKrlj5HnjrDpl67pophcbiAgICAgICAgZGF0YS5zZXR0aW5ncy5hc3NldHMuc2VydmVyID0gKGF3YWl0IGJyb3dzZXJQcmV2aWV3TWFuYWdlci5xdWVyeVByZXZpZXdVcmwoKSkgKyAnLyc7XG4gICAgICAgIGRhdGEuc2V0dGluZ3MuYXNzZXRzLnJlbW90ZUJ1bmRsZXMgPSBkYXRhLnNldHRpbmdzLmFzc2V0cy5wcm9qZWN0QnVuZGxlcztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBwcmV2aWV3U2NlbmVKc29uLFxuICAgICAgICBzZXR0aW5nczogZGF0YS5zZXR0aW5ncyxcbiAgICAgICAgYnVuZGxlQ29uZmlnczogZGF0YS5idW5kbGVDb25maWdzLFxuICAgIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3cml0ZVNldHRpbmdGaWxlKGRzdERpcjogc3RyaW5nKXtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZ2VuZXJhdGVQcmV2aWV3RGF0YSgpO1xuICAgIGVuc3VyZURpclN5bmMoam9pbihkc3REaXIsICdzcmMnKSk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oZHN0RGlyLCAnc3JjL3NldHRpbmdzLmpzb24nKSwgSlNPTi5zdHJpbmdpZnkoZGF0YS5zZXR0aW5ncywgdW5kZWZpbmVkLCAyKSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmJ1bmRsZUNvbmZpZ3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gZGF0YS5idW5kbGVDb25maWdzW2ldO1xuICAgICAgICBjb25zdCBidW5kbGVEaXIgPSBqb2luKGRzdERpciwgJ2Fzc2V0cycsIGNvbmZpZy5uYW1lKTtcbiAgICAgICAgZW5zdXJlRGlyU3luYyhidW5kbGVEaXIpO1xuICAgICAgICAvLyDliKDpmaQgaW1wb3J0QmFzZSDlkowgbmF0aXZlQmFzZe+8jOS9v+eUqCBnZW5lcmFsQmFzZVxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGRlbGV0ZSBjb25maWcuaW1wb3J0QmFzZTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBkZWxldGUgY29uZmlnLm5hdGl2ZUJhc2U7XG4gICAgICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKGJ1bmRsZURpciwgJ2NjLmNvbmZpZy5qc29uJyksIEpTT04uc3RyaW5naWZ5KGNvbmZpZywgdW5kZWZpbmVkLCAyKSk7XG4gICAgICAgIC8vIFRPRE86IOebruWJjeeahOWunueOsOi3nyB3ZWIg6aKE6KeI5LiA5qC377yM5LiA5qyh5oCn5Yqg6L295omA5pyJ6ISa5pysXG4gICAgICAgIGNvbnN0IGJ1bmRsZUVudHJ5ID0gW107XG4gICAgICAgIGlmIChjb25maWcubmFtZSA9PT0gJ21haW4nKSB7XG4gICAgICAgICAgICBidW5kbGVFbnRyeS5wdXNoKCdjY2U6L2ludGVybmFsL3gvcHJlcmVxdWlzaXRlLWltcG9ydHMnKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBidW5kbGVJbmRleEpzU291cmNlID0gYXdhaXQgRWpzLnJlbmRlckZpbGUoam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL2J1bmRsZUluZGV4LmVqcycpLCB7XG4gICAgICAgICAgICBidW5kbGVOYW1lOiBjb25maWcubmFtZSxcbiAgICAgICAgICAgIGJ1bmRsZUVudHJ5LFxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oYnVuZGxlRGlyLCAnaW5kZXguanMnKSwgYnVuZGxlSW5kZXhKc1NvdXJjZSwgJ3V0ZjgnKTtcbiAgICB9XG59XG5cbmxldCBmaXJzdE1ldHJpY3MgPSBmYWxzZTtcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5TaW11bGF0b3Iob25Db21wbGV0ZWQ/OiAoKSA9PiB2b2lkKSB7XG4gICAgZmlyc3RNZXRyaWNzID0gdHJ1ZTtcbiAgICAvLyDlhbPpl63mqKHmi5/lmahcbiAgICBzdG9wU2ltdWxhdG9yUHJvY2VzcygpO1xuXG4gICAgLy8g6I635Y+W5qih5ouf5Zmo5YGP5aW96K6+572uXG4gICAgY29uc3QgcHJlZmVyZW5jZSA9IGF3YWl0IGdldFNpbXVsYXRvclByZWZlcmVuY2UoKTtcblxuICAgIC8vIOi3r+W+hOWkhOeQhlxuICAgIGNvbnN0IGlzRGFyd2luID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2Rhcndpbic7XG4gICAgY29uc3QganNFbmdpbmVQYXRoID0gYXdhaXQgZ2V0SnNFbmdpbmVQYXRoKCk7XG4gICAgY29uc3QgbmF0aXZlRW5naW5lUGF0aCA9IGF3YWl0IGdldE5hdGl2ZUVuZ2luZVBhdGgoKTtcbiAgICBjb25zdCBzaW11bGF0b3JSb290ID0gam9pbihuYXRpdmVFbmdpbmVQYXRoLCBpc0RhcndpbiA/ICdzaW11bGF0b3IvUmVsZWFzZS9TaW11bGF0b3JBcHAtTWFjLmFwcCcgOiAnc2ltdWxhdG9yL1JlbGVhc2UnKTtcbiAgICBjb25zdCBzaW11bGF0b3JSZXNvdXJjZXMgPSBpc0RhcndpbiA/IGpvaW4oc2ltdWxhdG9yUm9vdCwgJ0NvbnRlbnRzL1Jlc291cmNlcycpIDogc2ltdWxhdG9yUm9vdDtcbiAgICBjb25zdCBleGVjdXRhYmxlU2ltdWxhdG9yID0gaXNEYXJ3aW4gPyBqb2luKHNpbXVsYXRvclJvb3QsICdDb250ZW50cy9NYWNPUy9TaW11bGF0b3JBcHAtTWFjJykgOiBqb2luKHNpbXVsYXRvclJvb3QsICdTaW11bGF0b3JBcHAtV2luMzIuZXhlJyk7XG5cbiAgICBlbnN1cmVEaXJTeW5jKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnanNiLWFkYXB0ZXInKSk7XG4gICAgZW5zdXJlRGlyU3luYyhqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9jb2Nvcy1qcycpKTtcbiAgICAvLyDmuIXnqbrnvJPlrZhcbiAgICBhd2FpdCBlbXB0eURpcihqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2Fzc2V0cycpKTtcbiAgICBjb25zdCBhdXRvQ2xlYW5DYWNoZSA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldENvbmZpZygncHJldmlldycsICdwcmV2aWV3LmF1dG9fY2xlYW5fY2FjaGUnKTtcbiAgICBpZiAoYXV0b0NsZWFuQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgZW1wdHlEaXIoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdnYW1lY2FjaGVzJykpO1xuICAgIH1cblxuICAgIC8vIOagueaNruWBj+Wlveiuvue9rueahOaooeWdl+mFjee9ru+8jOeUn+aIkCBjYy5qcyDliLAgc3RhdGljL3NpbXVsYXRvci9jb2Nvcy1qcyDnm67lvZVcbiAgICAvLyBUT0RPOiDkvb/nlKggUVVJQ0tfQ09NUElMRSDnvJbor5EgZW5naW5lXG4gICAgY29uc3QgY2NNb2R1bGVGaWxlID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvY29jb3MtanMvY2MuanMnKTtcbiAgICBjb25zdCBjY2VDb2RlUXVhbGl0eUZpbGUgPSBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9idWlsdGluL2NjZS5jb2RlLXF1YWxpdHkuY3IuanMnKTtcbiAgICBjb25zdCBjY2VFbnZGaWxlID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvYnVpbHRpbi9jY2UuZW52LmpzJyk7XG4gICAgZW5zdXJlRGlyU3luYyhkaXJuYW1lKGNjTW9kdWxlRmlsZSkpO1xuICAgIGVuc3VyZURpclN5bmMoZGlybmFtZShjY2VDb2RlUXVhbGl0eUZpbGUpKTtcbiAgICBjb25zdCBzdGF0c1F1ZXJ5ID0gYXdhaXQgU3RhdHNRdWVyeS5jcmVhdGUoanNFbmdpbmVQYXRoKTtcbiAgICBjb25zdCBjY0VudkNvbnN0YW50cyA9IHN0YXRzUXVlcnkuY29uc3RhbnRNYW5hZ2VyLmdlbkNDRW52Q29uc3RhbnRzKHtcbiAgICAgICAgbW9kZTogJ1BSRVZJRVcnLFxuICAgICAgICBwbGF0Zm9ybTogJ05BVElWRScsXG4gICAgICAgIGZsYWdzOiB7XG4gICAgICAgICAgICBERUJVRzogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGZlYXR1cmVzID0gKGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2VuZ2luZScsICdxdWVyeS1lbmdpbmUtbW9kdWxlcy1wcm9maWxlJykpPy5pbmNsdWRlTW9kdWxlcyA/PyBbXTtcbiAgICBjb25zdCBmZWF0dXJlVW5pdHMgPSBzdGF0c1F1ZXJ5LmdldFVuaXRzT2ZGZWF0dXJlcyhmZWF0dXJlcyk7XG4gICAgY29uc3QgeyBjb2RlOiBpbmRleE1vZCB9ID0gYXdhaXQgYnVpbGRFbmdpbmUudHJhbnNmb3JtKHN0YXRzUXVlcnkuZXZhbHVhdGVJbmRleE1vZHVsZVNvdXJjZShcbiAgICAgICAgZmVhdHVyZVVuaXRzLFxuICAgICAgICAobW9kdWxlTmFtZSkgPT4gbW9kdWxlTmFtZSwgLy8g5ZKMIHF1aWNrIGNvbXBpbGVyIOe7meeahOWJjee8gOS4gOiHtCxcbiAgICApLCAnc3lzdGVtJyk7XG4gICAgY29uc3QgYnVpbHRpbk1vZHVsZVByb3ZpZGVyID0gYXdhaXQgQnVpbHRpbk1vZHVsZVByb3ZpZGVyLmNyZWF0ZSh7IGZvcm1hdDogJ3N5c3RlbWpzJyB9KTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgIC8vIFRPRE86IOenu+mZpCBidWlsdGluTW9kdWxlUHJvdmlkZXIg5L6d6LWWXG4gICAgICAgIGJ1aWx0aW5Nb2R1bGVQcm92aWRlci5hZGRCdWlsZFRpbWVDb25zdGFudHNNb2QoY2NFbnZDb25zdGFudHMgYXMgYW55KSxcbiAgICBdKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoY2NNb2R1bGVGaWxlLCBpbmRleE1vZCwgJ3V0ZjgnKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoY2NlRW52RmlsZSwgYnVpbHRpbk1vZHVsZVByb3ZpZGVyLm1vZHVsZXNbJ2NjL2VudiddLCAndXRmOCcpO1xuXG4gICAgLy8g5ou36LSd5paH5Lu2XG4gICAgY29uc3QgdG9Db3B5ID0gW1xuICAgICAgICAvLyDmi7fotJ0ganNiLWFkYXB0ZXJcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKGpzRW5naW5lUGF0aCwgJ2Jpbi9hZGFwdGVyL25hdGl2ZS93ZWItYWRhcHRlci5qcycpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdqc2ItYWRhcHRlci93ZWItYWRhcHRlci5qcycpLFxuICAgICAgICAgICAgaXNEaXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oanNFbmdpbmVQYXRoLCAnYmluL2FkYXB0ZXIvbmF0aXZlL2VuZ2luZS1hZGFwdGVyLmpzJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2pzYi1hZGFwdGVyL2VuZ2luZS1hZGFwdGVyLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOaLt+i0nSBlbmdpbmUsIGltcG9ydC1tYXAuanNvblxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oanNFbmdpbmVQYXRoLCAnYmluL25hdGl2ZS1wcmV2aWV3JyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9jb2Nvcy1qcycpLFxuICAgICAgICAgICAgaXNEaXI6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL2ltcG9ydC1tYXAuanNvbicpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvaW1wb3J0LW1hcC5qc29uJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL3N5c3RlbS5idW5kbGUuanMnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL3N5c3RlbS5idW5kbGUuanMnKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3IvcG9seWZpbGxzLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvcG9seWZpbGxzLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgaXNEaXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oRWRpdG9yLlByb2plY3QudG1wRGlyLCAnYXNzZXQtZGIvZWZmZWN0L2VmZmVjdC5iaW4nKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2VmZmVjdC5iaW4nKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICBdO1xuICAgIHRvQ29weS5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICBpZiAocGF0aEV4aXN0c1N5bmMoaXRlbS5zcmMpKSB7XG4gICAgICAgICAgICBpZiAoaXRlbS5pc0Rpcikge1xuICAgICAgICAgICAgICAgIGNvcHlEaXJTeW5jKGl0ZW0uc3JjLCBpdGVtLmRlc3QpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb3B5RmlsZVN5bmMoaXRlbS5zcmMsIGl0ZW0uZGVzdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIOWGmeWFpSBzZXR0aW5ncy5qc1xuICAgIGF3YWl0IHdyaXRlU2V0dGluZ0ZpbGUoc2ltdWxhdG9yUmVzb3VyY2VzKTtcblxuICAgIC8vIOWGmeWFpeWIneWni+WcuuaZr+aVsOaNrlxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBnZW5lcmF0ZVByZXZpZXdEYXRhKCk7XG4gICAgbGV0IHByZXZpZXdTY2VuZUpzb25QYXRoID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdwcmV2aWV3LXNjZW5lLmpzb24nKTtcbiAgICBwcmV2aWV3U2NlbmVKc29uUGF0aCA9IGZvcm1hdFBhdGgocHJldmlld1NjZW5lSnNvblBhdGgpO1xuICAgIGF3YWl0IHdyaXRlRmlsZShwcmV2aWV3U2NlbmVKc29uUGF0aCwgZGF0YS5wcmV2aWV3U2NlbmVKc29uLCAndXRmOCcpO1xuXG4gICAgLy8g55Sf5oiQIG1haW4uanNcbiAgICBjb25zdCBwcmV2aWV3UG9ydCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NlcnZlcicsICdxdWVyeS1wb3J0Jyk7XG4gICAgY29uc3QgcHJldmlld0lwID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgncHJldmlldycsICdnZXQtcHJldmlldy1pcCcpO1xuICAgIGNvbnN0IG1haW5Kc1NvdXJjZSA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9tYWluLmVqcycpLCB7XG4gICAgICAgIGxpYnJhcnlQYXRoOiBmb3JtYXRQYXRoKGpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ2xpYnJhcnknKSksXG4gICAgICAgIHdhaXRGb3JDb25uZWN0OiBwcmVmZXJlbmNlLndhaXRGb3JDb25uZWN0LFxuICAgICAgICBwcm9qZWN0UGF0aDogZm9ybWF0UGF0aChFZGl0b3IuUHJvamVjdC5wYXRoKSxcbiAgICAgICAgcHJldmlld0lwLFxuICAgICAgICBwcmV2aWV3UG9ydCxcbiAgICAgICAgcGFja0ltcG9ydE1hcFVSTDogJy9zY3JpcHRpbmcveC9pbXBvcnQtbWFwLmpzb24nLFxuICAgICAgICBwYWNrUmVzb2x1dGlvbkRldGFpbE1hcFVSTDogJy9zY3JpcHRpbmcveC9yZXNvbHV0aW9uLWRldGFpbC1tYXAuanNvbicsXG4gICAgfSk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnbWFpbi5qcycpLCBtYWluSnNTb3VyY2UsICd1dGY4Jyk7XG5cbiAgICAvLyDnlJ/miJAgYXBwbGljYXRpb24uanNcbiAgICBjb25zdCBoYXNQaHlzaWNzQW1tbyA9IGZlYXR1cmVzLmluY2x1ZGVzKCdwaHlzaWNzLWFtbW8nKTtcbiAgICBjb25zdCBwcm9qZWN0RGF0YSA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldFByb2plY3QoJ3Byb2plY3QnLCAnZ2VuZXJhbC5kZXNpZ25SZXNvbHV0aW9uJyk7XG4gICAgbGV0IHJlc29sdXRpb25Qb2xpY3k6IFJlc29sdXRpb25Qb2xpY3k7XG4gICAgaWYgKHByb2plY3REYXRhLmZpdFdpZHRoICYmIHByb2plY3REYXRhLmZpdEhlaWdodCkge1xuICAgICAgICByZXNvbHV0aW9uUG9saWN5ID0gUmVzb2x1dGlvblBvbGljeS5SZXNvbHV0aW9uU2hvd0FsbDtcbiAgICB9XG4gICAgZWxzZSBpZiAocHJvamVjdERhdGEuZml0V2lkdGggJiYgIXByb2plY3REYXRhLmZpdEhlaWdodCkge1xuICAgICAgICByZXNvbHV0aW9uUG9saWN5ID0gUmVzb2x1dGlvblBvbGljeS5SZXNvbHV0aW9uRml4ZWRXaWR0aDtcbiAgICB9XG4gICAgZWxzZSBpZiAoIXByb2plY3REYXRhLmZpdFdpZHRoICYmIHByb2plY3REYXRhLmZpdEhlaWdodCkge1xuICAgICAgICByZXNvbHV0aW9uUG9saWN5ID0gUmVzb2x1dGlvblBvbGljeS5SZXNvbHV0aW9uRml4ZWRIZWlnaHQ7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXNvbHV0aW9uUG9saWN5ID0gUmVzb2x1dGlvblBvbGljeS5SZXNvbHV0aW9uTm9Cb3JkZXI7XG4gICAgfVxuICAgIGNvbnN0IGRlc2lnblJlc29sdXRpb24gPSB7XG4gICAgICAgIHdpZHRoOiBwcm9qZWN0RGF0YS53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiBwcm9qZWN0RGF0YS5oZWlnaHQsXG4gICAgICAgIHJlc29sdXRpb25Qb2xpY3ksXG4gICAgfTtcbiAgICBjb25zdCBhcHBKc1NvdXJjZSA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9hcHBsaWNhdGlvbi5lanMnKSwge1xuICAgICAgICBoYXNQaHlzaWNzQW1tbyxcbiAgICAgICAgcHJldmlld1NjZW5lSnNvblBhdGgsXG4gICAgICAgIGxpYnJhcnlQYXRoOiBmb3JtYXRQYXRoKGpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ2xpYnJhcnknKSksXG4gICAgICAgIHByb2plY3RQYXRoOiBmb3JtYXRQYXRoKEVkaXRvci5Qcm9qZWN0LnBhdGgpLFxuICAgICAgICBkZXNpZ25SZXNvbHV0aW9uLFxuICAgICAgICBwcmV2aWV3SXAsXG4gICAgICAgIHByZXZpZXdQb3J0LFxuICAgIH0pO1xuICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9hcHBsaWNhdGlvbi5qcycpLCBhcHBKc1NvdXJjZSwgJ3V0ZjgnKTtcblxuICAgIC8vIOagueaNruWBj+Wlveiuvue9ru+8jOabtOaWsOaooeaLn+WZqOmFjee9ruaWh+S7tlxuICAgIGF3YWl0IGdlbmVyYXRlU2ltdWxhdG9yQ29uZmlnKCk7XG5cbiAgICAvLyDov5DooYzmqKHmi5/lmahcbiAgICAvLyBlbnZpcm9ubWVudFxuICAgIC8vIFRPRE86IOWIneWni+WMlueOr+Wig+WPmOmHj1xuICAgIC8vIGVudiA9IHtcbiAgICAvLyAgICAgQ09DT1NfRlJBTUVXT1JLUzogUGF0aC5qb2luKGNvY29zUm9vdCwgJy4uLycpLFxuICAgIC8vICAgICBDT0NPU19YX1JPT1Q6IGNvY29zUm9vdCxcbiAgICAvLyAgICAgQ09DT1NfQ09OU09MRV9ST09UOiBjb2Nvc0NvbnNvbGVSb290LFxuICAgIC8vICAgICBOREtfUk9PVDogbmRrUm9vdCxcbiAgICAvLyAgICAgQU5EUk9JRF9TREtfUk9PVDogYW5kcm9pZFNES1Jvb3RcbiAgICAvLyB9O1xuXG4gICAgLy8gLy8gZm9ybWF0IGVudmlyb25tZW50IHN0cmluZ1xuICAgIC8vIGVudlN0ciA9ICcnO1xuICAgIC8vIGZvciAobGV0IGsgaW4gZW52KSB7XG4gICAgLy8gICAgIGlmIChlbnZTdHIgIT09ICcnKSB7XG4gICAgLy8gICAgICAgICBlbnZTdHIgKz0gJzsnO1xuICAgIC8vICAgICB9XG5cbiAgICAvLyAgICAgZW52U3RyICs9IGAke2t9PSR7ZW52W2tdfWA7XG4gICAgLy8gfVxuICAgIC8vIGxldCBhcmdzID0gWyctd29ya2RpcicsIHNpbXVsYXRvclJlc291cmNlcywgJy13cml0YWJsZS1wYXRoJywgc2ltdWxhdG9yUmVzb3VyY2VzLCAnLWNvbnNvbGUnLCAnZmFsc2UnLCAnLS1lbnYnLCBlbnZTdHJdO1xuICAgIGNvbnN0IGFyZ3MgPSBbJy13b3JrZGlyJywgc2ltdWxhdG9yUmVzb3VyY2VzLCAnLXdyaXRhYmxlLXBhdGgnLCBzaW11bGF0b3JSZXNvdXJjZXMsICctY29uc29sZScsICdmYWxzZSddO1xuICAgIHNpbXVsYXRvclByb2Nlc3MgPSBzcGF3bihleGVjdXRhYmxlU2ltdWxhdG9yLCBhcmdzKTtcblxuICAgIC8vIOaJk+W8gOaooeaLn+WZqOiwg+ivleWZqFxuICAgIGlmIChwcmVmZXJlbmNlLnNob3dEZWJ1Z1BhbmVsKSB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLlBhbmVsLm9wZW4oJ3ByZXZpZXcuZGVidWdnZXInKTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfVxuXG4gICAgLy8g55uR5ZCs5qih5ouf5Zmo6L+b56iL55qE6L6T5Ye6XG4gICAgc2ltdWxhdG9yUHJvY2Vzcy5vbignY2xvc2UnLCAoKSA9PiB7XG4gICAgICAgIEVkaXRvci5QYW5lbC5jbG9zZSgncHJldmlldy5kZWJ1Z2dlcicpO1xuICAgIH0pO1xuICAgIHNpbXVsYXRvclByb2Nlc3Muc3Rkb3V0Py5vbignZGF0YScsIGRhdGEgPT4ge1xuICAgICAgICBpZiAoZmlyc3RNZXRyaWNzICYmIG9uQ29tcGxldGVkKSB7XG4gICAgICAgICAgICBmaXJzdE1ldHJpY3MgPSBmYWxzZTtcbiAgICAgICAgICAgIG9uQ29tcGxldGVkKCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coZGF0YS50b1N0cmluZyA/IGRhdGEudG9TdHJpbmcoKSA6IGRhdGEpO1xuICAgIH0pO1xuICAgIHNpbXVsYXRvclByb2Nlc3Muc3RkZXJyPy5vbignZGF0YScsIGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGRhdGEudG9TdHJpbmcgPyBkYXRhLnRvU3RyaW5nKCkgOiBkYXRhKTtcbiAgICB9KTtcbiAgICBzaW11bGF0b3JQcm9jZXNzLm9uKCdlcnJvcicsIGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGRhdGEudG9TdHJpbmcgPyBkYXRhLnRvU3RyaW5nKCkgOiBkYXRhKTtcbiAgICB9KTtcbn1cbiJdfQ==