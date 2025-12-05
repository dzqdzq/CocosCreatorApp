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
    if (simulatorProcess) {
        (0, tree_kill_1.default)(simulatorProcess.pid);
        simulatorProcess = null;
    }
}
async function generatePreviewData() {
    // 模拟器预览不需要 launchScene 数据
    const data = await Editor.Message.request('preview', 'generate-settings', {
        type: 'simulator',
        platform: 'windows',
    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltdWxhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2Jyb3dzZXIvc2ltdWxhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLCtCQUFxQztBQUNyQyw4Q0FBc0I7QUFDdEIsdUNBQXNHO0FBQ3RHLGlEQUFvRDtBQUNwRCwwREFBaUM7QUFDakMsa0dBQTZGO0FBQzdGLDRDQUF5RDtBQUN6RCx1REFBbUo7QUFFbkosSUFBSyxnQkFNSjtBQU5ELFdBQUssZ0JBQWdCO0lBQ2pCLG1GQUFrQixDQUFBO0lBQ2xCLG1GQUFrQixDQUFBO0lBQ2xCLGlGQUFpQixDQUFBO0lBQ2pCLHlGQUFxQixDQUFBO0lBQ3JCLHVGQUFvQixDQUFBO0FBQ3hCLENBQUMsRUFOSSxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBTXBCO0FBQ0QsSUFBSSxnQkFBcUMsQ0FBQyxDQUFDLGdCQUFnQjtBQUUzRCxTQUFTLG9CQUFvQjtJQUN6QixJQUFJLGdCQUFnQixFQUFFO1FBQ2xCLElBQUEsbUJBQVEsRUFBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMvQixnQkFBZ0IsR0FBRyxJQUFJLENBQUM7S0FDM0I7QUFDTCxDQUFDO0FBRUQsS0FBSyxVQUFVLG1CQUFtQjtJQUM5QiwwQkFBMEI7SUFDMUIsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsbUJBQW1CLEVBQUU7UUFDdEUsSUFBSSxFQUFFLFdBQVc7UUFDakIsUUFBUSxFQUFFLFNBQVM7S0FDdEIsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7S0FDckM7SUFFRCxPQUFPO0lBQ1AsSUFBSSxnQkFBd0IsQ0FBQztJQUM3QixNQUFNLFlBQVksR0FBRyxNQUFNLE1B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QUM7SUFDSCxNQUFBLGdCQUFnQixDQUFDLE1BQU0sMENBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRTtRQUN2QyxJQUFJLFlBQVksSUFBSSxXQUFXLEVBQUU7WUFDN0IsWUFBWSxHQUFHLEtBQUssQ0FBQztZQUNyQixXQUFXLEVBQUUsQ0FBQztTQUNqQjtRQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4RCxDQUFDLENBQUMsQ0FBQztJQUNILE1BQUEsZ0JBQWdCLENBQUMsTUFBTSwwQ0FBRSxFQUFFLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxFQUFFO1FBQ3ZDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxRCxDQUFDLENBQUMsQ0FBQztJQUNILGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEVBQUU7UUFDaEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzFELENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQXBORCxvQ0FvTkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkaXJuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgRWpzIGZyb20gJ2Vqcyc7XG5pbXBvcnQgeyB3cml0ZUZpbGUsIGNvcHlGaWxlU3luYywgZW5zdXJlRGlyU3luYywgZW1wdHlEaXIsIHJlYWRGaWxlLCBwYXRoRXhpc3RzU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IENoaWxkUHJvY2Vzcywgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCB0cmVlS2lsbCBmcm9tICd0cmVlLWtpbGwnO1xuaW1wb3J0IHsgQnVpbHRpbk1vZHVsZVByb3ZpZGVyIH0gZnJvbSAnQGVkaXRvci9saWItcHJvZ3JhbW1pbmcvZGlzdC9idWlsdGluLW1vZHVsZS1wcm92aWRlcic7XG5pbXBvcnQgeyBidWlsZEVuZ2luZSwgU3RhdHNRdWVyeSB9IGZyb20gJ0Bjb2Nvcy9jY2J1aWxkJztcbmltcG9ydCB7IGNvcHlEaXJTeW5jLCBmb3JtYXRQYXRoLCBnZW5lcmF0ZVNpbXVsYXRvckNvbmZpZywgZ2V0SnNFbmdpbmVQYXRoLCBnZXROYXRpdmVFbmdpbmVQYXRoLCBnZXRTaW11bGF0b3JQcmVmZXJlbmNlIH0gZnJvbSAnLi9zaW11bGF0b3ItdXRpbHMnO1xuXG5lbnVtIFJlc29sdXRpb25Qb2xpY3kge1xuICAgIFJlc29sdXRpb25FeGFjdEZpdCxcbiAgICBSZXNvbHV0aW9uTm9Cb3JkZXIsXG4gICAgUmVzb2x1dGlvblNob3dBbGwsXG4gICAgUmVzb2x1dGlvbkZpeGVkSGVpZ2h0LFxuICAgIFJlc29sdXRpb25GaXhlZFdpZHRoLFxufVxubGV0IHNpbXVsYXRvclByb2Nlc3M6IENoaWxkUHJvY2VzcyB8IG51bGw7IC8vIOagh+ivhuaooeaLn+WZqOmihOiniOi/m+eoi+aYr+WQpuWtmOWcqFxuXG5mdW5jdGlvbiBzdG9wU2ltdWxhdG9yUHJvY2VzcygpIHtcbiAgICBpZiAoc2ltdWxhdG9yUHJvY2Vzcykge1xuICAgICAgICB0cmVlS2lsbChzaW11bGF0b3JQcm9jZXNzLnBpZCk7XG4gICAgICAgIHNpbXVsYXRvclByb2Nlc3MgPSBudWxsO1xuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVQcmV2aWV3RGF0YSgpIHtcbiAgICAvLyDmqKHmi5/lmajpooTop4jkuI3pnIDopoEgbGF1bmNoU2NlbmUg5pWw5o2uXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3ByZXZpZXcnLCAnZ2VuZXJhdGUtc2V0dGluZ3MnLCB7XG4gICAgICAgIHR5cGU6ICdzaW11bGF0b3InLFxuICAgICAgICBwbGF0Zm9ybTogJ3dpbmRvd3MnLFxuICAgIH0pO1xuXG4gICAgaWYgKCEoZGF0YSAmJiBkYXRhLnNldHRpbmdzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+aehOW7uiBzZXR0aW5ncyDlh7rplJknKTtcbiAgICB9XG5cbiAgICAvLyDlkK/liqjlnLrmma9cbiAgICBsZXQgcHJldmlld1NjZW5lSnNvbjogc3RyaW5nO1xuICAgIGNvbnN0IHByZXZpZXdTY2VuZSA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldENvbmZpZygncHJldmlldycsICdnZW5lcmFsLnN0YXJ0X3NjZW5lJyk7XG4gICAgaWYgKHByZXZpZXdTY2VuZSA9PT0gJ2N1cnJlbnRfc2NlbmUnKSB7XG4gICAgICAgIHByZXZpZXdTY2VuZUpzb24gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1zY2VuZS1qc29uJyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zdCBwcmV2aWV3U2NlbmVQYXRoID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktcGF0aCcsIHByZXZpZXdTY2VuZSkgYXMgc3RyaW5nO1xuICAgICAgICBwcmV2aWV3U2NlbmVKc29uID0gYXdhaXQgcmVhZEZpbGUocHJldmlld1NjZW5lUGF0aCwgJ3V0ZjgnKTtcbiAgICB9XG4gICAgLy8g5qih5ouf5Zmo6aKE6KeI5LiN5pi+56S65o+S5bGP77yM5Yqg5b+r5ZCv5Yqo6YCf5bqmXG4gICAgZGF0YS5zZXR0aW5ncy5zcGxhc2hTY3JlZW4udG90YWxUaW1lID0gMDtcbiAgICByZXR1cm4ge1xuICAgICAgICBwcmV2aWV3U2NlbmVKc29uLFxuICAgICAgICBzZXR0aW5nczogZGF0YS5zZXR0aW5ncyxcbiAgICAgICAgYnVuZGxlQ29uZmlnczogZGF0YS5idW5kbGVDb25maWdzLFxuICAgIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3cml0ZVNldHRpbmdGaWxlKGRzdERpcjogc3RyaW5nKXtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZ2VuZXJhdGVQcmV2aWV3RGF0YSgpO1xuICAgIGVuc3VyZURpclN5bmMoam9pbihkc3REaXIsICdzcmMnKSk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oZHN0RGlyLCAnc3JjL3NldHRpbmdzLmpzb24nKSwgSlNPTi5zdHJpbmdpZnkoZGF0YS5zZXR0aW5ncywgdW5kZWZpbmVkLCAyKSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmJ1bmRsZUNvbmZpZ3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gZGF0YS5idW5kbGVDb25maWdzW2ldO1xuICAgICAgICBjb25zdCBidW5kbGVEaXIgPSBqb2luKGRzdERpciwgJ2Fzc2V0cycsIGNvbmZpZy5uYW1lKTtcbiAgICAgICAgZW5zdXJlRGlyU3luYyhidW5kbGVEaXIpO1xuICAgICAgICAvLyDliKDpmaQgaW1wb3J0QmFzZSDlkowgbmF0aXZlQmFzZe+8jOS9v+eUqCBnZW5lcmFsQmFzZVxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGRlbGV0ZSBjb25maWcuaW1wb3J0QmFzZTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBkZWxldGUgY29uZmlnLm5hdGl2ZUJhc2U7XG4gICAgICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKGJ1bmRsZURpciwgJ2NjLmNvbmZpZy5qc29uJyksIEpTT04uc3RyaW5naWZ5KGNvbmZpZywgdW5kZWZpbmVkLCAyKSk7XG4gICAgICAgIC8vIFRPRE86IOebruWJjeeahOWunueOsOi3nyB3ZWIg6aKE6KeI5LiA5qC377yM5LiA5qyh5oCn5Yqg6L295omA5pyJ6ISa5pysXG4gICAgICAgIGNvbnN0IGJ1bmRsZUVudHJ5ID0gW107XG4gICAgICAgIGlmIChjb25maWcubmFtZSA9PT0gJ21haW4nKSB7XG4gICAgICAgICAgICBidW5kbGVFbnRyeS5wdXNoKCdjY2U6L2ludGVybmFsL3gvcHJlcmVxdWlzaXRlLWltcG9ydHMnKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBidW5kbGVJbmRleEpzU291cmNlID0gYXdhaXQgRWpzLnJlbmRlckZpbGUoam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL2J1bmRsZUluZGV4LmVqcycpLCB7XG4gICAgICAgICAgICBidW5kbGVOYW1lOiBjb25maWcubmFtZSxcbiAgICAgICAgICAgIGJ1bmRsZUVudHJ5LFxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oYnVuZGxlRGlyLCAnaW5kZXguanMnKSwgYnVuZGxlSW5kZXhKc1NvdXJjZSwgJ3V0ZjgnKTtcbiAgICB9XG59XG5cbmxldCBmaXJzdE1ldHJpY3MgPSBmYWxzZTtcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5TaW11bGF0b3Iob25Db21wbGV0ZWQ/OiAoKSA9PiB2b2lkKSB7XG4gICAgZmlyc3RNZXRyaWNzID0gdHJ1ZTtcbiAgICAvLyDlhbPpl63mqKHmi5/lmahcbiAgICBzdG9wU2ltdWxhdG9yUHJvY2VzcygpO1xuXG4gICAgLy8g6I635Y+W5qih5ouf5Zmo5YGP5aW96K6+572uXG4gICAgY29uc3QgcHJlZmVyZW5jZSA9IGF3YWl0IGdldFNpbXVsYXRvclByZWZlcmVuY2UoKTtcblxuICAgIC8vIOi3r+W+hOWkhOeQhlxuICAgIGNvbnN0IGlzRGFyd2luID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2Rhcndpbic7XG4gICAgY29uc3QganNFbmdpbmVQYXRoID0gYXdhaXQgZ2V0SnNFbmdpbmVQYXRoKCk7XG4gICAgY29uc3QgbmF0aXZlRW5naW5lUGF0aCA9IGF3YWl0IGdldE5hdGl2ZUVuZ2luZVBhdGgoKTtcbiAgICBjb25zdCBzaW11bGF0b3JSb290ID0gam9pbihuYXRpdmVFbmdpbmVQYXRoLCBpc0RhcndpbiA/ICdzaW11bGF0b3IvUmVsZWFzZS9TaW11bGF0b3JBcHAtTWFjLmFwcCcgOiAnc2ltdWxhdG9yL1JlbGVhc2UnKTtcbiAgICBjb25zdCBzaW11bGF0b3JSZXNvdXJjZXMgPSBpc0RhcndpbiA/IGpvaW4oc2ltdWxhdG9yUm9vdCwgJ0NvbnRlbnRzL1Jlc291cmNlcycpIDogc2ltdWxhdG9yUm9vdDtcbiAgICBjb25zdCBleGVjdXRhYmxlU2ltdWxhdG9yID0gaXNEYXJ3aW4gPyBqb2luKHNpbXVsYXRvclJvb3QsICdDb250ZW50cy9NYWNPUy9TaW11bGF0b3JBcHAtTWFjJykgOiBqb2luKHNpbXVsYXRvclJvb3QsICdTaW11bGF0b3JBcHAtV2luMzIuZXhlJyk7XG5cbiAgICBlbnN1cmVEaXJTeW5jKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnanNiLWFkYXB0ZXInKSk7XG4gICAgZW5zdXJlRGlyU3luYyhqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9jb2Nvcy1qcycpKTtcbiAgICAvLyDmuIXnqbrnvJPlrZhcbiAgICBhd2FpdCBlbXB0eURpcihqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2Fzc2V0cycpKTtcbiAgICBjb25zdCBhdXRvQ2xlYW5DYWNoZSA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldENvbmZpZygncHJldmlldycsICdwcmV2aWV3LmF1dG9fY2xlYW5fY2FjaGUnKTtcbiAgICBpZiAoYXV0b0NsZWFuQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgZW1wdHlEaXIoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdnYW1lY2FjaGVzJykpO1xuICAgIH1cblxuICAgIC8vIOagueaNruWBj+Wlveiuvue9rueahOaooeWdl+mFjee9ru+8jOeUn+aIkCBjYy5qcyDliLAgc3RhdGljL3NpbXVsYXRvci9jb2Nvcy1qcyDnm67lvZVcbiAgICAvLyBUT0RPOiDkvb/nlKggUVVJQ0tfQ09NUElMRSDnvJbor5EgZW5naW5lXG4gICAgY29uc3QgY2NNb2R1bGVGaWxlID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvY29jb3MtanMvY2MuanMnKTtcbiAgICBjb25zdCBjY2VDb2RlUXVhbGl0eUZpbGUgPSBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9idWlsdGluL2NjZS5jb2RlLXF1YWxpdHkuY3IuanMnKTtcbiAgICBjb25zdCBjY2VFbnZGaWxlID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvYnVpbHRpbi9jY2UuZW52LmpzJyk7XG4gICAgZW5zdXJlRGlyU3luYyhkaXJuYW1lKGNjTW9kdWxlRmlsZSkpO1xuICAgIGVuc3VyZURpclN5bmMoZGlybmFtZShjY2VDb2RlUXVhbGl0eUZpbGUpKTtcbiAgICBjb25zdCBzdGF0c1F1ZXJ5ID0gYXdhaXQgU3RhdHNRdWVyeS5jcmVhdGUoanNFbmdpbmVQYXRoKTtcbiAgICBjb25zdCBjY0VudkNvbnN0YW50cyA9IHN0YXRzUXVlcnkuY29uc3RhbnRNYW5hZ2VyLmdlbkNDRW52Q29uc3RhbnRzKHtcbiAgICAgICAgbW9kZTogJ1BSRVZJRVcnLFxuICAgICAgICBwbGF0Zm9ybTogJ05BVElWRScsXG4gICAgICAgIGZsYWdzOiB7XG4gICAgICAgICAgICBERUJVRzogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGZlYXR1cmVzID0gKGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldFByb2plY3QoJ2VuZ2luZScsICdtb2R1bGVzLmluY2x1ZGVNb2R1bGVzJykpIHx8IFtdO1xuICAgIGNvbnN0IGZlYXR1cmVVbml0cyA9IHN0YXRzUXVlcnkuZ2V0VW5pdHNPZkZlYXR1cmVzKGZlYXR1cmVzKTtcbiAgICBjb25zdCB7IGNvZGU6IGluZGV4TW9kIH0gPSBhd2FpdCBidWlsZEVuZ2luZS50cmFuc2Zvcm0oc3RhdHNRdWVyeS5ldmFsdWF0ZUluZGV4TW9kdWxlU291cmNlKFxuICAgICAgICBmZWF0dXJlVW5pdHMsXG4gICAgICAgIChtb2R1bGVOYW1lKSA9PiBtb2R1bGVOYW1lLCAvLyDlkowgcXVpY2sgY29tcGlsZXIg57uZ55qE5YmN57yA5LiA6Ie0LFxuICAgICksICdzeXN0ZW0nKTtcbiAgICBjb25zdCBidWlsdGluTW9kdWxlUHJvdmlkZXIgPSBhd2FpdCBCdWlsdGluTW9kdWxlUHJvdmlkZXIuY3JlYXRlKHsgZm9ybWF0OiAnc3lzdGVtanMnIH0pO1xuICAgIGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgLy8gVE9ETzog56e76ZmkIGJ1aWx0aW5Nb2R1bGVQcm92aWRlciDkvp3otZZcbiAgICAgICAgYnVpbHRpbk1vZHVsZVByb3ZpZGVyLmFkZEJ1aWxkVGltZUNvbnN0YW50c01vZChjY0VudkNvbnN0YW50cyBhcyBhbnkpLFxuICAgIF0pO1xuICAgIGF3YWl0IHdyaXRlRmlsZShjY01vZHVsZUZpbGUsIGluZGV4TW9kLCAndXRmOCcpO1xuICAgIGF3YWl0IHdyaXRlRmlsZShjY2VFbnZGaWxlLCBidWlsdGluTW9kdWxlUHJvdmlkZXIubW9kdWxlc1snY2MvZW52J10sICd1dGY4Jyk7XG5cbiAgICAvLyDmi7fotJ3mlofku7ZcbiAgICBjb25zdCB0b0NvcHkgPSBbXG4gICAgICAgIC8vIOaLt+i0nSBqc2ItYWRhcHRlclxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oanNFbmdpbmVQYXRoLCAnYmluL2FkYXB0ZXIvbmF0aXZlL3dlYi1hZGFwdGVyLmpzJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2pzYi1hZGFwdGVyL3dlYi1hZGFwdGVyLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihqc0VuZ2luZVBhdGgsICdiaW4vYWRhcHRlci9uYXRpdmUvZW5naW5lLWFkYXB0ZXIuanMnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnanNiLWFkYXB0ZXIvZW5naW5lLWFkYXB0ZXIuanMnKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgLy8g5ou36LSdIGVuZ2luZSwgaW1wb3J0LW1hcC5qc29uXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihqc0VuZ2luZVBhdGgsICdiaW4vbmF0aXZlLXByZXZpZXcnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2NvY29zLWpzJyksXG4gICAgICAgICAgICBpc0RpcjogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3IvaW1wb3J0LW1hcC5qc29uJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9pbXBvcnQtbWFwLmpzb24nKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3Ivc3lzdGVtLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvc3lzdGVtLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgaXNEaXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9wb2x5ZmlsbHMuYnVuZGxlLmpzJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9wb2x5ZmlsbHMuYnVuZGxlLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihFZGl0b3IuUHJvamVjdC50bXBEaXIsICdhc3NldC1kYi9lZmZlY3QvZWZmZWN0LmJpbicpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvZWZmZWN0LmJpbicpLFxuICAgICAgICAgICAgaXNEaXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgIF07XG4gICAgdG9Db3B5LmZvckVhY2goaXRlbSA9PiB7XG4gICAgICAgIGlmIChwYXRoRXhpc3RzU3luYyhpdGVtLnNyYykpIHtcbiAgICAgICAgICAgIGlmIChpdGVtLmlzRGlyKSB7XG4gICAgICAgICAgICAgICAgY29weURpclN5bmMoaXRlbS5zcmMsIGl0ZW0uZGVzdCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvcHlGaWxlU3luYyhpdGVtLnNyYywgaXRlbS5kZXN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8g5YaZ5YWlIHNldHRpbmdzLmpzXG4gICAgYXdhaXQgd3JpdGVTZXR0aW5nRmlsZShzaW11bGF0b3JSZXNvdXJjZXMpO1xuXG4gICAgLy8g5YaZ5YWl5Yid5aeL5Zy65pmv5pWw5o2uXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGdlbmVyYXRlUHJldmlld0RhdGEoKTtcbiAgICBsZXQgcHJldmlld1NjZW5lSnNvblBhdGggPSBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3ByZXZpZXctc2NlbmUuanNvbicpO1xuICAgIHByZXZpZXdTY2VuZUpzb25QYXRoID0gZm9ybWF0UGF0aChwcmV2aWV3U2NlbmVKc29uUGF0aCk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKHByZXZpZXdTY2VuZUpzb25QYXRoLCBkYXRhLnByZXZpZXdTY2VuZUpzb24sICd1dGY4Jyk7XG5cbiAgICAvLyDnlJ/miJAgbWFpbi5qc1xuICAgIGNvbnN0IHByZXZpZXdQb3J0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2VydmVyJywgJ3F1ZXJ5LXBvcnQnKTtcbiAgICBjb25zdCBwcmV2aWV3SXAgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdwcmV2aWV3JywgJ2dldC1wcmV2aWV3LWlwJyk7XG4gICAgY29uc3QgbWFpbkpzU291cmNlID0gYXdhaXQgRWpzLnJlbmRlckZpbGUoam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL21haW4uZWpzJyksIHtcbiAgICAgICAgbGlicmFyeVBhdGg6IGZvcm1hdFBhdGgoam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCAnbGlicmFyeScpKSxcbiAgICAgICAgd2FpdEZvckNvbm5lY3Q6IHByZWZlcmVuY2Uud2FpdEZvckNvbm5lY3QsXG4gICAgICAgIHByb2plY3RQYXRoOiBmb3JtYXRQYXRoKEVkaXRvci5Qcm9qZWN0LnBhdGgpLFxuICAgICAgICBwcmV2aWV3SXAsXG4gICAgICAgIHByZXZpZXdQb3J0LFxuICAgICAgICBwYWNrSW1wb3J0TWFwVVJMOiAnL3NjcmlwdGluZy94L2ltcG9ydC1tYXAuanNvbicsXG4gICAgICAgIHBhY2tSZXNvbHV0aW9uRGV0YWlsTWFwVVJMOiAnL3NjcmlwdGluZy94L3Jlc29sdXRpb24tZGV0YWlsLW1hcC5qc29uJyxcbiAgICB9KTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdtYWluLmpzJyksIG1haW5Kc1NvdXJjZSwgJ3V0ZjgnKTtcblxuICAgIC8vIOeUn+aIkCBhcHBsaWNhdGlvbi5qc1xuICAgIGNvbnN0IGluY2x1ZGVNb2R1bGVzID0gYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0UHJvamVjdCgnZW5naW5lJywgJ21vZHVsZXMuaW5jbHVkZU1vZHVsZXMnKTtcbiAgICBjb25zdCBoYXNQaHlzaWNzQW1tbyA9IGluY2x1ZGVNb2R1bGVzLmluY2x1ZGVzKCdwaHlzaWNzLWFtbW8nKTtcbiAgICBjb25zdCBwcm9qZWN0RGF0YSA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldFByb2plY3QoJ3Byb2plY3QnLCAnZ2VuZXJhbC5kZXNpZ25SZXNvbHV0aW9uJyk7XG4gICAgbGV0IHJlc29sdXRpb25Qb2xpY3k6IFJlc29sdXRpb25Qb2xpY3k7XG4gICAgaWYgKHByb2plY3REYXRhLmZpdFdpZHRoICYmIHByb2plY3REYXRhLmZpdEhlaWdodCkge1xuICAgICAgICByZXNvbHV0aW9uUG9saWN5ID0gUmVzb2x1dGlvblBvbGljeS5SZXNvbHV0aW9uU2hvd0FsbDtcbiAgICB9XG4gICAgZWxzZSBpZiAocHJvamVjdERhdGEuZml0V2lkdGggJiYgIXByb2plY3REYXRhLmZpdEhlaWdodCkge1xuICAgICAgICByZXNvbHV0aW9uUG9saWN5ID0gUmVzb2x1dGlvblBvbGljeS5SZXNvbHV0aW9uRml4ZWRXaWR0aDtcbiAgICB9XG4gICAgZWxzZSBpZiAoIXByb2plY3REYXRhLmZpdFdpZHRoICYmIHByb2plY3REYXRhLmZpdEhlaWdodCkge1xuICAgICAgICByZXNvbHV0aW9uUG9saWN5ID0gUmVzb2x1dGlvblBvbGljeS5SZXNvbHV0aW9uRml4ZWRIZWlnaHQ7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXNvbHV0aW9uUG9saWN5ID0gUmVzb2x1dGlvblBvbGljeS5SZXNvbHV0aW9uTm9Cb3JkZXI7XG4gICAgfVxuICAgIGNvbnN0IGRlc2lnblJlc29sdXRpb24gPSB7XG4gICAgICAgIHdpZHRoOiBwcm9qZWN0RGF0YS53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiBwcm9qZWN0RGF0YS5oZWlnaHQsXG4gICAgICAgIHJlc29sdXRpb25Qb2xpY3ksXG4gICAgfTtcbiAgICBjb25zdCBhcHBKc1NvdXJjZSA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9hcHBsaWNhdGlvbi5lanMnKSwge1xuICAgICAgICBoYXNQaHlzaWNzQW1tbyxcbiAgICAgICAgcHJldmlld1NjZW5lSnNvblBhdGgsXG4gICAgICAgIGxpYnJhcnlQYXRoOiBmb3JtYXRQYXRoKGpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ2xpYnJhcnknKSksXG4gICAgICAgIHByb2plY3RQYXRoOiBmb3JtYXRQYXRoKEVkaXRvci5Qcm9qZWN0LnBhdGgpLFxuICAgICAgICBkZXNpZ25SZXNvbHV0aW9uLFxuICAgICAgICBwcmV2aWV3SXAsXG4gICAgICAgIHByZXZpZXdQb3J0LFxuICAgIH0pO1xuICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9hcHBsaWNhdGlvbi5qcycpLCBhcHBKc1NvdXJjZSwgJ3V0ZjgnKTtcblxuICAgIC8vIOagueaNruWBj+Wlveiuvue9ru+8jOabtOaWsOaooeaLn+WZqOmFjee9ruaWh+S7tlxuICAgIGF3YWl0IGdlbmVyYXRlU2ltdWxhdG9yQ29uZmlnKCk7XG5cbiAgICAvLyDov5DooYzmqKHmi5/lmahcbiAgICAvLyBlbnZpcm9ubWVudFxuICAgIC8vIFRPRE86IOWIneWni+WMlueOr+Wig+WPmOmHj1xuICAgIC8vIGVudiA9IHtcbiAgICAvLyAgICAgQ09DT1NfRlJBTUVXT1JLUzogUGF0aC5qb2luKGNvY29zUm9vdCwgJy4uLycpLFxuICAgIC8vICAgICBDT0NPU19YX1JPT1Q6IGNvY29zUm9vdCxcbiAgICAvLyAgICAgQ09DT1NfQ09OU09MRV9ST09UOiBjb2Nvc0NvbnNvbGVSb290LFxuICAgIC8vICAgICBOREtfUk9PVDogbmRrUm9vdCxcbiAgICAvLyAgICAgQU5EUk9JRF9TREtfUk9PVDogYW5kcm9pZFNES1Jvb3RcbiAgICAvLyB9O1xuXG4gICAgLy8gLy8gZm9ybWF0IGVudmlyb25tZW50IHN0cmluZ1xuICAgIC8vIGVudlN0ciA9ICcnO1xuICAgIC8vIGZvciAobGV0IGsgaW4gZW52KSB7XG4gICAgLy8gICAgIGlmIChlbnZTdHIgIT09ICcnKSB7XG4gICAgLy8gICAgICAgICBlbnZTdHIgKz0gJzsnO1xuICAgIC8vICAgICB9XG5cbiAgICAvLyAgICAgZW52U3RyICs9IGAke2t9PSR7ZW52W2tdfWA7XG4gICAgLy8gfVxuICAgIC8vIGxldCBhcmdzID0gWyctd29ya2RpcicsIHNpbXVsYXRvclJlc291cmNlcywgJy13cml0YWJsZS1wYXRoJywgc2ltdWxhdG9yUmVzb3VyY2VzLCAnLWNvbnNvbGUnLCAnZmFsc2UnLCAnLS1lbnYnLCBlbnZTdHJdO1xuICAgIGNvbnN0IGFyZ3MgPSBbJy13b3JrZGlyJywgc2ltdWxhdG9yUmVzb3VyY2VzLCAnLXdyaXRhYmxlLXBhdGgnLCBzaW11bGF0b3JSZXNvdXJjZXMsICctY29uc29sZScsICdmYWxzZSddO1xuICAgIHNpbXVsYXRvclByb2Nlc3MgPSBzcGF3bihleGVjdXRhYmxlU2ltdWxhdG9yLCBhcmdzKTtcblxuICAgIC8vIOaJk+W8gOaooeaLn+WZqOiwg+ivleWZqFxuICAgIGlmIChwcmVmZXJlbmNlLnNob3dEZWJ1Z1BhbmVsKSB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLlBhbmVsLm9wZW4oJ3ByZXZpZXcuZGVidWdnZXInKTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfVxuXG4gICAgLy8g55uR5ZCs5qih5ouf5Zmo6L+b56iL55qE6L6T5Ye6XG4gICAgc2ltdWxhdG9yUHJvY2Vzcy5vbignY2xvc2UnLCAoKSA9PiB7XG4gICAgICAgIEVkaXRvci5QYW5lbC5jbG9zZSgncHJldmlldy5kZWJ1Z2dlcicpO1xuICAgIH0pO1xuICAgIHNpbXVsYXRvclByb2Nlc3Muc3Rkb3V0Py5vbignZGF0YScsIGRhdGEgPT4ge1xuICAgICAgICBpZiAoZmlyc3RNZXRyaWNzICYmIG9uQ29tcGxldGVkKSB7XG4gICAgICAgICAgICBmaXJzdE1ldHJpY3MgPSBmYWxzZTtcbiAgICAgICAgICAgIG9uQ29tcGxldGVkKCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coZGF0YS50b1N0cmluZyA/IGRhdGEudG9TdHJpbmcoKSA6IGRhdGEpO1xuICAgIH0pO1xuICAgIHNpbXVsYXRvclByb2Nlc3Muc3RkZXJyPy5vbignZGF0YScsIGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGRhdGEudG9TdHJpbmcgPyBkYXRhLnRvU3RyaW5nKCkgOiBkYXRhKTtcbiAgICB9KTtcbiAgICBzaW11bGF0b3JQcm9jZXNzLm9uKCdlcnJvcicsIGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGRhdGEudG9TdHJpbmcgPyBkYXRhLnRvU3RyaW5nKCkgOiBkYXRhKTtcbiAgICB9KTtcbn1cbiJdfQ==