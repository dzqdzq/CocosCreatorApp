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
    ];
    toCopy.forEach(item => {
        if (item.isDir) {
            (0, simulator_utils_1.copyDirSync)(item.src, item.dest);
        }
        else {
            (0, fs_extra_1.copyFileSync)(item.src, item.dest);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltdWxhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2Jyb3dzZXIvc2ltdWxhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLCtCQUFxQztBQUNyQyw4Q0FBc0I7QUFDdEIsdUNBQXNGO0FBQ3RGLGlEQUFvRDtBQUNwRCwwREFBaUM7QUFDakMsa0dBQTZGO0FBQzdGLDRDQUF5RDtBQUN6RCx1REFBbUo7QUFFbkosSUFBSyxnQkFNSjtBQU5ELFdBQUssZ0JBQWdCO0lBQ2pCLG1GQUFrQixDQUFBO0lBQ2xCLG1GQUFrQixDQUFBO0lBQ2xCLGlGQUFpQixDQUFBO0lBQ2pCLHlGQUFxQixDQUFBO0lBQ3JCLHVGQUFvQixDQUFBO0FBQ3hCLENBQUMsRUFOSSxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBTXBCO0FBQ0QsSUFBSSxnQkFBcUMsQ0FBQyxDQUFDLGdCQUFnQjtBQUUzRCxTQUFTLG9CQUFvQjtJQUN6QixJQUFJLGdCQUFnQixFQUFFO1FBQ2xCLElBQUEsbUJBQVEsRUFBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMvQixnQkFBZ0IsR0FBRyxJQUFJLENBQUM7S0FDM0I7QUFDTCxDQUFDO0FBRUQsS0FBSyxVQUFVLG1CQUFtQjtJQUM5QiwwQkFBMEI7SUFDMUIsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsbUJBQW1CLEVBQUU7UUFDdEUsSUFBSSxFQUFFLFdBQVc7UUFDakIsUUFBUSxFQUFFLFNBQVM7S0FDdEIsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7S0FDckM7SUFFRCxPQUFPO0lBQ1AsSUFBSSxnQkFBd0IsQ0FBQztJQUM3QixNQUFNLFlBQVksR0FBRyxNQUFNLE1B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QyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEQsQ0FBQyxDQUFDLENBQUM7SUFDSCxNQUFBLGdCQUFnQixDQUFDLE1BQU0sMENBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRTtRQUN2QyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDMUQsQ0FBQyxDQUFDLENBQUM7SUFDSCxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFO1FBQ2hDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxRCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUE5TUQsb0NBOE1DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGlybmFtZSwgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IEVqcyBmcm9tICdlanMnO1xuaW1wb3J0IHsgd3JpdGVGaWxlLCBjb3B5RmlsZVN5bmMsIGVuc3VyZURpclN5bmMsIGVtcHR5RGlyLCByZWFkRmlsZSB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IENoaWxkUHJvY2Vzcywgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCB0cmVlS2lsbCBmcm9tICd0cmVlLWtpbGwnO1xuaW1wb3J0IHsgQnVpbHRpbk1vZHVsZVByb3ZpZGVyIH0gZnJvbSAnQGVkaXRvci9saWItcHJvZ3JhbW1pbmcvZGlzdC9idWlsdGluLW1vZHVsZS1wcm92aWRlcic7XG5pbXBvcnQgeyBidWlsZEVuZ2luZSwgU3RhdHNRdWVyeSB9IGZyb20gJ0Bjb2Nvcy9jY2J1aWxkJztcbmltcG9ydCB7IGNvcHlEaXJTeW5jLCBmb3JtYXRQYXRoLCBnZW5lcmF0ZVNpbXVsYXRvckNvbmZpZywgZ2V0SnNFbmdpbmVQYXRoLCBnZXROYXRpdmVFbmdpbmVQYXRoLCBnZXRTaW11bGF0b3JQcmVmZXJlbmNlIH0gZnJvbSAnLi9zaW11bGF0b3ItdXRpbHMnO1xuXG5lbnVtIFJlc29sdXRpb25Qb2xpY3kge1xuICAgIFJlc29sdXRpb25FeGFjdEZpdCxcbiAgICBSZXNvbHV0aW9uTm9Cb3JkZXIsXG4gICAgUmVzb2x1dGlvblNob3dBbGwsXG4gICAgUmVzb2x1dGlvbkZpeGVkSGVpZ2h0LFxuICAgIFJlc29sdXRpb25GaXhlZFdpZHRoLFxufVxubGV0IHNpbXVsYXRvclByb2Nlc3M6IENoaWxkUHJvY2VzcyB8IG51bGw7IC8vIOagh+ivhuaooeaLn+WZqOmihOiniOi/m+eoi+aYr+WQpuWtmOWcqFxuXG5mdW5jdGlvbiBzdG9wU2ltdWxhdG9yUHJvY2VzcygpIHtcbiAgICBpZiAoc2ltdWxhdG9yUHJvY2Vzcykge1xuICAgICAgICB0cmVlS2lsbChzaW11bGF0b3JQcm9jZXNzLnBpZCk7XG4gICAgICAgIHNpbXVsYXRvclByb2Nlc3MgPSBudWxsO1xuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVQcmV2aWV3RGF0YSgpIHtcbiAgICAvLyDmqKHmi5/lmajpooTop4jkuI3pnIDopoEgbGF1bmNoU2NlbmUg5pWw5o2uXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3ByZXZpZXcnLCAnZ2VuZXJhdGUtc2V0dGluZ3MnLCB7XG4gICAgICAgIHR5cGU6ICdzaW11bGF0b3InLFxuICAgICAgICBwbGF0Zm9ybTogJ3dpbmRvd3MnLFxuICAgIH0pO1xuXG4gICAgaWYgKCEoZGF0YSAmJiBkYXRhLnNldHRpbmdzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+aehOW7uiBzZXR0aW5ncyDlh7rplJknKTtcbiAgICB9XG5cbiAgICAvLyDlkK/liqjlnLrmma9cbiAgICBsZXQgcHJldmlld1NjZW5lSnNvbjogc3RyaW5nO1xuICAgIGNvbnN0IHByZXZpZXdTY2VuZSA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldENvbmZpZygncHJldmlldycsICdnZW5lcmFsLnN0YXJ0X3NjZW5lJyk7XG4gICAgaWYgKHByZXZpZXdTY2VuZSA9PT0gJ2N1cnJlbnRfc2NlbmUnKSB7XG4gICAgICAgIHByZXZpZXdTY2VuZUpzb24gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1zY2VuZS1qc29uJyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zdCBwcmV2aWV3U2NlbmVQYXRoID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktcGF0aCcsIHByZXZpZXdTY2VuZSkgYXMgc3RyaW5nO1xuICAgICAgICBwcmV2aWV3U2NlbmVKc29uID0gYXdhaXQgcmVhZEZpbGUocHJldmlld1NjZW5lUGF0aCwgJ3V0ZjgnKTtcbiAgICB9XG4gICAgLy8g5qih5ouf5Zmo6aKE6KeI5LiN5pi+56S65o+S5bGP77yM5Yqg5b+r5ZCv5Yqo6YCf5bqmXG4gICAgZGF0YS5zZXR0aW5ncy5zcGxhc2hTY3JlZW4udG90YWxUaW1lID0gMDtcbiAgICByZXR1cm4ge1xuICAgICAgICBwcmV2aWV3U2NlbmVKc29uLFxuICAgICAgICBzZXR0aW5nczogZGF0YS5zZXR0aW5ncyxcbiAgICAgICAgYnVuZGxlQ29uZmlnczogZGF0YS5idW5kbGVDb25maWdzLFxuICAgIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3cml0ZVNldHRpbmdGaWxlKGRzdERpcjogc3RyaW5nKXtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZ2VuZXJhdGVQcmV2aWV3RGF0YSgpO1xuICAgIGVuc3VyZURpclN5bmMoam9pbihkc3REaXIsICdzcmMnKSk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oZHN0RGlyLCAnc3JjL3NldHRpbmdzLmpzb24nKSwgSlNPTi5zdHJpbmdpZnkoZGF0YS5zZXR0aW5ncywgdW5kZWZpbmVkLCAyKSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmJ1bmRsZUNvbmZpZ3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gZGF0YS5idW5kbGVDb25maWdzW2ldO1xuICAgICAgICBjb25zdCBidW5kbGVEaXIgPSBqb2luKGRzdERpciwgJ2Fzc2V0cycsIGNvbmZpZy5uYW1lKTtcbiAgICAgICAgZW5zdXJlRGlyU3luYyhidW5kbGVEaXIpO1xuICAgICAgICAvLyDliKDpmaQgaW1wb3J0QmFzZSDlkowgbmF0aXZlQmFzZe+8jOS9v+eUqCBnZW5lcmFsQmFzZVxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGRlbGV0ZSBjb25maWcuaW1wb3J0QmFzZTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBkZWxldGUgY29uZmlnLm5hdGl2ZUJhc2U7XG4gICAgICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKGJ1bmRsZURpciwgJ2NjLmNvbmZpZy5qc29uJyksIEpTT04uc3RyaW5naWZ5KGNvbmZpZywgdW5kZWZpbmVkLCAyKSk7XG4gICAgICAgIC8vIFRPRE86IOebruWJjeeahOWunueOsOi3nyB3ZWIg6aKE6KeI5LiA5qC377yM5LiA5qyh5oCn5Yqg6L295omA5pyJ6ISa5pysXG4gICAgICAgIGNvbnN0IGJ1bmRsZUVudHJ5ID0gW107XG4gICAgICAgIGlmIChjb25maWcubmFtZSA9PT0gJ21haW4nKSB7XG4gICAgICAgICAgICBidW5kbGVFbnRyeS5wdXNoKCdjY2U6L2ludGVybmFsL3gvcHJlcmVxdWlzaXRlLWltcG9ydHMnKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBidW5kbGVJbmRleEpzU291cmNlID0gYXdhaXQgRWpzLnJlbmRlckZpbGUoam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL2J1bmRsZUluZGV4LmVqcycpLCB7XG4gICAgICAgICAgICBidW5kbGVOYW1lOiBjb25maWcubmFtZSxcbiAgICAgICAgICAgIGJ1bmRsZUVudHJ5LFxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oYnVuZGxlRGlyLCAnaW5kZXguanMnKSwgYnVuZGxlSW5kZXhKc1NvdXJjZSwgJ3V0ZjgnKTtcbiAgICB9XG59XG5cbmxldCBmaXJzdE1ldHJpY3MgPSBmYWxzZTtcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5TaW11bGF0b3Iob25Db21wbGV0ZWQ/OiAoKSA9PiB2b2lkKSB7XG4gICAgZmlyc3RNZXRyaWNzID0gdHJ1ZTtcbiAgICAvLyDlhbPpl63mqKHmi5/lmahcbiAgICBzdG9wU2ltdWxhdG9yUHJvY2VzcygpO1xuXG4gICAgLy8g6I635Y+W5qih5ouf5Zmo5YGP5aW96K6+572uXG4gICAgY29uc3QgcHJlZmVyZW5jZSA9IGF3YWl0IGdldFNpbXVsYXRvclByZWZlcmVuY2UoKTtcblxuICAgIC8vIOi3r+W+hOWkhOeQhlxuICAgIGNvbnN0IGlzRGFyd2luID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2Rhcndpbic7XG4gICAgY29uc3QganNFbmdpbmVQYXRoID0gYXdhaXQgZ2V0SnNFbmdpbmVQYXRoKCk7XG4gICAgY29uc3QgbmF0aXZlRW5naW5lUGF0aCA9IGF3YWl0IGdldE5hdGl2ZUVuZ2luZVBhdGgoKTtcbiAgICBjb25zdCBzaW11bGF0b3JSb290ID0gam9pbihuYXRpdmVFbmdpbmVQYXRoLCBpc0RhcndpbiA/ICdzaW11bGF0b3IvUmVsZWFzZS9TaW11bGF0b3JBcHAtTWFjLmFwcCcgOiAnc2ltdWxhdG9yL1JlbGVhc2UnKTtcbiAgICBjb25zdCBzaW11bGF0b3JSZXNvdXJjZXMgPSBpc0RhcndpbiA/IGpvaW4oc2ltdWxhdG9yUm9vdCwgJ0NvbnRlbnRzL1Jlc291cmNlcycpIDogc2ltdWxhdG9yUm9vdDtcbiAgICBjb25zdCBleGVjdXRhYmxlU2ltdWxhdG9yID0gaXNEYXJ3aW4gPyBqb2luKHNpbXVsYXRvclJvb3QsICdDb250ZW50cy9NYWNPUy9TaW11bGF0b3JBcHAtTWFjJykgOiBqb2luKHNpbXVsYXRvclJvb3QsICdTaW11bGF0b3JBcHAtV2luMzIuZXhlJyk7XG5cbiAgICBlbnN1cmVEaXJTeW5jKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnanNiLWFkYXB0ZXInKSk7XG4gICAgZW5zdXJlRGlyU3luYyhqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9jb2Nvcy1qcycpKTtcbiAgICAvLyDmuIXnqbrnvJPlrZhcbiAgICBhd2FpdCBlbXB0eURpcihqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2Fzc2V0cycpKTtcbiAgICBjb25zdCBhdXRvQ2xlYW5DYWNoZSA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldENvbmZpZygncHJldmlldycsICdwcmV2aWV3LmF1dG9fY2xlYW5fY2FjaGUnKTtcbiAgICBpZiAoYXV0b0NsZWFuQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgZW1wdHlEaXIoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdnYW1lY2FjaGVzJykpO1xuICAgIH1cblxuICAgIC8vIOagueaNruWBj+Wlveiuvue9rueahOaooeWdl+mFjee9ru+8jOeUn+aIkCBjYy5qcyDliLAgc3RhdGljL3NpbXVsYXRvci9jb2Nvcy1qcyDnm67lvZVcbiAgICAvLyBUT0RPOiDkvb/nlKggUVVJQ0tfQ09NUElMRSDnvJbor5EgZW5naW5lXG4gICAgY29uc3QgY2NNb2R1bGVGaWxlID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvY29jb3MtanMvY2MuanMnKTtcbiAgICBjb25zdCBjY2VDb2RlUXVhbGl0eUZpbGUgPSBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9idWlsdGluL2NjZS5jb2RlLXF1YWxpdHkuY3IuanMnKTtcbiAgICBjb25zdCBjY2VFbnZGaWxlID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvYnVpbHRpbi9jY2UuZW52LmpzJyk7XG4gICAgZW5zdXJlRGlyU3luYyhkaXJuYW1lKGNjTW9kdWxlRmlsZSkpO1xuICAgIGVuc3VyZURpclN5bmMoZGlybmFtZShjY2VDb2RlUXVhbGl0eUZpbGUpKTtcbiAgICBjb25zdCBzdGF0c1F1ZXJ5ID0gYXdhaXQgU3RhdHNRdWVyeS5jcmVhdGUoanNFbmdpbmVQYXRoKTtcbiAgICBjb25zdCBjY0VudkNvbnN0YW50cyA9IHN0YXRzUXVlcnkuY29uc3RhbnRNYW5hZ2VyLmdlbkNDRW52Q29uc3RhbnRzKHtcbiAgICAgICAgbW9kZTogJ1BSRVZJRVcnLFxuICAgICAgICBwbGF0Zm9ybTogJ05BVElWRScsXG4gICAgICAgIGZsYWdzOiB7XG4gICAgICAgICAgICBERUJVRzogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGZlYXR1cmVzID0gKGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldFByb2plY3QoJ2VuZ2luZScsICdtb2R1bGVzLmluY2x1ZGVNb2R1bGVzJykpIHx8IFtdO1xuICAgIGNvbnN0IGZlYXR1cmVVbml0cyA9IHN0YXRzUXVlcnkuZ2V0VW5pdHNPZkZlYXR1cmVzKGZlYXR1cmVzKTtcbiAgICBjb25zdCB7IGNvZGU6IGluZGV4TW9kIH0gPSBhd2FpdCBidWlsZEVuZ2luZS50cmFuc2Zvcm0oc3RhdHNRdWVyeS5ldmFsdWF0ZUluZGV4TW9kdWxlU291cmNlKFxuICAgICAgICBmZWF0dXJlVW5pdHMsXG4gICAgICAgIChtb2R1bGVOYW1lKSA9PiBtb2R1bGVOYW1lLCAvLyDlkowgcXVpY2sgY29tcGlsZXIg57uZ55qE5YmN57yA5LiA6Ie0LFxuICAgICksICdzeXN0ZW0nKTtcbiAgICBjb25zdCBidWlsdGluTW9kdWxlUHJvdmlkZXIgPSBhd2FpdCBCdWlsdGluTW9kdWxlUHJvdmlkZXIuY3JlYXRlKHsgZm9ybWF0OiAnc3lzdGVtanMnIH0pO1xuICAgIGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgLy8gVE9ETzog56e76ZmkIGJ1aWx0aW5Nb2R1bGVQcm92aWRlciDkvp3otZZcbiAgICAgICAgYnVpbHRpbk1vZHVsZVByb3ZpZGVyLmFkZEJ1aWxkVGltZUNvbnN0YW50c01vZChjY0VudkNvbnN0YW50cyBhcyBhbnkpLFxuICAgIF0pO1xuICAgIGF3YWl0IHdyaXRlRmlsZShjY01vZHVsZUZpbGUsIGluZGV4TW9kLCAndXRmOCcpO1xuICAgIGF3YWl0IHdyaXRlRmlsZShjY2VFbnZGaWxlLCBidWlsdGluTW9kdWxlUHJvdmlkZXIubW9kdWxlc1snY2MvZW52J10sICd1dGY4Jyk7XG5cbiAgICAvLyDmi7fotJ3mlofku7ZcbiAgICBjb25zdCB0b0NvcHkgPSBbXG4gICAgICAgIC8vIOaLt+i0nSBqc2ItYWRhcHRlclxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oanNFbmdpbmVQYXRoLCAnYmluL2FkYXB0ZXIvbmF0aXZlL3dlYi1hZGFwdGVyLmpzJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2pzYi1hZGFwdGVyL3dlYi1hZGFwdGVyLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihqc0VuZ2luZVBhdGgsICdiaW4vYWRhcHRlci9uYXRpdmUvZW5naW5lLWFkYXB0ZXIuanMnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnanNiLWFkYXB0ZXIvZW5naW5lLWFkYXB0ZXIuanMnKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgLy8g5ou36LSdIGVuZ2luZSwgaW1wb3J0LW1hcC5qc29uXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihqc0VuZ2luZVBhdGgsICdiaW4vbmF0aXZlLXByZXZpZXcnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2NvY29zLWpzJyksXG4gICAgICAgICAgICBpc0RpcjogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3IvaW1wb3J0LW1hcC5qc29uJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9pbXBvcnQtbWFwLmpzb24nKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3Ivc3lzdGVtLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvc3lzdGVtLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgaXNEaXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9wb2x5ZmlsbHMuYnVuZGxlLmpzJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9wb2x5ZmlsbHMuYnVuZGxlLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgXTtcbiAgICB0b0NvcHkuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgaWYgKGl0ZW0uaXNEaXIpIHtcbiAgICAgICAgICAgIGNvcHlEaXJTeW5jKGl0ZW0uc3JjLCBpdGVtLmRlc3QpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29weUZpbGVTeW5jKGl0ZW0uc3JjLCBpdGVtLmRlc3QpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyDlhpnlhaUgc2V0dGluZ3MuanNcbiAgICBhd2FpdCB3cml0ZVNldHRpbmdGaWxlKHNpbXVsYXRvclJlc291cmNlcyk7XG5cbiAgICAvLyDlhpnlhaXliJ3lp4vlnLrmma/mlbDmja5cbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZ2VuZXJhdGVQcmV2aWV3RGF0YSgpO1xuICAgIGxldCBwcmV2aWV3U2NlbmVKc29uUGF0aCA9IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAncHJldmlldy1zY2VuZS5qc29uJyk7XG4gICAgcHJldmlld1NjZW5lSnNvblBhdGggPSBmb3JtYXRQYXRoKHByZXZpZXdTY2VuZUpzb25QYXRoKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUocHJldmlld1NjZW5lSnNvblBhdGgsIGRhdGEucHJldmlld1NjZW5lSnNvbiwgJ3V0ZjgnKTtcblxuICAgIC8vIOeUn+aIkCBtYWluLmpzXG4gICAgY29uc3QgcHJldmlld1BvcnQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzZXJ2ZXInLCAncXVlcnktcG9ydCcpO1xuICAgIGNvbnN0IHByZXZpZXdJcCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3ByZXZpZXcnLCAnZ2V0LXByZXZpZXctaXAnKTtcbiAgICBjb25zdCBtYWluSnNTb3VyY2UgPSBhd2FpdCBFanMucmVuZGVyRmlsZShqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3IvbWFpbi5lanMnKSwge1xuICAgICAgICBsaWJyYXJ5UGF0aDogZm9ybWF0UGF0aChqb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsICdsaWJyYXJ5JykpLFxuICAgICAgICB3YWl0Rm9yQ29ubmVjdDogcHJlZmVyZW5jZS53YWl0Rm9yQ29ubmVjdCxcbiAgICAgICAgcHJvamVjdFBhdGg6IGZvcm1hdFBhdGgoRWRpdG9yLlByb2plY3QucGF0aCksXG4gICAgICAgIHByZXZpZXdJcCxcbiAgICAgICAgcHJldmlld1BvcnQsXG4gICAgICAgIHBhY2tJbXBvcnRNYXBVUkw6ICcvc2NyaXB0aW5nL3gvaW1wb3J0LW1hcC5qc29uJyxcbiAgICAgICAgcGFja1Jlc29sdXRpb25EZXRhaWxNYXBVUkw6ICcvc2NyaXB0aW5nL3gvcmVzb2x1dGlvbi1kZXRhaWwtbWFwLmpzb24nLFxuICAgIH0pO1xuICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ21haW4uanMnKSwgbWFpbkpzU291cmNlLCAndXRmOCcpO1xuXG4gICAgLy8g55Sf5oiQIGFwcGxpY2F0aW9uLmpzXG4gICAgY29uc3QgaW5jbHVkZU1vZHVsZXMgPSBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRQcm9qZWN0KCdlbmdpbmUnLCAnbW9kdWxlcy5pbmNsdWRlTW9kdWxlcycpO1xuICAgIGNvbnN0IGhhc1BoeXNpY3NBbW1vID0gaW5jbHVkZU1vZHVsZXMuaW5jbHVkZXMoJ3BoeXNpY3MtYW1tbycpO1xuICAgIGNvbnN0IHByb2plY3REYXRhID0gYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0UHJvamVjdCgncHJvamVjdCcsICdnZW5lcmFsLmRlc2lnblJlc29sdXRpb24nKTtcbiAgICBsZXQgcmVzb2x1dGlvblBvbGljeTogUmVzb2x1dGlvblBvbGljeTtcbiAgICBpZiAocHJvamVjdERhdGEuZml0V2lkdGggJiYgcHJvamVjdERhdGEuZml0SGVpZ2h0KSB7XG4gICAgICAgIHJlc29sdXRpb25Qb2xpY3kgPSBSZXNvbHV0aW9uUG9saWN5LlJlc29sdXRpb25TaG93QWxsO1xuICAgIH1cbiAgICBlbHNlIGlmIChwcm9qZWN0RGF0YS5maXRXaWR0aCAmJiAhcHJvamVjdERhdGEuZml0SGVpZ2h0KSB7XG4gICAgICAgIHJlc29sdXRpb25Qb2xpY3kgPSBSZXNvbHV0aW9uUG9saWN5LlJlc29sdXRpb25GaXhlZFdpZHRoO1xuICAgIH1cbiAgICBlbHNlIGlmICghcHJvamVjdERhdGEuZml0V2lkdGggJiYgcHJvamVjdERhdGEuZml0SGVpZ2h0KSB7XG4gICAgICAgIHJlc29sdXRpb25Qb2xpY3kgPSBSZXNvbHV0aW9uUG9saWN5LlJlc29sdXRpb25GaXhlZEhlaWdodDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJlc29sdXRpb25Qb2xpY3kgPSBSZXNvbHV0aW9uUG9saWN5LlJlc29sdXRpb25Ob0JvcmRlcjtcbiAgICB9XG4gICAgY29uc3QgZGVzaWduUmVzb2x1dGlvbiA9IHtcbiAgICAgICAgd2lkdGg6IHByb2plY3REYXRhLndpZHRoLFxuICAgICAgICBoZWlnaHQ6IHByb2plY3REYXRhLmhlaWdodCxcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSxcbiAgICB9O1xuICAgIGNvbnN0IGFwcEpzU291cmNlID0gYXdhaXQgRWpzLnJlbmRlckZpbGUoam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL2FwcGxpY2F0aW9uLmVqcycpLCB7XG4gICAgICAgIGhhc1BoeXNpY3NBbW1vLFxuICAgICAgICBwcmV2aWV3U2NlbmVKc29uUGF0aCxcbiAgICAgICAgbGlicmFyeVBhdGg6IGZvcm1hdFBhdGgoam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCAnbGlicmFyeScpKSxcbiAgICAgICAgcHJvamVjdFBhdGg6IGZvcm1hdFBhdGgoRWRpdG9yLlByb2plY3QucGF0aCksXG4gICAgICAgIGRlc2lnblJlc29sdXRpb24sXG4gICAgICAgIHByZXZpZXdJcCxcbiAgICAgICAgcHJldmlld1BvcnQsXG4gICAgfSk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2FwcGxpY2F0aW9uLmpzJyksIGFwcEpzU291cmNlLCAndXRmOCcpO1xuXG4gICAgLy8g5qC55o2u5YGP5aW96K6+572u77yM5pu05paw5qih5ouf5Zmo6YWN572u5paH5Lu2XG4gICAgYXdhaXQgZ2VuZXJhdGVTaW11bGF0b3JDb25maWcoKTtcblxuICAgIC8vIOi/kOihjOaooeaLn+WZqFxuICAgIC8vIGVudmlyb25tZW50XG4gICAgLy8gVE9ETzog5Yid5aeL5YyW546v5aKD5Y+Y6YePXG4gICAgLy8gZW52ID0ge1xuICAgIC8vICAgICBDT0NPU19GUkFNRVdPUktTOiBQYXRoLmpvaW4oY29jb3NSb290LCAnLi4vJyksXG4gICAgLy8gICAgIENPQ09TX1hfUk9PVDogY29jb3NSb290LFxuICAgIC8vICAgICBDT0NPU19DT05TT0xFX1JPT1Q6IGNvY29zQ29uc29sZVJvb3QsXG4gICAgLy8gICAgIE5ES19ST09UOiBuZGtSb290LFxuICAgIC8vICAgICBBTkRST0lEX1NES19ST09UOiBhbmRyb2lkU0RLUm9vdFxuICAgIC8vIH07XG5cbiAgICAvLyAvLyBmb3JtYXQgZW52aXJvbm1lbnQgc3RyaW5nXG4gICAgLy8gZW52U3RyID0gJyc7XG4gICAgLy8gZm9yIChsZXQgayBpbiBlbnYpIHtcbiAgICAvLyAgICAgaWYgKGVudlN0ciAhPT0gJycpIHtcbiAgICAvLyAgICAgICAgIGVudlN0ciArPSAnOyc7XG4gICAgLy8gICAgIH1cblxuICAgIC8vICAgICBlbnZTdHIgKz0gYCR7a309JHtlbnZba119YDtcbiAgICAvLyB9XG4gICAgLy8gbGV0IGFyZ3MgPSBbJy13b3JrZGlyJywgc2ltdWxhdG9yUmVzb3VyY2VzLCAnLXdyaXRhYmxlLXBhdGgnLCBzaW11bGF0b3JSZXNvdXJjZXMsICctY29uc29sZScsICdmYWxzZScsICctLWVudicsIGVudlN0cl07XG4gICAgY29uc3QgYXJncyA9IFsnLXdvcmtkaXInLCBzaW11bGF0b3JSZXNvdXJjZXMsICctd3JpdGFibGUtcGF0aCcsIHNpbXVsYXRvclJlc291cmNlcywgJy1jb25zb2xlJywgJ2ZhbHNlJ107XG4gICAgc2ltdWxhdG9yUHJvY2VzcyA9IHNwYXduKGV4ZWN1dGFibGVTaW11bGF0b3IsIGFyZ3MpO1xuXG4gICAgLy8g5omT5byA5qih5ouf5Zmo6LCD6K+V5ZmoXG4gICAgaWYgKHByZWZlcmVuY2Uuc2hvd0RlYnVnUGFuZWwpIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuUGFuZWwub3BlbigncHJldmlldy5kZWJ1Z2dlcicpO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICB9XG5cbiAgICAvLyDnm5HlkKzmqKHmi5/lmajov5vnqIvnmoTovpPlh7pcbiAgICBzaW11bGF0b3JQcm9jZXNzLm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgICAgRWRpdG9yLlBhbmVsLmNsb3NlKCdwcmV2aWV3LmRlYnVnZ2VyJyk7XG4gICAgfSk7XG4gICAgc2ltdWxhdG9yUHJvY2Vzcy5zdGRvdXQ/Lm9uKCdkYXRhJywgZGF0YSA9PiB7XG4gICAgICAgIGlmIChmaXJzdE1ldHJpY3MgJiYgb25Db21wbGV0ZWQpIHtcbiAgICAgICAgICAgIGZpcnN0TWV0cmljcyA9IGZhbHNlO1xuICAgICAgICAgICAgb25Db21wbGV0ZWQoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhkYXRhLnRvU3RyaW5nID8gZGF0YS50b1N0cmluZygpIDogZGF0YSk7XG4gICAgfSk7XG4gICAgc2ltdWxhdG9yUHJvY2Vzcy5zdGRlcnI/Lm9uKCdkYXRhJywgZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZGF0YS50b1N0cmluZyA/IGRhdGEudG9TdHJpbmcoKSA6IGRhdGEpO1xuICAgIH0pO1xuICAgIHNpbXVsYXRvclByb2Nlc3Mub24oJ2Vycm9yJywgZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZGF0YS50b1N0cmluZyA/IGRhdGEudG9TdHJpbmcoKSA6IGRhdGEpO1xuICAgIH0pO1xufVxuIl19