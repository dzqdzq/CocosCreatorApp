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
        await fs_extra_1.writeFile(path_1.join(bundleDir, 'config.json'), JSON.stringify(config, undefined, 2));
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
    let appJsSource = await ejs_1.default.renderFile(path_1.join(__dirname, '../../static/simulator/application.ejs'), {
        hasPhysicsAmmo,
        previewSceneJsonPath,
        libraryPath: simulator_utils_1.formatPath(path_1.join(Editor.Project.path, 'library')),
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
        Editor.Panel.open('preview.debugger');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltdWxhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2Jyb3dzZXIvc2ltdWxhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBcUM7QUFDckMsOENBQXNCO0FBQ3RCLHVDQUFzRjtBQUN0RixpREFBb0Q7QUFDcEQsMERBQWlDO0FBQ2pDLHdGQUF3RjtBQUN4RixrR0FBNkY7QUFDN0Ysc0VBQWtFO0FBQ2xFLHNEQUFtRDtBQUNuRCx1REFBbUo7QUFFbkosSUFBSSxnQkFBcUMsQ0FBQyxDQUFFLGdCQUFnQjtBQUU1RCxTQUFTLG9CQUFvQjtJQUN6QixJQUFJLGdCQUFnQixFQUFFO1FBQ2xCLG1CQUFRLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO0tBQzNCO0FBQ0wsQ0FBQztBQUVELEtBQUssVUFBVSxtQkFBbUI7SUFDOUIsMEJBQTBCO0lBQzFCLE1BQU0sSUFBSSxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLG1CQUFtQixFQUFFO1FBQ3RFLElBQUksRUFBRSxXQUFXO1FBQ2pCLFFBQVEsRUFBRSxTQUFTO0tBQ3RCLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0tBQ3JDO0lBRUQsT0FBTztJQUNQLElBQUksZ0JBQXdCLENBQUM7SUFDN0IsTUFBTSxZQUFZLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUscUJBQXFCLENBQUMsQ0FBQztJQUN0RixJQUFJLFlBQVksS0FBSyxlQUFlLEVBQUU7UUFDbEMsZ0JBQWdCLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxD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QUVwRCxXQUFXO0lBQ1gsSUFBSSxVQUFVLENBQUMsY0FBYyxFQUFFO1FBQzNCLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7S0FDekM7SUFFRCxhQUFhO0lBQ2IsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7UUFDOUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUMzQyxDQUFDLENBQUMsQ0FBQztJQUNILE1BQUEsZ0JBQWdCLENBQUMsTUFBTSwwQ0FBRSxFQUFFLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxFQUFFO1FBQ3ZDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0RCxDQUFDLEVBQUU7SUFDSCxNQUFBLGdCQUFnQixDQUFDLE1BQU0sMENBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRTtRQUN2QyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEQsQ0FBQyxFQUFFO0lBQ0gsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsRUFBRTtRQUNoQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEQsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBeE1ELG9DQXdNQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRpcm5hbWUsIGpvaW4gfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IEVqcyBmcm9tICdlanMnO1xuaW1wb3J0IHsgd3JpdGVGaWxlLCBjb3B5RmlsZVN5bmMsIGVuc3VyZURpclN5bmMsIGVtcHR5RGlyLCByZWFkRmlsZSB9IGZyb20gXCJmcy1leHRyYVwiO1xuaW1wb3J0IHsgQ2hpbGRQcm9jZXNzLCBzcGF3biB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHRyZWVLaWxsIGZyb20gJ3RyZWUta2lsbCc7XG5pbXBvcnQgeyBzZXR1cEJ1aWxkVGltZUNvbnN0YW50cyB9IGZyb20gJ0Bjb2Nvcy9idWlsZC1lbmdpbmUvZGlzdC9idWlsZC10aW1lLWNvbnN0YW50cyc7XG5pbXBvcnQgeyBCdWlsdGluTW9kdWxlUHJvdmlkZXIgfSBmcm9tIFwiQGVkaXRvci9saWItcHJvZ3JhbW1pbmcvZGlzdC9idWlsdGluLW1vZHVsZS1wcm92aWRlclwiO1xuaW1wb3J0IHsgU3RhdHNRdWVyeSB9IGZyb20gJ0Bjb2Nvcy9idWlsZC1lbmdpbmUvZGlzdC9zdGF0cy1xdWVyeSc7XG5pbXBvcnQgeyBNb2R1bGVPcHRpb24gfSBmcm9tICdAY29jb3MvYnVpbGQtZW5naW5lJztcbmltcG9ydCB7IGNvcHlEaXJTeW5jLCBmb3JtYXRQYXRoLCBnZW5lcmF0ZVNpbXVsYXRvckNvbmZpZywgZ2V0SnNFbmdpbmVQYXRoLCBnZXROYXRpdmVFbmdpbmVQYXRoLCBnZXRTaW11bGF0b3JQcmVmZXJlbmNlIH0gZnJvbSBcIi4vc2ltdWxhdG9yLXV0aWxzXCI7XG5cbmxldCBzaW11bGF0b3JQcm9jZXNzOiBDaGlsZFByb2Nlc3MgfCBudWxsOyAgLy8g5qCH6K+G5qih5ouf5Zmo6aKE6KeI6L+b56iL5piv5ZCm5a2Y5ZyoXG5cbmZ1bmN0aW9uIHN0b3BTaW11bGF0b3JQcm9jZXNzICgpIHtcbiAgICBpZiAoc2ltdWxhdG9yUHJvY2Vzcykge1xuICAgICAgICB0cmVlS2lsbChzaW11bGF0b3JQcm9jZXNzLnBpZCk7XG4gICAgICAgIHNpbXVsYXRvclByb2Nlc3MgPSBudWxsO1xuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVQcmV2aWV3RGF0YSAoKSB7XG4gICAgLy8g5qih5ouf5Zmo6aKE6KeI5LiN6ZyA6KaBIGxhdW5jaFNjZW5lIOaVsOaNrlxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdwcmV2aWV3JywgJ2dlbmVyYXRlLXNldHRpbmdzJywge1xuICAgICAgICB0eXBlOiAnc2ltdWxhdG9yJyxcbiAgICAgICAgcGxhdGZvcm06ICd3aW5kb3dzJyxcbiAgICB9KTtcblxuICAgIGlmICghKGRhdGEgJiYgZGF0YS5zZXR0aW5ncykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDmnoTlu7ogc2V0dGluZ3Mg5Ye66ZSZYCk7XG4gICAgfVxuXG4gICAgLy8g5ZCv5Yqo5Zy65pmvXG4gICAgbGV0IHByZXZpZXdTY2VuZUpzb246IHN0cmluZztcbiAgICBjb25zdCBwcmV2aWV3U2NlbmUgPSBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRDb25maWcoJ3ByZXZpZXcnLCBgZ2VuZXJhbC5zdGFydF9zY2VuZWApO1xuICAgIGlmIChwcmV2aWV3U2NlbmUgPT09ICdjdXJyZW50X3NjZW5lJykge1xuICAgICAgICBwcmV2aWV3U2NlbmVKc29uID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktc2NlbmUtanNvbicpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29uc3QgcHJldmlld1NjZW5lUGF0aCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXBhdGgnLCBwcmV2aWV3U2NlbmUpIGFzIHN0cmluZztcbiAgICAgICAgcHJldmlld1NjZW5lSnNvbiA9IGF3YWl0IHJlYWRGaWxlKHByZXZpZXdTY2VuZVBhdGgsICd1dGY4Jyk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHByZXZpZXdTY2VuZUpzb24sXG4gICAgICAgIHNldHRpbmdzOiBkYXRhLnNldHRpbmdzLFxuICAgICAgICBidW5kbGVDb25maWdzOiBkYXRhLmJ1bmRsZUNvbmZpZ3MsXG4gICAgfTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1blNpbXVsYXRvciAoKSB7XG4gICAgLy8g5YWz6Zet5qih5ouf5ZmoXG4gICAgc3RvcFNpbXVsYXRvclByb2Nlc3MoKTtcbiAgICBcbiAgICAvLyDojrflj5bmqKHmi5/lmajlgY/lpb3orr7nva5cbiAgICBsZXQgcHJlZmVyZW5jZSA9IGF3YWl0IGdldFNpbXVsYXRvclByZWZlcmVuY2UoKTtcblxuICAgIC8vIOi3r+W+hOWkhOeQhlxuICAgIGxldCBpc0RhcndpbiA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nO1xuICAgIGxldCBqc0VuZ2luZVBhdGggPSBhd2FpdCBnZXRKc0VuZ2luZVBhdGgoKTtcbiAgICBsZXQgbmF0aXZlRW5naW5lUGF0aCA9IGF3YWl0IGdldE5hdGl2ZUVuZ2luZVBhdGgoKTtcbiAgICBsZXQgc2ltdWxhdG9yUm9vdCA9IGpvaW4obmF0aXZlRW5naW5lUGF0aCwgaXNEYXJ3aW4/ICdzaW11bGF0b3IvRGVidWcvU2ltdWxhdG9yQXBwLU1hYy5hcHAnOiAnc2ltdWxhdG9yL0RlYnVnJyk7XG4gICAgbGV0IHNpbXVsYXRvclJlc291cmNlcyA9IGlzRGFyd2luPyBqb2luKHNpbXVsYXRvclJvb3QsICdDb250ZW50cy9SZXNvdXJjZXMnKTogc2ltdWxhdG9yUm9vdDtcbiAgICBsZXQgZXhlY3V0YWJsZVNpbXVsYXRvciA9IGlzRGFyd2luPyBqb2luKHNpbXVsYXRvclJvb3QsICdDb250ZW50cy9NYWNPUy9TaW11bGF0b3JBcHAtTWFjJyk6IGpvaW4oc2ltdWxhdG9yUm9vdCwgJ1NpbXVsYXRvckFwcC1XaW4zMi5leGUnKTtcblxuICAgIGVuc3VyZURpclN5bmMoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdqc2ItYWRhcHRlcicpKTtcbiAgICBlbnN1cmVEaXJTeW5jKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2NvY29zLWpzJykpO1xuICAgIC8vIOa4heepuue8k+WtmFxuICAgIGF3YWl0IGVtcHR5RGlyKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnYXNzZXRzJykpO1xuICAgIGxldCBhdXRvQ2xlYW5DYWNoZSA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldENvbmZpZygncHJldmlldycsIGBwcmV2aWV3LmF1dG9fY2xlYW5fY2FjaGVgKTtcbiAgICBpZiAoYXV0b0NsZWFuQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgZW1wdHlEaXIoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdnYW1lY2FjaGVzJykpO1xuICAgIH1cblxuICAgIC8vIOe8luivkSBhZGFwdGVyXG4gICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnbmF0aXZlJywgJ2NvbXBpbGUtanNiLWFkYXB0ZXInKTtcblxuICAgIC8vIOagueaNruWBj+Wlveiuvue9rueahOaooeWdl+mFjee9ru+8jOeUn+aIkCBjYy5qcyDliLAgc3RhdGljL3NpbXVsYXRvci9jb2Nvcy1qcyDnm67lvZVcbiAgICAvLyBUT0RPOiDkvb/nlKggUVVJQ0tfQ09NUElMRSDnvJbor5EgZW5naW5lXG4gICAgY29uc3QgY2NNb2R1bGVGaWxlID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvY29jb3MtanMvY2MuanMnKTtcbiAgICBjb25zdCBjY2VDb2RlUXVhbGl0eUZpbGUgPSBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9idWlsdGluL2NjZS5jb2RlLXF1YWxpdHkuY3IuanMnKTtcbiAgICBjb25zdCBjY2VFbnZGaWxlID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvYnVpbHRpbi9jY2UuZW52LmpzJyk7XG4gICAgZW5zdXJlRGlyU3luYyhkaXJuYW1lKGNjTW9kdWxlRmlsZSkpO1xuICAgIGVuc3VyZURpclN5bmMoZGlybmFtZShjY2VDb2RlUXVhbGl0eUZpbGUpKTtcbiAgICBjb25zdCBidWlsZFRpbWVDb25zdGFudHMgPSBzZXR1cEJ1aWxkVGltZUNvbnN0YW50cyh7XG4gICAgICAgIG1vZGU6ICdQUkVWSUVXJyxcbiAgICAgICAgcGxhdGZvcm06ICdOQVRJVkUnLFxuICAgICAgICBmbGFnczoge1xuICAgICAgICAgICAgREVCVUc6IHRydWUsXG4gICAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBzdGF0c1F1ZXJ5ID0gYXdhaXQgU3RhdHNRdWVyeS5jcmVhdGUoanNFbmdpbmVQYXRoKTtcbiAgICBcbiAgICBjb25zdCBmZWF0dXJlcyA9IChhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRQcm9qZWN0KCdlbmdpbmUnLCAnbW9kdWxlcy5pbmNsdWRlTW9kdWxlcycpKSB8fCBbXTtcbiAgICBjb25zdCBmZWF0dXJlVW5pdHMgPSBzdGF0c1F1ZXJ5LmdldFVuaXRzT2ZGZWF0dXJlcyhmZWF0dXJlcyk7XG4gICAgY29uc3QgeyBidWlsZCB9ID0gYXdhaXQgaW1wb3J0KCdAY29jb3MvYnVpbGQtZW5naW5lL2Rpc3QvaW5kZXgnKTtcbiAgICBjb25zdCB7IGNvZGU6IGluZGV4TW9kIH0gPSBhd2FpdCBidWlsZC50cmFuc2Zvcm0oc3RhdHNRdWVyeS5ldmFsdWF0ZUluZGV4TW9kdWxlU291cmNlKFxuICAgICAgICBmZWF0dXJlVW5pdHMsXG4gICAgICAgIChtb2R1bGVOYW1lKSA9PiBtb2R1bGVOYW1lLCAvLyDlkowgcXVpY2sgY29tcGlsZXIg57uZ55qE5YmN57yA5LiA6Ie0LFxuICAgICksIE1vZHVsZU9wdGlvbi5zeXN0ZW0pO1xuICAgIGNvbnN0IGJ1aWx0aW5Nb2R1bGVQcm92aWRlciA9IGF3YWl0IEJ1aWx0aW5Nb2R1bGVQcm92aWRlci5jcmVhdGUoeyBmb3JtYXQ6ICdzeXN0ZW1qcycgfSk7XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICBidWlsdGluTW9kdWxlUHJvdmlkZXIuYWRkQnVpbGRUaW1lQ29uc3RhbnRzTW9kKGJ1aWxkVGltZUNvbnN0YW50cyksXG4gICAgXSk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKGNjTW9kdWxlRmlsZSwgaW5kZXhNb2QsICd1dGY4Jyk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKGNjZUNvZGVRdWFsaXR5RmlsZSwgYnVpbHRpbk1vZHVsZVByb3ZpZGVyLm1vZHVsZXNbJ2NjZTpjb2RlLXF1YWxpdHkvY3InXSwgJ3V0ZjgnKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoY2NlRW52RmlsZSwgYnVpbHRpbk1vZHVsZVByb3ZpZGVyLm1vZHVsZXNbJ2NjL2VudiddLCAndXRmOCcpO1xuXG4gICAgLy8g5ou36LSd5paH5Lu2XG4gICAgbGV0IHRvQ29weSA9IFtcbiAgICAgICAgLy8g5ou36LSdIGpzYi1hZGFwdGVyXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihqc0VuZ2luZVBhdGgsICdiaW4vLmNhY2hlL2Rldi9uYXRpdmUtcHJldmlldy1hZGFwdGVyL2pzYi1idWlsdGluLmpzJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2pzYi1hZGFwdGVyL2pzYi1idWlsdGluLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihqc0VuZ2luZVBhdGgsICdiaW4vLmNhY2hlL2Rldi9uYXRpdmUtcHJldmlldy1hZGFwdGVyL2pzYi1lbmdpbmUuanMnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnanNiLWFkYXB0ZXIvanNiLWVuZ2luZS5qcycpLFxuICAgICAgICAgICAgaXNEaXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICAvLyDmi7fotJ0gZW5naW5lLCBpbXBvcnQtbWFwLmpzb25cbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKGpzRW5naW5lUGF0aCwgJ2Jpbi8uY2FjaGUvZGV2L25hdGl2ZS1wcmV2aWV3JyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9jb2Nvcy1qcycpLFxuICAgICAgICAgICAgaXNEaXI6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL2ltcG9ydC1tYXAuanNvbicpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvaW1wb3J0LW1hcC5qc29uJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL3N5c3RlbS5idW5kbGUuanMnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL3N5c3RlbS5idW5kbGUuanMnKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3IvcG9seWZpbGxzLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvcG9seWZpbGxzLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgaXNEaXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgIF07XG4gICAgdG9Db3B5LmZvckVhY2goaXRlbSA9PiB7XG4gICAgICAgIGlmIChpdGVtLmlzRGlyKSB7XG4gICAgICAgICAgICBjb3B5RGlyU3luYyhpdGVtLnNyYywgaXRlbS5kZXN0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvcHlGaWxlU3luYyhpdGVtLnNyYywgaXRlbS5kZXN0KTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8g5YaZ5YWlIHNldHRpbmdzLmpzXG4gICAgbGV0IGRhdGEgPSBhd2FpdCBnZW5lcmF0ZVByZXZpZXdEYXRhKCk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL3NldHRpbmdzLmpzb24nKSwgSlNPTi5zdHJpbmdpZnkoZGF0YS5zZXR0aW5ncywgdW5kZWZpbmVkLCAyKSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmJ1bmRsZUNvbmZpZ3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgbGV0IGNvbmZpZyA9IGRhdGEuYnVuZGxlQ29uZmlnc1tpXTtcbiAgICAgICAgbGV0IGJ1bmRsZURpciA9IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnYXNzZXRzJywgY29uZmlnLm5hbWUpO1xuICAgICAgICBlbnN1cmVEaXJTeW5jKGJ1bmRsZURpcik7XG4gICAgICAgIC8vIOWIoOmZpCBpbXBvcnRCYXNlIOWSjCBuYXRpdmVCYXNl77yM5L2/55SoIGdlbmVyYWxCYXNlXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZGVsZXRlIGNvbmZpZy5pbXBvcnRCYXNlO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGRlbGV0ZSBjb25maWcubmF0aXZlQmFzZTtcbiAgICAgICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oYnVuZGxlRGlyLCAnY29uZmlnLmpzb24nKSwgSlNPTi5zdHJpbmdpZnkoY29uZmlnLCB1bmRlZmluZWQsIDIpKTtcbiAgICAgICAgLy8gVE9ETzog55uu5YmN55qE5a6e546w6LefIHdlYiDpooTop4jkuIDmoLfvvIzkuIDmrKHmgKfliqDovb3miYDmnInohJrmnKxcbiAgICAgICAgbGV0IGJ1bmRsZUVudHJ5ID0gW107XG4gICAgICAgIGlmIChjb25maWcubmFtZSA9PT0gJ21haW4nKSB7XG4gICAgICAgICAgICBidW5kbGVFbnRyeS5wdXNoKCdjY2U6L2ludGVybmFsL3gvcHJlcmVxdWlzaXRlLWltcG9ydHMnKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgYnVuZGxlSW5kZXhKc1NvdXJjZSA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9idW5kbGVJbmRleC5lanMnKSwge1xuICAgICAgICAgICAgYnVuZGxlTmFtZTogY29uZmlnLm5hbWUsXG4gICAgICAgICAgICBidW5kbGVFbnRyeSxcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKGJ1bmRsZURpciwgJ2luZGV4LmpzJyksIGJ1bmRsZUluZGV4SnNTb3VyY2UsICd1dGY4Jyk7XG4gICAgfVxuXG4gICAgLy8g5YaZ5YWl5Yid5aeL5Zy65pmv5pWw5o2uXG4gICAgbGV0IHByZXZpZXdTY2VuZUpzb25QYXRoID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdwcmV2aWV3LXNjZW5lLmpzb24nKTtcbiAgICBwcmV2aWV3U2NlbmVKc29uUGF0aCA9IGZvcm1hdFBhdGgocHJldmlld1NjZW5lSnNvblBhdGgpO1xuICAgIGF3YWl0IHdyaXRlRmlsZShwcmV2aWV3U2NlbmVKc29uUGF0aCwgZGF0YS5wcmV2aWV3U2NlbmVKc29uLCAndXRmOCcpO1xuXG4gICAgLy8g55Sf5oiQIG1haW4uanNcbiAgICBsZXQgcHJldmlld1BvcnQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzZXJ2ZXInLCAncXVlcnktcG9ydCcpO1xuICAgIGxldCBwcmV2aWV3SXAgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdwcmV2aWV3JywgJ2dldC1wcmV2aWV3LWlwJyk7XG4gICAgbGV0IG1haW5Kc1NvdXJjZSA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9tYWluLmVqcycpLCB7XG4gICAgICAgIGxpYnJhcnlQYXRoOiBmb3JtYXRQYXRoKGpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ2xpYnJhcnknKSksXG4gICAgICAgIHdhaXRGb3JDb25uZWN0OiBwcmVmZXJlbmNlLndhaXRGb3JDb25uZWN0LFxuICAgICAgICBwcm9qZWN0UGF0aDogZm9ybWF0UGF0aChFZGl0b3IuUHJvamVjdC5wYXRoKSxcbiAgICAgICAgcHJldmlld0lwLFxuICAgICAgICBwcmV2aWV3UG9ydCxcbiAgICB9KTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdtYWluLmpzJyksIG1haW5Kc1NvdXJjZSwgJ3V0ZjgnKTtcblxuICAgIC8vIOeUn+aIkCBhcHBsaWNhdGlvbi5qc1xuICAgIGxldCBpbmNsdWRlTW9kdWxlcyA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldFByb2plY3QoJ2VuZ2luZScsICdtb2R1bGVzLmluY2x1ZGVNb2R1bGVzJyk7XG4gICAgbGV0IGhhc1BoeXNpY3NBbW1vID0gaW5jbHVkZU1vZHVsZXMuaW5jbHVkZXMoJ3BoeXNpY3MtYW1tbycpO1xuICAgIGxldCBhcHBKc1NvdXJjZSA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9hcHBsaWNhdGlvbi5lanMnKSwge1xuICAgICAgICBoYXNQaHlzaWNzQW1tbyxcbiAgICAgICAgcHJldmlld1NjZW5lSnNvblBhdGgsXG4gICAgICAgIGxpYnJhcnlQYXRoOiBmb3JtYXRQYXRoKGpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ2xpYnJhcnknKSksXG4gICAgfSk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2FwcGxpY2F0aW9uLmpzJyksIGFwcEpzU291cmNlLCAndXRmOCcpO1xuXG4gICAgLy8g5qC55o2u5YGP5aW96K6+572u77yM5pu05paw5qih5ouf5Zmo6YWN572u5paH5Lu2XG4gICAgYXdhaXQgZ2VuZXJhdGVTaW11bGF0b3JDb25maWcoKTtcblxuICAgIC8vIOi/kOihjOaooeaLn+WZqFxuICAgIC8vIGVudmlyb25tZW50XG4gICAgLy8gVE9ETzog5Yid5aeL5YyW546v5aKD5Y+Y6YePXG4gICAgLy8gZW52ID0ge1xuICAgIC8vICAgICBDT0NPU19GUkFNRVdPUktTOiBQYXRoLmpvaW4oY29jb3NSb290LCAnLi4vJyksXG4gICAgLy8gICAgIENPQ09TX1hfUk9PVDogY29jb3NSb290LFxuICAgIC8vICAgICBDT0NPU19DT05TT0xFX1JPT1Q6IGNvY29zQ29uc29sZVJvb3QsXG4gICAgLy8gICAgIE5ES19ST09UOiBuZGtSb290LFxuICAgIC8vICAgICBBTkRST0lEX1NES19ST09UOiBhbmRyb2lkU0RLUm9vdFxuICAgIC8vIH07XG5cbiAgICAvLyAvLyBmb3JtYXQgZW52aXJvbm1lbnQgc3RyaW5nXG4gICAgLy8gZW52U3RyID0gJyc7XG4gICAgLy8gZm9yIChsZXQgayBpbiBlbnYpIHtcbiAgICAvLyAgICAgaWYgKGVudlN0ciAhPT0gJycpIHtcbiAgICAvLyAgICAgICAgIGVudlN0ciArPSAnOyc7XG4gICAgLy8gICAgIH1cblxuICAgIC8vICAgICBlbnZTdHIgKz0gYCR7a309JHtlbnZba119YDtcbiAgICAvLyB9XG4gICAgLy8gbGV0IGFyZ3MgPSBbJy13b3JrZGlyJywgc2ltdWxhdG9yUmVzb3VyY2VzLCAnLXdyaXRhYmxlLXBhdGgnLCBzaW11bGF0b3JSZXNvdXJjZXMsICctY29uc29sZScsICdmYWxzZScsICctLWVudicsIGVudlN0cl07XG4gICAgbGV0IGFyZ3MgPSBbJy13b3JrZGlyJywgc2ltdWxhdG9yUmVzb3VyY2VzLCAnLXdyaXRhYmxlLXBhdGgnLCBzaW11bGF0b3JSZXNvdXJjZXMsICctY29uc29sZScsICdmYWxzZSddO1xuICAgIHNpbXVsYXRvclByb2Nlc3MgPSBzcGF3bihleGVjdXRhYmxlU2ltdWxhdG9yLCBhcmdzKTtcblxuICAgIC8vIOaJk+W8gOaooeaLn+WZqOiwg+ivleWZqFxuICAgIGlmIChwcmVmZXJlbmNlLnNob3dEZWJ1Z1BhbmVsKSB7XG4gICAgICAgIEVkaXRvci5QYW5lbC5vcGVuKCdwcmV2aWV3LmRlYnVnZ2VyJyk7XG4gICAgfVxuXG4gICAgLy8g55uR5ZCs5qih5ouf5Zmo6L+b56iL55qE6L6T5Ye6XG4gICAgc2ltdWxhdG9yUHJvY2Vzcy5vbignY2xvc2UnLCAoKSA9PiB7XG4gICAgICAgIEVkaXRvci5QYW5lbC5jbG9zZSgncHJldmlldy5kZWJ1Z2dlcicpO1xuICAgIH0pO1xuICAgIHNpbXVsYXRvclByb2Nlc3Muc3Rkb3V0Py5vbignZGF0YScsIGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhLnRvU3RyaW5nPyBkYXRhLnRvU3RyaW5nKCk6IGRhdGEpO1xuICAgIH0pO1xuICAgIHNpbXVsYXRvclByb2Nlc3Muc3RkZXJyPy5vbignZGF0YScsIGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGRhdGEudG9TdHJpbmc/IGRhdGEudG9TdHJpbmcoKTogZGF0YSk7XG4gICAgfSk7XG4gICAgc2ltdWxhdG9yUHJvY2Vzcy5vbignZXJyb3InLCBkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihkYXRhLnRvU3RyaW5nPyBkYXRhLnRvU3RyaW5nKCk6IGRhdGEpO1xuICAgIH0pO1xufVxuIl19