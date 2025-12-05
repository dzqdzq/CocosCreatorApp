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
exports.runSimulator = void 0;
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
    return {
        previewSceneJson,
        settings: data.settings,
        bundleConfigs: data.bundleConfigs,
    };
}
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
    const buildTimeConstants = statsQuery.constantManager.genBuildTimeConstants({
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
        builtinModuleProvider.addBuildTimeConstantsMod(buildTimeConstants),
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
            src: (0, path_1.join)(jsEnginePath, 'bin/.cache/dev/native-preview'),
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
    const data = await generatePreviewData();
    await (0, fs_extra_1.writeFile)((0, path_1.join)(simulatorResources, 'src/settings.json'), JSON.stringify(data.settings, undefined, 2));
    for (let i = 0; i < data.bundleConfigs.length; ++i) {
        const config = data.bundleConfigs[i];
        const bundleDir = (0, path_1.join)(simulatorResources, 'assets', config.name);
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
    // 写入初始场景数据
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltdWxhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2Jyb3dzZXIvc2ltdWxhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0JBQXFDO0FBQ3JDLDhDQUFzQjtBQUN0Qix1Q0FBc0Y7QUFDdEYsaURBQW9EO0FBQ3BELDBEQUFpQztBQUNqQyxrR0FBNkY7QUFDN0Ysc0RBQStEO0FBQy9ELHVEQUFtSjtBQUVuSixJQUFLLGdCQU1KO0FBTkQsV0FBSyxnQkFBZ0I7SUFDakIsbUZBQWtCLENBQUE7SUFDbEIsbUZBQWtCLENBQUE7SUFDbEIsaUZBQWlCLENBQUE7SUFDakIseUZBQXFCLENBQUE7SUFDckIsdUZBQW9CLENBQUE7QUFDeEIsQ0FBQyxFQU5JLGdCQUFnQixLQUFoQixnQkFBZ0IsUUFNcEI7QUFDRCxJQUFJLGdCQUFxQyxDQUFDLENBQUMsZ0JBQWdCO0FBRTNELFNBQVMsb0JBQW9CO0lBQ3pCLElBQUksZ0JBQWdCLEVBQUU7UUFDbEIsSUFBQSxtQkFBUSxFQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9CLGdCQUFnQixHQUFHLElBQUksQ0FBQztLQUMzQjtBQUNMLENBQUM7QUFFRCxLQUFLLFVBQVUsbUJBQW1CO0lBQzlCLDBCQUEwQjtJQUMxQixNQUFNLElBQUksR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxtQkFBbUIsRUFBRTtRQUN0RSxJQUFJLEVBQUUsV0FBVztRQUNqQixRQUFRLEVBQUUsU0FBUztLQUN0QixDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztLQUNyQztJQUVELE9BQU87SUFDUCxJQUFJLGdCQUF3QixDQUFDO0lBQzdC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QyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDMUQsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBOU5ELG9DQThOQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRpcm5hbWUsIGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCBFanMgZnJvbSAnZWpzJztcbmltcG9ydCB7IHdyaXRlRmlsZSwgY29weUZpbGVTeW5jLCBlbnN1cmVEaXJTeW5jLCBlbXB0eURpciwgcmVhZEZpbGUgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBDaGlsZFByb2Nlc3MsIHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgdHJlZUtpbGwgZnJvbSAndHJlZS1raWxsJztcbmltcG9ydCB7IEJ1aWx0aW5Nb2R1bGVQcm92aWRlciB9IGZyb20gJ0BlZGl0b3IvbGliLXByb2dyYW1taW5nL2Rpc3QvYnVpbHRpbi1tb2R1bGUtcHJvdmlkZXInO1xuaW1wb3J0IHsgU3RhdHNRdWVyeSwgTW9kdWxlT3B0aW9uIH0gZnJvbSAnQGNvY29zL2J1aWxkLWVuZ2luZSc7XG5pbXBvcnQgeyBjb3B5RGlyU3luYywgZm9ybWF0UGF0aCwgZ2VuZXJhdGVTaW11bGF0b3JDb25maWcsIGdldEpzRW5naW5lUGF0aCwgZ2V0TmF0aXZlRW5naW5lUGF0aCwgZ2V0U2ltdWxhdG9yUHJlZmVyZW5jZSB9IGZyb20gJy4vc2ltdWxhdG9yLXV0aWxzJztcblxuZW51bSBSZXNvbHV0aW9uUG9saWN5IHtcbiAgICBSZXNvbHV0aW9uRXhhY3RGaXQsXG4gICAgUmVzb2x1dGlvbk5vQm9yZGVyLFxuICAgIFJlc29sdXRpb25TaG93QWxsLFxuICAgIFJlc29sdXRpb25GaXhlZEhlaWdodCxcbiAgICBSZXNvbHV0aW9uRml4ZWRXaWR0aCxcbn1cbmxldCBzaW11bGF0b3JQcm9jZXNzOiBDaGlsZFByb2Nlc3MgfCBudWxsOyAvLyDmoIfor4bmqKHmi5/lmajpooTop4jov5vnqIvmmK/lkKblrZjlnKhcblxuZnVuY3Rpb24gc3RvcFNpbXVsYXRvclByb2Nlc3MoKSB7XG4gICAgaWYgKHNpbXVsYXRvclByb2Nlc3MpIHtcbiAgICAgICAgdHJlZUtpbGwoc2ltdWxhdG9yUHJvY2Vzcy5waWQpO1xuICAgICAgICBzaW11bGF0b3JQcm9jZXNzID0gbnVsbDtcbiAgICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlUHJldmlld0RhdGEoKSB7XG4gICAgLy8g5qih5ouf5Zmo6aKE6KeI5LiN6ZyA6KaBIGxhdW5jaFNjZW5lIOaVsOaNrlxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdwcmV2aWV3JywgJ2dlbmVyYXRlLXNldHRpbmdzJywge1xuICAgICAgICB0eXBlOiAnc2ltdWxhdG9yJyxcbiAgICAgICAgcGxhdGZvcm06ICd3aW5kb3dzJyxcbiAgICB9KTtcblxuICAgIGlmICghKGRhdGEgJiYgZGF0YS5zZXR0aW5ncykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfmnoTlu7ogc2V0dGluZ3Mg5Ye66ZSZJyk7XG4gICAgfVxuXG4gICAgLy8g5ZCv5Yqo5Zy65pmvXG4gICAgbGV0IHByZXZpZXdTY2VuZUpzb246IHN0cmluZztcbiAgICBjb25zdCBwcmV2aWV3U2NlbmUgPSBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRDb25maWcoJ3ByZXZpZXcnLCAnZ2VuZXJhbC5zdGFydF9zY2VuZScpO1xuICAgIGlmIChwcmV2aWV3U2NlbmUgPT09ICdjdXJyZW50X3NjZW5lJykge1xuICAgICAgICBwcmV2aWV3U2NlbmVKc29uID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktc2NlbmUtanNvbicpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29uc3QgcHJldmlld1NjZW5lUGF0aCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXBhdGgnLCBwcmV2aWV3U2NlbmUpIGFzIHN0cmluZztcbiAgICAgICAgcHJldmlld1NjZW5lSnNvbiA9IGF3YWl0IHJlYWRGaWxlKHByZXZpZXdTY2VuZVBhdGgsICd1dGY4Jyk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHByZXZpZXdTY2VuZUpzb24sXG4gICAgICAgIHNldHRpbmdzOiBkYXRhLnNldHRpbmdzLFxuICAgICAgICBidW5kbGVDb25maWdzOiBkYXRhLmJ1bmRsZUNvbmZpZ3MsXG4gICAgfTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1blNpbXVsYXRvcigpIHtcbiAgICAvLyDlhbPpl63mqKHmi5/lmahcbiAgICBzdG9wU2ltdWxhdG9yUHJvY2VzcygpO1xuXG4gICAgLy8g6I635Y+W5qih5ouf5Zmo5YGP5aW96K6+572uXG4gICAgY29uc3QgcHJlZmVyZW5jZSA9IGF3YWl0IGdldFNpbXVsYXRvclByZWZlcmVuY2UoKTtcblxuICAgIC8vIOi3r+W+hOWkhOeQhlxuICAgIGNvbnN0IGlzRGFyd2luID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2Rhcndpbic7XG4gICAgY29uc3QganNFbmdpbmVQYXRoID0gYXdhaXQgZ2V0SnNFbmdpbmVQYXRoKCk7XG4gICAgY29uc3QgbmF0aXZlRW5naW5lUGF0aCA9IGF3YWl0IGdldE5hdGl2ZUVuZ2luZVBhdGgoKTtcbiAgICBjb25zdCBzaW11bGF0b3JSb290ID0gam9pbihuYXRpdmVFbmdpbmVQYXRoLCBpc0RhcndpbiA/ICdzaW11bGF0b3IvUmVsZWFzZS9TaW11bGF0b3JBcHAtTWFjLmFwcCcgOiAnc2ltdWxhdG9yL1JlbGVhc2UnKTtcbiAgICBjb25zdCBzaW11bGF0b3JSZXNvdXJjZXMgPSBpc0RhcndpbiA/IGpvaW4oc2ltdWxhdG9yUm9vdCwgJ0NvbnRlbnRzL1Jlc291cmNlcycpIDogc2ltdWxhdG9yUm9vdDtcbiAgICBjb25zdCBleGVjdXRhYmxlU2ltdWxhdG9yID0gaXNEYXJ3aW4gPyBqb2luKHNpbXVsYXRvclJvb3QsICdDb250ZW50cy9NYWNPUy9TaW11bGF0b3JBcHAtTWFjJykgOiBqb2luKHNpbXVsYXRvclJvb3QsICdTaW11bGF0b3JBcHAtV2luMzIuZXhlJyk7XG5cbiAgICBlbnN1cmVEaXJTeW5jKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnanNiLWFkYXB0ZXInKSk7XG4gICAgZW5zdXJlRGlyU3luYyhqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9jb2Nvcy1qcycpKTtcbiAgICAvLyDmuIXnqbrnvJPlrZhcbiAgICBhd2FpdCBlbXB0eURpcihqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2Fzc2V0cycpKTtcbiAgICBjb25zdCBhdXRvQ2xlYW5DYWNoZSA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldENvbmZpZygncHJldmlldycsICdwcmV2aWV3LmF1dG9fY2xlYW5fY2FjaGUnKTtcbiAgICBpZiAoYXV0b0NsZWFuQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgZW1wdHlEaXIoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdnYW1lY2FjaGVzJykpO1xuICAgIH1cblxuICAgIC8vIOagueaNruWBj+Wlveiuvue9rueahOaooeWdl+mFjee9ru+8jOeUn+aIkCBjYy5qcyDliLAgc3RhdGljL3NpbXVsYXRvci9jb2Nvcy1qcyDnm67lvZVcbiAgICAvLyBUT0RPOiDkvb/nlKggUVVJQ0tfQ09NUElMRSDnvJbor5EgZW5naW5lXG4gICAgY29uc3QgY2NNb2R1bGVGaWxlID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvY29jb3MtanMvY2MuanMnKTtcbiAgICBjb25zdCBjY2VDb2RlUXVhbGl0eUZpbGUgPSBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9idWlsdGluL2NjZS5jb2RlLXF1YWxpdHkuY3IuanMnKTtcbiAgICBjb25zdCBjY2VFbnZGaWxlID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvYnVpbHRpbi9jY2UuZW52LmpzJyk7XG4gICAgZW5zdXJlRGlyU3luYyhkaXJuYW1lKGNjTW9kdWxlRmlsZSkpO1xuICAgIGVuc3VyZURpclN5bmMoZGlybmFtZShjY2VDb2RlUXVhbGl0eUZpbGUpKTtcbiAgICBjb25zdCBzdGF0c1F1ZXJ5ID0gYXdhaXQgU3RhdHNRdWVyeS5jcmVhdGUoanNFbmdpbmVQYXRoKTtcbiAgICBjb25zdCBidWlsZFRpbWVDb25zdGFudHMgPSBzdGF0c1F1ZXJ5LmNvbnN0YW50TWFuYWdlci5nZW5CdWlsZFRpbWVDb25zdGFudHMoe1xuICAgICAgICBtb2RlOiAnUFJFVklFVycsXG4gICAgICAgIHBsYXRmb3JtOiAnTkFUSVZFJyxcbiAgICAgICAgZmxhZ3M6IHtcbiAgICAgICAgICAgIERFQlVHOiB0cnVlLFxuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgZmVhdHVyZXMgPSAoYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0UHJvamVjdCgnZW5naW5lJywgJ21vZHVsZXMuaW5jbHVkZU1vZHVsZXMnKSkgfHwgW107XG4gICAgY29uc3QgZmVhdHVyZVVuaXRzID0gc3RhdHNRdWVyeS5nZXRVbml0c09mRmVhdHVyZXMoZmVhdHVyZXMpO1xuICAgIGNvbnN0IHsgYnVpbGQgfSA9IGF3YWl0IGltcG9ydCgnQGNvY29zL2J1aWxkLWVuZ2luZScpO1xuICAgIGNvbnN0IHsgY29kZTogaW5kZXhNb2QgfSA9IGF3YWl0IGJ1aWxkLnRyYW5zZm9ybShzdGF0c1F1ZXJ5LmV2YWx1YXRlSW5kZXhNb2R1bGVTb3VyY2UoXG4gICAgICAgIGZlYXR1cmVVbml0cyxcbiAgICAgICAgKG1vZHVsZU5hbWUpID0+IG1vZHVsZU5hbWUsIC8vIOWSjCBxdWljayBjb21waWxlciDnu5nnmoTliY3nvIDkuIDoh7QsXG4gICAgKSwgTW9kdWxlT3B0aW9uLnN5c3RlbSk7XG4gICAgY29uc3QgYnVpbHRpbk1vZHVsZVByb3ZpZGVyID0gYXdhaXQgQnVpbHRpbk1vZHVsZVByb3ZpZGVyLmNyZWF0ZSh7IGZvcm1hdDogJ3N5c3RlbWpzJyB9KTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgIGJ1aWx0aW5Nb2R1bGVQcm92aWRlci5hZGRCdWlsZFRpbWVDb25zdGFudHNNb2QoYnVpbGRUaW1lQ29uc3RhbnRzKSxcbiAgICBdKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoY2NNb2R1bGVGaWxlLCBpbmRleE1vZCwgJ3V0ZjgnKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoY2NlRW52RmlsZSwgYnVpbHRpbk1vZHVsZVByb3ZpZGVyLm1vZHVsZXNbJ2NjL2VudiddLCAndXRmOCcpO1xuXG4gICAgLy8g5ou36LSd5paH5Lu2XG4gICAgY29uc3QgdG9Db3B5ID0gW1xuICAgICAgICAvLyDmi7fotJ0ganNiLWFkYXB0ZXJcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKGpzRW5naW5lUGF0aCwgJ2Jpbi9hZGFwdGVyL25hdGl2ZS93ZWItYWRhcHRlci5qcycpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdqc2ItYWRhcHRlci93ZWItYWRhcHRlci5qcycpLFxuICAgICAgICAgICAgaXNEaXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oanNFbmdpbmVQYXRoLCAnYmluL2FkYXB0ZXIvbmF0aXZlL2VuZ2luZS1hZGFwdGVyLmpzJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2pzYi1hZGFwdGVyL2VuZ2luZS1hZGFwdGVyLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOaLt+i0nSBlbmdpbmUsIGltcG9ydC1tYXAuanNvblxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oanNFbmdpbmVQYXRoLCAnYmluLy5jYWNoZS9kZXYvbmF0aXZlLXByZXZpZXcnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2NvY29zLWpzJyksXG4gICAgICAgICAgICBpc0RpcjogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3IvaW1wb3J0LW1hcC5qc29uJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9pbXBvcnQtbWFwLmpzb24nKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3Ivc3lzdGVtLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvc3lzdGVtLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgaXNEaXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9wb2x5ZmlsbHMuYnVuZGxlLmpzJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9wb2x5ZmlsbHMuYnVuZGxlLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgXTtcbiAgICB0b0NvcHkuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgaWYgKGl0ZW0uaXNEaXIpIHtcbiAgICAgICAgICAgIGNvcHlEaXJTeW5jKGl0ZW0uc3JjLCBpdGVtLmRlc3QpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29weUZpbGVTeW5jKGl0ZW0uc3JjLCBpdGVtLmRlc3QpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyDlhpnlhaUgc2V0dGluZ3MuanNcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZ2VuZXJhdGVQcmV2aWV3RGF0YSgpO1xuICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9zZXR0aW5ncy5qc29uJyksIEpTT04uc3RyaW5naWZ5KGRhdGEuc2V0dGluZ3MsIHVuZGVmaW5lZCwgMikpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5idW5kbGVDb25maWdzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IGRhdGEuYnVuZGxlQ29uZmlnc1tpXTtcbiAgICAgICAgY29uc3QgYnVuZGxlRGlyID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdhc3NldHMnLCBjb25maWcubmFtZSk7XG4gICAgICAgIGVuc3VyZURpclN5bmMoYnVuZGxlRGlyKTtcbiAgICAgICAgLy8g5Yig6ZmkIGltcG9ydEJhc2Ug5ZKMIG5hdGl2ZUJhc2XvvIzkvb/nlKggZ2VuZXJhbEJhc2VcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBkZWxldGUgY29uZmlnLmltcG9ydEJhc2U7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZGVsZXRlIGNvbmZpZy5uYXRpdmVCYXNlO1xuICAgICAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihidW5kbGVEaXIsICdjYy5jb25maWcuanNvbicpLCBKU09OLnN0cmluZ2lmeShjb25maWcsIHVuZGVmaW5lZCwgMikpO1xuICAgICAgICAvLyBUT0RPOiDnm67liY3nmoTlrp7njrDot58gd2ViIOmihOiniOS4gOagt++8jOS4gOasoeaAp+WKoOi9veaJgOacieiEmuacrFxuICAgICAgICBjb25zdCBidW5kbGVFbnRyeSA9IFtdO1xuICAgICAgICBpZiAoY29uZmlnLm5hbWUgPT09ICdtYWluJykge1xuICAgICAgICAgICAgYnVuZGxlRW50cnkucHVzaCgnY2NlOi9pbnRlcm5hbC94L3ByZXJlcXVpc2l0ZS1pbXBvcnRzJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYnVuZGxlSW5kZXhKc1NvdXJjZSA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9idW5kbGVJbmRleC5lanMnKSwge1xuICAgICAgICAgICAgYnVuZGxlTmFtZTogY29uZmlnLm5hbWUsXG4gICAgICAgICAgICBidW5kbGVFbnRyeSxcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKGJ1bmRsZURpciwgJ2luZGV4LmpzJyksIGJ1bmRsZUluZGV4SnNTb3VyY2UsICd1dGY4Jyk7XG4gICAgfVxuXG4gICAgLy8g5YaZ5YWl5Yid5aeL5Zy65pmv5pWw5o2uXG4gICAgbGV0IHByZXZpZXdTY2VuZUpzb25QYXRoID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdwcmV2aWV3LXNjZW5lLmpzb24nKTtcbiAgICBwcmV2aWV3U2NlbmVKc29uUGF0aCA9IGZvcm1hdFBhdGgocHJldmlld1NjZW5lSnNvblBhdGgpO1xuICAgIGF3YWl0IHdyaXRlRmlsZShwcmV2aWV3U2NlbmVKc29uUGF0aCwgZGF0YS5wcmV2aWV3U2NlbmVKc29uLCAndXRmOCcpO1xuXG4gICAgLy8g55Sf5oiQIG1haW4uanNcbiAgICBjb25zdCBwcmV2aWV3UG9ydCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NlcnZlcicsICdxdWVyeS1wb3J0Jyk7XG4gICAgY29uc3QgcHJldmlld0lwID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgncHJldmlldycsICdnZXQtcHJldmlldy1pcCcpO1xuICAgIGNvbnN0IG1haW5Kc1NvdXJjZSA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9tYWluLmVqcycpLCB7XG4gICAgICAgIGxpYnJhcnlQYXRoOiBmb3JtYXRQYXRoKGpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ2xpYnJhcnknKSksXG4gICAgICAgIHdhaXRGb3JDb25uZWN0OiBwcmVmZXJlbmNlLndhaXRGb3JDb25uZWN0LFxuICAgICAgICBwcm9qZWN0UGF0aDogZm9ybWF0UGF0aChFZGl0b3IuUHJvamVjdC5wYXRoKSxcbiAgICAgICAgcHJldmlld0lwLFxuICAgICAgICBwcmV2aWV3UG9ydCxcbiAgICAgICAgcGFja0ltcG9ydE1hcFVSTDogJy9zY3JpcHRpbmcveC9pbXBvcnQtbWFwLmpzb24nLFxuICAgICAgICBwYWNrUmVzb2x1dGlvbkRldGFpbE1hcFVSTDogJy9zY3JpcHRpbmcveC9yZXNvbHV0aW9uLWRldGFpbC1tYXAuanNvbicsXG4gICAgfSk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnbWFpbi5qcycpLCBtYWluSnNTb3VyY2UsICd1dGY4Jyk7XG5cbiAgICAvLyDnlJ/miJAgYXBwbGljYXRpb24uanNcbiAgICBjb25zdCBpbmNsdWRlTW9kdWxlcyA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldFByb2plY3QoJ2VuZ2luZScsICdtb2R1bGVzLmluY2x1ZGVNb2R1bGVzJyk7XG4gICAgY29uc3QgaGFzUGh5c2ljc0FtbW8gPSBpbmNsdWRlTW9kdWxlcy5pbmNsdWRlcygncGh5c2ljcy1hbW1vJyk7XG4gICAgY29uc3QgcHJvamVjdERhdGEgPSBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRQcm9qZWN0KCdwcm9qZWN0JywgJ2dlbmVyYWwuZGVzaWduUmVzb2x1dGlvbicpO1xuICAgIGxldCByZXNvbHV0aW9uUG9saWN5OiBSZXNvbHV0aW9uUG9saWN5O1xuICAgIGlmIChwcm9qZWN0RGF0YS5maXRXaWR0aCAmJiBwcm9qZWN0RGF0YS5maXRIZWlnaHQpIHtcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuUmVzb2x1dGlvblNob3dBbGw7XG4gICAgfVxuICAgIGVsc2UgaWYgKHByb2plY3REYXRhLmZpdFdpZHRoICYmICFwcm9qZWN0RGF0YS5maXRIZWlnaHQpIHtcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuUmVzb2x1dGlvbkZpeGVkV2lkdGg7XG4gICAgfVxuICAgIGVsc2UgaWYgKCFwcm9qZWN0RGF0YS5maXRXaWR0aCAmJiBwcm9qZWN0RGF0YS5maXRIZWlnaHQpIHtcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuUmVzb2x1dGlvbkZpeGVkSGVpZ2h0O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuUmVzb2x1dGlvbk5vQm9yZGVyO1xuICAgIH1cbiAgICBjb25zdCBkZXNpZ25SZXNvbHV0aW9uID0ge1xuICAgICAgICB3aWR0aDogcHJvamVjdERhdGEud2lkdGgsXG4gICAgICAgIGhlaWdodDogcHJvamVjdERhdGEuaGVpZ2h0LFxuICAgICAgICByZXNvbHV0aW9uUG9saWN5LFxuICAgIH07XG4gICAgY29uc3QgYXBwSnNTb3VyY2UgPSBhd2FpdCBFanMucmVuZGVyRmlsZShqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3IvYXBwbGljYXRpb24uZWpzJyksIHtcbiAgICAgICAgaGFzUGh5c2ljc0FtbW8sXG4gICAgICAgIHByZXZpZXdTY2VuZUpzb25QYXRoLFxuICAgICAgICBsaWJyYXJ5UGF0aDogZm9ybWF0UGF0aChqb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsICdsaWJyYXJ5JykpLFxuICAgICAgICBwcm9qZWN0UGF0aDogZm9ybWF0UGF0aChFZGl0b3IuUHJvamVjdC5wYXRoKSxcbiAgICAgICAgZGVzaWduUmVzb2x1dGlvbixcbiAgICAgICAgcHJldmlld0lwLFxuICAgICAgICBwcmV2aWV3UG9ydCxcbiAgICB9KTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvYXBwbGljYXRpb24uanMnKSwgYXBwSnNTb3VyY2UsICd1dGY4Jyk7XG5cbiAgICAvLyDmoLnmja7lgY/lpb3orr7nva7vvIzmm7TmlrDmqKHmi5/lmajphY3nva7mlofku7ZcbiAgICBhd2FpdCBnZW5lcmF0ZVNpbXVsYXRvckNvbmZpZygpO1xuXG4gICAgLy8g6L+Q6KGM5qih5ouf5ZmoXG4gICAgLy8gZW52aXJvbm1lbnRcbiAgICAvLyBUT0RPOiDliJ3lp4vljJbnjq/looPlj5jph49cbiAgICAvLyBlbnYgPSB7XG4gICAgLy8gICAgIENPQ09TX0ZSQU1FV09SS1M6IFBhdGguam9pbihjb2Nvc1Jvb3QsICcuLi8nKSxcbiAgICAvLyAgICAgQ09DT1NfWF9ST09UOiBjb2Nvc1Jvb3QsXG4gICAgLy8gICAgIENPQ09TX0NPTlNPTEVfUk9PVDogY29jb3NDb25zb2xlUm9vdCxcbiAgICAvLyAgICAgTkRLX1JPT1Q6IG5ka1Jvb3QsXG4gICAgLy8gICAgIEFORFJPSURfU0RLX1JPT1Q6IGFuZHJvaWRTREtSb290XG4gICAgLy8gfTtcblxuICAgIC8vIC8vIGZvcm1hdCBlbnZpcm9ubWVudCBzdHJpbmdcbiAgICAvLyBlbnZTdHIgPSAnJztcbiAgICAvLyBmb3IgKGxldCBrIGluIGVudikge1xuICAgIC8vICAgICBpZiAoZW52U3RyICE9PSAnJykge1xuICAgIC8vICAgICAgICAgZW52U3RyICs9ICc7JztcbiAgICAvLyAgICAgfVxuXG4gICAgLy8gICAgIGVudlN0ciArPSBgJHtrfT0ke2VudltrXX1gO1xuICAgIC8vIH1cbiAgICAvLyBsZXQgYXJncyA9IFsnLXdvcmtkaXInLCBzaW11bGF0b3JSZXNvdXJjZXMsICctd3JpdGFibGUtcGF0aCcsIHNpbXVsYXRvclJlc291cmNlcywgJy1jb25zb2xlJywgJ2ZhbHNlJywgJy0tZW52JywgZW52U3RyXTtcbiAgICBjb25zdCBhcmdzID0gWyctd29ya2RpcicsIHNpbXVsYXRvclJlc291cmNlcywgJy13cml0YWJsZS1wYXRoJywgc2ltdWxhdG9yUmVzb3VyY2VzLCAnLWNvbnNvbGUnLCAnZmFsc2UnXTtcbiAgICBzaW11bGF0b3JQcm9jZXNzID0gc3Bhd24oZXhlY3V0YWJsZVNpbXVsYXRvciwgYXJncyk7XG5cbiAgICAvLyDmiZPlvIDmqKHmi5/lmajosIPor5XlmahcbiAgICBpZiAocHJlZmVyZW5jZS5zaG93RGVidWdQYW5lbCkge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5QYW5lbC5vcGVuKCdwcmV2aWV3LmRlYnVnZ2VyJyk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgIH1cblxuICAgIC8vIOebkeWQrOaooeaLn+WZqOi/m+eoi+eahOi+k+WHulxuICAgIHNpbXVsYXRvclByb2Nlc3Mub24oJ2Nsb3NlJywgKCkgPT4ge1xuICAgICAgICBFZGl0b3IuUGFuZWwuY2xvc2UoJ3ByZXZpZXcuZGVidWdnZXInKTtcbiAgICB9KTtcbiAgICBzaW11bGF0b3JQcm9jZXNzLnN0ZG91dD8ub24oJ2RhdGEnLCBkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YS50b1N0cmluZyA/IGRhdGEudG9TdHJpbmcoKSA6IGRhdGEpO1xuICAgIH0pO1xuICAgIHNpbXVsYXRvclByb2Nlc3Muc3RkZXJyPy5vbignZGF0YScsIGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGRhdGEudG9TdHJpbmcgPyBkYXRhLnRvU3RyaW5nKCkgOiBkYXRhKTtcbiAgICB9KTtcbiAgICBzaW11bGF0b3JQcm9jZXNzLm9uKCdlcnJvcicsIGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGRhdGEudG9TdHJpbmcgPyBkYXRhLnRvU3RyaW5nKCkgOiBkYXRhKTtcbiAgICB9KTtcbn1cbiJdfQ==