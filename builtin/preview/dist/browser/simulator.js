"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeSettingFile = writeSettingFile;
exports.generateBundleIndex = generateBundleIndex;
exports.runSimulator = runSimulator;
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
        data.settings.assets.server = (await preview_manager_1.browserPreviewManager.queryPreviewUrl()) + '/simulator/';
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
        await (0, fs_extra_1.writeFile)((0, path_1.join)(bundleDir, 'index.js'), await generateBundleIndex(config.name), 'utf8');
    }
}
async function generateBundleIndex(bundleName) {
    const bundleEntry = [];
    if (bundleName === 'main') {
        bundleEntry.push('cce:/internal/x/prerequisite-imports');
    }
    return await ejs_1.default.renderFile((0, path_1.join)(__dirname, '../../static/simulator/bundleIndex.ejs'), {
        bundleName,
        bundleEntry,
    });
}
let firstMetrics = false;
async function runSimulator(onCompleted) {
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
    const ccEnvOptions = {
        mode: 'PREVIEW',
        platform: 'NATIVE',
        flags: {
            DEBUG: true,
        },
    };
    const ccEnvConstants = statsQuery.constantManager.genCCEnvConstants(ccEnvOptions);
    const features = (await Editor.Message.request('engine', 'query-engine-modules-profile', '', ccEnvOptions))?.includeModules || [];
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
    simulatorProcess.stdout?.on('data', data => {
        if (firstMetrics && onCompleted) {
            firstMetrics = false;
            onCompleted();
        }
        console.log(data.toString ? data.toString() : data);
    });
    simulatorProcess.stderr?.on('data', data => {
        console.error(data.toString ? data.toString() : data);
    });
    simulatorProcess.on('error', data => {
        console.error(data.toString ? data.toString() : data);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltdWxhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2Jyb3dzZXIvc2ltdWxhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBZ0VBLDRDQWtCQztBQUVELGtEQVNDO0FBR0Qsb0NBbU5DO0FBblRELCtCQUFxQztBQUNyQyw4Q0FBc0I7QUFDdEIsdUNBQXNHO0FBQ3RHLGlEQUFvRDtBQUNwRCwwREFBaUM7QUFDakMsa0dBQTZGO0FBQzdGLDRDQUF5RDtBQUN6RCx1REFBbUo7QUFDbkosdURBQTBEO0FBQzFELHlEQUE0RDtBQUU1RCxJQUFLLGdCQU1KO0FBTkQsV0FBSyxnQkFBZ0I7SUFDakIsbUZBQWtCLENBQUE7SUFDbEIsbUZBQWtCLENBQUE7SUFDbEIsaUZBQWlCLENBQUE7SUFDakIseUZBQXFCLENBQUE7SUFDckIsdUZBQW9CLENBQUE7QUFDeEIsQ0FBQyxFQU5JLGdCQUFnQixLQUFoQixnQkFBZ0IsUUFNcEI7QUFDRCxJQUFJLGdCQUFxQyxDQUFDLENBQUMsZ0JBQWdCO0FBRTNELFNBQVMsb0JBQW9CO0lBQ3pCLElBQUksZ0JBQWdCLElBQUksT0FBTyxnQkFBZ0IsQ0FBQyxHQUFHLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDL0QsSUFBQSxtQkFBUSxFQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9CLGdCQUFnQixHQUFHLElBQUksQ0FBQztJQUM1QixDQUFDO0FBQ0wsQ0FBQztBQUVELEtBQUssVUFBVSxtQkFBbUI7SUFDOUIsMEJBQTBCO0lBQzFCLE1BQU0sSUFBSSxHQUFHLE1BQU0seUNBQXNCLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLENBQUM7SUFFekUsSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1FBQzNCLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRUQsT0FBTztJ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SyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDMUQsQ0FBQyxDQUFDLENBQUM7SUFDSCxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFO1FBQ2hDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxRCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkaXJuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgRWpzIGZyb20gJ2Vqcyc7XG5pbXBvcnQgeyB3cml0ZUZpbGUsIGNvcHlGaWxlU3luYywgZW5zdXJlRGlyU3luYywgZW1wdHlEaXIsIHJlYWRGaWxlLCBwYXRoRXhpc3RzU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IENoaWxkUHJvY2Vzcywgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCB0cmVlS2lsbCBmcm9tICd0cmVlLWtpbGwnO1xuaW1wb3J0IHsgQnVpbHRpbk1vZHVsZVByb3ZpZGVyIH0gZnJvbSAnQGVkaXRvci9saWItcHJvZ3JhbW1pbmcvZGlzdC9idWlsdGluLW1vZHVsZS1wcm92aWRlcic7XG5pbXBvcnQgeyBidWlsZEVuZ2luZSwgU3RhdHNRdWVyeSB9IGZyb20gJ0Bjb2Nvcy9jY2J1aWxkJztcbmltcG9ydCB7IGNvcHlEaXJTeW5jLCBmb3JtYXRQYXRoLCBnZW5lcmF0ZVNpbXVsYXRvckNvbmZpZywgZ2V0SnNFbmdpbmVQYXRoLCBnZXROYXRpdmVFbmdpbmVQYXRoLCBnZXRTaW11bGF0b3JQcmVmZXJlbmNlIH0gZnJvbSAnLi9zaW11bGF0b3ItdXRpbHMnO1xuaW1wb3J0IHsgYnJvd3NlclByZXZpZXdNYW5hZ2VyIH0gZnJvbSAnLi9wcmV2aWV3LW1hbmFnZXInO1xuaW1wb3J0IHsgcHJldmlld1NldHRpbmdzTWFuYWdlciB9IGZyb20gJy4vcHJldmlldy1zZXR0aW5ncyc7XG5cbmVudW0gUmVzb2x1dGlvblBvbGljeSB7XG4gICAgUmVzb2x1dGlvbkV4YWN0Rml0LFxuICAgIFJlc29sdXRpb25Ob0JvcmRlcixcbiAgICBSZXNvbHV0aW9uU2hvd0FsbCxcbiAgICBSZXNvbHV0aW9uRml4ZWRIZWlnaHQsXG4gICAgUmVzb2x1dGlvbkZpeGVkV2lkdGgsXG59XG5sZXQgc2ltdWxhdG9yUHJvY2VzczogQ2hpbGRQcm9jZXNzIHwgbnVsbDsgLy8g5qCH6K+G5qih5ouf5Zmo6aKE6KeI6L+b56iL5piv5ZCm5a2Y5ZyoXG5cbmZ1bmN0aW9uIHN0b3BTaW11bGF0b3JQcm9jZXNzKCkge1xuICAgIGlmIChzaW11bGF0b3JQcm9jZXNzICYmIHR5cGVvZiBzaW11bGF0b3JQcm9jZXNzLnBpZCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgdHJlZUtpbGwoc2ltdWxhdG9yUHJvY2Vzcy5waWQpO1xuICAgICAgICBzaW11bGF0b3JQcm9jZXNzID0gbnVsbDtcbiAgICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlUHJldmlld0RhdGEoKSB7XG4gICAgLy8g5qih5ouf5Zmo6aKE6KeI5LiN6ZyA6KaBIGxhdW5jaFNjZW5lIOaVsOaNrlxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBwcmV2aWV3U2V0dGluZ3NNYW5hZ2VyLnF1ZXJ5U2V0dGluZ3NEYXRhKCdzaW11bGF0b3InKTtcblxuICAgIGlmICghKGRhdGEgJiYgZGF0YS5zZXR0aW5ncykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfmnoTlu7ogc2V0dGluZ3Mg5Ye66ZSZJyk7XG4gICAgfVxuXG4gICAgLy8g5ZCv5Yqo5Zy65pmvXG4gICAgbGV0IHByZXZpZXdTY2VuZUpzb246IHN0cmluZztcbiAgICBjb25zdCBwcmV2aWV3U2NlbmUgPSBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRDb25maWcoJ3ByZXZpZXcnLCAnZ2VuZXJhbC5zdGFydF9zY2VuZScpO1xuICAgIGlmIChwcmV2aWV3U2NlbmUgPT09ICdjdXJyZW50X3NjZW5lJykge1xuICAgICAgICBwcmV2aWV3U2NlbmVKc29uID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktc2NlbmUtanNvbicpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29uc3QgcHJldmlld1NjZW5lUGF0aCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXBhdGgnLCBwcmV2aWV3U2NlbmUpIGFzIHN0cmluZztcbiAgICAgICAgcHJldmlld1NjZW5lSnNvbiA9IGF3YWl0IHJlYWRGaWxlKHByZXZpZXdTY2VuZVBhdGgsICd1dGY4Jyk7XG4gICAgfVxuICAgIC8vIOaooeaLn+WZqOmihOiniOS4jeaYvuekuuaPkuWxj++8jOWKoOW/q+WQr+WKqOmAn+W6plxuICAgIGRhdGEuc2V0dGluZ3Muc3BsYXNoU2NyZWVuIS50b3RhbFRpbWUgPSAwO1xuICAgIGNvbnN0IGdsb2JhbEludGVybmFsTGlicmFyeSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWdsb2JhbC1pbnRlcm5hbC1saWJyYXJ5Jyk7XG4gICAgaWYgKGdsb2JhbEludGVybmFsTGlicmFyeSkge1xuICAgICAgICAvLyDnlLHkuo7ljp/nlJ/mqKHmi5/lmajpooTop4jliqDovb3mlofku7bpu5jorqTotbDnmoTmlofku7bns7vnu5/vvIzkvJrlr7zoh7TlvZPmlbDmja7lupPpu5jorqTlr7zlhaXlnLDlnYDkuI3mlL7lnKggbGlicmFyeSDlhoXml7bkvJrmnInpl67popjjgIJcbiAgICAgICAgLy8gMy44LjUg5pSv5oyB5LqG5YaF572u6LWE5rqQ5a+85YWl5Yiw5YWo5bGA55uu5b2V77yM5omA5Lul5q2k5aSE5Yip55So6L+c56iLIGJ1bmRsZSDnmoTmnLrliLbvvIxcbiAgICAgICAgLy8g5bCG5omA5pyJIGJ1bmRsZSDorr7nva7kuLogcmVtb3RlIGJ1bmRsZe+8jOWGjemAmui/h+mihOiniOacjeWKoeWZqOaLv+WIsOato+ehrueahOi1hOa6kOS/oeaBr1xuICAgICAgICAvLyBUT0RPIOatpOaWueW8j+S8muWvvOiHtCBidW5kbGUg6ISa5pys55qE5YaF5a655Y+Y5Li65rWP6KeI5Zmo6aKE6KeI55qE5qC85byP54mI5pys77yM55Sx5LqO6aKE6KeI6Zi25q616YO95piv56m66ISa5pys77yM5pqC5pyq5Y+R546w6Zeu6aKYXG4gICAgICAgIGRhdGEuc2V0dGluZ3MuYXNzZXRzLnNlcnZlciA9IChhd2FpdCBicm93c2VyUHJldmlld01hbmFnZXIucXVlcnlQcmV2aWV3VXJsKCkpICsgJy9zaW11bGF0b3IvJztcbiAgICAgICAgZGF0YS5zZXR0aW5ncy5hc3NldHMucmVtb3RlQnVuZGxlcyA9IGRhdGEuc2V0dGluZ3MuYXNzZXRzLnByb2plY3RCdW5kbGVzO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHByZXZpZXdTY2VuZUpzb24sXG4gICAgICAgIHNldHRpbmdzOiBkYXRhLnNldHRpbmdzLFxuICAgICAgICBidW5kbGVDb25maWdzOiBkYXRhLmJ1bmRsZUNvbmZpZ3MsXG4gICAgfTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyaXRlU2V0dGluZ0ZpbGUoZHN0RGlyOiBzdHJpbmcpe1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBnZW5lcmF0ZVByZXZpZXdEYXRhKCk7XG4gICAgZW5zdXJlRGlyU3luYyhqb2luKGRzdERpciwgJ3NyYycpKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihkc3REaXIsICdzcmMvc2V0dGluZ3MuanNvbicpLCBKU09OLnN0cmluZ2lmeShkYXRhLnNldHRpbmdzLCB1bmRlZmluZWQsIDIpKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEuYnVuZGxlQ29uZmlncy5sZW5ndGg7ICsraSkge1xuICAgICAgICBjb25zdCBjb25maWcgPSBkYXRhLmJ1bmRsZUNvbmZpZ3NbaV07XG4gICAgICAgIGNvbnN0IGJ1bmRsZURpciA9IGpvaW4oZHN0RGlyLCAnYXNzZXRzJywgY29uZmlnLm5hbWUpO1xuICAgICAgICBlbnN1cmVEaXJTeW5jKGJ1bmRsZURpcik7XG4gICAgICAgIC8vIOWIoOmZpCBpbXBvcnRCYXNlIOWSjCBuYXRpdmVCYXNl77yM5L2/55SoIGdlbmVyYWxCYXNlXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZGVsZXRlIGNvbmZpZy5pbXBvcnRCYXNlO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGRlbGV0ZSBjb25maWcubmF0aXZlQmFzZTtcbiAgICAgICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oYnVuZGxlRGlyLCAnY2MuY29uZmlnLmpzb24nKSwgSlNPTi5zdHJpbmdpZnkoY29uZmlnLCB1bmRlZmluZWQsIDIpKTtcbiAgICAgICAgLy8gVE9ETzog55uu5YmN55qE5a6e546w6LefIHdlYiDpooTop4jkuIDmoLfvvIzkuIDmrKHmgKfliqDovb3miYDmnInohJrmnKxcblxuICAgICAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihidW5kbGVEaXIsICdpbmRleC5qcycpLCBhd2FpdCBnZW5lcmF0ZUJ1bmRsZUluZGV4KGNvbmZpZy5uYW1lKSwgJ3V0ZjgnKTtcbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZUJ1bmRsZUluZGV4KGJ1bmRsZU5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IGJ1bmRsZUVudHJ5ID0gW107XG4gICAgaWYgKGJ1bmRsZU5hbWUgPT09ICdtYWluJykge1xuICAgICAgICBidW5kbGVFbnRyeS5wdXNoKCdjY2U6L2ludGVybmFsL3gvcHJlcmVxdWlzaXRlLWltcG9ydHMnKTtcbiAgICB9XG4gICAgcmV0dXJuIGF3YWl0IEVqcy5yZW5kZXJGaWxlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9idW5kbGVJbmRleC5lanMnKSwge1xuICAgICAgICBidW5kbGVOYW1lLFxuICAgICAgICBidW5kbGVFbnRyeSxcbiAgICB9KTtcbn1cblxubGV0IGZpcnN0TWV0cmljcyA9IGZhbHNlO1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1blNpbXVsYXRvcihvbkNvbXBsZXRlZD86ICgpID0+IHZvaWQpIHtcbiAgICBmaXJzdE1ldHJpY3MgPSB0cnVlO1xuICAgIC8vIOWFs+mXreaooeaLn+WZqFxuICAgIHN0b3BTaW11bGF0b3JQcm9jZXNzKCk7XG5cbiAgICAvLyDojrflj5bmqKHmi5/lmajlgY/lpb3orr7nva5cbiAgICBjb25zdCBwcmVmZXJlbmNlID0gYXdhaXQgZ2V0U2ltdWxhdG9yUHJlZmVyZW5jZSgpO1xuXG4gICAgLy8g6Lev5b6E5aSE55CGXG4gICAgY29uc3QgaXNEYXJ3aW4gPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJztcbiAgICBjb25zdCBqc0VuZ2luZVBhdGggPSBhd2FpdCBnZXRKc0VuZ2luZVBhdGgoKTtcbiAgICBjb25zdCBuYXRpdmVFbmdpbmVQYXRoID0gYXdhaXQgZ2V0TmF0aXZlRW5naW5lUGF0aCgpO1xuICAgIGNvbnN0IHNpbXVsYXRvclJvb3QgPSBqb2luKG5hdGl2ZUVuZ2luZVBhdGgsIGlzRGFyd2luID8gJ3NpbXVsYXRvci9SZWxlYXNlL1NpbXVsYXRvckFwcC1NYWMuYXBwJyA6ICdzaW11bGF0b3IvUmVsZWFzZScpO1xuICAgIGNvbnN0IHNpbXVsYXRvclJlc291cmNlcyA9IGlzRGFyd2luID8gam9pbihzaW11bGF0b3JSb290LCAnQ29udGVudHMvUmVzb3VyY2VzJykgOiBzaW11bGF0b3JSb290O1xuICAgIGNvbnN0IGV4ZWN1dGFibGVTaW11bGF0b3IgPSBpc0RhcndpbiA/IGpvaW4oc2ltdWxhdG9yUm9vdCwgJ0NvbnRlbnRzL01hY09TL1NpbXVsYXRvckFwcC1NYWMnKSA6IGpvaW4oc2ltdWxhdG9yUm9vdCwgJ1NpbXVsYXRvckFwcC1XaW4zMi5leGUnKTtcblxuICAgIGVuc3VyZURpclN5bmMoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdqc2ItYWRhcHRlcicpKTtcbiAgICBlbnN1cmVEaXJTeW5jKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2NvY29zLWpzJykpO1xuICAgIC8vIOa4heepuue8k+WtmFxuICAgIGF3YWl0IGVtcHR5RGlyKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnYXNzZXRzJykpO1xuICAgIGNvbnN0IGF1dG9DbGVhbkNhY2hlID0gYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0Q29uZmlnKCdwcmV2aWV3JywgJ3ByZXZpZXcuYXV0b19jbGVhbl9jYWNoZScpO1xuICAgIGlmIChhdXRvQ2xlYW5DYWNoZSkge1xuICAgICAgICBhd2FpdCBlbXB0eURpcihqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2dhbWVjYWNoZXMnKSk7XG4gICAgfVxuXG4gICAgLy8g5qC55o2u5YGP5aW96K6+572u55qE5qih5Z2X6YWN572u77yM55Sf5oiQIGNjLmpzIOWIsCBzdGF0aWMvc2ltdWxhdG9yL2NvY29zLWpzIOebruW9lVxuICAgIC8vIFRPRE86IOS9v+eUqCBRVUlDS19DT01QSUxFIOe8luivkSBlbmdpbmVcbiAgICBjb25zdCBjY01vZHVsZUZpbGUgPSBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9jb2Nvcy1qcy9jYy5qcycpO1xuICAgIGNvbnN0IGNjZUNvZGVRdWFsaXR5RmlsZSA9IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2J1aWx0aW4vY2NlLmNvZGUtcXVhbGl0eS5jci5qcycpO1xuICAgIGNvbnN0IGNjZUVudkZpbGUgPSBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9idWlsdGluL2NjZS5lbnYuanMnKTtcbiAgICBlbnN1cmVEaXJTeW5jKGRpcm5hbWUoY2NNb2R1bGVGaWxlKSk7XG4gICAgZW5zdXJlRGlyU3luYyhkaXJuYW1lKGNjZUNvZGVRdWFsaXR5RmlsZSkpO1xuICAgIGNvbnN0IHN0YXRzUXVlcnkgPSBhd2FpdCBTdGF0c1F1ZXJ5LmNyZWF0ZShqc0VuZ2luZVBhdGgpO1xuICAgIGNvbnN0IGNjRW52T3B0aW9uczogU3RhdHNRdWVyeS5Db25zdGFudE1hbmFnZXIuQ29uc3RhbnRPcHRpb25zID0ge1xuICAgICAgICBtb2RlOiAnUFJFVklFVycsXG4gICAgICAgIHBsYXRmb3JtOiAnTkFUSVZFJyxcbiAgICAgICAgZmxhZ3M6IHtcbiAgICAgICAgICAgIERFQlVHOiB0cnVlLFxuICAgICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgY2NFbnZDb25zdGFudHMgPSBzdGF0c1F1ZXJ5LmNvbnN0YW50TWFuYWdlci5nZW5DQ0VudkNvbnN0YW50cyhjY0Vudk9wdGlvbnMpO1xuICAgIGNvbnN0IGZlYXR1cmVzID0gKGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2VuZ2luZScsICdxdWVyeS1lbmdpbmUtbW9kdWxlcy1wcm9maWxlJywgJycsIGNjRW52T3B0aW9ucykpPy5pbmNsdWRlTW9kdWxlcyB8fCBbXTtcbiAgICBjb25zdCBmZWF0dXJlVW5pdHMgPSBzdGF0c1F1ZXJ5LmdldFVuaXRzT2ZGZWF0dXJlcyhmZWF0dXJlcyk7XG4gICAgY29uc3QgeyBjb2RlOiBpbmRleE1vZCB9ID0gYXdhaXQgYnVpbGRFbmdpbmUudHJhbnNmb3JtKHN0YXRzUXVlcnkuZXZhbHVhdGVJbmRleE1vZHVsZVNvdXJjZShcbiAgICAgICAgZmVhdHVyZVVuaXRzLFxuICAgICAgICAobW9kdWxlTmFtZSkgPT4gbW9kdWxlTmFtZSwgLy8g5ZKMIHF1aWNrIGNvbXBpbGVyIOe7meeahOWJjee8gOS4gOiHtCxcbiAgICApLCAnc3lzdGVtJyk7XG4gICAgY29uc3QgYnVpbHRpbk1vZHVsZVByb3ZpZGVyID0gYXdhaXQgQnVpbHRpbk1vZHVsZVByb3ZpZGVyLmNyZWF0ZSh7IGZvcm1hdDogJ3N5c3RlbWpzJyB9KTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgIC8vIFRPRE86IOenu+mZpCBidWlsdGluTW9kdWxlUHJvdmlkZXIg5L6d6LWWXG4gICAgICAgIGJ1aWx0aW5Nb2R1bGVQcm92aWRlci5hZGRCdWlsZFRpbWVDb25zdGFudHNNb2QoY2NFbnZDb25zdGFudHMgYXMgYW55KSxcbiAgICBdKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoY2NNb2R1bGVGaWxlLCBpbmRleE1vZCwgJ3V0ZjgnKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoY2NlRW52RmlsZSwgYnVpbHRpbk1vZHVsZVByb3ZpZGVyLm1vZHVsZXNbJ2NjL2VudiddLCAndXRmOCcpO1xuXG4gICAgLy8g5ou36LSd5paH5Lu2XG4gICAgY29uc3QgdG9Db3B5ID0gW1xuICAgICAgICAvLyDmi7fotJ0ganNiLWFkYXB0ZXJcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKGpzRW5naW5lUGF0aCwgJ2Jpbi9hZGFwdGVyL25hdGl2ZS93ZWItYWRhcHRlci5qcycpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdqc2ItYWRhcHRlci93ZWItYWRhcHRlci5qcycpLFxuICAgICAgICAgICAgaXNEaXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oanNFbmdpbmVQYXRoLCAnYmluL2FkYXB0ZXIvbmF0aXZlL2VuZ2luZS1hZGFwdGVyLmpzJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2pzYi1hZGFwdGVyL2VuZ2luZS1hZGFwdGVyLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOaLt+i0nSBlbmdpbmUsIGltcG9ydC1tYXAuanNvblxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oanNFbmdpbmVQYXRoLCAnYmluL25hdGl2ZS1wcmV2aWV3JyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9jb2Nvcy1qcycpLFxuICAgICAgICAgICAgaXNEaXI6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL2ltcG9ydC1tYXAuanNvbicpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvaW1wb3J0LW1hcC5qc29uJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL3N5c3RlbS5idW5kbGUuanMnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL3N5c3RlbS5idW5kbGUuanMnKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3IvcG9seWZpbGxzLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvcG9seWZpbGxzLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgaXNEaXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oRWRpdG9yLlByb2plY3QudG1wRGlyLCAnYXNzZXQtZGIvZWZmZWN0L2VmZmVjdC5iaW4nKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2VmZmVjdC5iaW4nKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICBdO1xuICAgIHRvQ29weS5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICBpZiAocGF0aEV4aXN0c1N5bmMoaXRlbS5zcmMpKSB7XG4gICAgICAgICAgICBpZiAoaXRlbS5pc0Rpcikge1xuICAgICAgICAgICAgICAgIGNvcHlEaXJTeW5jKGl0ZW0uc3JjLCBpdGVtLmRlc3QpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb3B5RmlsZVN5bmMoaXRlbS5zcmMsIGl0ZW0uZGVzdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIOWGmeWFpSBzZXR0aW5ncy5qc1xuICAgIGF3YWl0IHdyaXRlU2V0dGluZ0ZpbGUoc2ltdWxhdG9yUmVzb3VyY2VzKTtcblxuICAgIC8vIOWGmeWFpeWIneWni+WcuuaZr+aVsOaNrlxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBnZW5lcmF0ZVByZXZpZXdEYXRhKCk7XG4gICAgbGV0IHByZXZpZXdTY2VuZUpzb25QYXRoID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdwcmV2aWV3LXNjZW5lLmpzb24nKTtcbiAgICBwcmV2aWV3U2NlbmVKc29uUGF0aCA9IGZvcm1hdFBhdGgocHJldmlld1NjZW5lSnNvblBhdGgpO1xuICAgIGF3YWl0IHdyaXRlRmlsZShwcmV2aWV3U2NlbmVKc29uUGF0aCwgZGF0YS5wcmV2aWV3U2NlbmVKc29uLCAndXRmOCcpO1xuXG4gICAgLy8g55Sf5oiQIG1haW4uanNcbiAgICBjb25zdCBwcmV2aWV3UG9ydCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NlcnZlcicsICdxdWVyeS1wb3J0Jyk7XG4gICAgY29uc3QgcHJldmlld0lwID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgncHJldmlldycsICdnZXQtcHJldmlldy1pcCcpO1xuICAgIGNvbnN0IG1haW5Kc1NvdXJjZSA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9tYWluLmVqcycpLCB7XG4gICAgICAgIGxpYnJhcnlQYXRoOiBmb3JtYXRQYXRoKGpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ2xpYnJhcnknKSksXG4gICAgICAgIHdhaXRGb3JDb25uZWN0OiBwcmVmZXJlbmNlLndhaXRGb3JDb25uZWN0LFxuICAgICAgICBwcm9qZWN0UGF0aDogZm9ybWF0UGF0aChFZGl0b3IuUHJvamVjdC5wYXRoKSxcbiAgICAgICAgcHJldmlld0lwLFxuICAgICAgICBwcmV2aWV3UG9ydCxcbiAgICAgICAgcGFja0ltcG9ydE1hcFVSTDogJy9zY3JpcHRpbmcveC9pbXBvcnQtbWFwLmpzb24nLFxuICAgICAgICBwYWNrUmVzb2x1dGlvbkRldGFpbE1hcFVSTDogJy9zY3JpcHRpbmcveC9yZXNvbHV0aW9uLWRldGFpbC1tYXAuanNvbicsXG4gICAgfSk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnbWFpbi5qcycpLCBtYWluSnNTb3VyY2UsICd1dGY4Jyk7XG5cbiAgICAvLyDnlJ/miJAgYXBwbGljYXRpb24uanNcbiAgICBjb25zdCBoYXNQaHlzaWNzQW1tbyA9IGZlYXR1cmVzLmluY2x1ZGVzKCdwaHlzaWNzLWFtbW8nKTtcbiAgICBjb25zdCBwcm9qZWN0RGF0YSA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldFByb2plY3QoJ3Byb2plY3QnLCAnZ2VuZXJhbC5kZXNpZ25SZXNvbHV0aW9uJyk7XG4gICAgbGV0IHJlc29sdXRpb25Qb2xpY3k6IFJlc29sdXRpb25Qb2xpY3k7XG4gICAgaWYgKHByb2plY3REYXRhLmZpdFdpZHRoICYmIHByb2plY3REYXRhLmZpdEhlaWdodCkge1xuICAgICAgICByZXNvbHV0aW9uUG9saWN5ID0gUmVzb2x1dGlvblBvbGljeS5SZXNvbHV0aW9uU2hvd0FsbDtcbiAgICB9XG4gICAgZWxzZSBpZiAocHJvamVjdERhdGEuZml0V2lkdGggJiYgIXByb2plY3REYXRhLmZpdEhlaWdodCkge1xuICAgICAgICByZXNvbHV0aW9uUG9saWN5ID0gUmVzb2x1dGlvblBvbGljeS5SZXNvbHV0aW9uRml4ZWRXaWR0aDtcbiAgICB9XG4gICAgZWxzZSBpZiAoIXByb2plY3REYXRhLmZpdFdpZHRoICYmIHByb2plY3REYXRhLmZpdEhlaWdodCkge1xuICAgICAgICByZXNvbHV0aW9uUG9saWN5ID0gUmVzb2x1dGlvblBvbGljeS5SZXNvbHV0aW9uRml4ZWRIZWlnaHQ7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXNvbHV0aW9uUG9saWN5ID0gUmVzb2x1dGlvblBvbGljeS5SZXNvbHV0aW9uTm9Cb3JkZXI7XG4gICAgfVxuICAgIGNvbnN0IGRlc2lnblJlc29sdXRpb24gPSB7XG4gICAgICAgIHdpZHRoOiBwcm9qZWN0RGF0YS53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiBwcm9qZWN0RGF0YS5oZWlnaHQsXG4gICAgICAgIHJlc29sdXRpb25Qb2xpY3ksXG4gICAgfTtcbiAgICBjb25zdCBhcHBKc1NvdXJjZSA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9hcHBsaWNhdGlvbi5lanMnKSwge1xuICAgICAgICBoYXNQaHlzaWNzQW1tbyxcbiAgICAgICAgcHJldmlld1NjZW5lSnNvblBhdGgsXG4gICAgICAgIGxpYnJhcnlQYXRoOiBmb3JtYXRQYXRoKGpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ2xpYnJhcnknKSksXG4gICAgICAgIHByb2plY3RQYXRoOiBmb3JtYXRQYXRoKEVkaXRvci5Qcm9qZWN0LnBhdGgpLFxuICAgICAgICBkZXNpZ25SZXNvbHV0aW9uLFxuICAgICAgICBwcmV2aWV3SXAsXG4gICAgICAgIHByZXZpZXdQb3J0LFxuICAgIH0pO1xuICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9hcHBsaWNhdGlvbi5qcycpLCBhcHBKc1NvdXJjZSwgJ3V0ZjgnKTtcblxuICAgIC8vIOagueaNruWBj+Wlveiuvue9ru+8jOabtOaWsOaooeaLn+WZqOmFjee9ruaWh+S7tlxuICAgIGF3YWl0IGdlbmVyYXRlU2ltdWxhdG9yQ29uZmlnKCk7XG5cbiAgICAvLyDov5DooYzmqKHmi5/lmahcbiAgICAvLyBlbnZpcm9ubWVudFxuICAgIC8vIFRPRE86IOWIneWni+WMlueOr+Wig+WPmOmHj1xuICAgIC8vIGVudiA9IHtcbiAgICAvLyAgICAgQ09DT1NfRlJBTUVXT1JLUzogUGF0aC5qb2luKGNvY29zUm9vdCwgJy4uLycpLFxuICAgIC8vICAgICBDT0NPU19YX1JPT1Q6IGNvY29zUm9vdCxcbiAgICAvLyAgICAgQ09DT1NfQ09OU09MRV9ST09UOiBjb2Nvc0NvbnNvbGVSb290LFxuICAgIC8vICAgICBOREtfUk9PVDogbmRrUm9vdCxcbiAgICAvLyAgICAgQU5EUk9JRF9TREtfUk9PVDogYW5kcm9pZFNES1Jvb3RcbiAgICAvLyB9O1xuXG4gICAgLy8gLy8gZm9ybWF0IGVudmlyb25tZW50IHN0cmluZ1xuICAgIC8vIGVudlN0ciA9ICcnO1xuICAgIC8vIGZvciAobGV0IGsgaW4gZW52KSB7XG4gICAgLy8gICAgIGlmIChlbnZTdHIgIT09ICcnKSB7XG4gICAgLy8gICAgICAgICBlbnZTdHIgKz0gJzsnO1xuICAgIC8vICAgICB9XG5cbiAgICAvLyAgICAgZW52U3RyICs9IGAke2t9PSR7ZW52W2tdfWA7XG4gICAgLy8gfVxuICAgIC8vIGxldCBhcmdzID0gWyctd29ya2RpcicsIHNpbXVsYXRvclJlc291cmNlcywgJy13cml0YWJsZS1wYXRoJywgc2ltdWxhdG9yUmVzb3VyY2VzLCAnLWNvbnNvbGUnLCAnZmFsc2UnLCAnLS1lbnYnLCBlbnZTdHJdO1xuICAgIGNvbnN0IGFyZ3MgPSBbJy13b3JrZGlyJywgc2ltdWxhdG9yUmVzb3VyY2VzLCAnLXdyaXRhYmxlLXBhdGgnLCBzaW11bGF0b3JSZXNvdXJjZXMsICctY29uc29sZScsICdmYWxzZSddO1xuICAgIHNpbXVsYXRvclByb2Nlc3MgPSBzcGF3bihleGVjdXRhYmxlU2ltdWxhdG9yLCBhcmdzKTtcblxuICAgIC8vIOaJk+W8gOaooeaLn+WZqOiwg+ivleWZqFxuICAgIGlmIChwcmVmZXJlbmNlLnNob3dEZWJ1Z1BhbmVsKSB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLlBhbmVsLm9wZW4oJ3ByZXZpZXcuZGVidWdnZXInKTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfVxuXG4gICAgLy8g55uR5ZCs5qih5ouf5Zmo6L+b56iL55qE6L6T5Ye6XG4gICAgc2ltdWxhdG9yUHJvY2Vzcy5vbignY2xvc2UnLCAoKSA9PiB7XG4gICAgICAgIEVkaXRvci5QYW5lbC5jbG9zZSgncHJldmlldy5kZWJ1Z2dlcicpO1xuICAgIH0pO1xuICAgIHNpbXVsYXRvclByb2Nlc3Muc3Rkb3V0Py5vbignZGF0YScsIGRhdGEgPT4ge1xuICAgICAgICBpZiAoZmlyc3RNZXRyaWNzICYmIG9uQ29tcGxldGVkKSB7XG4gICAgICAgICAgICBmaXJzdE1ldHJpY3MgPSBmYWxzZTtcbiAgICAgICAgICAgIG9uQ29tcGxldGVkKCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coZGF0YS50b1N0cmluZyA/IGRhdGEudG9TdHJpbmcoKSA6IGRhdGEpO1xuICAgIH0pO1xuICAgIHNpbXVsYXRvclByb2Nlc3Muc3RkZXJyPy5vbignZGF0YScsIGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGRhdGEudG9TdHJpbmcgPyBkYXRhLnRvU3RyaW5nKCkgOiBkYXRhKTtcbiAgICB9KTtcbiAgICBzaW11bGF0b3JQcm9jZXNzLm9uKCdlcnJvcicsIGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGRhdGEudG9TdHJpbmcgPyBkYXRhLnRvU3RyaW5nKCkgOiBkYXRhKTtcbiAgICB9KTtcbn1cbiJdfQ==