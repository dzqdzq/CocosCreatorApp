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
    var _a, _b;
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
    const features = (await Editor.Profile.getProject('engine', 'modules.includeModules')) || [];
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
    const includeModules = await Editor.Profile.getProject('engine', 'modules.includeModules');
    const hasPhysicsAmmo = includeModules.includes('physics-ammo');
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
    (_a = simulatorProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', data => {
        if (firstMetrics && onCompleted) {
            firstMetrics = false;
            onCompleted();
        }
        console.log(data.toString ? data.toString() : data);
    });
    (_b = simulatorProcess.stderr) === null || _b === void 0 ? void 0 : _b.on('data', data => {
        console.error(data.toString ? data.toString() : data);
    });
    simulatorProcess.on('error', data => {
        console.error(data.toString ? data.toString() : data);
    });
}
exports.runSimulator = runSimulator;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltdWxhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2Jyb3dzZXIvc2ltdWxhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLCtCQUFxQztBQUNyQyw4Q0FBc0I7QUFDdEIsdUNBQXNHO0FBQ3RHLGlEQUFvRDtBQUNwRCwwREFBaUM7QUFDakMsa0dBQTZGO0FBQzdGLDRDQUF5RDtBQUN6RCx1REFBbUo7QUFDbkosdURBQTBEO0FBQzFELHlEQUE0RDtBQUU1RCxJQUFLLGdCQU1KO0FBTkQsV0FBSyxnQkFBZ0I7SUFDakIsbUZBQWtCLENBQUE7SUFDbEIsbUZBQWtCLENBQUE7SUFDbEIsaUZBQWlCLENBQUE7SUFDakIseUZBQXFCLENBQUE7SUFDckIsdUZBQW9CLENBQUE7QUFDeEIsQ0FBQyxFQU5JLGdCQUFnQixLQUFoQixnQkFBZ0IsUUFNcEI7QUFDRCxJQUFJLGdCQUFxQyxDQUFDLENBQUMsZ0JBQWdCO0FBRTNELFNBQVMsb0JBQW9CO0lBQ3pCLElBQUksZ0JBQWdCLElBQUksT0FBTyxnQkFBZ0IsQ0FBQyxHQUFHLEtBQUssUUFBUSxFQUFFO1FBQzlELElBQUEsbUJBQVEsRUFBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMvQixnQkFBZ0IsR0FBRyxJQUFJLENBQUM7S0FDM0I7QUFDTCxDQUFDO0FBRUQsS0FBSyxVQUFVLG1CQUFtQjtJQUM5QiwwQkFBMEI7SUFDMUIsTUFBTSxJQUFJLEdBQUcsTUFBTSx5Q0FBc0IsQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUV6RSxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztLQUNyQztJQUVELE9BQU87SUFDUCxJQUFJLGdCQUF3QixDQUFDO0lBQzdCLE1BQU0sWUFBWSxHQUFHLE1BQU0sTUFBTSxDQUFD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LENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzFELENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQXBORCxvQ0FvTkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkaXJuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgRWpzIGZyb20gJ2Vqcyc7XG5pbXBvcnQgeyB3cml0ZUZpbGUsIGNvcHlGaWxlU3luYywgZW5zdXJlRGlyU3luYywgZW1wdHlEaXIsIHJlYWRGaWxlLCBwYXRoRXhpc3RzU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IENoaWxkUHJvY2Vzcywgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCB0cmVlS2lsbCBmcm9tICd0cmVlLWtpbGwnO1xuaW1wb3J0IHsgQnVpbHRpbk1vZHVsZVByb3ZpZGVyIH0gZnJvbSAnQGVkaXRvci9saWItcHJvZ3JhbW1pbmcvZGlzdC9idWlsdGluLW1vZHVsZS1wcm92aWRlcic7XG5pbXBvcnQgeyBidWlsZEVuZ2luZSwgU3RhdHNRdWVyeSB9IGZyb20gJ0Bjb2Nvcy9jY2J1aWxkJztcbmltcG9ydCB7IGNvcHlEaXJTeW5jLCBmb3JtYXRQYXRoLCBnZW5lcmF0ZVNpbXVsYXRvckNvbmZpZywgZ2V0SnNFbmdpbmVQYXRoLCBnZXROYXRpdmVFbmdpbmVQYXRoLCBnZXRTaW11bGF0b3JQcmVmZXJlbmNlIH0gZnJvbSAnLi9zaW11bGF0b3ItdXRpbHMnO1xuaW1wb3J0IHsgYnJvd3NlclByZXZpZXdNYW5hZ2VyIH0gZnJvbSAnLi9wcmV2aWV3LW1hbmFnZXInO1xuaW1wb3J0IHsgcHJldmlld1NldHRpbmdzTWFuYWdlciB9IGZyb20gJy4vcHJldmlldy1zZXR0aW5ncyc7XG5cbmVudW0gUmVzb2x1dGlvblBvbGljeSB7XG4gICAgUmVzb2x1dGlvbkV4YWN0Rml0LFxuICAgIFJlc29sdXRpb25Ob0JvcmRlcixcbiAgICBSZXNvbHV0aW9uU2hvd0FsbCxcbiAgICBSZXNvbHV0aW9uRml4ZWRIZWlnaHQsXG4gICAgUmVzb2x1dGlvbkZpeGVkV2lkdGgsXG59XG5sZXQgc2ltdWxhdG9yUHJvY2VzczogQ2hpbGRQcm9jZXNzIHwgbnVsbDsgLy8g5qCH6K+G5qih5ouf5Zmo6aKE6KeI6L+b56iL5piv5ZCm5a2Y5ZyoXG5cbmZ1bmN0aW9uIHN0b3BTaW11bGF0b3JQcm9jZXNzKCkge1xuICAgIGlmIChzaW11bGF0b3JQcm9jZXNzICYmIHR5cGVvZiBzaW11bGF0b3JQcm9jZXNzLnBpZCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgdHJlZUtpbGwoc2ltdWxhdG9yUHJvY2Vzcy5waWQpO1xuICAgICAgICBzaW11bGF0b3JQcm9jZXNzID0gbnVsbDtcbiAgICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlUHJldmlld0RhdGEoKSB7XG4gICAgLy8g5qih5ouf5Zmo6aKE6KeI5LiN6ZyA6KaBIGxhdW5jaFNjZW5lIOaVsOaNrlxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBwcmV2aWV3U2V0dGluZ3NNYW5hZ2VyLnF1ZXJ5U2V0dGluZ3NEYXRhKCdzaW11bGF0b3InKTtcblxuICAgIGlmICghKGRhdGEgJiYgZGF0YS5zZXR0aW5ncykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfmnoTlu7ogc2V0dGluZ3Mg5Ye66ZSZJyk7XG4gICAgfVxuXG4gICAgLy8g5ZCv5Yqo5Zy65pmvXG4gICAgbGV0IHByZXZpZXdTY2VuZUpzb246IHN0cmluZztcbiAgICBjb25zdCBwcmV2aWV3U2NlbmUgPSBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRDb25maWcoJ3ByZXZpZXcnLCAnZ2VuZXJhbC5zdGFydF9zY2VuZScpO1xuICAgIGlmIChwcmV2aWV3U2NlbmUgPT09ICdjdXJyZW50X3NjZW5lJykge1xuICAgICAgICBwcmV2aWV3U2NlbmVKc29uID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktc2NlbmUtanNvbicpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29uc3QgcHJldmlld1NjZW5lUGF0aCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXBhdGgnLCBwcmV2aWV3U2NlbmUpIGFzIHN0cmluZztcbiAgICAgICAgcHJldmlld1NjZW5lSnNvbiA9IGF3YWl0IHJlYWRGaWxlKHByZXZpZXdTY2VuZVBhdGgsICd1dGY4Jyk7XG4gICAgfVxuICAgIC8vIOaooeaLn+WZqOmihOiniOS4jeaYvuekuuaPkuWxj++8jOWKoOW/q+WQr+WKqOmAn+W6plxuICAgIGRhdGEuc2V0dGluZ3Muc3BsYXNoU2NyZWVuIS50b3RhbFRpbWUgPSAwO1xuICAgIGNvbnN0IGdsb2JhbEludGVybmFsTGlicmFyeSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWdsb2JhbC1pbnRlcm5hbC1saWJyYXJ5Jyk7XG4gICAgaWYgKGdsb2JhbEludGVybmFsTGlicmFyeSkge1xuICAgICAgICAvLyDnlLHkuo7ljp/nlJ/mqKHmi5/lmajpooTop4jliqDovb3mlofku7bpu5jorqTotbDnmoTmlofku7bns7vnu5/vvIzkvJrlr7zoh7TlvZPmlbDmja7lupPpu5jorqTlr7zlhaXlnLDlnYDkuI3mlL7lnKggbGlicmFyeSDlhoXml7bkvJrmnInpl67popjjgIJcbiAgICAgICAgLy8gMy44LjUg5pSv5oyB5LqG5YaF572u6LWE5rqQ5a+85YWl5Yiw5YWo5bGA55uu5b2V77yM5omA5Lul5q2k5aSE5Yip55So6L+c56iLIGJ1bmRsZSDnmoTmnLrliLbvvIxcbiAgICAgICAgLy8g5bCG5omA5pyJIGJ1bmRsZSDorr7nva7kuLogcmVtb3RlIGJ1bmRsZe+8jOWGjemAmui/h+mihOiniOacjeWKoeWZqOaLv+WIsOato+ehrueahOi1hOa6kOS/oeaBr1xuICAgICAgICAvLyBUT0RPIOatpOaWueW8j+S8muWvvOiHtCBidW5kbGUg6ISa5pys55qE5YaF5a655Y+Y5Li65rWP6KeI5Zmo6aKE6KeI55qE5qC85byP54mI5pys77yM55Sx5LqO6aKE6KeI6Zi25q616YO95piv56m66ISa5pys77yM5pqC5pyq5Y+R546w6Zeu6aKYXG4gICAgICAgIGRhdGEuc2V0dGluZ3MuYXNzZXRzLnNlcnZlciA9IChhd2FpdCBicm93c2VyUHJldmlld01hbmFnZXIucXVlcnlQcmV2aWV3VXJsKCkpICsgJy8nO1xuICAgICAgICBkYXRhLnNldHRpbmdzLmFzc2V0cy5yZW1vdGVCdW5kbGVzID0gZGF0YS5zZXR0aW5ncy5hc3NldHMucHJvamVjdEJ1bmRsZXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcHJldmlld1NjZW5lSnNvbixcbiAgICAgICAgc2V0dGluZ3M6IGRhdGEuc2V0dGluZ3MsXG4gICAgICAgIGJ1bmRsZUNvbmZpZ3M6IGRhdGEuYnVuZGxlQ29uZmlncyxcbiAgICB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JpdGVTZXR0aW5nRmlsZShkc3REaXI6IHN0cmluZyl7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGdlbmVyYXRlUHJldmlld0RhdGEoKTtcbiAgICBlbnN1cmVEaXJTeW5jKGpvaW4oZHN0RGlyLCAnc3JjJykpO1xuICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKGRzdERpciwgJ3NyYy9zZXR0aW5ncy5qc29uJyksIEpTT04uc3RyaW5naWZ5KGRhdGEuc2V0dGluZ3MsIHVuZGVmaW5lZCwgMikpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5idW5kbGVDb25maWdzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IGRhdGEuYnVuZGxlQ29uZmlnc1tpXTtcbiAgICAgICAgY29uc3QgYnVuZGxlRGlyID0gam9pbihkc3REaXIsICdhc3NldHMnLCBjb25maWcubmFtZSk7XG4gICAgICAgIGVuc3VyZURpclN5bmMoYnVuZGxlRGlyKTtcbiAgICAgICAgLy8g5Yig6ZmkIGltcG9ydEJhc2Ug5ZKMIG5hdGl2ZUJhc2XvvIzkvb/nlKggZ2VuZXJhbEJhc2VcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBkZWxldGUgY29uZmlnLmltcG9ydEJhc2U7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZGVsZXRlIGNvbmZpZy5uYXRpdmVCYXNlO1xuICAgICAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihidW5kbGVEaXIsICdjYy5jb25maWcuanNvbicpLCBKU09OLnN0cmluZ2lmeShjb25maWcsIHVuZGVmaW5lZCwgMikpO1xuICAgICAgICAvLyBUT0RPOiDnm67liY3nmoTlrp7njrDot58gd2ViIOmihOiniOS4gOagt++8jOS4gOasoeaAp+WKoOi9veaJgOacieiEmuacrFxuICAgICAgICBjb25zdCBidW5kbGVFbnRyeSA9IFtdO1xuICAgICAgICBpZiAoY29uZmlnLm5hbWUgPT09ICdtYWluJykge1xuICAgICAgICAgICAgYnVuZGxlRW50cnkucHVzaCgnY2NlOi9pbnRlcm5hbC94L3ByZXJlcXVpc2l0ZS1pbXBvcnRzJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYnVuZGxlSW5kZXhKc1NvdXJjZSA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9idW5kbGVJbmRleC5lanMnKSwge1xuICAgICAgICAgICAgYnVuZGxlTmFtZTogY29uZmlnLm5hbWUsXG4gICAgICAgICAgICBidW5kbGVFbnRyeSxcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKGJ1bmRsZURpciwgJ2luZGV4LmpzJyksIGJ1bmRsZUluZGV4SnNTb3VyY2UsICd1dGY4Jyk7XG4gICAgfVxufVxuXG5sZXQgZmlyc3RNZXRyaWNzID0gZmFsc2U7XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuU2ltdWxhdG9yKG9uQ29tcGxldGVkPzogKCkgPT4gdm9pZCkge1xuICAgIGZpcnN0TWV0cmljcyA9IHRydWU7XG4gICAgLy8g5YWz6Zet5qih5ouf5ZmoXG4gICAgc3RvcFNpbXVsYXRvclByb2Nlc3MoKTtcblxuICAgIC8vIOiOt+WPluaooeaLn+WZqOWBj+Wlveiuvue9rlxuICAgIGNvbnN0IHByZWZlcmVuY2UgPSBhd2FpdCBnZXRTaW11bGF0b3JQcmVmZXJlbmNlKCk7XG5cbiAgICAvLyDot6/lvoTlpITnkIZcbiAgICBjb25zdCBpc0RhcndpbiA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nO1xuICAgIGNvbnN0IGpzRW5naW5lUGF0aCA9IGF3YWl0IGdldEpzRW5naW5lUGF0aCgpO1xuICAgIGNvbnN0IG5hdGl2ZUVuZ2luZVBhdGggPSBhd2FpdCBnZXROYXRpdmVFbmdpbmVQYXRoKCk7XG4gICAgY29uc3Qgc2ltdWxhdG9yUm9vdCA9IGpvaW4obmF0aXZlRW5naW5lUGF0aCwgaXNEYXJ3aW4gPyAnc2ltdWxhdG9yL1JlbGVhc2UvU2ltdWxhdG9yQXBwLU1hYy5hcHAnIDogJ3NpbXVsYXRvci9SZWxlYXNlJyk7XG4gICAgY29uc3Qgc2ltdWxhdG9yUmVzb3VyY2VzID0gaXNEYXJ3aW4gPyBqb2luKHNpbXVsYXRvclJvb3QsICdDb250ZW50cy9SZXNvdXJjZXMnKSA6IHNpbXVsYXRvclJvb3Q7XG4gICAgY29uc3QgZXhlY3V0YWJsZVNpbXVsYXRvciA9IGlzRGFyd2luID8gam9pbihzaW11bGF0b3JSb290LCAnQ29udGVudHMvTWFjT1MvU2ltdWxhdG9yQXBwLU1hYycpIDogam9pbihzaW11bGF0b3JSb290LCAnU2ltdWxhdG9yQXBwLVdpbjMyLmV4ZScpO1xuXG4gICAgZW5zdXJlRGlyU3luYyhqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2pzYi1hZGFwdGVyJykpO1xuICAgIGVuc3VyZURpclN5bmMoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvY29jb3MtanMnKSk7XG4gICAgLy8g5riF56m657yT5a2YXG4gICAgYXdhaXQgZW1wdHlEaXIoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdhc3NldHMnKSk7XG4gICAgY29uc3QgYXV0b0NsZWFuQ2FjaGUgPSBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRDb25maWcoJ3ByZXZpZXcnLCAncHJldmlldy5hdXRvX2NsZWFuX2NhY2hlJyk7XG4gICAgaWYgKGF1dG9DbGVhbkNhY2hlKSB7XG4gICAgICAgIGF3YWl0IGVtcHR5RGlyKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnZ2FtZWNhY2hlcycpKTtcbiAgICB9XG5cbiAgICAvLyDmoLnmja7lgY/lpb3orr7nva7nmoTmqKHlnZfphY3nva7vvIznlJ/miJAgY2MuanMg5YiwIHN0YXRpYy9zaW11bGF0b3IvY29jb3MtanMg55uu5b2VXG4gICAgLy8gVE9ETzog5L2/55SoIFFVSUNLX0NPTVBJTEUg57yW6K+RIGVuZ2luZVxuICAgIGNvbnN0IGNjTW9kdWxlRmlsZSA9IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2NvY29zLWpzL2NjLmpzJyk7XG4gICAgY29uc3QgY2NlQ29kZVF1YWxpdHlGaWxlID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvYnVpbHRpbi9jY2UuY29kZS1xdWFsaXR5LmNyLmpzJyk7XG4gICAgY29uc3QgY2NlRW52RmlsZSA9IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2J1aWx0aW4vY2NlLmVudi5qcycpO1xuICAgIGVuc3VyZURpclN5bmMoZGlybmFtZShjY01vZHVsZUZpbGUpKTtcbiAgICBlbnN1cmVEaXJTeW5jKGRpcm5hbWUoY2NlQ29kZVF1YWxpdHlGaWxlKSk7XG4gICAgY29uc3Qgc3RhdHNRdWVyeSA9IGF3YWl0IFN0YXRzUXVlcnkuY3JlYXRlKGpzRW5naW5lUGF0aCk7XG4gICAgY29uc3QgY2NFbnZDb25zdGFudHMgPSBzdGF0c1F1ZXJ5LmNvbnN0YW50TWFuYWdlci5nZW5DQ0VudkNvbnN0YW50cyh7XG4gICAgICAgIG1vZGU6ICdQUkVWSUVXJyxcbiAgICAgICAgcGxhdGZvcm06ICdOQVRJVkUnLFxuICAgICAgICBmbGFnczoge1xuICAgICAgICAgICAgREVCVUc6IHRydWUsXG4gICAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBmZWF0dXJlcyA9IChhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRQcm9qZWN0KCdlbmdpbmUnLCAnbW9kdWxlcy5pbmNsdWRlTW9kdWxlcycpKSB8fCBbXTtcbiAgICBjb25zdCBmZWF0dXJlVW5pdHMgPSBzdGF0c1F1ZXJ5LmdldFVuaXRzT2ZGZWF0dXJlcyhmZWF0dXJlcyk7XG4gICAgY29uc3QgeyBjb2RlOiBpbmRleE1vZCB9ID0gYXdhaXQgYnVpbGRFbmdpbmUudHJhbnNmb3JtKHN0YXRzUXVlcnkuZXZhbHVhdGVJbmRleE1vZHVsZVNvdXJjZShcbiAgICAgICAgZmVhdHVyZVVuaXRzLFxuICAgICAgICAobW9kdWxlTmFtZSkgPT4gbW9kdWxlTmFtZSwgLy8g5ZKMIHF1aWNrIGNvbXBpbGVyIOe7meeahOWJjee8gOS4gOiHtCxcbiAgICApLCAnc3lzdGVtJyk7XG4gICAgY29uc3QgYnVpbHRpbk1vZHVsZVByb3ZpZGVyID0gYXdhaXQgQnVpbHRpbk1vZHVsZVByb3ZpZGVyLmNyZWF0ZSh7IGZvcm1hdDogJ3N5c3RlbWpzJyB9KTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgIC8vIFRPRE86IOenu+mZpCBidWlsdGluTW9kdWxlUHJvdmlkZXIg5L6d6LWWXG4gICAgICAgIGJ1aWx0aW5Nb2R1bGVQcm92aWRlci5hZGRCdWlsZFRpbWVDb25zdGFudHNNb2QoY2NFbnZDb25zdGFudHMgYXMgYW55KSxcbiAgICBdKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoY2NNb2R1bGVGaWxlLCBpbmRleE1vZCwgJ3V0ZjgnKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoY2NlRW52RmlsZSwgYnVpbHRpbk1vZHVsZVByb3ZpZGVyLm1vZHVsZXNbJ2NjL2VudiddLCAndXRmOCcpO1xuXG4gICAgLy8g5ou36LSd5paH5Lu2XG4gICAgY29uc3QgdG9Db3B5ID0gW1xuICAgICAgICAvLyDmi7fotJ0ganNiLWFkYXB0ZXJcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKGpzRW5naW5lUGF0aCwgJ2Jpbi9hZGFwdGVyL25hdGl2ZS93ZWItYWRhcHRlci5qcycpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdqc2ItYWRhcHRlci93ZWItYWRhcHRlci5qcycpLFxuICAgICAgICAgICAgaXNEaXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oanNFbmdpbmVQYXRoLCAnYmluL2FkYXB0ZXIvbmF0aXZlL2VuZ2luZS1hZGFwdGVyLmpzJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2pzYi1hZGFwdGVyL2VuZ2luZS1hZGFwdGVyLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOaLt+i0nSBlbmdpbmUsIGltcG9ydC1tYXAuanNvblxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oanNFbmdpbmVQYXRoLCAnYmluL25hdGl2ZS1wcmV2aWV3JyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9jb2Nvcy1qcycpLFxuICAgICAgICAgICAgaXNEaXI6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL2ltcG9ydC1tYXAuanNvbicpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvaW1wb3J0LW1hcC5qc29uJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL3N5c3RlbS5idW5kbGUuanMnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL3N5c3RlbS5idW5kbGUuanMnKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3IvcG9seWZpbGxzLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvcG9seWZpbGxzLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgaXNEaXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oRWRpdG9yLlByb2plY3QudG1wRGlyLCAnYXNzZXQtZGIvZWZmZWN0L2VmZmVjdC5iaW4nKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2VmZmVjdC5iaW4nKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICBdO1xuICAgIHRvQ29weS5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICBpZiAocGF0aEV4aXN0c1N5bmMoaXRlbS5zcmMpKSB7XG4gICAgICAgICAgICBpZiAoaXRlbS5pc0Rpcikge1xuICAgICAgICAgICAgICAgIGNvcHlEaXJTeW5jKGl0ZW0uc3JjLCBpdGVtLmRlc3QpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb3B5RmlsZVN5bmMoaXRlbS5zcmMsIGl0ZW0uZGVzdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIOWGmeWFpSBzZXR0aW5ncy5qc1xuICAgIGF3YWl0IHdyaXRlU2V0dGluZ0ZpbGUoc2ltdWxhdG9yUmVzb3VyY2VzKTtcblxuICAgIC8vIOWGmeWFpeWIneWni+WcuuaZr+aVsOaNrlxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBnZW5lcmF0ZVByZXZpZXdEYXRhKCk7XG4gICAgbGV0IHByZXZpZXdTY2VuZUpzb25QYXRoID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdwcmV2aWV3LXNjZW5lLmpzb24nKTtcbiAgICBwcmV2aWV3U2NlbmVKc29uUGF0aCA9IGZvcm1hdFBhdGgocHJldmlld1NjZW5lSnNvblBhdGgpO1xuICAgIGF3YWl0IHdyaXRlRmlsZShwcmV2aWV3U2NlbmVKc29uUGF0aCwgZGF0YS5wcmV2aWV3U2NlbmVKc29uLCAndXRmOCcpO1xuXG4gICAgLy8g55Sf5oiQIG1haW4uanNcbiAgICBjb25zdCBwcmV2aWV3UG9ydCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NlcnZlcicsICdxdWVyeS1wb3J0Jyk7XG4gICAgY29uc3QgcHJldmlld0lwID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgncHJldmlldycsICdnZXQtcHJldmlldy1pcCcpO1xuICAgIGNvbnN0IG1haW5Kc1NvdXJjZSA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9tYWluLmVqcycpLCB7XG4gICAgICAgIGxpYnJhcnlQYXRoOiBmb3JtYXRQYXRoKGpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ2xpYnJhcnknKSksXG4gICAgICAgIHdhaXRGb3JDb25uZWN0OiBwcmVmZXJlbmNlLndhaXRGb3JDb25uZWN0LFxuICAgICAgICBwcm9qZWN0UGF0aDogZm9ybWF0UGF0aChFZGl0b3IuUHJvamVjdC5wYXRoKSxcbiAgICAgICAgcHJldmlld0lwLFxuICAgICAgICBwcmV2aWV3UG9ydCxcbiAgICAgICAgcGFja0ltcG9ydE1hcFVSTDogJy9zY3JpcHRpbmcveC9pbXBvcnQtbWFwLmpzb24nLFxuICAgICAgICBwYWNrUmVzb2x1dGlvbkRldGFpbE1hcFVSTDogJy9zY3JpcHRpbmcveC9yZXNvbHV0aW9uLWRldGFpbC1tYXAuanNvbicsXG4gICAgfSk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnbWFpbi5qcycpLCBtYWluSnNTb3VyY2UsICd1dGY4Jyk7XG5cbiAgICAvLyDnlJ/miJAgYXBwbGljYXRpb24uanNcbiAgICBjb25zdCBpbmNsdWRlTW9kdWxlcyA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldFByb2plY3QoJ2VuZ2luZScsICdtb2R1bGVzLmluY2x1ZGVNb2R1bGVzJyk7XG4gICAgY29uc3QgaGFzUGh5c2ljc0FtbW8gPSBpbmNsdWRlTW9kdWxlcy5pbmNsdWRlcygncGh5c2ljcy1hbW1vJyk7XG4gICAgY29uc3QgcHJvamVjdERhdGEgPSBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRQcm9qZWN0KCdwcm9qZWN0JywgJ2dlbmVyYWwuZGVzaWduUmVzb2x1dGlvbicpO1xuICAgIGxldCByZXNvbHV0aW9uUG9saWN5OiBSZXNvbHV0aW9uUG9saWN5O1xuICAgIGlmIChwcm9qZWN0RGF0YS5maXRXaWR0aCAmJiBwcm9qZWN0RGF0YS5maXRIZWlnaHQpIHtcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuUmVzb2x1dGlvblNob3dBbGw7XG4gICAgfVxuICAgIGVsc2UgaWYgKHByb2plY3REYXRhLmZpdFdpZHRoICYmICFwcm9qZWN0RGF0YS5maXRIZWlnaHQpIHtcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuUmVzb2x1dGlvbkZpeGVkV2lkdGg7XG4gICAgfVxuICAgIGVsc2UgaWYgKCFwcm9qZWN0RGF0YS5maXRXaWR0aCAmJiBwcm9qZWN0RGF0YS5maXRIZWlnaHQpIHtcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuUmVzb2x1dGlvbkZpeGVkSGVpZ2h0O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuUmVzb2x1dGlvbk5vQm9yZGVyO1xuICAgIH1cbiAgICBjb25zdCBkZXNpZ25SZXNvbHV0aW9uID0ge1xuICAgICAgICB3aWR0aDogcHJvamVjdERhdGEud2lkdGgsXG4gICAgICAgIGhlaWdodDogcHJvamVjdERhdGEuaGVpZ2h0LFxuICAgICAgICByZXNvbHV0aW9uUG9saWN5LFxuICAgIH07XG4gICAgY29uc3QgYXBwSnNTb3VyY2UgPSBhd2FpdCBFanMucmVuZGVyRmlsZShqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3IvYXBwbGljYXRpb24uZWpzJyksIHtcbiAgICAgICAgaGFzUGh5c2ljc0FtbW8sXG4gICAgICAgIHByZXZpZXdTY2VuZUpzb25QYXRoLFxuICAgICAgICBsaWJyYXJ5UGF0aDogZm9ybWF0UGF0aChqb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsICdsaWJyYXJ5JykpLFxuICAgICAgICBwcm9qZWN0UGF0aDogZm9ybWF0UGF0aChFZGl0b3IuUHJvamVjdC5wYXRoKSxcbiAgICAgICAgZGVzaWduUmVzb2x1dGlvbixcbiAgICAgICAgcHJldmlld0lwLFxuICAgICAgICBwcmV2aWV3UG9ydCxcbiAgICB9KTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvYXBwbGljYXRpb24uanMnKSwgYXBwSnNTb3VyY2UsICd1dGY4Jyk7XG5cbiAgICAvLyDmoLnmja7lgY/lpb3orr7nva7vvIzmm7TmlrDmqKHmi5/lmajphY3nva7mlofku7ZcbiAgICBhd2FpdCBnZW5lcmF0ZVNpbXVsYXRvckNvbmZpZygpO1xuXG4gICAgLy8g6L+Q6KGM5qih5ouf5ZmoXG4gICAgLy8gZW52aXJvbm1lbnRcbiAgICAvLyBUT0RPOiDliJ3lp4vljJbnjq/looPlj5jph49cbiAgICAvLyBlbnYgPSB7XG4gICAgLy8gICAgIENPQ09TX0ZSQU1FV09SS1M6IFBhdGguam9pbihjb2Nvc1Jvb3QsICcuLi8nKSxcbiAgICAvLyAgICAgQ09DT1NfWF9ST09UOiBjb2Nvc1Jvb3QsXG4gICAgLy8gICAgIENPQ09TX0NPTlNPTEVfUk9PVDogY29jb3NDb25zb2xlUm9vdCxcbiAgICAvLyAgICAgTkRLX1JPT1Q6IG5ka1Jvb3QsXG4gICAgLy8gICAgIEFORFJPSURfU0RLX1JPT1Q6IGFuZHJvaWRTREtSb290XG4gICAgLy8gfTtcblxuICAgIC8vIC8vIGZvcm1hdCBlbnZpcm9ubWVudCBzdHJpbmdcbiAgICAvLyBlbnZTdHIgPSAnJztcbiAgICAvLyBmb3IgKGxldCBrIGluIGVudikge1xuICAgIC8vICAgICBpZiAoZW52U3RyICE9PSAnJykge1xuICAgIC8vICAgICAgICAgZW52U3RyICs9ICc7JztcbiAgICAvLyAgICAgfVxuXG4gICAgLy8gICAgIGVudlN0ciArPSBgJHtrfT0ke2VudltrXX1gO1xuICAgIC8vIH1cbiAgICAvLyBsZXQgYXJncyA9IFsnLXdvcmtkaXInLCBzaW11bGF0b3JSZXNvdXJjZXMsICctd3JpdGFibGUtcGF0aCcsIHNpbXVsYXRvclJlc291cmNlcywgJy1jb25zb2xlJywgJ2ZhbHNlJywgJy0tZW52JywgZW52U3RyXTtcbiAgICBjb25zdCBhcmdzID0gWyctd29ya2RpcicsIHNpbXVsYXRvclJlc291cmNlcywgJy13cml0YWJsZS1wYXRoJywgc2ltdWxhdG9yUmVzb3VyY2VzLCAnLWNvbnNvbGUnLCAnZmFsc2UnXTtcbiAgICBzaW11bGF0b3JQcm9jZXNzID0gc3Bhd24oZXhlY3V0YWJsZVNpbXVsYXRvciwgYXJncyk7XG5cbiAgICAvLyDmiZPlvIDmqKHmi5/lmajosIPor5XlmahcbiAgICBpZiAocHJlZmVyZW5jZS5zaG93RGVidWdQYW5lbCkge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5QYW5lbC5vcGVuKCdwcmV2aWV3LmRlYnVnZ2VyJyk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgIH1cblxuICAgIC8vIOebkeWQrOaooeaLn+WZqOi/m+eoi+eahOi+k+WHulxuICAgIHNpbXVsYXRvclByb2Nlc3Mub24oJ2Nsb3NlJywgKCkgPT4ge1xuICAgICAgICBFZGl0b3IuUGFuZWwuY2xvc2UoJ3ByZXZpZXcuZGVidWdnZXInKTtcbiAgICB9KTtcbiAgICBzaW11bGF0b3JQcm9jZXNzLnN0ZG91dD8ub24oJ2RhdGEnLCBkYXRhID0+IHtcbiAgICAgICAgaWYgKGZpcnN0TWV0cmljcyAmJiBvbkNvbXBsZXRlZCkge1xuICAgICAgICAgICAgZmlyc3RNZXRyaWNzID0gZmFsc2U7XG4gICAgICAgICAgICBvbkNvbXBsZXRlZCgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEudG9TdHJpbmcgPyBkYXRhLnRvU3RyaW5nKCkgOiBkYXRhKTtcbiAgICB9KTtcbiAgICBzaW11bGF0b3JQcm9jZXNzLnN0ZGVycj8ub24oJ2RhdGEnLCBkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihkYXRhLnRvU3RyaW5nID8gZGF0YS50b1N0cmluZygpIDogZGF0YSk7XG4gICAgfSk7XG4gICAgc2ltdWxhdG9yUHJvY2Vzcy5vbignZXJyb3InLCBkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihkYXRhLnRvU3RyaW5nID8gZGF0YS50b1N0cmluZygpIDogZGF0YSk7XG4gICAgfSk7XG59XG4iXX0=