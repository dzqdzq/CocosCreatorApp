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
    const preference = await simulator_utils_1.getSimulatorPreference();
    // 路径处理
    const isDarwin = process.platform === 'darwin';
    const jsEnginePath = await simulator_utils_1.getJsEnginePath();
    const nativeEnginePath = await simulator_utils_1.getNativeEnginePath();
    const simulatorRoot = path_1.join(nativeEnginePath, isDarwin ? 'simulator/Debug/SimulatorApp-Mac.app' : 'simulator/Debug');
    const simulatorResources = isDarwin ? path_1.join(simulatorRoot, 'Contents/Resources') : simulatorRoot;
    const executableSimulator = isDarwin ? path_1.join(simulatorRoot, 'Contents/MacOS/SimulatorApp-Mac') : path_1.join(simulatorRoot, 'SimulatorApp-Win32.exe');
    fs_extra_1.ensureDirSync(path_1.join(simulatorResources, 'jsb-adapter'));
    fs_extra_1.ensureDirSync(path_1.join(simulatorResources, 'src/cocos-js'));
    // 清空缓存
    await fs_extra_1.emptyDir(path_1.join(simulatorResources, 'assets'));
    const autoCleanCache = await Editor.Profile.getConfig('preview', `preview.auto_clean_cache`);
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
    await fs_extra_1.writeFile(cceEnvFile, builtinModuleProvider.modules['cc/env'], 'utf8');
    // 拷贝文件
    const toCopy = [
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
    const data = await generatePreviewData();
    await fs_extra_1.writeFile(path_1.join(simulatorResources, 'src/settings.json'), JSON.stringify(data.settings, undefined, 2));
    for (let i = 0; i < data.bundleConfigs.length; ++i) {
        const config = data.bundleConfigs[i];
        const bundleDir = path_1.join(simulatorResources, 'assets', config.name);
        fs_extra_1.ensureDirSync(bundleDir);
        // 删除 importBase 和 nativeBase，使用 generalBase
        // @ts-ignore
        delete config.importBase;
        // @ts-ignore
        delete config.nativeBase;
        await fs_extra_1.writeFile(path_1.join(bundleDir, 'cc.config.json'), JSON.stringify(config, undefined, 2));
        // TODO: 目前的实现跟 web 预览一样，一次性加载所有脚本
        const bundleEntry = [];
        if (config.name === 'main') {
            bundleEntry.push('cce:/internal/x/prerequisite-imports');
        }
        const bundleIndexJsSource = await ejs_1.default.renderFile(path_1.join(__dirname, '../../static/simulator/bundleIndex.ejs'), {
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
    const previewPort = await Editor.Message.request('server', 'query-port');
    const previewIp = await Editor.Message.request('preview', 'get-preview-ip');
    const mainJsSource = await ejs_1.default.renderFile(path_1.join(__dirname, '../../static/simulator/main.ejs'), {
        libraryPath: simulator_utils_1.formatPath(path_1.join(Editor.Project.path, 'library')),
        waitForConnect: preference.waitForConnect,
        projectPath: simulator_utils_1.formatPath(Editor.Project.path),
        previewIp,
        previewPort,
        packImportMapURL: `/scripting/x/import-map.json`,
        packResolutionDetailMapURL: `/scripting/x/resolution-detail-map.json`,
    });
    await fs_extra_1.writeFile(path_1.join(simulatorResources, 'main.js'), mainJsSource, 'utf8');
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
    const appJsSource = await ejs_1.default.renderFile(path_1.join(__dirname, '../../static/simulator/application.ejs'), {
        hasPhysicsAmmo,
        previewSceneJsonPath,
        libraryPath: simulator_utils_1.formatPath(path_1.join(Editor.Project.path, 'library')),
        designResolution,
        previewIp,
        previewPort,
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
    const args = ['-workdir', simulatorResources, '-writable-path', simulatorResources, '-console', 'false'];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltdWxhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2Jyb3dzZXIvc2ltdWxhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBcUM7QUFDckMsOENBQXNCO0FBQ3RCLHVDQUFzRjtBQUN0RixpREFBb0Q7QUFDcEQsMERBQWlDO0FBQ2pDLHdGQUF3RjtBQUN4RixrR0FBNkY7QUFDN0Ysc0VBQWtFO0FBQ2xFLHNEQUFtRDtBQUNuRCx1REFBbUo7QUFFbkosSUFBSyxnQkFNSjtBQU5ELFdBQUssZ0JBQWdCO0lBQ2pCLG1GQUFrQixDQUFBO0lBQ2xCLG1GQUFrQixDQUFBO0lBQ2xCLGlGQUFpQixDQUFBO0lBQ2pCLHlGQUFxQixDQUFBO0lBQ3JCLHVGQUFvQixDQUFBO0FBQ3hCLENBQUMsRUFOSSxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBTXBCO0FBQ0QsSUFBSSxnQkFBcUMsQ0FBQyxDQUFFLGdCQUFnQjtBQUU1RCxTQUFTLG9CQUFvQjtJQUN6QixJQUFJLGdCQUFnQixFQUFFO1FBQ2xCLG1CQUFRLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO0tBQzNCO0FBQ0wsQ0FBQztBQUVELEtBQUssVUFBVSxtQkFBbUI7SUFDOUIsMEJBQTBCO0lBQzFCLE1BQU0sSUFBSSxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLG1CQUFtQixFQUFFO1FBQ3RFLElBQUksRUFBRSxXQUFXO1FBQ2pCLFFBQVEsRUFBRSxTQUFTO0tBQ3RCLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0tBQ3JDO0lBRUQsT0FBTztJQUNQLElBQUks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LGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO1FBQzlCLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDM0MsQ0FBQyxDQUFDLENBQUM7SUFDSCxNQUFBLGdCQUFnQixDQUFDLE1BQU0sMENBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRTtRQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEQsQ0FBQyxDQUFDLENBQUM7SUFDSCxNQUFBLGdCQUFnQixDQUFDLE1BQU0sMENBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRTtRQUN2QyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDMUQsQ0FBQyxDQUFDLENBQUM7SUFDSCxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFO1FBQ2hDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxRCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFqT0Qsb0NBaU9DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGlybmFtZSwgam9pbiB9IGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgRWpzIGZyb20gJ2Vqcyc7XG5pbXBvcnQgeyB3cml0ZUZpbGUsIGNvcHlGaWxlU3luYywgZW5zdXJlRGlyU3luYywgZW1wdHlEaXIsIHJlYWRGaWxlIH0gZnJvbSBcImZzLWV4dHJhXCI7XG5pbXBvcnQgeyBDaGlsZFByb2Nlc3MsIHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgdHJlZUtpbGwgZnJvbSAndHJlZS1raWxsJztcbmltcG9ydCB7IHNldHVwQnVpbGRUaW1lQ29uc3RhbnRzIH0gZnJvbSAnQGNvY29zL2J1aWxkLWVuZ2luZS9kaXN0L2J1aWxkLXRpbWUtY29uc3RhbnRzJztcbmltcG9ydCB7IEJ1aWx0aW5Nb2R1bGVQcm92aWRlciB9IGZyb20gXCJAZWRpdG9yL2xpYi1wcm9ncmFtbWluZy9kaXN0L2J1aWx0aW4tbW9kdWxlLXByb3ZpZGVyXCI7XG5pbXBvcnQgeyBTdGF0c1F1ZXJ5IH0gZnJvbSAnQGNvY29zL2J1aWxkLWVuZ2luZS9kaXN0L3N0YXRzLXF1ZXJ5JztcbmltcG9ydCB7IE1vZHVsZU9wdGlvbiB9IGZyb20gJ0Bjb2Nvcy9idWlsZC1lbmdpbmUnO1xuaW1wb3J0IHsgY29weURpclN5bmMsIGZvcm1hdFBhdGgsIGdlbmVyYXRlU2ltdWxhdG9yQ29uZmlnLCBnZXRKc0VuZ2luZVBhdGgsIGdldE5hdGl2ZUVuZ2luZVBhdGgsIGdldFNpbXVsYXRvclByZWZlcmVuY2UgfSBmcm9tIFwiLi9zaW11bGF0b3ItdXRpbHNcIjtcblxuZW51bSBSZXNvbHV0aW9uUG9saWN5IHtcbiAgICBSZXNvbHV0aW9uRXhhY3RGaXQsXG4gICAgUmVzb2x1dGlvbk5vQm9yZGVyLFxuICAgIFJlc29sdXRpb25TaG93QWxsLFxuICAgIFJlc29sdXRpb25GaXhlZEhlaWdodCxcbiAgICBSZXNvbHV0aW9uRml4ZWRXaWR0aCxcbn1cbmxldCBzaW11bGF0b3JQcm9jZXNzOiBDaGlsZFByb2Nlc3MgfCBudWxsOyAgLy8g5qCH6K+G5qih5ouf5Zmo6aKE6KeI6L+b56iL5piv5ZCm5a2Y5ZyoXG5cbmZ1bmN0aW9uIHN0b3BTaW11bGF0b3JQcm9jZXNzKCkge1xuICAgIGlmIChzaW11bGF0b3JQcm9jZXNzKSB7XG4gICAgICAgIHRyZWVLaWxsKHNpbXVsYXRvclByb2Nlc3MucGlkKTtcbiAgICAgICAgc2ltdWxhdG9yUHJvY2VzcyA9IG51bGw7XG4gICAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBnZW5lcmF0ZVByZXZpZXdEYXRhKCkge1xuICAgIC8vIOaooeaLn+WZqOmihOiniOS4jemcgOimgSBsYXVuY2hTY2VuZSDmlbDmja5cbiAgICBjb25zdCBkYXRhID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgncHJldmlldycsICdnZW5lcmF0ZS1zZXR0aW5ncycsIHtcbiAgICAgICAgdHlwZTogJ3NpbXVsYXRvcicsXG4gICAgICAgIHBsYXRmb3JtOiAnd2luZG93cycsXG4gICAgfSk7XG5cbiAgICBpZiAoIShkYXRhICYmIGRhdGEuc2V0dGluZ3MpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihg5p6E5bu6IHNldHRpbmdzIOWHuumUmWApO1xuICAgIH1cblxuICAgIC8vIOWQr+WKqOWcuuaZr1xuICAgIGxldCBwcmV2aWV3U2NlbmVKc29uOiBzdHJpbmc7XG4gICAgY29uc3QgcHJldmlld1NjZW5lID0gYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0Q29uZmlnKCdwcmV2aWV3JywgYGdlbmVyYWwuc3RhcnRfc2NlbmVgKTtcbiAgICBpZiAocHJldmlld1NjZW5lID09PSAnY3VycmVudF9zY2VuZScpIHtcbiAgICAgICAgcHJldmlld1NjZW5lSnNvbiA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LXNjZW5lLWpzb24nKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNvbnN0IHByZXZpZXdTY2VuZVBhdGggPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1wYXRoJywgcHJldmlld1NjZW5lKSBhcyBzdHJpbmc7XG4gICAgICAgIHByZXZpZXdTY2VuZUpzb24gPSBhd2FpdCByZWFkRmlsZShwcmV2aWV3U2NlbmVQYXRoLCAndXRmOCcpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBwcmV2aWV3U2NlbmVKc29uLFxuICAgICAgICBzZXR0aW5nczogZGF0YS5zZXR0aW5ncyxcbiAgICAgICAgYnVuZGxlQ29uZmlnczogZGF0YS5idW5kbGVDb25maWdzLFxuICAgIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5TaW11bGF0b3IoKSB7XG4gICAgLy8g5YWz6Zet5qih5ouf5ZmoXG4gICAgc3RvcFNpbXVsYXRvclByb2Nlc3MoKTtcblxuICAgIC8vIOiOt+WPluaooeaLn+WZqOWBj+Wlveiuvue9rlxuICAgIGNvbnN0IHByZWZlcmVuY2UgPSBhd2FpdCBnZXRTaW11bGF0b3JQcmVmZXJlbmNlKCk7XG5cbiAgICAvLyDot6/lvoTlpITnkIZcbiAgICBjb25zdCBpc0RhcndpbiA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nO1xuICAgIGNvbnN0IGpzRW5naW5lUGF0aCA9IGF3YWl0IGdldEpzRW5naW5lUGF0aCgpO1xuICAgIGNvbnN0IG5hdGl2ZUVuZ2luZVBhdGggPSBhd2FpdCBnZXROYXRpdmVFbmdpbmVQYXRoKCk7XG4gICAgY29uc3Qgc2ltdWxhdG9yUm9vdCA9IGpvaW4obmF0aXZlRW5naW5lUGF0aCwgaXNEYXJ3aW4gPyAnc2ltdWxhdG9yL0RlYnVnL1NpbXVsYXRvckFwcC1NYWMuYXBwJyA6ICdzaW11bGF0b3IvRGVidWcnKTtcbiAgICBjb25zdCBzaW11bGF0b3JSZXNvdXJjZXMgPSBpc0RhcndpbiA/IGpvaW4oc2ltdWxhdG9yUm9vdCwgJ0NvbnRlbnRzL1Jlc291cmNlcycpIDogc2ltdWxhdG9yUm9vdDtcbiAgICBjb25zdCBleGVjdXRhYmxlU2ltdWxhdG9yID0gaXNEYXJ3aW4gPyBqb2luKHNpbXVsYXRvclJvb3QsICdDb250ZW50cy9NYWNPUy9TaW11bGF0b3JBcHAtTWFjJykgOiBqb2luKHNpbXVsYXRvclJvb3QsICdTaW11bGF0b3JBcHAtV2luMzIuZXhlJyk7XG5cbiAgICBlbnN1cmVEaXJTeW5jKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnanNiLWFkYXB0ZXInKSk7XG4gICAgZW5zdXJlRGlyU3luYyhqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9jb2Nvcy1qcycpKTtcbiAgICAvLyDmuIXnqbrnvJPlrZhcbiAgICBhd2FpdCBlbXB0eURpcihqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2Fzc2V0cycpKTtcbiAgICBjb25zdCBhdXRvQ2xlYW5DYWNoZSA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldENvbmZpZygncHJldmlldycsIGBwcmV2aWV3LmF1dG9fY2xlYW5fY2FjaGVgKTtcbiAgICBpZiAoYXV0b0NsZWFuQ2FjaGUpIHtcbiAgICAgICAgYXdhaXQgZW1wdHlEaXIoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdnYW1lY2FjaGVzJykpO1xuICAgIH1cblxuICAgIC8vIOe8luivkSBhZGFwdGVyXG4gICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnbmF0aXZlJywgJ2NvbXBpbGUtanNiLWFkYXB0ZXInKTtcblxuICAgIC8vIOagueaNruWBj+Wlveiuvue9rueahOaooeWdl+mFjee9ru+8jOeUn+aIkCBjYy5qcyDliLAgc3RhdGljL3NpbXVsYXRvci9jb2Nvcy1qcyDnm67lvZVcbiAgICAvLyBUT0RPOiDkvb/nlKggUVVJQ0tfQ09NUElMRSDnvJbor5EgZW5naW5lXG4gICAgY29uc3QgY2NNb2R1bGVGaWxlID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvY29jb3MtanMvY2MuanMnKTtcbiAgICBjb25zdCBjY2VDb2RlUXVhbGl0eUZpbGUgPSBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9idWlsdGluL2NjZS5jb2RlLXF1YWxpdHkuY3IuanMnKTtcbiAgICBjb25zdCBjY2VFbnZGaWxlID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvYnVpbHRpbi9jY2UuZW52LmpzJyk7XG4gICAgZW5zdXJlRGlyU3luYyhkaXJuYW1lKGNjTW9kdWxlRmlsZSkpO1xuICAgIGVuc3VyZURpclN5bmMoZGlybmFtZShjY2VDb2RlUXVhbGl0eUZpbGUpKTtcbiAgICBjb25zdCBidWlsZFRpbWVDb25zdGFudHMgPSBzZXR1cEJ1aWxkVGltZUNvbnN0YW50cyh7XG4gICAgICAgIG1vZGU6ICdQUkVWSUVXJyxcbiAgICAgICAgcGxhdGZvcm06ICdOQVRJVkUnLFxuICAgICAgICBmbGFnczoge1xuICAgICAgICAgICAgREVCVUc6IHRydWUsXG4gICAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBzdGF0c1F1ZXJ5ID0gYXdhaXQgU3RhdHNRdWVyeS5jcmVhdGUoanNFbmdpbmVQYXRoKTtcblxuICAgIGNvbnN0IGZlYXR1cmVzID0gKGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldFByb2plY3QoJ2VuZ2luZScsICdtb2R1bGVzLmluY2x1ZGVNb2R1bGVzJykpIHx8IFtdO1xuICAgIGNvbnN0IGZlYXR1cmVVbml0cyA9IHN0YXRzUXVlcnkuZ2V0VW5pdHNPZkZlYXR1cmVzKGZlYXR1cmVzKTtcbiAgICBjb25zdCB7IGJ1aWxkIH0gPSBhd2FpdCBpbXBvcnQoJ0Bjb2Nvcy9idWlsZC1lbmdpbmUvZGlzdC9pbmRleCcpO1xuICAgIGNvbnN0IHsgY29kZTogaW5kZXhNb2QgfSA9IGF3YWl0IGJ1aWxkLnRyYW5zZm9ybShzdGF0c1F1ZXJ5LmV2YWx1YXRlSW5kZXhNb2R1bGVTb3VyY2UoXG4gICAgICAgIGZlYXR1cmVVbml0cyxcbiAgICAgICAgKG1vZHVsZU5hbWUpID0+IG1vZHVsZU5hbWUsIC8vIOWSjCBxdWljayBjb21waWxlciDnu5nnmoTliY3nvIDkuIDoh7QsXG4gICAgKSwgTW9kdWxlT3B0aW9uLnN5c3RlbSk7XG4gICAgY29uc3QgYnVpbHRpbk1vZHVsZVByb3ZpZGVyID0gYXdhaXQgQnVpbHRpbk1vZHVsZVByb3ZpZGVyLmNyZWF0ZSh7IGZvcm1hdDogJ3N5c3RlbWpzJyB9KTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgIGJ1aWx0aW5Nb2R1bGVQcm92aWRlci5hZGRCdWlsZFRpbWVDb25zdGFudHNNb2QoYnVpbGRUaW1lQ29uc3RhbnRzKSxcbiAgICBdKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoY2NNb2R1bGVGaWxlLCBpbmRleE1vZCwgJ3V0ZjgnKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoY2NlRW52RmlsZSwgYnVpbHRpbk1vZHVsZVByb3ZpZGVyLm1vZHVsZXNbJ2NjL2VudiddLCAndXRmOCcpO1xuXG4gICAgLy8g5ou36LSd5paH5Lu2XG4gICAgY29uc3QgdG9Db3B5ID0gW1xuICAgICAgICAvLyDmi7fotJ0ganNiLWFkYXB0ZXJcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKGpzRW5naW5lUGF0aCwgJ2Jpbi8uY2FjaGUvZGV2L25hdGl2ZS1wcmV2aWV3LWFkYXB0ZXIvanNiLWJ1aWx0aW4uanMnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnanNiLWFkYXB0ZXIvanNiLWJ1aWx0aW4uanMnKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKGpzRW5naW5lUGF0aCwgJ2Jpbi8uY2FjaGUvZGV2L25hdGl2ZS1wcmV2aWV3LWFkYXB0ZXIvanNiLWVuZ2luZS5qcycpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdqc2ItYWRhcHRlci9qc2ItZW5naW5lLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOaLt+i0nSBlbmdpbmUsIGltcG9ydC1tYXAuanNvblxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oanNFbmdpbmVQYXRoLCAnYmluLy5jYWNoZS9kZXYvbmF0aXZlLXByZXZpZXcnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2NvY29zLWpzJyksXG4gICAgICAgICAgICBpc0RpcjogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3IvaW1wb3J0LW1hcC5qc29uJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9pbXBvcnQtbWFwLmpzb24nKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3Ivc3lzdGVtLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvc3lzdGVtLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgaXNEaXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9wb2x5ZmlsbHMuYnVuZGxlLmpzJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9wb2x5ZmlsbHMuYnVuZGxlLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgXTtcbiAgICB0b0NvcHkuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgaWYgKGl0ZW0uaXNEaXIpIHtcbiAgICAgICAgICAgIGNvcHlEaXJTeW5jKGl0ZW0uc3JjLCBpdGVtLmRlc3QpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29weUZpbGVTeW5jKGl0ZW0uc3JjLCBpdGVtLmRlc3QpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyDlhpnlhaUgc2V0dGluZ3MuanNcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZ2VuZXJhdGVQcmV2aWV3RGF0YSgpO1xuICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9zZXR0aW5ncy5qc29uJyksIEpTT04uc3RyaW5naWZ5KGRhdGEuc2V0dGluZ3MsIHVuZGVmaW5lZCwgMikpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5idW5kbGVDb25maWdzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IGRhdGEuYnVuZGxlQ29uZmlnc1tpXTtcbiAgICAgICAgY29uc3QgYnVuZGxlRGlyID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdhc3NldHMnLCBjb25maWcubmFtZSk7XG4gICAgICAgIGVuc3VyZURpclN5bmMoYnVuZGxlRGlyKTtcbiAgICAgICAgLy8g5Yig6ZmkIGltcG9ydEJhc2Ug5ZKMIG5hdGl2ZUJhc2XvvIzkvb/nlKggZ2VuZXJhbEJhc2VcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBkZWxldGUgY29uZmlnLmltcG9ydEJhc2U7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZGVsZXRlIGNvbmZpZy5uYXRpdmVCYXNlO1xuICAgICAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihidW5kbGVEaXIsICdjYy5jb25maWcuanNvbicpLCBKU09OLnN0cmluZ2lmeShjb25maWcsIHVuZGVmaW5lZCwgMikpO1xuICAgICAgICAvLyBUT0RPOiDnm67liY3nmoTlrp7njrDot58gd2ViIOmihOiniOS4gOagt++8jOS4gOasoeaAp+WKoOi9veaJgOacieiEmuacrFxuICAgICAgICBjb25zdCBidW5kbGVFbnRyeSA9IFtdO1xuICAgICAgICBpZiAoY29uZmlnLm5hbWUgPT09ICdtYWluJykge1xuICAgICAgICAgICAgYnVuZGxlRW50cnkucHVzaCgnY2NlOi9pbnRlcm5hbC94L3ByZXJlcXVpc2l0ZS1pbXBvcnRzJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYnVuZGxlSW5kZXhKc1NvdXJjZSA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9idW5kbGVJbmRleC5lanMnKSwge1xuICAgICAgICAgICAgYnVuZGxlTmFtZTogY29uZmlnLm5hbWUsXG4gICAgICAgICAgICBidW5kbGVFbnRyeSxcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKGJ1bmRsZURpciwgJ2luZGV4LmpzJyksIGJ1bmRsZUluZGV4SnNTb3VyY2UsICd1dGY4Jyk7XG4gICAgfVxuXG4gICAgLy8g5YaZ5YWl5Yid5aeL5Zy65pmv5pWw5o2uXG4gICAgbGV0IHByZXZpZXdTY2VuZUpzb25QYXRoID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdwcmV2aWV3LXNjZW5lLmpzb24nKTtcbiAgICBwcmV2aWV3U2NlbmVKc29uUGF0aCA9IGZvcm1hdFBhdGgocHJldmlld1NjZW5lSnNvblBhdGgpO1xuICAgIGF3YWl0IHdyaXRlRmlsZShwcmV2aWV3U2NlbmVKc29uUGF0aCwgZGF0YS5wcmV2aWV3U2NlbmVKc29uLCAndXRmOCcpO1xuXG4gICAgLy8g55Sf5oiQIG1haW4uanNcbiAgICBjb25zdCBwcmV2aWV3UG9ydCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NlcnZlcicsICdxdWVyeS1wb3J0Jyk7XG4gICAgY29uc3QgcHJldmlld0lwID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgncHJldmlldycsICdnZXQtcHJldmlldy1pcCcpO1xuICAgIGNvbnN0IG1haW5Kc1NvdXJjZSA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9tYWluLmVqcycpLCB7XG4gICAgICAgIGxpYnJhcnlQYXRoOiBmb3JtYXRQYXRoKGpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ2xpYnJhcnknKSksXG4gICAgICAgIHdhaXRGb3JDb25uZWN0OiBwcmVmZXJlbmNlLndhaXRGb3JDb25uZWN0LFxuICAgICAgICBwcm9qZWN0UGF0aDogZm9ybWF0UGF0aChFZGl0b3IuUHJvamVjdC5wYXRoKSxcbiAgICAgICAgcHJldmlld0lwLFxuICAgICAgICBwcmV2aWV3UG9ydCxcbiAgICAgICAgcGFja0ltcG9ydE1hcFVSTDogYC9zY3JpcHRpbmcveC9pbXBvcnQtbWFwLmpzb25gLFxuICAgICAgICBwYWNrUmVzb2x1dGlvbkRldGFpbE1hcFVSTDogYC9zY3JpcHRpbmcveC9yZXNvbHV0aW9uLWRldGFpbC1tYXAuanNvbmAsXG4gICAgfSk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnbWFpbi5qcycpLCBtYWluSnNTb3VyY2UsICd1dGY4Jyk7XG5cbiAgICAvLyDnlJ/miJAgYXBwbGljYXRpb24uanNcbiAgICBjb25zdCBpbmNsdWRlTW9kdWxlcyA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldFByb2plY3QoJ2VuZ2luZScsICdtb2R1bGVzLmluY2x1ZGVNb2R1bGVzJyk7XG4gICAgY29uc3QgaGFzUGh5c2ljc0FtbW8gPSBpbmNsdWRlTW9kdWxlcy5pbmNsdWRlcygncGh5c2ljcy1hbW1vJyk7XG4gICAgY29uc3QgcHJvamVjdERhdGEgPSBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRQcm9qZWN0KCdwcm9qZWN0JywgJ2dlbmVyYWwuZGVzaWduUmVzb2x1dGlvbicpO1xuICAgIGxldCByZXNvbHV0aW9uUG9saWN5OiBSZXNvbHV0aW9uUG9saWN5O1xuICAgIGlmIChwcm9qZWN0RGF0YS5maXRXaWR0aCAmJiBwcm9qZWN0RGF0YS5maXRIZWlnaHQpIHtcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuUmVzb2x1dGlvblNob3dBbGw7XG4gICAgfVxuICAgIGVsc2UgaWYgKHByb2plY3REYXRhLmZpdFdpZHRoICYmICFwcm9qZWN0RGF0YS5maXRIZWlnaHQpIHtcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuUmVzb2x1dGlvbkZpeGVkV2lkdGg7XG4gICAgfVxuICAgIGVsc2UgaWYgKCFwcm9qZWN0RGF0YS5maXRXaWR0aCAmJiBwcm9qZWN0RGF0YS5maXRIZWlnaHQpIHtcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuUmVzb2x1dGlvbkZpeGVkSGVpZ2h0O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuUmVzb2x1dGlvbk5vQm9yZGVyO1xuICAgIH1cbiAgICBjb25zdCBkZXNpZ25SZXNvbHV0aW9uID0ge1xuICAgICAgICB3aWR0aDogcHJvamVjdERhdGEud2lkdGgsXG4gICAgICAgIGhlaWdodDogcHJvamVjdERhdGEuaGVpZ2h0LFxuICAgICAgICByZXNvbHV0aW9uUG9saWN5LFxuICAgIH07XG4gICAgY29uc3QgYXBwSnNTb3VyY2UgPSBhd2FpdCBFanMucmVuZGVyRmlsZShqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3IvYXBwbGljYXRpb24uZWpzJyksIHtcbiAgICAgICAgaGFzUGh5c2ljc0FtbW8sXG4gICAgICAgIHByZXZpZXdTY2VuZUpzb25QYXRoLFxuICAgICAgICBsaWJyYXJ5UGF0aDogZm9ybWF0UGF0aChqb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsICdsaWJyYXJ5JykpLFxuICAgICAgICBkZXNpZ25SZXNvbHV0aW9uLFxuICAgICAgICBwcmV2aWV3SXAsXG4gICAgICAgIHByZXZpZXdQb3J0LFxuICAgIH0pO1xuICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9hcHBsaWNhdGlvbi5qcycpLCBhcHBKc1NvdXJjZSwgJ3V0ZjgnKTtcblxuICAgIC8vIOagueaNruWBj+Wlveiuvue9ru+8jOabtOaWsOaooeaLn+WZqOmFjee9ruaWh+S7tlxuICAgIGF3YWl0IGdlbmVyYXRlU2ltdWxhdG9yQ29uZmlnKCk7XG5cbiAgICAvLyDov5DooYzmqKHmi5/lmahcbiAgICAvLyBlbnZpcm9ubWVudFxuICAgIC8vIFRPRE86IOWIneWni+WMlueOr+Wig+WPmOmHj1xuICAgIC8vIGVudiA9IHtcbiAgICAvLyAgICAgQ09DT1NfRlJBTUVXT1JLUzogUGF0aC5qb2luKGNvY29zUm9vdCwgJy4uLycpLFxuICAgIC8vICAgICBDT0NPU19YX1JPT1Q6IGNvY29zUm9vdCxcbiAgICAvLyAgICAgQ09DT1NfQ09OU09MRV9ST09UOiBjb2Nvc0NvbnNvbGVSb290LFxuICAgIC8vICAgICBOREtfUk9PVDogbmRrUm9vdCxcbiAgICAvLyAgICAgQU5EUk9JRF9TREtfUk9PVDogYW5kcm9pZFNES1Jvb3RcbiAgICAvLyB9O1xuXG4gICAgLy8gLy8gZm9ybWF0IGVudmlyb25tZW50IHN0cmluZ1xuICAgIC8vIGVudlN0ciA9ICcnO1xuICAgIC8vIGZvciAobGV0IGsgaW4gZW52KSB7XG4gICAgLy8gICAgIGlmIChlbnZTdHIgIT09ICcnKSB7XG4gICAgLy8gICAgICAgICBlbnZTdHIgKz0gJzsnO1xuICAgIC8vICAgICB9XG5cbiAgICAvLyAgICAgZW52U3RyICs9IGAke2t9PSR7ZW52W2tdfWA7XG4gICAgLy8gfVxuICAgIC8vIGxldCBhcmdzID0gWyctd29ya2RpcicsIHNpbXVsYXRvclJlc291cmNlcywgJy13cml0YWJsZS1wYXRoJywgc2ltdWxhdG9yUmVzb3VyY2VzLCAnLWNvbnNvbGUnLCAnZmFsc2UnLCAnLS1lbnYnLCBlbnZTdHJdO1xuICAgIGNvbnN0IGFyZ3MgPSBbJy13b3JrZGlyJywgc2ltdWxhdG9yUmVzb3VyY2VzLCAnLXdyaXRhYmxlLXBhdGgnLCBzaW11bGF0b3JSZXNvdXJjZXMsICctY29uc29sZScsICdmYWxzZSddO1xuICAgIHNpbXVsYXRvclByb2Nlc3MgPSBzcGF3bihleGVjdXRhYmxlU2ltdWxhdG9yLCBhcmdzKTtcblxuICAgIC8vIOaJk+W8gOaooeaLn+WZqOiwg+ivleWZqFxuICAgIGlmIChwcmVmZXJlbmNlLnNob3dEZWJ1Z1BhbmVsKSB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLlBhbmVsLm9wZW4oJ3ByZXZpZXcuZGVidWdnZXInKTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfVxuXG4gICAgLy8g55uR5ZCs5qih5ouf5Zmo6L+b56iL55qE6L6T5Ye6XG4gICAgc2ltdWxhdG9yUHJvY2Vzcy5vbignY2xvc2UnLCAoKSA9PiB7XG4gICAgICAgIEVkaXRvci5QYW5lbC5jbG9zZSgncHJldmlldy5kZWJ1Z2dlcicpO1xuICAgIH0pO1xuICAgIHNpbXVsYXRvclByb2Nlc3Muc3Rkb3V0Py5vbignZGF0YScsIGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhLnRvU3RyaW5nID8gZGF0YS50b1N0cmluZygpIDogZGF0YSk7XG4gICAgfSk7XG4gICAgc2ltdWxhdG9yUHJvY2Vzcy5zdGRlcnI/Lm9uKCdkYXRhJywgZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZGF0YS50b1N0cmluZyA/IGRhdGEudG9TdHJpbmcoKSA6IGRhdGEpO1xuICAgIH0pO1xuICAgIHNpbXVsYXRvclByb2Nlc3Mub24oJ2Vycm9yJywgZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZGF0YS50b1N0cmluZyA/IGRhdGEudG9TdHJpbmcoKSA6IGRhdGEpO1xuICAgIH0pO1xufVxuIl19