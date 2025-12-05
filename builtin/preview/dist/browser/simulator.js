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
            UI_GPU_DRIVEN: false,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltdWxhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2Jyb3dzZXIvc2ltdWxhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBcUM7QUFDckMsOENBQXNCO0FBQ3RCLHVDQUFzRjtBQUN0RixpREFBb0Q7QUFDcEQsMERBQWlDO0FBQ2pDLHdGQUF3RjtBQUN4RixrR0FBNkY7QUFDN0Ysc0VBQWtFO0FBQ2xFLHNEQUFtRDtBQUNuRCx1REFBbUo7QUFFbkosSUFBSyxnQkFNSjtBQU5ELFdBQUssZ0JBQWdCO0lBQ2pCLG1GQUFrQixDQUFBO0lBQ2xCLG1GQUFrQixDQUFBO0lBQ2xCLGlGQUFpQixDQUFBO0lBQ2pCLHlGQUFxQixDQUFBO0lBQ3JCLHVGQUFvQixDQUFBO0FBQ3hCLENBQUMsRUFOSSxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBTXBCO0FBQ0QsSUFBSSxnQkFBcUMsQ0FBQyxDQUFFLGdCQUFnQjtBQUU1RCxTQUFTLG9CQUFvQjtJQUN6QixJQUFJLGdCQUFnQixFQUFFO1FBQ2xCLG1CQUFRLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO0tBQzNCO0FBQ0wsQ0FBQztBQUVELEtBQUssVUFBVSxtQkFBbUI7SUFDOUIsMEJBQTBCO0lBQzFCLE1BQU0sSUFBSSxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLG1CQUFtQixFQUFFO1FBQ3RFLElBQUksRUFBRSxXQUFXO1FBQ2pCLFFBQVEsRUFBRSxTQUFTO0tBQ3RCLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0tBQ3JDO0lBRUQsT0FBTztJQUNQLElBQUks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QUFFLEdBQUcsRUFBRTtRQUM5QixNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDO0lBQ0gsTUFBQSxnQkFBZ0IsQ0FBQyxNQUFNLDBDQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUU7UUFDdkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hELENBQUMsQ0FBQyxDQUFDO0lBQ0gsTUFBQSxnQkFBZ0IsQ0FBQyxNQUFNLDBDQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUU7UUFDdkMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzFELENBQUMsQ0FBQyxDQUFDO0lBQ0gsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsRUFBRTtRQUNoQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDMUQsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBaE9ELG9DQWdPQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRpcm5hbWUsIGpvaW4gfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IEVqcyBmcm9tICdlanMnO1xuaW1wb3J0IHsgd3JpdGVGaWxlLCBjb3B5RmlsZVN5bmMsIGVuc3VyZURpclN5bmMsIGVtcHR5RGlyLCByZWFkRmlsZSB9IGZyb20gXCJmcy1leHRyYVwiO1xuaW1wb3J0IHsgQ2hpbGRQcm9jZXNzLCBzcGF3biB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHRyZWVLaWxsIGZyb20gJ3RyZWUta2lsbCc7XG5pbXBvcnQgeyBzZXR1cEJ1aWxkVGltZUNvbnN0YW50cyB9IGZyb20gJ0Bjb2Nvcy9idWlsZC1lbmdpbmUvZGlzdC9idWlsZC10aW1lLWNvbnN0YW50cyc7XG5pbXBvcnQgeyBCdWlsdGluTW9kdWxlUHJvdmlkZXIgfSBmcm9tIFwiQGVkaXRvci9saWItcHJvZ3JhbW1pbmcvZGlzdC9idWlsdGluLW1vZHVsZS1wcm92aWRlclwiO1xuaW1wb3J0IHsgU3RhdHNRdWVyeSB9IGZyb20gJ0Bjb2Nvcy9idWlsZC1lbmdpbmUvZGlzdC9zdGF0cy1xdWVyeSc7XG5pbXBvcnQgeyBNb2R1bGVPcHRpb24gfSBmcm9tICdAY29jb3MvYnVpbGQtZW5naW5lJztcbmltcG9ydCB7IGNvcHlEaXJTeW5jLCBmb3JtYXRQYXRoLCBnZW5lcmF0ZVNpbXVsYXRvckNvbmZpZywgZ2V0SnNFbmdpbmVQYXRoLCBnZXROYXRpdmVFbmdpbmVQYXRoLCBnZXRTaW11bGF0b3JQcmVmZXJlbmNlIH0gZnJvbSBcIi4vc2ltdWxhdG9yLXV0aWxzXCI7XG5cbmVudW0gUmVzb2x1dGlvblBvbGljeSB7XG4gICAgUmVzb2x1dGlvbkV4YWN0Rml0LFxuICAgIFJlc29sdXRpb25Ob0JvcmRlcixcbiAgICBSZXNvbHV0aW9uU2hvd0FsbCxcbiAgICBSZXNvbHV0aW9uRml4ZWRIZWlnaHQsXG4gICAgUmVzb2x1dGlvbkZpeGVkV2lkdGgsXG59XG5sZXQgc2ltdWxhdG9yUHJvY2VzczogQ2hpbGRQcm9jZXNzIHwgbnVsbDsgIC8vIOagh+ivhuaooeaLn+WZqOmihOiniOi/m+eoi+aYr+WQpuWtmOWcqFxuXG5mdW5jdGlvbiBzdG9wU2ltdWxhdG9yUHJvY2VzcygpIHtcbiAgICBpZiAoc2ltdWxhdG9yUHJvY2Vzcykge1xuICAgICAgICB0cmVlS2lsbChzaW11bGF0b3JQcm9jZXNzLnBpZCk7XG4gICAgICAgIHNpbXVsYXRvclByb2Nlc3MgPSBudWxsO1xuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVQcmV2aWV3RGF0YSgpIHtcbiAgICAvLyDmqKHmi5/lmajpooTop4jkuI3pnIDopoEgbGF1bmNoU2NlbmUg5pWw5o2uXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3ByZXZpZXcnLCAnZ2VuZXJhdGUtc2V0dGluZ3MnLCB7XG4gICAgICAgIHR5cGU6ICdzaW11bGF0b3InLFxuICAgICAgICBwbGF0Zm9ybTogJ3dpbmRvd3MnLFxuICAgIH0pO1xuXG4gICAgaWYgKCEoZGF0YSAmJiBkYXRhLnNldHRpbmdzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOaehOW7uiBzZXR0aW5ncyDlh7rplJlgKTtcbiAgICB9XG5cbiAgICAvLyDlkK/liqjlnLrmma9cbiAgICBsZXQgcHJldmlld1NjZW5lSnNvbjogc3RyaW5nO1xuICAgIGNvbnN0IHByZXZpZXdTY2VuZSA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldENvbmZpZygncHJldmlldycsIGBnZW5lcmFsLnN0YXJ0X3NjZW5lYCk7XG4gICAgaWYgKHByZXZpZXdTY2VuZSA9PT0gJ2N1cnJlbnRfc2NlbmUnKSB7XG4gICAgICAgIHByZXZpZXdTY2VuZUpzb24gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1zY2VuZS1qc29uJyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zdCBwcmV2aWV3U2NlbmVQYXRoID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktcGF0aCcsIHByZXZpZXdTY2VuZSkgYXMgc3RyaW5nO1xuICAgICAgICBwcmV2aWV3U2NlbmVKc29uID0gYXdhaXQgcmVhZEZpbGUocHJldmlld1NjZW5lUGF0aCwgJ3V0ZjgnKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcHJldmlld1NjZW5lSnNvbixcbiAgICAgICAgc2V0dGluZ3M6IGRhdGEuc2V0dGluZ3MsXG4gICAgICAgIGJ1bmRsZUNvbmZpZ3M6IGRhdGEuYnVuZGxlQ29uZmlncyxcbiAgICB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuU2ltdWxhdG9yKCkge1xuICAgIC8vIOWFs+mXreaooeaLn+WZqFxuICAgIHN0b3BTaW11bGF0b3JQcm9jZXNzKCk7XG5cbiAgICAvLyDojrflj5bmqKHmi5/lmajlgY/lpb3orr7nva5cbiAgICBjb25zdCBwcmVmZXJlbmNlID0gYXdhaXQgZ2V0U2ltdWxhdG9yUHJlZmVyZW5jZSgpO1xuXG4gICAgLy8g6Lev5b6E5aSE55CGXG4gICAgY29uc3QgaXNEYXJ3aW4gPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJztcbiAgICBjb25zdCBqc0VuZ2luZVBhdGggPSBhd2FpdCBnZXRKc0VuZ2luZVBhdGgoKTtcbiAgICBjb25zdCBuYXRpdmVFbmdpbmVQYXRoID0gYXdhaXQgZ2V0TmF0aXZlRW5naW5lUGF0aCgpO1xuICAgIGNvbnN0IHNpbXVsYXRvclJvb3QgPSBqb2luKG5hdGl2ZUVuZ2luZVBhdGgsIGlzRGFyd2luID8gJ3NpbXVsYXRvci9EZWJ1Zy9TaW11bGF0b3JBcHAtTWFjLmFwcCcgOiAnc2ltdWxhdG9yL0RlYnVnJyk7XG4gICAgY29uc3Qgc2ltdWxhdG9yUmVzb3VyY2VzID0gaXNEYXJ3aW4gPyBqb2luKHNpbXVsYXRvclJvb3QsICdDb250ZW50cy9SZXNvdXJjZXMnKSA6IHNpbXVsYXRvclJvb3Q7XG4gICAgY29uc3QgZXhlY3V0YWJsZVNpbXVsYXRvciA9IGlzRGFyd2luID8gam9pbihzaW11bGF0b3JSb290LCAnQ29udGVudHMvTWFjT1MvU2ltdWxhdG9yQXBwLU1hYycpIDogam9pbihzaW11bGF0b3JSb290LCAnU2ltdWxhdG9yQXBwLVdpbjMyLmV4ZScpO1xuXG4gICAgZW5zdXJlRGlyU3luYyhqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2pzYi1hZGFwdGVyJykpO1xuICAgIGVuc3VyZURpclN5bmMoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvY29jb3MtanMnKSk7XG4gICAgLy8g5riF56m657yT5a2YXG4gICAgYXdhaXQgZW1wdHlEaXIoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdhc3NldHMnKSk7XG4gICAgY29uc3QgYXV0b0NsZWFuQ2FjaGUgPSBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRDb25maWcoJ3ByZXZpZXcnLCBgcHJldmlldy5hdXRvX2NsZWFuX2NhY2hlYCk7XG4gICAgaWYgKGF1dG9DbGVhbkNhY2hlKSB7XG4gICAgICAgIGF3YWl0IGVtcHR5RGlyKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnZ2FtZWNhY2hlcycpKTtcbiAgICB9XG5cbiAgICAvLyDnvJbor5EgYWRhcHRlclxuICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ25hdGl2ZScsICdjb21waWxlLWpzYi1hZGFwdGVyJyk7XG5cbiAgICAvLyDmoLnmja7lgY/lpb3orr7nva7nmoTmqKHlnZfphY3nva7vvIznlJ/miJAgY2MuanMg5YiwIHN0YXRpYy9zaW11bGF0b3IvY29jb3MtanMg55uu5b2VXG4gICAgLy8gVE9ETzog5L2/55SoIFFVSUNLX0NPTVBJTEUg57yW6K+RIGVuZ2luZVxuICAgIGNvbnN0IGNjTW9kdWxlRmlsZSA9IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2NvY29zLWpzL2NjLmpzJyk7XG4gICAgY29uc3QgY2NlQ29kZVF1YWxpdHlGaWxlID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvYnVpbHRpbi9jY2UuY29kZS1xdWFsaXR5LmNyLmpzJyk7XG4gICAgY29uc3QgY2NlRW52RmlsZSA9IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2J1aWx0aW4vY2NlLmVudi5qcycpO1xuICAgIGVuc3VyZURpclN5bmMoZGlybmFtZShjY01vZHVsZUZpbGUpKTtcbiAgICBlbnN1cmVEaXJTeW5jKGRpcm5hbWUoY2NlQ29kZVF1YWxpdHlGaWxlKSk7XG4gICAgY29uc3QgYnVpbGRUaW1lQ29uc3RhbnRzID0gc2V0dXBCdWlsZFRpbWVDb25zdGFudHMoe1xuICAgICAgICBtb2RlOiAnUFJFVklFVycsXG4gICAgICAgIHBsYXRmb3JtOiAnTkFUSVZFJyxcbiAgICAgICAgZmxhZ3M6IHtcbiAgICAgICAgICAgIERFQlVHOiB0cnVlLFxuICAgICAgICAgICAgVUlfR1BVX0RSSVZFTjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBzdGF0c1F1ZXJ5ID0gYXdhaXQgU3RhdHNRdWVyeS5jcmVhdGUoanNFbmdpbmVQYXRoKTtcblxuICAgIGNvbnN0IGZlYXR1cmVzID0gKGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldFByb2plY3QoJ2VuZ2luZScsICdtb2R1bGVzLmluY2x1ZGVNb2R1bGVzJykpIHx8IFtdO1xuICAgIGNvbnN0IGZlYXR1cmVVbml0cyA9IHN0YXRzUXVlcnkuZ2V0VW5pdHNPZkZlYXR1cmVzKGZlYXR1cmVzKTtcbiAgICBjb25zdCB7IGJ1aWxkIH0gPSBhd2FpdCBpbXBvcnQoJ0Bjb2Nvcy9idWlsZC1lbmdpbmUvZGlzdC9pbmRleCcpO1xuICAgIGNvbnN0IHsgY29kZTogaW5kZXhNb2QgfSA9IGF3YWl0IGJ1aWxkLnRyYW5zZm9ybShzdGF0c1F1ZXJ5LmV2YWx1YXRlSW5kZXhNb2R1bGVTb3VyY2UoXG4gICAgICAgIGZlYXR1cmVVbml0cyxcbiAgICAgICAgKG1vZHVsZU5hbWUpID0+IG1vZHVsZU5hbWUsIC8vIOWSjCBxdWljayBjb21waWxlciDnu5nnmoTliY3nvIDkuIDoh7QsXG4gICAgKSwgTW9kdWxlT3B0aW9uLnN5c3RlbSk7XG4gICAgY29uc3QgYnVpbHRpbk1vZHVsZVByb3ZpZGVyID0gYXdhaXQgQnVpbHRpbk1vZHVsZVByb3ZpZGVyLmNyZWF0ZSh7IGZvcm1hdDogJ3N5c3RlbWpzJyB9KTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgIGJ1aWx0aW5Nb2R1bGVQcm92aWRlci5hZGRCdWlsZFRpbWVDb25zdGFudHNNb2QoYnVpbGRUaW1lQ29uc3RhbnRzKSxcbiAgICBdKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoY2NNb2R1bGVGaWxlLCBpbmRleE1vZCwgJ3V0ZjgnKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoY2NlRW52RmlsZSwgYnVpbHRpbk1vZHVsZVByb3ZpZGVyLm1vZHVsZXNbJ2NjL2VudiddLCAndXRmOCcpO1xuXG4gICAgLy8g5ou36LSd5paH5Lu2XG4gICAgY29uc3QgdG9Db3B5ID0gW1xuICAgICAgICAvLyDmi7fotJ0ganNiLWFkYXB0ZXJcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKGpzRW5naW5lUGF0aCwgJ2Jpbi8uY2FjaGUvZGV2L25hdGl2ZS1wcmV2aWV3LWFkYXB0ZXIvanNiLWJ1aWx0aW4uanMnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnanNiLWFkYXB0ZXIvanNiLWJ1aWx0aW4uanMnKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKGpzRW5naW5lUGF0aCwgJ2Jpbi8uY2FjaGUvZGV2L25hdGl2ZS1wcmV2aWV3LWFkYXB0ZXIvanNiLWVuZ2luZS5qcycpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdqc2ItYWRhcHRlci9qc2ItZW5naW5lLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOaLt+i0nSBlbmdpbmUsIGltcG9ydC1tYXAuanNvblxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oanNFbmdpbmVQYXRoLCAnYmluLy5jYWNoZS9kZXYvbmF0aXZlLXByZXZpZXcnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2NvY29zLWpzJyksXG4gICAgICAgICAgICBpc0RpcjogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3IvaW1wb3J0LW1hcC5qc29uJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9pbXBvcnQtbWFwLmpzb24nKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3Ivc3lzdGVtLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvc3lzdGVtLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgaXNEaXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9wb2x5ZmlsbHMuYnVuZGxlLmpzJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9wb2x5ZmlsbHMuYnVuZGxlLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgXTtcbiAgICB0b0NvcHkuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgaWYgKGl0ZW0uaXNEaXIpIHtcbiAgICAgICAgICAgIGNvcHlEaXJTeW5jKGl0ZW0uc3JjLCBpdGVtLmRlc3QpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29weUZpbGVTeW5jKGl0ZW0uc3JjLCBpdGVtLmRlc3QpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyDlhpnlhaUgc2V0dGluZ3MuanNcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZ2VuZXJhdGVQcmV2aWV3RGF0YSgpO1xuICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9zZXR0aW5ncy5qc29uJyksIEpTT04uc3RyaW5naWZ5KGRhdGEuc2V0dGluZ3MsIHVuZGVmaW5lZCwgMikpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5idW5kbGVDb25maWdzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IGRhdGEuYnVuZGxlQ29uZmlnc1tpXTtcbiAgICAgICAgY29uc3QgYnVuZGxlRGlyID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdhc3NldHMnLCBjb25maWcubmFtZSk7XG4gICAgICAgIGVuc3VyZURpclN5bmMoYnVuZGxlRGlyKTtcbiAgICAgICAgLy8g5Yig6ZmkIGltcG9ydEJhc2Ug5ZKMIG5hdGl2ZUJhc2XvvIzkvb/nlKggZ2VuZXJhbEJhc2VcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBkZWxldGUgY29uZmlnLmltcG9ydEJhc2U7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZGVsZXRlIGNvbmZpZy5uYXRpdmVCYXNlO1xuICAgICAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihidW5kbGVEaXIsICdjYy5jb25maWcuanNvbicpLCBKU09OLnN0cmluZ2lmeShjb25maWcsIHVuZGVmaW5lZCwgMikpO1xuICAgICAgICAvLyBUT0RPOiDnm67liY3nmoTlrp7njrDot58gd2ViIOmihOiniOS4gOagt++8jOS4gOasoeaAp+WKoOi9veaJgOacieiEmuacrFxuICAgICAgICBjb25zdCBidW5kbGVFbnRyeSA9IFtdO1xuICAgICAgICBpZiAoY29uZmlnLm5hbWUgPT09ICdtYWluJykge1xuICAgICAgICAgICAgYnVuZGxlRW50cnkucHVzaCgnY2NlOi9pbnRlcm5hbC94L3ByZXJlcXVpc2l0ZS1pbXBvcnRzJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYnVuZGxlSW5kZXhKc1NvdXJjZSA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9idW5kbGVJbmRleC5lanMnKSwge1xuICAgICAgICAgICAgYnVuZGxlTmFtZTogY29uZmlnLm5hbWUsXG4gICAgICAgICAgICBidW5kbGVFbnRyeSxcbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKGJ1bmRsZURpciwgJ2luZGV4LmpzJyksIGJ1bmRsZUluZGV4SnNTb3VyY2UsICd1dGY4Jyk7XG4gICAgfVxuXG4gICAgLy8g5YaZ5YWl5Yid5aeL5Zy65pmv5pWw5o2uXG4gICAgbGV0IHByZXZpZXdTY2VuZUpzb25QYXRoID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdwcmV2aWV3LXNjZW5lLmpzb24nKTtcbiAgICBwcmV2aWV3U2NlbmVKc29uUGF0aCA9IGZvcm1hdFBhdGgocHJldmlld1NjZW5lSnNvblBhdGgpO1xuICAgIGF3YWl0IHdyaXRlRmlsZShwcmV2aWV3U2NlbmVKc29uUGF0aCwgZGF0YS5wcmV2aWV3U2NlbmVKc29uLCAndXRmOCcpO1xuXG4gICAgLy8g55Sf5oiQIG1haW4uanNcbiAgICBjb25zdCBwcmV2aWV3UG9ydCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NlcnZlcicsICdxdWVyeS1wb3J0Jyk7XG4gICAgY29uc3QgcHJldmlld0lwID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgncHJldmlldycsICdnZXQtcHJldmlldy1pcCcpO1xuICAgIGNvbnN0IG1haW5Kc1NvdXJjZSA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9tYWluLmVqcycpLCB7XG4gICAgICAgIGxpYnJhcnlQYXRoOiBmb3JtYXRQYXRoKGpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ2xpYnJhcnknKSksXG4gICAgICAgIHdhaXRGb3JDb25uZWN0OiBwcmVmZXJlbmNlLndhaXRGb3JDb25uZWN0LFxuICAgICAgICBwcm9qZWN0UGF0aDogZm9ybWF0UGF0aChFZGl0b3IuUHJvamVjdC5wYXRoKSxcbiAgICAgICAgcHJldmlld0lwLFxuICAgICAgICBwcmV2aWV3UG9ydCxcbiAgICB9KTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdtYWluLmpzJyksIG1haW5Kc1NvdXJjZSwgJ3V0ZjgnKTtcblxuICAgIC8vIOeUn+aIkCBhcHBsaWNhdGlvbi5qc1xuICAgIGNvbnN0IGluY2x1ZGVNb2R1bGVzID0gYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0UHJvamVjdCgnZW5naW5lJywgJ21vZHVsZXMuaW5jbHVkZU1vZHVsZXMnKTtcbiAgICBjb25zdCBoYXNQaHlzaWNzQW1tbyA9IGluY2x1ZGVNb2R1bGVzLmluY2x1ZGVzKCdwaHlzaWNzLWFtbW8nKTtcbiAgICBjb25zdCBwcm9qZWN0RGF0YSA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldFByb2plY3QoJ3Byb2plY3QnLCAnZ2VuZXJhbC5kZXNpZ25SZXNvbHV0aW9uJyk7XG4gICAgbGV0IHJlc29sdXRpb25Qb2xpY3k6IFJlc29sdXRpb25Qb2xpY3k7XG4gICAgaWYgKHByb2plY3REYXRhLmZpdFdpZHRoICYmIHByb2plY3REYXRhLmZpdEhlaWdodCkge1xuICAgICAgICByZXNvbHV0aW9uUG9saWN5ID0gUmVzb2x1dGlvblBvbGljeS5SZXNvbHV0aW9uU2hvd0FsbDtcbiAgICB9XG4gICAgZWxzZSBpZiAocHJvamVjdERhdGEuZml0V2lkdGggJiYgIXByb2plY3REYXRhLmZpdEhlaWdodCkge1xuICAgICAgICByZXNvbHV0aW9uUG9saWN5ID0gUmVzb2x1dGlvblBvbGljeS5SZXNvbHV0aW9uRml4ZWRXaWR0aDtcbiAgICB9XG4gICAgZWxzZSBpZiAoIXByb2plY3REYXRhLmZpdFdpZHRoICYmIHByb2plY3REYXRhLmZpdEhlaWdodCkge1xuICAgICAgICByZXNvbHV0aW9uUG9saWN5ID0gUmVzb2x1dGlvblBvbGljeS5SZXNvbHV0aW9uRml4ZWRIZWlnaHQ7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXNvbHV0aW9uUG9saWN5ID0gUmVzb2x1dGlvblBvbGljeS5SZXNvbHV0aW9uTm9Cb3JkZXI7XG4gICAgfVxuICAgIGNvbnN0IGRlc2lnblJlc29sdXRpb24gPSB7XG4gICAgICAgIHdpZHRoOiBwcm9qZWN0RGF0YS53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiBwcm9qZWN0RGF0YS5oZWlnaHQsXG4gICAgICAgIHJlc29sdXRpb25Qb2xpY3ksXG4gICAgfTtcbiAgICBjb25zdCBhcHBKc1NvdXJjZSA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9hcHBsaWNhdGlvbi5lanMnKSwge1xuICAgICAgICBoYXNQaHlzaWNzQW1tbyxcbiAgICAgICAgcHJldmlld1NjZW5lSnNvblBhdGgsXG4gICAgICAgIGxpYnJhcnlQYXRoOiBmb3JtYXRQYXRoKGpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ2xpYnJhcnknKSksXG4gICAgICAgIGRlc2lnblJlc29sdXRpb24sXG4gICAgICAgIHByZXZpZXdJcCxcbiAgICAgICAgcHJldmlld1BvcnQsXG4gICAgfSk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2FwcGxpY2F0aW9uLmpzJyksIGFwcEpzU291cmNlLCAndXRmOCcpO1xuXG4gICAgLy8g5qC55o2u5YGP5aW96K6+572u77yM5pu05paw5qih5ouf5Zmo6YWN572u5paH5Lu2XG4gICAgYXdhaXQgZ2VuZXJhdGVTaW11bGF0b3JDb25maWcoKTtcblxuICAgIC8vIOi/kOihjOaooeaLn+WZqFxuICAgIC8vIGVudmlyb25tZW50XG4gICAgLy8gVE9ETzog5Yid5aeL5YyW546v5aKD5Y+Y6YePXG4gICAgLy8gZW52ID0ge1xuICAgIC8vICAgICBDT0NPU19GUkFNRVdPUktTOiBQYXRoLmpvaW4oY29jb3NSb290LCAnLi4vJyksXG4gICAgLy8gICAgIENPQ09TX1hfUk9PVDogY29jb3NSb290LFxuICAgIC8vICAgICBDT0NPU19DT05TT0xFX1JPT1Q6IGNvY29zQ29uc29sZVJvb3QsXG4gICAgLy8gICAgIE5ES19ST09UOiBuZGtSb290LFxuICAgIC8vICAgICBBTkRST0lEX1NES19ST09UOiBhbmRyb2lkU0RLUm9vdFxuICAgIC8vIH07XG5cbiAgICAvLyAvLyBmb3JtYXQgZW52aXJvbm1lbnQgc3RyaW5nXG4gICAgLy8gZW52U3RyID0gJyc7XG4gICAgLy8gZm9yIChsZXQgayBpbiBlbnYpIHtcbiAgICAvLyAgICAgaWYgKGVudlN0ciAhPT0gJycpIHtcbiAgICAvLyAgICAgICAgIGVudlN0ciArPSAnOyc7XG4gICAgLy8gICAgIH1cblxuICAgIC8vICAgICBlbnZTdHIgKz0gYCR7a309JHtlbnZba119YDtcbiAgICAvLyB9XG4gICAgLy8gbGV0IGFyZ3MgPSBbJy13b3JrZGlyJywgc2ltdWxhdG9yUmVzb3VyY2VzLCAnLXdyaXRhYmxlLXBhdGgnLCBzaW11bGF0b3JSZXNvdXJjZXMsICctY29uc29sZScsICdmYWxzZScsICctLWVudicsIGVudlN0cl07XG4gICAgY29uc3QgYXJncyA9IFsnLXdvcmtkaXInLCBzaW11bGF0b3JSZXNvdXJjZXMsICctd3JpdGFibGUtcGF0aCcsIHNpbXVsYXRvclJlc291cmNlcywgJy1jb25zb2xlJywgJ2ZhbHNlJ107XG4gICAgc2ltdWxhdG9yUHJvY2VzcyA9IHNwYXduKGV4ZWN1dGFibGVTaW11bGF0b3IsIGFyZ3MpO1xuXG4gICAgLy8g5omT5byA5qih5ouf5Zmo6LCD6K+V5ZmoXG4gICAgaWYgKHByZWZlcmVuY2Uuc2hvd0RlYnVnUGFuZWwpIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuUGFuZWwub3BlbigncHJldmlldy5kZWJ1Z2dlcicpO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICB9XG5cbiAgICAvLyDnm5HlkKzmqKHmi5/lmajov5vnqIvnmoTovpPlh7pcbiAgICBzaW11bGF0b3JQcm9jZXNzLm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgICAgRWRpdG9yLlBhbmVsLmNsb3NlKCdwcmV2aWV3LmRlYnVnZ2VyJyk7XG4gICAgfSk7XG4gICAgc2ltdWxhdG9yUHJvY2Vzcy5zdGRvdXQ/Lm9uKCdkYXRhJywgZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEudG9TdHJpbmcgPyBkYXRhLnRvU3RyaW5nKCkgOiBkYXRhKTtcbiAgICB9KTtcbiAgICBzaW11bGF0b3JQcm9jZXNzLnN0ZGVycj8ub24oJ2RhdGEnLCBkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihkYXRhLnRvU3RyaW5nID8gZGF0YS50b1N0cmluZygpIDogZGF0YSk7XG4gICAgfSk7XG4gICAgc2ltdWxhdG9yUHJvY2Vzcy5vbignZXJyb3InLCBkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihkYXRhLnRvU3RyaW5nID8gZGF0YS50b1N0cmluZygpIDogZGF0YSk7XG4gICAgfSk7XG59XG4iXX0=