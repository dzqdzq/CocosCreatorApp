"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const build_engine_1 = require("@cocos/build-engine");
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
async function runSimulator() {
    var _a, _b;
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
    const statsQuery = await build_engine_1.StatsQuery.create(jsEnginePath);
    const ccEnvConstants = statsQuery.constantManager.genCCEnvConstants({
        mode: 'PREVIEW',
        platform: 'NATIVE',
        flags: {
            DEBUG: true,
        },
    });
    const features = (await Editor.Profile.getProject('engine', 'modules.includeModules')) || [];
    const featureUnits = statsQuery.getUnitsOfFeatures(features);
    const { build } = await Promise.resolve().then(() => __importStar(require('@cocos/build-engine')));
    const { code: indexMod } = await build.transform(statsQuery.evaluateIndexModuleSource(featureUnits, (moduleName) => moduleName), build_engine_1.ModuleOption.system);
    const builtinModuleProvider = await builtin_module_provider_1.BuiltinModuleProvider.create({ format: 'systemjs' });
    await Promise.all([
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltdWxhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2Jyb3dzZXIvc2ltdWxhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0JBQXFDO0FBQ3JDLDhDQUFzQjtBQUN0Qix1Q0FBc0Y7QUFDdEYsaURBQW9EO0FBQ3BELDBEQUFpQztBQUNqQyxrR0FBNkY7QUFDN0Ysc0RBQStEO0FBQy9ELHVEQUFtSjtBQUVuSixJQUFLLGdCQU1KO0FBTkQsV0FBSyxnQkFBZ0I7SUFDakIsbUZBQWtCLENBQUE7SUFDbEIsbUZBQWtCLENBQUE7SUFDbEIsaUZBQWlCLENBQUE7SUFDakIseUZBQXFCLENBQUE7SUFDckIsdUZBQW9CLENBQUE7QUFDeEIsQ0FBQyxFQU5JLGdCQUFnQixLQUFoQixnQkFBZ0IsUUFNcEI7QUFDRCxJQUFJLGdCQUFxQyxDQUFDLENBQUMsZ0JBQWdCO0FBRTNELFNBQVMsb0JBQW9CO0lBQ3pCLElBQUksZ0JBQWdCLEVBQUU7UUFDbEIsSUFBQSxtQkFBUSxFQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9CLGdCQUFnQixHQUFHLElBQUksQ0FBQztLQUMzQjtBQUNMLENBQUM7QUFFRCxLQUFLLFVBQVUsbUJBQW1CO0lBQzlCLDBCQUEwQjtJQUMxQixNQUFNLElBQUksR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxtQkFBbUIsRUFBRTtRQUN0RSxJQUFJLEVBQUUsV0FBVztRQUNqQixRQUFRLEVBQUUsU0FBUztLQUN0QixDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztLQUNyQztJQUVELE9BQU87SUFDUCxJQUFJLGdCQUF3QixDQUFDO0lBQzdC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Z0IsQ0FBQyxNQUFNLDBDQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUU7UUFDdkMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzFELENBQUMsQ0FBQyxDQUFDO0lBQ0gsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsRUFBRTtRQUNoQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDMUQsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBek1ELG9DQXlNQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRpcm5hbWUsIGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCBFanMgZnJvbSAnZWpzJztcbmltcG9ydCB7IHdyaXRlRmlsZSwgY29weUZpbGVTeW5jLCBlbnN1cmVEaXJTeW5jLCBlbXB0eURpciwgcmVhZEZpbGUgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBDaGlsZFByb2Nlc3MsIHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgdHJlZUtpbGwgZnJvbSAndHJlZS1raWxsJztcbmltcG9ydCB7IEJ1aWx0aW5Nb2R1bGVQcm92aWRlciB9IGZyb20gJ0BlZGl0b3IvbGliLXByb2dyYW1taW5nL2Rpc3QvYnVpbHRpbi1tb2R1bGUtcHJvdmlkZXInO1xuaW1wb3J0IHsgU3RhdHNRdWVyeSwgTW9kdWxlT3B0aW9uIH0gZnJvbSAnQGNvY29zL2J1aWxkLWVuZ2luZSc7XG5pbXBvcnQgeyBjb3B5RGlyU3luYywgZm9ybWF0UGF0aCwgZ2VuZXJhdGVTaW11bGF0b3JDb25maWcsIGdldEpzRW5naW5lUGF0aCwgZ2V0TmF0aXZlRW5naW5lUGF0aCwgZ2V0U2ltdWxhdG9yUHJlZmVyZW5jZSB9IGZyb20gJy4vc2ltdWxhdG9yLXV0aWxzJztcblxuZW51bSBSZXNvbHV0aW9uUG9saWN5IHtcbiAgICBSZXNvbHV0aW9uRXhhY3RGaXQsXG4gICAgUmVzb2x1dGlvbk5vQm9yZGVyLFxuICAgIFJlc29sdXRpb25TaG93QWxsLFxuICAgIFJlc29sdXRpb25GaXhlZEhlaWdodCxcbiAgICBSZXNvbHV0aW9uRml4ZWRXaWR0aCxcbn1cbmxldCBzaW11bGF0b3JQcm9jZXNzOiBDaGlsZFByb2Nlc3MgfCBudWxsOyAvLyDmoIfor4bmqKHmi5/lmajpooTop4jov5vnqIvmmK/lkKblrZjlnKhcblxuZnVuY3Rpb24gc3RvcFNpbXVsYXRvclByb2Nlc3MoKSB7XG4gICAgaWYgKHNpbXVsYXRvclByb2Nlc3MpIHtcbiAgICAgICAgdHJlZUtpbGwoc2ltdWxhdG9yUHJvY2Vzcy5waWQpO1xuICAgICAgICBzaW11bGF0b3JQcm9jZXNzID0gbnVsbDtcbiAgICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlUHJldmlld0RhdGEoKSB7XG4gICAgLy8g5qih5ouf5Zmo6aKE6KeI5LiN6ZyA6KaBIGxhdW5jaFNjZW5lIOaVsOaNrlxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdwcmV2aWV3JywgJ2dlbmVyYXRlLXNldHRpbmdzJywge1xuICAgICAgICB0eXBlOiAnc2ltdWxhdG9yJyxcbiAgICAgICAgcGxhdGZvcm06ICd3aW5kb3dzJyxcbiAgICB9KTtcblxuICAgIGlmICghKGRhdGEgJiYgZGF0YS5zZXR0aW5ncykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfmnoTlu7ogc2V0dGluZ3Mg5Ye66ZSZJyk7XG4gICAgfVxuXG4gICAgLy8g5ZCv5Yqo5Zy65pmvXG4gICAgbGV0IHByZXZpZXdTY2VuZUpzb246IHN0cmluZztcbiAgICBjb25zdCBwcmV2aWV3U2NlbmUgPSBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRDb25maWcoJ3ByZXZpZXcnLCAnZ2VuZXJhbC5zdGFydF9zY2VuZScpO1xuICAgIGlmIChwcmV2aWV3U2NlbmUgPT09ICdjdXJyZW50X3NjZW5lJykge1xuICAgICAgICBwcmV2aWV3U2NlbmVKc29uID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktc2NlbmUtanNvbicpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29uc3QgcHJldmlld1NjZW5lUGF0aCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXBhdGgnLCBwcmV2aWV3U2NlbmUpIGFzIHN0cmluZztcbiAgICAgICAgcHJldmlld1NjZW5lSnNvbiA9IGF3YWl0IHJlYWRGaWxlKHByZXZpZXdTY2VuZVBhdGgsICd1dGY4Jyk7XG4gICAgfVxuICAgIC8vIOaooeaLn+WZqOmihOiniOS4jeaYvuekuuaPkuWxj++8jOWKoOW/q+WQr+WKqOmAn+W6plxuICAgIGRhdGEuc2V0dGluZ3Muc3BsYXNoU2NyZWVuLnRvdGFsVGltZSA9IDA7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcHJldmlld1NjZW5lSnNvbixcbiAgICAgICAgc2V0dGluZ3M6IGRhdGEuc2V0dGluZ3MsXG4gICAgICAgIGJ1bmRsZUNvbmZpZ3M6IGRhdGEuYnVuZGxlQ29uZmlncyxcbiAgICB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JpdGVTZXR0aW5nRmlsZShkc3REaXI6IHN0cmluZyl7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGdlbmVyYXRlUHJldmlld0RhdGEoKTtcbiAgICBlbnN1cmVEaXJTeW5jKGpvaW4oZHN0RGlyLCAnc3JjJykpO1xuICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKGRzdERpciwgJ3NyYy9zZXR0aW5ncy5qc29uJyksIEpTT04uc3RyaW5naWZ5KGRhdGEuc2V0dGluZ3MsIHVuZGVmaW5lZCwgMikpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5idW5kbGVDb25maWdzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IGRhdGEuYnVuZGxlQ29uZmlnc1tpXTtcbiAgICAgICAgY29uc3QgYnVuZGxlRGlyID0gam9pbihkc3REaXIsICdhc3NldHMnLCBjb25maWcubmFtZSk7XG4gICAgICAgIGVuc3VyZURpclN5bmMoYnVuZGxlRGlyKTtcbiAgICAgICAgLy8g5Yig6ZmkIGltcG9ydEJhc2Ug5ZKMIG5hdGl2ZUJhc2XvvIzkvb/nlKggZ2VuZXJhbEJhc2VcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBkZWxldGUgY29uZmlnLmltcG9ydEJhc2U7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZGVsZXRlIGNvbmZpZy5uYXRpdmVCYXNlO1xuICAgICAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihidW5kbGVEaXIsICdjYy5jb25maWcuanNvbicpLCBKU09OLnN0cmluZ2lmeShjb25maWcsIHVuZGVmaW5lZCwgMikpO1xuICAgICAgICAvLyBUT0RPOiDnm67liY3nmoTlrp7njrDot58gd2ViIOmihOiniOS4gOagt++8jOS4gOasoeaAp+WKoOi9veaJgOacieiEmuacrFxuICAgICAgICBjb25zdCBidW5kbGVFbnRyeSA9IFtdO1xuICAgICAgICBpZiAoY29uZmlnLm5hbWUgPT09ICdtYWluJykge1xuICAgICAgICAgICAgYnVuZGxlRW50cnkucHVzaCgnY2NlOi9pbnRlcm5hbC94L3ByZXJlcXVpc2l0ZS1pbXBvcnRzJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYnVuZGxlSW5kZXhKc1NvdXJjZSA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9idW5kbGVJbmRleC5lanMnKSwge1xuICAgICAgICAgICAgYnVuZGxlTmFtZTogY29uZmlnLm5hbWUsXG4gICAgICAgICAgICBidW5kbGVFbnRyeSxcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKGJ1bmRsZURpciwgJ2luZGV4LmpzJyksIGJ1bmRsZUluZGV4SnNTb3VyY2UsICd1dGY4Jyk7XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuU2ltdWxhdG9yKCkge1xuICAgIC8vIOWFs+mXreaooeaLn+WZqFxuICAgIHN0b3BTaW11bGF0b3JQcm9jZXNzKCk7XG5cbiAgICAvLyDojrflj5bmqKHmi5/lmajlgY/lpb3orr7nva5cbiAgICBjb25zdCBwcmVmZXJlbmNlID0gYXdhaXQgZ2V0U2ltdWxhdG9yUHJlZmVyZW5jZSgpO1xuXG4gICAgLy8g6Lev5b6E5aSE55CGXG4gICAgY29uc3QgaXNEYXJ3aW4gPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJztcbiAgICBjb25zdCBqc0VuZ2luZVBhdGggPSBhd2FpdCBnZXRKc0VuZ2luZVBhdGgoKTtcbiAgICBjb25zdCBuYXRpdmVFbmdpbmVQYXRoID0gYXdhaXQgZ2V0TmF0aXZlRW5naW5lUGF0aCgpO1xuICAgIGNvbnN0IHNpbXVsYXRvclJvb3QgPSBqb2luKG5hdGl2ZUVuZ2luZVBhdGgsIGlzRGFyd2luID8gJ3NpbXVsYXRvci9SZWxlYXNlL1NpbXVsYXRvckFwcC1NYWMuYXBwJyA6ICdzaW11bGF0b3IvUmVsZWFzZScpO1xuICAgIGNvbnN0IHNpbXVsYXRvclJlc291cmNlcyA9IGlzRGFyd2luID8gam9pbihzaW11bGF0b3JSb290LCAnQ29udGVudHMvUmVzb3VyY2VzJykgOiBzaW11bGF0b3JSb290O1xuICAgIGNvbnN0IGV4ZWN1dGFibGVTaW11bGF0b3IgPSBpc0RhcndpbiA/IGpvaW4oc2ltdWxhdG9yUm9vdCwgJ0NvbnRlbnRzL01hY09TL1NpbXVsYXRvckFwcC1NYWMnKSA6IGpvaW4oc2ltdWxhdG9yUm9vdCwgJ1NpbXVsYXRvckFwcC1XaW4zMi5leGUnKTtcblxuICAgIGVuc3VyZURpclN5bmMoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdqc2ItYWRhcHRlcicpKTtcbiAgICBlbnN1cmVEaXJTeW5jKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2NvY29zLWpzJykpO1xuICAgIC8vIOa4heepuue8k+WtmFxuICAgIGF3YWl0IGVtcHR5RGlyKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnYXNzZXRzJykpO1xuICAgIGNvbnN0IGF1dG9DbGVhbkNhY2hlID0gYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0Q29uZmlnKCdwcmV2aWV3JywgJ3ByZXZpZXcuYXV0b19jbGVhbl9jYWNoZScpO1xuICAgIGlmIChhdXRvQ2xlYW5DYWNoZSkge1xuICAgICAgICBhd2FpdCBlbXB0eURpcihqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2dhbWVjYWNoZXMnKSk7XG4gICAgfVxuXG4gICAgLy8g5qC55o2u5YGP5aW96K6+572u55qE5qih5Z2X6YWN572u77yM55Sf5oiQIGNjLmpzIOWIsCBzdGF0aWMvc2ltdWxhdG9yL2NvY29zLWpzIOebruW9lVxuICAgIC8vIFRPRE86IOS9v+eUqCBRVUlDS19DT01QSUxFIOe8luivkSBlbmdpbmVcbiAgICBjb25zdCBjY01vZHVsZUZpbGUgPSBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9jb2Nvcy1qcy9jYy5qcycpO1xuICAgIGNvbnN0IGNjZUNvZGVRdWFsaXR5RmlsZSA9IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2J1aWx0aW4vY2NlLmNvZGUtcXVhbGl0eS5jci5qcycpO1xuICAgIGNvbnN0IGNjZUVudkZpbGUgPSBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9idWlsdGluL2NjZS5lbnYuanMnKTtcbiAgICBlbnN1cmVEaXJTeW5jKGRpcm5hbWUoY2NNb2R1bGVGaWxlKSk7XG4gICAgZW5zdXJlRGlyU3luYyhkaXJuYW1lKGNjZUNvZGVRdWFsaXR5RmlsZSkpO1xuICAgIGNvbnN0IHN0YXRzUXVlcnkgPSBhd2FpdCBTdGF0c1F1ZXJ5LmNyZWF0ZShqc0VuZ2luZVBhdGgpO1xuICAgIGNvbnN0IGNjRW52Q29uc3RhbnRzID0gc3RhdHNRdWVyeS5jb25zdGFudE1hbmFnZXIuZ2VuQ0NFbnZDb25zdGFudHMoe1xuICAgICAgICBtb2RlOiAnUFJFVklFVycsXG4gICAgICAgIHBsYXRmb3JtOiAnTkFUSVZFJyxcbiAgICAgICAgZmxhZ3M6IHtcbiAgICAgICAgICAgIERFQlVHOiB0cnVlLFxuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgZmVhdHVyZXMgPSAoYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0UHJvamVjdCgnZW5naW5lJywgJ21vZHVsZXMuaW5jbHVkZU1vZHVsZXMnKSkgfHwgW107XG4gICAgY29uc3QgZmVhdHVyZVVuaXRzID0gc3RhdHNRdWVyeS5nZXRVbml0c09mRmVhdHVyZXMoZmVhdHVyZXMpO1xuICAgIGNvbnN0IHsgYnVpbGQgfSA9IGF3YWl0IGltcG9ydCgnQGNvY29zL2J1aWxkLWVuZ2luZScpO1xuICAgIGNvbnN0IHsgY29kZTogaW5kZXhNb2QgfSA9IGF3YWl0IGJ1aWxkLnRyYW5zZm9ybShzdGF0c1F1ZXJ5LmV2YWx1YXRlSW5kZXhNb2R1bGVTb3VyY2UoXG4gICAgICAgIGZlYXR1cmVVbml0cyxcbiAgICAgICAgKG1vZHVsZU5hbWUpID0+IG1vZHVsZU5hbWUsIC8vIOWSjCBxdWljayBjb21waWxlciDnu5nnmoTliY3nvIDkuIDoh7QsXG4gICAgKSwgTW9kdWxlT3B0aW9uLnN5c3RlbSk7XG4gICAgY29uc3QgYnVpbHRpbk1vZHVsZVByb3ZpZGVyID0gYXdhaXQgQnVpbHRpbk1vZHVsZVByb3ZpZGVyLmNyZWF0ZSh7IGZvcm1hdDogJ3N5c3RlbWpzJyB9KTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgIGJ1aWx0aW5Nb2R1bGVQcm92aWRlci5hZGRCdWlsZFRpbWVDb25zdGFudHNNb2QoY2NFbnZDb25zdGFudHMpLFxuICAgIF0pO1xuICAgIGF3YWl0IHdyaXRlRmlsZShjY01vZHVsZUZpbGUsIGluZGV4TW9kLCAndXRmOCcpO1xuICAgIGF3YWl0IHdyaXRlRmlsZShjY2VFbnZGaWxlLCBidWlsdGluTW9kdWxlUHJvdmlkZXIubW9kdWxlc1snY2MvZW52J10sICd1dGY4Jyk7XG5cbiAgICAvLyDmi7fotJ3mlofku7ZcbiAgICBjb25zdCB0b0NvcHkgPSBbXG4gICAgICAgIC8vIOaLt+i0nSBqc2ItYWRhcHRlclxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oanNFbmdpbmVQYXRoLCAnYmluL2FkYXB0ZXIvbmF0aXZlL3dlYi1hZGFwdGVyLmpzJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2pzYi1hZGFwdGVyL3dlYi1hZGFwdGVyLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihqc0VuZ2luZVBhdGgsICdiaW4vYWRhcHRlci9uYXRpdmUvZW5naW5lLWFkYXB0ZXIuanMnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnanNiLWFkYXB0ZXIvZW5naW5lLWFkYXB0ZXIuanMnKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgLy8g5ou36LSdIGVuZ2luZSwgaW1wb3J0LW1hcC5qc29uXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihqc0VuZ2luZVBhdGgsICdiaW4vbmF0aXZlLXByZXZpZXcnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2NvY29zLWpzJyksXG4gICAgICAgICAgICBpc0RpcjogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3IvaW1wb3J0LW1hcC5qc29uJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9pbXBvcnQtbWFwLmpzb24nKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3Ivc3lzdGVtLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvc3lzdGVtLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgaXNEaXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9wb2x5ZmlsbHMuYnVuZGxlLmpzJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9wb2x5ZmlsbHMuYnVuZGxlLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgXTtcbiAgICB0b0NvcHkuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgaWYgKGl0ZW0uaXNEaXIpIHtcbiAgICAgICAgICAgIGNvcHlEaXJTeW5jKGl0ZW0uc3JjLCBpdGVtLmRlc3QpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29weUZpbGVTeW5jKGl0ZW0uc3JjLCBpdGVtLmRlc3QpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyDlhpnlhaUgc2V0dGluZ3MuanNcbiAgICBhd2FpdCB3cml0ZVNldHRpbmdGaWxlKHNpbXVsYXRvclJlc291cmNlcyk7XG5cbiAgICAvLyDlhpnlhaXliJ3lp4vlnLrmma/mlbDmja5cbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZ2VuZXJhdGVQcmV2aWV3RGF0YSgpO1xuICAgIGxldCBwcmV2aWV3U2NlbmVKc29uUGF0aCA9IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAncHJldmlldy1zY2VuZS5qc29uJyk7XG4gICAgcHJldmlld1NjZW5lSnNvblBhdGggPSBmb3JtYXRQYXRoKHByZXZpZXdTY2VuZUpzb25QYXRoKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUocHJldmlld1NjZW5lSnNvblBhdGgsIGRhdGEucHJldmlld1NjZW5lSnNvbiwgJ3V0ZjgnKTtcblxuICAgIC8vIOeUn+aIkCBtYWluLmpzXG4gICAgY29uc3QgcHJldmlld1BvcnQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzZXJ2ZXInLCAncXVlcnktcG9ydCcpO1xuICAgIGNvbnN0IHByZXZpZXdJcCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3ByZXZpZXcnLCAnZ2V0LXByZXZpZXctaXAnKTtcbiAgICBjb25zdCBtYWluSnNTb3VyY2UgPSBhd2FpdCBFanMucmVuZGVyRmlsZShqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3IvbWFpbi5lanMnKSwge1xuICAgICAgICBsaWJyYXJ5UGF0aDogZm9ybWF0UGF0aChqb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsICdsaWJyYXJ5JykpLFxuICAgICAgICB3YWl0Rm9yQ29ubmVjdDogcHJlZmVyZW5jZS53YWl0Rm9yQ29ubmVjdCxcbiAgICAgICAgcHJvamVjdFBhdGg6IGZvcm1hdFBhdGgoRWRpdG9yLlByb2plY3QucGF0aCksXG4gICAgICAgIHByZXZpZXdJcCxcbiAgICAgICAgcHJldmlld1BvcnQsXG4gICAgICAgIHBhY2tJbXBvcnRNYXBVUkw6ICcvc2NyaXB0aW5nL3gvaW1wb3J0LW1hcC5qc29uJyxcbiAgICAgICAgcGFja1Jlc29sdXRpb25EZXRhaWxNYXBVUkw6ICcvc2NyaXB0aW5nL3gvcmVzb2x1dGlvbi1kZXRhaWwtbWFwLmpzb24nLFxuICAgIH0pO1xuICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ21haW4uanMnKSwgbWFpbkpzU291cmNlLCAndXRmOCcpO1xuXG4gICAgLy8g55Sf5oiQIGFwcGxpY2F0aW9uLmpzXG4gICAgY29uc3QgaW5jbHVkZU1vZHVsZXMgPSBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRQcm9qZWN0KCdlbmdpbmUnLCAnbW9kdWxlcy5pbmNsdWRlTW9kdWxlcycpO1xuICAgIGNvbnN0IGhhc1BoeXNpY3NBbW1vID0gaW5jbHVkZU1vZHVsZXMuaW5jbHVkZXMoJ3BoeXNpY3MtYW1tbycpO1xuICAgIGNvbnN0IHByb2plY3REYXRhID0gYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0UHJvamVjdCgncHJvamVjdCcsICdnZW5lcmFsLmRlc2lnblJlc29sdXRpb24nKTtcbiAgICBsZXQgcmVzb2x1dGlvblBvbGljeTogUmVzb2x1dGlvblBvbGljeTtcbiAgICBpZiAocHJvamVjdERhdGEuZml0V2lkdGggJiYgcHJvamVjdERhdGEuZml0SGVpZ2h0KSB7XG4gICAgICAgIHJlc29sdXRpb25Qb2xpY3kgPSBSZXNvbHV0aW9uUG9saWN5LlJlc29sdXRpb25TaG93QWxsO1xuICAgIH1cbiAgICBlbHNlIGlmIChwcm9qZWN0RGF0YS5maXRXaWR0aCAmJiAhcHJvamVjdERhdGEuZml0SGVpZ2h0KSB7XG4gICAgICAgIHJlc29sdXRpb25Qb2xpY3kgPSBSZXNvbHV0aW9uUG9saWN5LlJlc29sdXRpb25GaXhlZFdpZHRoO1xuICAgIH1cbiAgICBlbHNlIGlmICghcHJvamVjdERhdGEuZml0V2lkdGggJiYgcHJvamVjdERhdGEuZml0SGVpZ2h0KSB7XG4gICAgICAgIHJlc29sdXRpb25Qb2xpY3kgPSBSZXNvbHV0aW9uUG9saWN5LlJlc29sdXRpb25GaXhlZEhlaWdodDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJlc29sdXRpb25Qb2xpY3kgPSBSZXNvbHV0aW9uUG9saWN5LlJlc29sdXRpb25Ob0JvcmRlcjtcbiAgICB9XG4gICAgY29uc3QgZGVzaWduUmVzb2x1dGlvbiA9IHtcbiAgICAgICAgd2lkdGg6IHByb2plY3REYXRhLndpZHRoLFxuICAgICAgICBoZWlnaHQ6IHByb2plY3REYXRhLmhlaWdodCxcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSxcbiAgICB9O1xuICAgIGNvbnN0IGFwcEpzU291cmNlID0gYXdhaXQgRWpzLnJlbmRlckZpbGUoam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL2FwcGxpY2F0aW9uLmVqcycpLCB7XG4gICAgICAgIGhhc1BoeXNpY3NBbW1vLFxuICAgICAgICBwcmV2aWV3U2NlbmVKc29uUGF0aCxcbiAgICAgICAgbGlicmFyeVBhdGg6IGZvcm1hdFBhdGgoam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCAnbGlicmFyeScpKSxcbiAgICAgICAgcHJvamVjdFBhdGg6IGZvcm1hdFBhdGgoRWRpdG9yLlByb2plY3QucGF0aCksXG4gICAgICAgIGRlc2lnblJlc29sdXRpb24sXG4gICAgICAgIHByZXZpZXdJcCxcbiAgICAgICAgcHJldmlld1BvcnQsXG4gICAgfSk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2FwcGxpY2F0aW9uLmpzJyksIGFwcEpzU291cmNlLCAndXRmOCcpO1xuXG4gICAgLy8g5qC55o2u5YGP5aW96K6+572u77yM5pu05paw5qih5ouf5Zmo6YWN572u5paH5Lu2XG4gICAgYXdhaXQgZ2VuZXJhdGVTaW11bGF0b3JDb25maWcoKTtcblxuICAgIC8vIOi/kOihjOaooeaLn+WZqFxuICAgIC8vIGVudmlyb25tZW50XG4gICAgLy8gVE9ETzog5Yid5aeL5YyW546v5aKD5Y+Y6YePXG4gICAgLy8gZW52ID0ge1xuICAgIC8vICAgICBDT0NPU19GUkFNRVdPUktTOiBQYXRoLmpvaW4oY29jb3NSb290LCAnLi4vJyksXG4gICAgLy8gICAgIENPQ09TX1hfUk9PVDogY29jb3NSb290LFxuICAgIC8vICAgICBDT0NPU19DT05TT0xFX1JPT1Q6IGNvY29zQ29uc29sZVJvb3QsXG4gICAgLy8gICAgIE5ES19ST09UOiBuZGtSb290LFxuICAgIC8vICAgICBBTkRST0lEX1NES19ST09UOiBhbmRyb2lkU0RLUm9vdFxuICAgIC8vIH07XG5cbiAgICAvLyAvLyBmb3JtYXQgZW52aXJvbm1lbnQgc3RyaW5nXG4gICAgLy8gZW52U3RyID0gJyc7XG4gICAgLy8gZm9yIChsZXQgayBpbiBlbnYpIHtcbiAgICAvLyAgICAgaWYgKGVudlN0ciAhPT0gJycpIHtcbiAgICAvLyAgICAgICAgIGVudlN0ciArPSAnOyc7XG4gICAgLy8gICAgIH1cblxuICAgIC8vICAgICBlbnZTdHIgKz0gYCR7a309JHtlbnZba119YDtcbiAgICAvLyB9XG4gICAgLy8gbGV0IGFyZ3MgPSBbJy13b3JrZGlyJywgc2ltdWxhdG9yUmVzb3VyY2VzLCAnLXdyaXRhYmxlLXBhdGgnLCBzaW11bGF0b3JSZXNvdXJjZXMsICctY29uc29sZScsICdmYWxzZScsICctLWVudicsIGVudlN0cl07XG4gICAgY29uc3QgYXJncyA9IFsnLXdvcmtkaXInLCBzaW11bGF0b3JSZXNvdXJjZXMsICctd3JpdGFibGUtcGF0aCcsIHNpbXVsYXRvclJlc291cmNlcywgJy1jb25zb2xlJywgJ2ZhbHNlJ107XG4gICAgc2ltdWxhdG9yUHJvY2VzcyA9IHNwYXduKGV4ZWN1dGFibGVTaW11bGF0b3IsIGFyZ3MpO1xuXG4gICAgLy8g5omT5byA5qih5ouf5Zmo6LCD6K+V5ZmoXG4gICAgaWYgKHByZWZlcmVuY2Uuc2hvd0RlYnVnUGFuZWwpIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuUGFuZWwub3BlbigncHJldmlldy5kZWJ1Z2dlcicpO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICB9XG5cbiAgICAvLyDnm5HlkKzmqKHmi5/lmajov5vnqIvnmoTovpPlh7pcbiAgICBzaW11bGF0b3JQcm9jZXNzLm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgICAgRWRpdG9yLlBhbmVsLmNsb3NlKCdwcmV2aWV3LmRlYnVnZ2VyJyk7XG4gICAgfSk7XG4gICAgc2ltdWxhdG9yUHJvY2Vzcy5zdGRvdXQ/Lm9uKCdkYXRhJywgZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEudG9TdHJpbmcgPyBkYXRhLnRvU3RyaW5nKCkgOiBkYXRhKTtcbiAgICB9KTtcbiAgICBzaW11bGF0b3JQcm9jZXNzLnN0ZGVycj8ub24oJ2RhdGEnLCBkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihkYXRhLnRvU3RyaW5nID8gZGF0YS50b1N0cmluZygpIDogZGF0YSk7XG4gICAgfSk7XG4gICAgc2ltdWxhdG9yUHJvY2Vzcy5vbignZXJyb3InLCBkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihkYXRhLnRvU3RyaW5nID8gZGF0YS50b1N0cmluZygpIDogZGF0YSk7XG4gICAgfSk7XG59XG4iXX0=