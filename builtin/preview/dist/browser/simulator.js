"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
const build_time_constants_1 = require("@cocos/build-engine/dist/build-time-constants");
const builtin_module_provider_1 = require("@editor/lib-programming/dist/builtin-module-provider");
const stats_query_1 = require("@cocos/build-engine/dist/stats-query");
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
        tree_kill_1.default(simulatorProcess.pid);
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
        throw new Error(`构建 settings 出错`);
    }
    // 启动场景
    let previewSceneJson;
    const previewScene = await Editor.Profile.getConfig('preview', `general.start_scene`);
    if (previewScene === 'current_scene') {
        previewSceneJson = await Editor.Message.request('scene', 'query-scene-json');
    }
    else {
        const previewScenePath = await Editor.Message.request('asset-db', 'query-path', previewScene);
        previewSceneJson = await fs_extra_1.readFile(previewScenePath, 'utf8');
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
    let preference = await simulator_utils_1.getSimulatorPreference();
    // 路径处理
    let isDarwin = process.platform === 'darwin';
    let jsEnginePath = await simulator_utils_1.getJsEnginePath();
    let nativeEnginePath = await simulator_utils_1.getNativeEnginePath();
    let simulatorRoot = path_1.join(nativeEnginePath, isDarwin ? 'simulator/Debug/SimulatorApp-Mac.app' : 'simulator/Debug');
    let simulatorResources = isDarwin ? path_1.join(simulatorRoot, 'Contents/Resources') : simulatorRoot;
    let executableSimulator = isDarwin ? path_1.join(simulatorRoot, 'Contents/MacOS/SimulatorApp-Mac') : path_1.join(simulatorRoot, 'SimulatorApp-Win32.exe');
    fs_extra_1.ensureDirSync(path_1.join(simulatorResources, 'jsb-adapter'));
    fs_extra_1.ensureDirSync(path_1.join(simulatorResources, 'src/cocos-js'));
    // 清空缓存
    await fs_extra_1.emptyDir(path_1.join(simulatorResources, 'assets'));
    let autoCleanCache = await Editor.Profile.getConfig('preview', `preview.auto_clean_cache`);
    if (autoCleanCache) {
        await fs_extra_1.emptyDir(path_1.join(simulatorResources, 'gamecaches'));
    }
    // 编译 adapter
    await Editor.Message.request('native', 'compile-jsb-adapter');
    // 根据偏好设置的模块配置，生成 cc.js 到 static/simulator/cocos-js 目录
    // TODO: 使用 QUICK_COMPILE 编译 engine
    const ccModuleFile = path_1.join(simulatorResources, 'src/cocos-js/cc.js');
    const cceCodeQualityFile = path_1.join(simulatorResources, 'src/builtin/cce.code-quality.cr.js');
    const cceEnvFile = path_1.join(simulatorResources, 'src/builtin/cce.env.js');
    fs_extra_1.ensureDirSync(path_1.dirname(ccModuleFile));
    fs_extra_1.ensureDirSync(path_1.dirname(cceCodeQualityFile));
    const buildTimeConstants = build_time_constants_1.setupBuildTimeConstants({
        mode: 'PREVIEW',
        platform: 'NATIVE',
        flags: {
            DEBUG: true,
        },
    });
    const statsQuery = await stats_query_1.StatsQuery.create(jsEnginePath);
    const features = (await Editor.Profile.getProject('engine', 'modules.includeModules')) || [];
    const featureUnits = statsQuery.getUnitsOfFeatures(features);
    const { build } = await Promise.resolve().then(() => __importStar(require('@cocos/build-engine/dist/index')));
    const { code: indexMod } = await build.transform(statsQuery.evaluateIndexModuleSource(featureUnits, (moduleName) => moduleName), build_engine_1.ModuleOption.system);
    const builtinModuleProvider = await builtin_module_provider_1.BuiltinModuleProvider.create({ format: 'systemjs' });
    await Promise.all([
        builtinModuleProvider.addBuildTimeConstantsMod(buildTimeConstants),
    ]);
    await fs_extra_1.writeFile(ccModuleFile, indexMod, 'utf8');
    await fs_extra_1.writeFile(cceCodeQualityFile, builtinModuleProvider.modules['cce:code-quality/cr'], 'utf8');
    await fs_extra_1.writeFile(cceEnvFile, builtinModuleProvider.modules['cc/env'], 'utf8');
    // 拷贝文件
    let toCopy = [
        // 拷贝 jsb-adapter
        {
            src: path_1.join(jsEnginePath, 'bin/.cache/dev/native-preview-adapter/jsb-builtin.js'),
            dest: path_1.join(simulatorResources, 'jsb-adapter/jsb-builtin.js'),
            isDir: false,
        },
        {
            src: path_1.join(jsEnginePath, 'bin/.cache/dev/native-preview-adapter/jsb-engine.js'),
            dest: path_1.join(simulatorResources, 'jsb-adapter/jsb-engine.js'),
            isDir: false,
        },
        // 拷贝 engine, import-map.json
        {
            src: path_1.join(jsEnginePath, 'bin/.cache/dev/native-preview'),
            dest: path_1.join(simulatorResources, 'src/cocos-js'),
            isDir: true,
        },
        {
            src: path_1.join(__dirname, '../../static/simulator/import-map.json'),
            dest: path_1.join(simulatorResources, 'src/import-map.json'),
            isDir: false,
        },
        {
            src: path_1.join(__dirname, '../../static/simulator/system.bundle.js'),
            dest: path_1.join(simulatorResources, 'src/system.bundle.js'),
            isDir: false,
        },
        {
            src: path_1.join(__dirname, '../../static/simulator/polyfills.bundle.js'),
            dest: path_1.join(simulatorResources, 'src/polyfills.bundle.js'),
            isDir: false,
        },
    ];
    toCopy.forEach(item => {
        if (item.isDir) {
            simulator_utils_1.copyDirSync(item.src, item.dest);
        }
        else {
            fs_extra_1.copyFileSync(item.src, item.dest);
        }
    });
    // 写入 settings.js
    let data = await generatePreviewData();
    await fs_extra_1.writeFile(path_1.join(simulatorResources, 'src/settings.json'), JSON.stringify(data.settings, undefined, 2));
    for (let i = 0; i < data.bundleConfigs.length; ++i) {
        let config = data.bundleConfigs[i];
        let bundleDir = path_1.join(simulatorResources, 'assets', config.name);
        fs_extra_1.ensureDirSync(bundleDir);
        // 删除 importBase 和 nativeBase，使用 generalBase
        // @ts-ignore
        delete config.importBase;
        // @ts-ignore
        delete config.nativeBase;
        await fs_extra_1.writeFile(path_1.join(bundleDir, 'cc.config.json'), JSON.stringify(config, undefined, 2));
        // TODO: 目前的实现跟 web 预览一样，一次性加载所有脚本
        let bundleEntry = [];
        if (config.name === 'main') {
            bundleEntry.push('cce:/internal/x/prerequisite-imports');
        }
        let bundleIndexJsSource = await ejs_1.default.renderFile(path_1.join(__dirname, '../../static/simulator/bundleIndex.ejs'), {
            bundleName: config.name,
            bundleEntry,
        });
        await fs_extra_1.writeFile(path_1.join(bundleDir, 'index.js'), bundleIndexJsSource, 'utf8');
    }
    // 写入初始场景数据
    let previewSceneJsonPath = path_1.join(simulatorResources, 'preview-scene.json');
    previewSceneJsonPath = simulator_utils_1.formatPath(previewSceneJsonPath);
    await fs_extra_1.writeFile(previewSceneJsonPath, data.previewSceneJson, 'utf8');
    // 生成 main.js
    let previewPort = await Editor.Message.request('server', 'query-port');
    let previewIp = await Editor.Message.request('preview', 'get-preview-ip');
    let mainJsSource = await ejs_1.default.renderFile(path_1.join(__dirname, '../../static/simulator/main.ejs'), {
        libraryPath: simulator_utils_1.formatPath(path_1.join(Editor.Project.path, 'library')),
        waitForConnect: preference.waitForConnect,
        projectPath: simulator_utils_1.formatPath(Editor.Project.path),
        previewIp,
        previewPort,
    });
    await fs_extra_1.writeFile(path_1.join(simulatorResources, 'main.js'), mainJsSource, 'utf8');
    // 生成 application.js
    let includeModules = await Editor.Profile.getProject('engine', 'modules.includeModules');
    let hasPhysicsAmmo = includeModules.includes('physics-ammo');
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
    let appJsSource = await ejs_1.default.renderFile(path_1.join(__dirname, '../../static/simulator/application.ejs'), {
        hasPhysicsAmmo,
        previewSceneJsonPath,
        libraryPath: simulator_utils_1.formatPath(path_1.join(Editor.Project.path, 'library')),
        designResolution,
    });
    await fs_extra_1.writeFile(path_1.join(simulatorResources, 'src/application.js'), appJsSource, 'utf8');
    // 根据偏好设置，更新模拟器配置文件
    await simulator_utils_1.generateSimulatorConfig();
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
    let args = ['-workdir', simulatorResources, '-writable-path', simulatorResources, '-console', 'false'];
    simulatorProcess = child_process_1.spawn(executableSimulator, args);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltdWxhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2Jyb3dzZXIvc2ltdWxhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBcUM7QUFDckMsOENBQXNCO0FBQ3RCLHVDQUFzRjtBQUN0RixpREFBb0Q7QUFDcEQsMERBQWlDO0FBQ2pDLHdGQUF3RjtBQUN4RixrR0FBNkY7QUFDN0Ysc0VBQWtFO0FBQ2xFLHNEQUFtRDtBQUNuRCx1REFBbUo7QUFFbkosSUFBSyxnQkFNSjtBQU5ELFdBQUssZ0JBQWdCO0lBQ2pCLG1GQUFrQixDQUFBO0lBQ2xCLG1GQUFrQixDQUFBO0lBQ2xCLGlGQUFpQixDQUFBO0lBQ2pCLHlGQUFxQixDQUFBO0lBQ3JCLHVGQUFvQixDQUFBO0FBQ3hCLENBQUMsRUFOSSxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBTXBCO0FBQ0QsSUFBSSxnQkFBcUMsQ0FBQyxDQUFFLGdCQUFnQjtBQUU1RCxTQUFTLG9CQUFvQjtJQUN6QixJQUFJLGdCQUFnQixFQUFFO1FBQ2xCLG1CQUFRLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO0tBQzNCO0FBQ0wsQ0FBQztBQUVELEtBQUssVUFBVSxtQkFBbUI7SUFDOUIsMEJBQTBCO0lBQzFCLE1BQU0sSUFBSSxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLG1CQUFtQixFQUFFO1FBQ3RFLElBQUksRUFBRSxXQUFXO1FBQ2pCLFFBQVEsRUFBRSxTQUFTO0tBQ3RCLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0tBQ3JDO0lBRUQsT0FBTztJQUNQLElBQUks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QUNaO0lBRUQsYUFBYTtJQUNiLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO1FBQzlCLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDM0MsQ0FBQyxDQUFDLENBQUM7SUFDSCxNQUFBLGdCQUFnQixDQUFDLE1BQU0sMENBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRTtRQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEQsQ0FBQyxFQUFFO0lBQ0gsTUFBQSxnQkFBZ0IsQ0FBQyxNQUFNLDBDQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUU7UUFDdkMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hELENBQUMsRUFBRTtJQUNILGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEVBQUU7UUFDaEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hELENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQTlORCxvQ0E4TkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkaXJuYW1lLCBqb2luIH0gZnJvbSBcInBhdGhcIjtcbmltcG9ydCBFanMgZnJvbSAnZWpzJztcbmltcG9ydCB7IHdyaXRlRmlsZSwgY29weUZpbGVTeW5jLCBlbnN1cmVEaXJTeW5jLCBlbXB0eURpciwgcmVhZEZpbGUgfSBmcm9tIFwiZnMtZXh0cmFcIjtcbmltcG9ydCB7IENoaWxkUHJvY2Vzcywgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCB0cmVlS2lsbCBmcm9tICd0cmVlLWtpbGwnO1xuaW1wb3J0IHsgc2V0dXBCdWlsZFRpbWVDb25zdGFudHMgfSBmcm9tICdAY29jb3MvYnVpbGQtZW5naW5lL2Rpc3QvYnVpbGQtdGltZS1jb25zdGFudHMnO1xuaW1wb3J0IHsgQnVpbHRpbk1vZHVsZVByb3ZpZGVyIH0gZnJvbSBcIkBlZGl0b3IvbGliLXByb2dyYW1taW5nL2Rpc3QvYnVpbHRpbi1tb2R1bGUtcHJvdmlkZXJcIjtcbmltcG9ydCB7IFN0YXRzUXVlcnkgfSBmcm9tICdAY29jb3MvYnVpbGQtZW5naW5lL2Rpc3Qvc3RhdHMtcXVlcnknO1xuaW1wb3J0IHsgTW9kdWxlT3B0aW9uIH0gZnJvbSAnQGNvY29zL2J1aWxkLWVuZ2luZSc7XG5pbXBvcnQgeyBjb3B5RGlyU3luYywgZm9ybWF0UGF0aCwgZ2VuZXJhdGVTaW11bGF0b3JDb25maWcsIGdldEpzRW5naW5lUGF0aCwgZ2V0TmF0aXZlRW5naW5lUGF0aCwgZ2V0U2ltdWxhdG9yUHJlZmVyZW5jZSB9IGZyb20gXCIuL3NpbXVsYXRvci11dGlsc1wiO1xuXG5lbnVtIFJlc29sdXRpb25Qb2xpY3kge1xuICAgIFJlc29sdXRpb25FeGFjdEZpdCxcbiAgICBSZXNvbHV0aW9uTm9Cb3JkZXIsXG4gICAgUmVzb2x1dGlvblNob3dBbGwsXG4gICAgUmVzb2x1dGlvbkZpeGVkSGVpZ2h0LFxuICAgIFJlc29sdXRpb25GaXhlZFdpZHRoLFxufVxubGV0IHNpbXVsYXRvclByb2Nlc3M6IENoaWxkUHJvY2VzcyB8IG51bGw7ICAvLyDmoIfor4bmqKHmi5/lmajpooTop4jov5vnqIvmmK/lkKblrZjlnKhcblxuZnVuY3Rpb24gc3RvcFNpbXVsYXRvclByb2Nlc3MgKCkge1xuICAgIGlmIChzaW11bGF0b3JQcm9jZXNzKSB7XG4gICAgICAgIHRyZWVLaWxsKHNpbXVsYXRvclByb2Nlc3MucGlkKTtcbiAgICAgICAgc2ltdWxhdG9yUHJvY2VzcyA9IG51bGw7XG4gICAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBnZW5lcmF0ZVByZXZpZXdEYXRhICgpIHtcbiAgICAvLyDmqKHmi5/lmajpooTop4jkuI3pnIDopoEgbGF1bmNoU2NlbmUg5pWw5o2uXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3ByZXZpZXcnLCAnZ2VuZXJhdGUtc2V0dGluZ3MnLCB7XG4gICAgICAgIHR5cGU6ICdzaW11bGF0b3InLFxuICAgICAgICBwbGF0Zm9ybTogJ3dpbmRvd3MnLFxuICAgIH0pO1xuXG4gICAgaWYgKCEoZGF0YSAmJiBkYXRhLnNldHRpbmdzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOaehOW7uiBzZXR0aW5ncyDlh7rplJlgKTtcbiAgICB9XG5cbiAgICAvLyDlkK/liqjlnLrmma9cbiAgICBsZXQgcHJldmlld1NjZW5lSnNvbjogc3RyaW5nO1xuICAgIGNvbnN0IHByZXZpZXdTY2VuZSA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldENvbmZpZygncHJldmlldycsIGBnZW5lcmFsLnN0YXJ0X3NjZW5lYCk7XG4gICAgaWYgKHByZXZpZXdTY2VuZSA9PT0gJ2N1cnJlbnRfc2NlbmUnKSB7XG4gICAgICAgIHByZXZpZXdTY2VuZUpzb24gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1zY2VuZS1qc29uJyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zdCBwcmV2aWV3U2NlbmVQYXRoID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktcGF0aCcsIHByZXZpZXdTY2VuZSkgYXMgc3RyaW5nO1xuICAgICAgICBwcmV2aWV3U2NlbmVKc29uID0gYXdhaXQgcmVhZEZpbGUocHJldmlld1NjZW5lUGF0aCwgJ3V0ZjgnKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcHJldmlld1NjZW5lSnNvbixcbiAgICAgICAgc2V0dGluZ3M6IGRhdGEuc2V0dGluZ3MsXG4gICAgICAgIGJ1bmRsZUNvbmZpZ3M6IGRhdGEuYnVuZGxlQ29uZmlncyxcbiAgICB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuU2ltdWxhdG9yICgpIHtcbiAgICAvLyDlhbPpl63mqKHmi5/lmahcbiAgICBzdG9wU2ltdWxhdG9yUHJvY2VzcygpO1xuICAgIFxuICAgIC8vIOiOt+WPluaooeaLn+WZqOWBj+Wlveiuvue9rlxuICAgIGxldCBwcmVmZXJlbmNlID0gYXdhaXQgZ2V0U2ltdWxhdG9yUHJlZmVyZW5jZSgpO1xuXG4gICAgLy8g6Lev5b6E5aSE55CGXG4gICAgbGV0IGlzRGFyd2luID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2Rhcndpbic7XG4gICAgbGV0IGpzRW5naW5lUGF0aCA9IGF3YWl0IGdldEpzRW5naW5lUGF0aCgpO1xuICAgIGxldCBuYXRpdmVFbmdpbmVQYXRoID0gYXdhaXQgZ2V0TmF0aXZlRW5naW5lUGF0aCgpO1xuICAgIGxldCBzaW11bGF0b3JSb290ID0gam9pbihuYXRpdmVFbmdpbmVQYXRoLCBpc0Rhcndpbj8gJ3NpbXVsYXRvci9EZWJ1Zy9TaW11bGF0b3JBcHAtTWFjLmFwcCc6ICdzaW11bGF0b3IvRGVidWcnKTtcbiAgICBsZXQgc2ltdWxhdG9yUmVzb3VyY2VzID0gaXNEYXJ3aW4/IGpvaW4oc2ltdWxhdG9yUm9vdCwgJ0NvbnRlbnRzL1Jlc291cmNlcycpOiBzaW11bGF0b3JSb290O1xuICAgIGxldCBleGVjdXRhYmxlU2ltdWxhdG9yID0gaXNEYXJ3aW4/IGpvaW4oc2ltdWxhdG9yUm9vdCwgJ0NvbnRlbnRzL01hY09TL1NpbXVsYXRvckFwcC1NYWMnKTogam9pbihzaW11bGF0b3JSb290LCAnU2ltdWxhdG9yQXBwLVdpbjMyLmV4ZScpO1xuXG4gICAgZW5zdXJlRGlyU3luYyhqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2pzYi1hZGFwdGVyJykpO1xuICAgIGVuc3VyZURpclN5bmMoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvY29jb3MtanMnKSk7XG4gICAgLy8g5riF56m657yT5a2YXG4gICAgYXdhaXQgZW1wdHlEaXIoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdhc3NldHMnKSk7XG4gICAgbGV0IGF1dG9DbGVhbkNhY2hlID0gYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0Q29uZmlnKCdwcmV2aWV3JywgYHByZXZpZXcuYXV0b19jbGVhbl9jYWNoZWApO1xuICAgIGlmIChhdXRvQ2xlYW5DYWNoZSkge1xuICAgICAgICBhd2FpdCBlbXB0eURpcihqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2dhbWVjYWNoZXMnKSk7XG4gICAgfVxuXG4gICAgLy8g57yW6K+RIGFkYXB0ZXJcbiAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCduYXRpdmUnLCAnY29tcGlsZS1qc2ItYWRhcHRlcicpO1xuXG4gICAgLy8g5qC55o2u5YGP5aW96K6+572u55qE5qih5Z2X6YWN572u77yM55Sf5oiQIGNjLmpzIOWIsCBzdGF0aWMvc2ltdWxhdG9yL2NvY29zLWpzIOebruW9lVxuICAgIC8vIFRPRE86IOS9v+eUqCBRVUlDS19DT01QSUxFIOe8luivkSBlbmdpbmVcbiAgICBjb25zdCBjY01vZHVsZUZpbGUgPSBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9jb2Nvcy1qcy9jYy5qcycpO1xuICAgIGNvbnN0IGNjZUNvZGVRdWFsaXR5RmlsZSA9IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2J1aWx0aW4vY2NlLmNvZGUtcXVhbGl0eS5jci5qcycpO1xuICAgIGNvbnN0IGNjZUVudkZpbGUgPSBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9idWlsdGluL2NjZS5lbnYuanMnKTtcbiAgICBlbnN1cmVEaXJTeW5jKGRpcm5hbWUoY2NNb2R1bGVGaWxlKSk7XG4gICAgZW5zdXJlRGlyU3luYyhkaXJuYW1lKGNjZUNvZGVRdWFsaXR5RmlsZSkpO1xuICAgIGNvbnN0IGJ1aWxkVGltZUNvbnN0YW50cyA9IHNldHVwQnVpbGRUaW1lQ29uc3RhbnRzKHtcbiAgICAgICAgbW9kZTogJ1BSRVZJRVcnLFxuICAgICAgICBwbGF0Zm9ybTogJ05BVElWRScsXG4gICAgICAgIGZsYWdzOiB7XG4gICAgICAgICAgICBERUJVRzogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHN0YXRzUXVlcnkgPSBhd2FpdCBTdGF0c1F1ZXJ5LmNyZWF0ZShqc0VuZ2luZVBhdGgpO1xuICAgIFxuICAgIGNvbnN0IGZlYXR1cmVzID0gKGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldFByb2plY3QoJ2VuZ2luZScsICdtb2R1bGVzLmluY2x1ZGVNb2R1bGVzJykpIHx8IFtdO1xuICAgIGNvbnN0IGZlYXR1cmVVbml0cyA9IHN0YXRzUXVlcnkuZ2V0VW5pdHNPZkZlYXR1cmVzKGZlYXR1cmVzKTtcbiAgICBjb25zdCB7IGJ1aWxkIH0gPSBhd2FpdCBpbXBvcnQoJ0Bjb2Nvcy9idWlsZC1lbmdpbmUvZGlzdC9pbmRleCcpO1xuICAgIGNvbnN0IHsgY29kZTogaW5kZXhNb2QgfSA9IGF3YWl0IGJ1aWxkLnRyYW5zZm9ybShzdGF0c1F1ZXJ5LmV2YWx1YXRlSW5kZXhNb2R1bGVTb3VyY2UoXG4gICAgICAgIGZlYXR1cmVVbml0cyxcbiAgICAgICAgKG1vZHVsZU5hbWUpID0+IG1vZHVsZU5hbWUsIC8vIOWSjCBxdWljayBjb21waWxlciDnu5nnmoTliY3nvIDkuIDoh7QsXG4gICAgKSwgTW9kdWxlT3B0aW9uLnN5c3RlbSk7XG4gICAgY29uc3QgYnVpbHRpbk1vZHVsZVByb3ZpZGVyID0gYXdhaXQgQnVpbHRpbk1vZHVsZVByb3ZpZGVyLmNyZWF0ZSh7IGZvcm1hdDogJ3N5c3RlbWpzJyB9KTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgIGJ1aWx0aW5Nb2R1bGVQcm92aWRlci5hZGRCdWlsZFRpbWVDb25zdGFudHNNb2QoYnVpbGRUaW1lQ29uc3RhbnRzKSxcbiAgICBdKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoY2NNb2R1bGVGaWxlLCBpbmRleE1vZCwgJ3V0ZjgnKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoY2NlQ29kZVF1YWxpdHlGaWxlLCBidWlsdGluTW9kdWxlUHJvdmlkZXIubW9kdWxlc1snY2NlOmNvZGUtcXVhbGl0eS9jciddLCAndXRmOCcpO1xuICAgIGF3YWl0IHdyaXRlRmlsZShjY2VFbnZGaWxlLCBidWlsdGluTW9kdWxlUHJvdmlkZXIubW9kdWxlc1snY2MvZW52J10sICd1dGY4Jyk7XG5cbiAgICAvLyDmi7fotJ3mlofku7ZcbiAgICBsZXQgdG9Db3B5ID0gW1xuICAgICAgICAvLyDmi7fotJ0ganNiLWFkYXB0ZXJcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKGpzRW5naW5lUGF0aCwgJ2Jpbi8uY2FjaGUvZGV2L25hdGl2ZS1wcmV2aWV3LWFkYXB0ZXIvanNiLWJ1aWx0aW4uanMnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnanNiLWFkYXB0ZXIvanNiLWJ1aWx0aW4uanMnKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKGpzRW5naW5lUGF0aCwgJ2Jpbi8uY2FjaGUvZGV2L25hdGl2ZS1wcmV2aWV3LWFkYXB0ZXIvanNiLWVuZ2luZS5qcycpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdqc2ItYWRhcHRlci9qc2ItZW5naW5lLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOaLt+i0nSBlbmdpbmUsIGltcG9ydC1tYXAuanNvblxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oanNFbmdpbmVQYXRoLCAnYmluLy5jYWNoZS9kZXYvbmF0aXZlLXByZXZpZXcnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2NvY29zLWpzJyksXG4gICAgICAgICAgICBpc0RpcjogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3IvaW1wb3J0LW1hcC5qc29uJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9pbXBvcnQtbWFwLmpzb24nKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3Ivc3lzdGVtLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvc3lzdGVtLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgaXNEaXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9wb2x5ZmlsbHMuYnVuZGxlLmpzJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9wb2x5ZmlsbHMuYnVuZGxlLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgXTtcbiAgICB0b0NvcHkuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgaWYgKGl0ZW0uaXNEaXIpIHtcbiAgICAgICAgICAgIGNvcHlEaXJTeW5jKGl0ZW0uc3JjLCBpdGVtLmRlc3QpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29weUZpbGVTeW5jKGl0ZW0uc3JjLCBpdGVtLmRlc3QpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyDlhpnlhaUgc2V0dGluZ3MuanNcbiAgICBsZXQgZGF0YSA9IGF3YWl0IGdlbmVyYXRlUHJldmlld0RhdGEoKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvc2V0dGluZ3MuanNvbicpLCBKU09OLnN0cmluZ2lmeShkYXRhLnNldHRpbmdzLCB1bmRlZmluZWQsIDIpKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEuYnVuZGxlQ29uZmlncy5sZW5ndGg7ICsraSkge1xuICAgICAgICBsZXQgY29uZmlnID0gZGF0YS5idW5kbGVDb25maWdzW2ldO1xuICAgICAgICBsZXQgYnVuZGxlRGlyID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdhc3NldHMnLCBjb25maWcubmFtZSk7XG4gICAgICAgIGVuc3VyZURpclN5bmMoYnVuZGxlRGlyKTtcbiAgICAgICAgLy8g5Yig6ZmkIGltcG9ydEJhc2Ug5ZKMIG5hdGl2ZUJhc2XvvIzkvb/nlKggZ2VuZXJhbEJhc2VcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBkZWxldGUgY29uZmlnLmltcG9ydEJhc2U7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZGVsZXRlIGNvbmZpZy5uYXRpdmVCYXNlO1xuICAgICAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihidW5kbGVEaXIsICdjYy5jb25maWcuanNvbicpLCBKU09OLnN0cmluZ2lmeShjb25maWcsIHVuZGVmaW5lZCwgMikpO1xuICAgICAgICAvLyBUT0RPOiDnm67liY3nmoTlrp7njrDot58gd2ViIOmihOiniOS4gOagt++8jOS4gOasoeaAp+WKoOi9veaJgOacieiEmuacrFxuICAgICAgICBsZXQgYnVuZGxlRW50cnkgPSBbXTtcbiAgICAgICAgaWYgKGNvbmZpZy5uYW1lID09PSAnbWFpbicpIHtcbiAgICAgICAgICAgIGJ1bmRsZUVudHJ5LnB1c2goJ2NjZTovaW50ZXJuYWwveC9wcmVyZXF1aXNpdGUtaW1wb3J0cycpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBidW5kbGVJbmRleEpzU291cmNlID0gYXdhaXQgRWpzLnJlbmRlckZpbGUoam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL2J1bmRsZUluZGV4LmVqcycpLCB7XG4gICAgICAgICAgICBidW5kbGVOYW1lOiBjb25maWcubmFtZSxcbiAgICAgICAgICAgIGJ1bmRsZUVudHJ5LFxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oYnVuZGxlRGlyLCAnaW5kZXguanMnKSwgYnVuZGxlSW5kZXhKc1NvdXJjZSwgJ3V0ZjgnKTtcbiAgICB9XG5cbiAgICAvLyDlhpnlhaXliJ3lp4vlnLrmma/mlbDmja5cbiAgICBsZXQgcHJldmlld1NjZW5lSnNvblBhdGggPSBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3ByZXZpZXctc2NlbmUuanNvbicpO1xuICAgIHByZXZpZXdTY2VuZUpzb25QYXRoID0gZm9ybWF0UGF0aChwcmV2aWV3U2NlbmVKc29uUGF0aCk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKHByZXZpZXdTY2VuZUpzb25QYXRoLCBkYXRhLnByZXZpZXdTY2VuZUpzb24sICd1dGY4Jyk7XG5cbiAgICAvLyDnlJ/miJAgbWFpbi5qc1xuICAgIGxldCBwcmV2aWV3UG9ydCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NlcnZlcicsICdxdWVyeS1wb3J0Jyk7XG4gICAgbGV0IHByZXZpZXdJcCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3ByZXZpZXcnLCAnZ2V0LXByZXZpZXctaXAnKTtcbiAgICBsZXQgbWFpbkpzU291cmNlID0gYXdhaXQgRWpzLnJlbmRlckZpbGUoam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL21haW4uZWpzJyksIHtcbiAgICAgICAgbGlicmFyeVBhdGg6IGZvcm1hdFBhdGgoam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCAnbGlicmFyeScpKSxcbiAgICAgICAgd2FpdEZvckNvbm5lY3Q6IHByZWZlcmVuY2Uud2FpdEZvckNvbm5lY3QsXG4gICAgICAgIHByb2plY3RQYXRoOiBmb3JtYXRQYXRoKEVkaXRvci5Qcm9qZWN0LnBhdGgpLFxuICAgICAgICBwcmV2aWV3SXAsXG4gICAgICAgIHByZXZpZXdQb3J0LFxuICAgIH0pO1xuICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ21haW4uanMnKSwgbWFpbkpzU291cmNlLCAndXRmOCcpO1xuXG4gICAgLy8g55Sf5oiQIGFwcGxpY2F0aW9uLmpzXG4gICAgbGV0IGluY2x1ZGVNb2R1bGVzID0gYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0UHJvamVjdCgnZW5naW5lJywgJ21vZHVsZXMuaW5jbHVkZU1vZHVsZXMnKTtcbiAgICBsZXQgaGFzUGh5c2ljc0FtbW8gPSBpbmNsdWRlTW9kdWxlcy5pbmNsdWRlcygncGh5c2ljcy1hbW1vJyk7XG4gICAgY29uc3QgcHJvamVjdERhdGEgPSBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRQcm9qZWN0KCdwcm9qZWN0JywgJ2dlbmVyYWwuZGVzaWduUmVzb2x1dGlvbicpO1xuICAgIGxldCByZXNvbHV0aW9uUG9saWN5OiBSZXNvbHV0aW9uUG9saWN5O1xuICAgIGlmIChwcm9qZWN0RGF0YS5maXRXaWR0aCAmJiBwcm9qZWN0RGF0YS5maXRIZWlnaHQpIHtcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuUmVzb2x1dGlvblNob3dBbGw7XG4gICAgfVxuICAgIGVsc2UgaWYgKHByb2plY3REYXRhLmZpdFdpZHRoICYmICFwcm9qZWN0RGF0YS5maXRIZWlnaHQpIHtcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuUmVzb2x1dGlvbkZpeGVkV2lkdGg7XG4gICAgfVxuICAgIGVsc2UgaWYgKCFwcm9qZWN0RGF0YS5maXRXaWR0aCAmJiBwcm9qZWN0RGF0YS5maXRIZWlnaHQpIHtcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuUmVzb2x1dGlvbkZpeGVkSGVpZ2h0O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuUmVzb2x1dGlvbk5vQm9yZGVyO1xuICAgIH1cbiAgICBjb25zdCBkZXNpZ25SZXNvbHV0aW9uID0ge1xuICAgICAgICB3aWR0aDogcHJvamVjdERhdGEud2lkdGgsXG4gICAgICAgIGhlaWdodDogcHJvamVjdERhdGEuaGVpZ2h0LFxuICAgICAgICByZXNvbHV0aW9uUG9saWN5LFxuICAgIH07XG4gICAgbGV0IGFwcEpzU291cmNlID0gYXdhaXQgRWpzLnJlbmRlckZpbGUoam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL2FwcGxpY2F0aW9uLmVqcycpLCB7XG4gICAgICAgIGhhc1BoeXNpY3NBbW1vLFxuICAgICAgICBwcmV2aWV3U2NlbmVKc29uUGF0aCxcbiAgICAgICAgbGlicmFyeVBhdGg6IGZvcm1hdFBhdGgoam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCAnbGlicmFyeScpKSxcbiAgICAgICAgZGVzaWduUmVzb2x1dGlvbixcbiAgICB9KTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvYXBwbGljYXRpb24uanMnKSwgYXBwSnNTb3VyY2UsICd1dGY4Jyk7XG5cbiAgICAvLyDmoLnmja7lgY/lpb3orr7nva7vvIzmm7TmlrDmqKHmi5/lmajphY3nva7mlofku7ZcbiAgICBhd2FpdCBnZW5lcmF0ZVNpbXVsYXRvckNvbmZpZygpO1xuXG4gICAgLy8g6L+Q6KGM5qih5ouf5ZmoXG4gICAgLy8gZW52aXJvbm1lbnRcbiAgICAvLyBUT0RPOiDliJ3lp4vljJbnjq/looPlj5jph49cbiAgICAvLyBlbnYgPSB7XG4gICAgLy8gICAgIENPQ09TX0ZSQU1FV09SS1M6IFBhdGguam9pbihjb2Nvc1Jvb3QsICcuLi8nKSxcbiAgICAvLyAgICAgQ09DT1NfWF9ST09UOiBjb2Nvc1Jvb3QsXG4gICAgLy8gICAgIENPQ09TX0NPTlNPTEVfUk9PVDogY29jb3NDb25zb2xlUm9vdCxcbiAgICAvLyAgICAgTkRLX1JPT1Q6IG5ka1Jvb3QsXG4gICAgLy8gICAgIEFORFJPSURfU0RLX1JPT1Q6IGFuZHJvaWRTREtSb290XG4gICAgLy8gfTtcblxuICAgIC8vIC8vIGZvcm1hdCBlbnZpcm9ubWVudCBzdHJpbmdcbiAgICAvLyBlbnZTdHIgPSAnJztcbiAgICAvLyBmb3IgKGxldCBrIGluIGVudikge1xuICAgIC8vICAgICBpZiAoZW52U3RyICE9PSAnJykge1xuICAgIC8vICAgICAgICAgZW52U3RyICs9ICc7JztcbiAgICAvLyAgICAgfVxuXG4gICAgLy8gICAgIGVudlN0ciArPSBgJHtrfT0ke2VudltrXX1gO1xuICAgIC8vIH1cbiAgICAvLyBsZXQgYXJncyA9IFsnLXdvcmtkaXInLCBzaW11bGF0b3JSZXNvdXJjZXMsICctd3JpdGFibGUtcGF0aCcsIHNpbXVsYXRvclJlc291cmNlcywgJy1jb25zb2xlJywgJ2ZhbHNlJywgJy0tZW52JywgZW52U3RyXTtcbiAgICBsZXQgYXJncyA9IFsnLXdvcmtkaXInLCBzaW11bGF0b3JSZXNvdXJjZXMsICctd3JpdGFibGUtcGF0aCcsIHNpbXVsYXRvclJlc291cmNlcywgJy1jb25zb2xlJywgJ2ZhbHNlJ107XG4gICAgc2ltdWxhdG9yUHJvY2VzcyA9IHNwYXduKGV4ZWN1dGFibGVTaW11bGF0b3IsIGFyZ3MpO1xuXG4gICAgLy8g5omT5byA5qih5ouf5Zmo6LCD6K+V5ZmoXG4gICAgaWYgKHByZWZlcmVuY2Uuc2hvd0RlYnVnUGFuZWwpIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuUGFuZWwub3BlbigncHJldmlldy5kZWJ1Z2dlcicpO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICB9XG5cbiAgICAvLyDnm5HlkKzmqKHmi5/lmajov5vnqIvnmoTovpPlh7pcbiAgICBzaW11bGF0b3JQcm9jZXNzLm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgICAgRWRpdG9yLlBhbmVsLmNsb3NlKCdwcmV2aWV3LmRlYnVnZ2VyJyk7XG4gICAgfSk7XG4gICAgc2ltdWxhdG9yUHJvY2Vzcy5zdGRvdXQ/Lm9uKCdkYXRhJywgZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEudG9TdHJpbmc/IGRhdGEudG9TdHJpbmcoKTogZGF0YSk7XG4gICAgfSk7XG4gICAgc2ltdWxhdG9yUHJvY2Vzcy5zdGRlcnI/Lm9uKCdkYXRhJywgZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZGF0YS50b1N0cmluZz8gZGF0YS50b1N0cmluZygpOiBkYXRhKTtcbiAgICB9KTtcbiAgICBzaW11bGF0b3JQcm9jZXNzLm9uKCdlcnJvcicsIGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGRhdGEudG9TdHJpbmc/IGRhdGEudG9TdHJpbmcoKTogZGF0YSk7XG4gICAgfSk7XG59XG4iXX0=