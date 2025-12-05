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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltdWxhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2Jyb3dzZXIvc2ltdWxhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBcUM7QUFDckMsOENBQXNCO0FBQ3RCLHVDQUFzRjtBQUN0RixpREFBb0Q7QUFDcEQsMERBQWlDO0FBQ2pDLHdGQUF3RjtBQUN4RixrR0FBNkY7QUFDN0Ysc0VBQWtFO0FBQ2xFLHNEQUFtRDtBQUNuRCx1REFBbUo7QUFFbkosSUFBSyxnQkFNSjtBQU5ELFdBQUssZ0JBQWdCO0lBQ2pCLG1GQUFrQixDQUFBO0lBQ2xCLG1GQUFrQixDQUFBO0lBQ2xCLGlGQUFpQixDQUFBO0lBQ2pCLHlGQUFxQixDQUFBO0lBQ3JCLHVGQUFvQixDQUFBO0FBQ3hCLENBQUMsRUFOSSxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBTXBCO0FBQ0QsSUFBSSxnQkFBcUMsQ0FBQyxDQUFFLGdCQUFnQjtBQUU1RCxTQUFTLG9CQUFvQjtJQUN6QixJQUFJLGdCQUFnQixFQUFFO1FBQ2xCLG1CQUFRLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO0tBQzNCO0FBQ0wsQ0FBQztBQUVELEtBQUssVUFBVSxtQkFBbUI7SUFDOUIsMEJBQTBCO0lBQzFCLE1BQU0sSUFBSSxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLG1CQUFtQixFQUFFO1FBQ3RFLElBQUksRUFBRSxXQUFXO1FBQ2pCLFFBQVEsRUFBRSxTQUFTO0tBQ3RCLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0tBQ3JDO0lBRUQsT0FBTztJQUNQLElBQUks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QUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDO0lBQ0gsTUFBQSxnQkFBZ0IsQ0FBQyxNQUFNLDBDQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUU7UUFDdkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RELENBQUMsQ0FBQyxDQUFDO0lBQ0gsTUFBQSxnQkFBZ0IsQ0FBQyxNQUFNLDBDQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUU7UUFDdkMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hELENBQUMsQ0FBQyxDQUFDO0lBQ0gsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsRUFBRTtRQUNoQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEQsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBL05ELG9DQStOQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRpcm5hbWUsIGpvaW4gfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IEVqcyBmcm9tICdlanMnO1xuaW1wb3J0IHsgd3JpdGVGaWxlLCBjb3B5RmlsZVN5bmMsIGVuc3VyZURpclN5bmMsIGVtcHR5RGlyLCByZWFkRmlsZSB9IGZyb20gXCJmcy1leHRyYVwiO1xuaW1wb3J0IHsgQ2hpbGRQcm9jZXNzLCBzcGF3biB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHRyZWVLaWxsIGZyb20gJ3RyZWUta2lsbCc7XG5pbXBvcnQgeyBzZXR1cEJ1aWxkVGltZUNvbnN0YW50cyB9IGZyb20gJ0Bjb2Nvcy9idWlsZC1lbmdpbmUvZGlzdC9idWlsZC10aW1lLWNvbnN0YW50cyc7XG5pbXBvcnQgeyBCdWlsdGluTW9kdWxlUHJvdmlkZXIgfSBmcm9tIFwiQGVkaXRvci9saWItcHJvZ3JhbW1pbmcvZGlzdC9idWlsdGluLW1vZHVsZS1wcm92aWRlclwiO1xuaW1wb3J0IHsgU3RhdHNRdWVyeSB9IGZyb20gJ0Bjb2Nvcy9idWlsZC1lbmdpbmUvZGlzdC9zdGF0cy1xdWVyeSc7XG5pbXBvcnQgeyBNb2R1bGVPcHRpb24gfSBmcm9tICdAY29jb3MvYnVpbGQtZW5naW5lJztcbmltcG9ydCB7IGNvcHlEaXJTeW5jLCBmb3JtYXRQYXRoLCBnZW5lcmF0ZVNpbXVsYXRvckNvbmZpZywgZ2V0SnNFbmdpbmVQYXRoLCBnZXROYXRpdmVFbmdpbmVQYXRoLCBnZXRTaW11bGF0b3JQcmVmZXJlbmNlIH0gZnJvbSBcIi4vc2ltdWxhdG9yLXV0aWxzXCI7XG5cbmVudW0gUmVzb2x1dGlvblBvbGljeSB7XG4gICAgUmVzb2x1dGlvbkV4YWN0Rml0LFxuICAgIFJlc29sdXRpb25Ob0JvcmRlcixcbiAgICBSZXNvbHV0aW9uU2hvd0FsbCxcbiAgICBSZXNvbHV0aW9uRml4ZWRIZWlnaHQsXG4gICAgUmVzb2x1dGlvbkZpeGVkV2lkdGgsXG59XG5sZXQgc2ltdWxhdG9yUHJvY2VzczogQ2hpbGRQcm9jZXNzIHwgbnVsbDsgIC8vIOagh+ivhuaooeaLn+WZqOmihOiniOi/m+eoi+aYr+WQpuWtmOWcqFxuXG5mdW5jdGlvbiBzdG9wU2ltdWxhdG9yUHJvY2VzcygpIHtcbiAgICBpZiAoc2ltdWxhdG9yUHJvY2Vzcykge1xuICAgICAgICB0cmVlS2lsbChzaW11bGF0b3JQcm9jZXNzLnBpZCk7XG4gICAgICAgIHNpbXVsYXRvclByb2Nlc3MgPSBudWxsO1xuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVQcmV2aWV3RGF0YSgpIHtcbiAgICAvLyDmqKHmi5/lmajpooTop4jkuI3pnIDopoEgbGF1bmNoU2NlbmUg5pWw5o2uXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3ByZXZpZXcnLCAnZ2VuZXJhdGUtc2V0dGluZ3MnLCB7XG4gICAgICAgIHR5cGU6ICdzaW11bGF0b3InLFxuICAgICAgICBwbGF0Zm9ybTogJ3dpbmRvd3MnLFxuICAgIH0pO1xuXG4gICAgaWYgKCEoZGF0YSAmJiBkYXRhLnNldHRpbmdzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOaehOW7uiBzZXR0aW5ncyDlh7rplJlgKTtcbiAgICB9XG5cbiAgICAvLyDlkK/liqjlnLrmma9cbiAgICBsZXQgcHJldmlld1NjZW5lSnNvbjogc3RyaW5nO1xuICAgIGNvbnN0IHByZXZpZXdTY2VuZSA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldENvbmZpZygncHJldmlldycsIGBnZW5lcmFsLnN0YXJ0X3NjZW5lYCk7XG4gICAgaWYgKHByZXZpZXdTY2VuZSA9PT0gJ2N1cnJlbnRfc2NlbmUnKSB7XG4gICAgICAgIHByZXZpZXdTY2VuZUpzb24gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1zY2VuZS1qc29uJyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zdCBwcmV2aWV3U2NlbmVQYXRoID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktcGF0aCcsIHByZXZpZXdTY2VuZSkgYXMgc3RyaW5nO1xuICAgICAgICBwcmV2aWV3U2NlbmVKc29uID0gYXdhaXQgcmVhZEZpbGUocHJldmlld1NjZW5lUGF0aCwgJ3V0ZjgnKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcHJldmlld1NjZW5lSnNvbixcbiAgICAgICAgc2V0dGluZ3M6IGRhdGEuc2V0dGluZ3MsXG4gICAgICAgIGJ1bmRsZUNvbmZpZ3M6IGRhdGEuYnVuZGxlQ29uZmlncyxcbiAgICB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuU2ltdWxhdG9yKCkge1xuICAgIC8vIOWFs+mXreaooeaLn+WZqFxuICAgIHN0b3BTaW11bGF0b3JQcm9jZXNzKCk7XG5cbiAgICAvLyDojrflj5bmqKHmi5/lmajlgY/lpb3orr7nva5cbiAgICBjb25zdCBwcmVmZXJlbmNlID0gYXdhaXQgZ2V0U2ltdWxhdG9yUHJlZmVyZW5jZSgpO1xuXG4gICAgLy8g6Lev5b6E5aSE55CGXG4gICAgY29uc3QgaXNEYXJ3aW4gPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJztcbiAgICBjb25zdCBqc0VuZ2luZVBhdGggPSBhd2FpdCBnZXRKc0VuZ2luZVBhdGgoKTtcbiAgICBjb25zdCBuYXRpdmVFbmdpbmVQYXRoID0gYXdhaXQgZ2V0TmF0aXZlRW5naW5lUGF0aCgpO1xuICAgIGNvbnN0IHNpbXVsYXRvclJvb3QgPSBqb2luKG5hdGl2ZUVuZ2luZVBhdGgsIGlzRGFyd2luPyAnc2ltdWxhdG9yL0RlYnVnL1NpbXVsYXRvckFwcC1NYWMuYXBwJzogJ3NpbXVsYXRvci9EZWJ1ZycpO1xuICAgIGNvbnN0IHNpbXVsYXRvclJlc291cmNlcyA9IGlzRGFyd2luPyBqb2luKHNpbXVsYXRvclJvb3QsICdDb250ZW50cy9SZXNvdXJjZXMnKTogc2ltdWxhdG9yUm9vdDtcbiAgICBjb25zdCBleGVjdXRhYmxlU2ltdWxhdG9yID0gaXNEYXJ3aW4/IGpvaW4oc2ltdWxhdG9yUm9vdCwgJ0NvbnRlbnRzL01hY09TL1NpbXVsYXRvckFwcC1NYWMnKTogam9pbihzaW11bGF0b3JSb290LCAnU2ltdWxhdG9yQXBwLVdpbjMyLmV4ZScpO1xuXG4gICAgZW5zdXJlRGlyU3luYyhqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2pzYi1hZGFwdGVyJykpO1xuICAgIGVuc3VyZURpclN5bmMoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvY29jb3MtanMnKSk7XG4gICAgLy8g5riF56m657yT5a2YXG4gICAgYXdhaXQgZW1wdHlEaXIoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdhc3NldHMnKSk7XG4gICAgY29uc3QgYXV0b0NsZWFuQ2FjaGUgPSBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRDb25maWcoJ3ByZXZpZXcnLCBgcHJldmlldy5hdXRvX2NsZWFuX2NhY2hlYCk7XG4gICAgaWYgKGF1dG9DbGVhbkNhY2hlKSB7XG4gICAgICAgIGF3YWl0IGVtcHR5RGlyKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnZ2FtZWNhY2hlcycpKTtcbiAgICB9XG5cbiAgICAvLyDnvJbor5EgYWRhcHRlclxuICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ25hdGl2ZScsICdjb21waWxlLWpzYi1hZGFwdGVyJyk7XG5cbiAgICAvLyDmoLnmja7lgY/lpb3orr7nva7nmoTmqKHlnZfphY3nva7vvIznlJ/miJAgY2MuanMg5YiwIHN0YXRpYy9zaW11bGF0b3IvY29jb3MtanMg55uu5b2VXG4gICAgLy8gVE9ETzog5L2/55SoIFFVSUNLX0NPTVBJTEUg57yW6K+RIGVuZ2luZVxuICAgIGNvbnN0IGNjTW9kdWxlRmlsZSA9IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2NvY29zLWpzL2NjLmpzJyk7XG4gICAgY29uc3QgY2NlQ29kZVF1YWxpdHlGaWxlID0gam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvYnVpbHRpbi9jY2UuY29kZS1xdWFsaXR5LmNyLmpzJyk7XG4gICAgY29uc3QgY2NlRW52RmlsZSA9IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2J1aWx0aW4vY2NlLmVudi5qcycpO1xuICAgIGVuc3VyZURpclN5bmMoZGlybmFtZShjY01vZHVsZUZpbGUpKTtcbiAgICBlbnN1cmVEaXJTeW5jKGRpcm5hbWUoY2NlQ29kZVF1YWxpdHlGaWxlKSk7XG4gICAgY29uc3QgYnVpbGRUaW1lQ29uc3RhbnRzID0gc2V0dXBCdWlsZFRpbWVDb25zdGFudHMoe1xuICAgICAgICBtb2RlOiAnUFJFVklFVycsXG4gICAgICAgIHBsYXRmb3JtOiAnTkFUSVZFJyxcbiAgICAgICAgZmxhZ3M6IHtcbiAgICAgICAgICAgIERFQlVHOiB0cnVlLFxuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3RhdHNRdWVyeSA9IGF3YWl0IFN0YXRzUXVlcnkuY3JlYXRlKGpzRW5naW5lUGF0aCk7XG5cbiAgICBjb25zdCBmZWF0dXJlcyA9IChhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRQcm9qZWN0KCdlbmdpbmUnLCAnbW9kdWxlcy5pbmNsdWRlTW9kdWxlcycpKSB8fCBbXTtcbiAgICBjb25zdCBmZWF0dXJlVW5pdHMgPSBzdGF0c1F1ZXJ5LmdldFVuaXRzT2ZGZWF0dXJlcyhmZWF0dXJlcyk7XG4gICAgY29uc3QgeyBidWlsZCB9ID0gYXdhaXQgaW1wb3J0KCdAY29jb3MvYnVpbGQtZW5naW5lL2Rpc3QvaW5kZXgnKTtcbiAgICBjb25zdCB7IGNvZGU6IGluZGV4TW9kIH0gPSBhd2FpdCBidWlsZC50cmFuc2Zvcm0oc3RhdHNRdWVyeS5ldmFsdWF0ZUluZGV4TW9kdWxlU291cmNlKFxuICAgICAgICBmZWF0dXJlVW5pdHMsXG4gICAgICAgIChtb2R1bGVOYW1lKSA9PiBtb2R1bGVOYW1lLCAvLyDlkowgcXVpY2sgY29tcGlsZXIg57uZ55qE5YmN57yA5LiA6Ie0LFxuICAgICksIE1vZHVsZU9wdGlvbi5zeXN0ZW0pO1xuICAgIGNvbnN0IGJ1aWx0aW5Nb2R1bGVQcm92aWRlciA9IGF3YWl0IEJ1aWx0aW5Nb2R1bGVQcm92aWRlci5jcmVhdGUoeyBmb3JtYXQ6ICdzeXN0ZW1qcycgfSk7XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICBidWlsdGluTW9kdWxlUHJvdmlkZXIuYWRkQnVpbGRUaW1lQ29uc3RhbnRzTW9kKGJ1aWxkVGltZUNvbnN0YW50cyksXG4gICAgXSk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKGNjTW9kdWxlRmlsZSwgaW5kZXhNb2QsICd1dGY4Jyk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKGNjZUVudkZpbGUsIGJ1aWx0aW5Nb2R1bGVQcm92aWRlci5tb2R1bGVzWydjYy9lbnYnXSwgJ3V0ZjgnKTtcblxuICAgIC8vIOaLt+i0neaWh+S7tlxuICAgIGNvbnN0IHRvQ29weSA9IFtcbiAgICAgICAgLy8g5ou36LSdIGpzYi1hZGFwdGVyXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihqc0VuZ2luZVBhdGgsICdiaW4vLmNhY2hlL2Rldi9uYXRpdmUtcHJldmlldy1hZGFwdGVyL2pzYi1idWlsdGluLmpzJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2pzYi1hZGFwdGVyL2pzYi1idWlsdGluLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihqc0VuZ2luZVBhdGgsICdiaW4vLmNhY2hlL2Rldi9uYXRpdmUtcHJldmlldy1hZGFwdGVyL2pzYi1lbmdpbmUuanMnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnanNiLWFkYXB0ZXIvanNiLWVuZ2luZS5qcycpLFxuICAgICAgICAgICAgaXNEaXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICAvLyDmi7fotJ0gZW5naW5lLCBpbXBvcnQtbWFwLmpzb25cbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKGpzRW5naW5lUGF0aCwgJ2Jpbi8uY2FjaGUvZGV2L25hdGl2ZS1wcmV2aWV3JyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9jb2Nvcy1qcycpLFxuICAgICAgICAgICAgaXNEaXI6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL2ltcG9ydC1tYXAuanNvbicpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvaW1wb3J0LW1hcC5qc29uJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL3N5c3RlbS5idW5kbGUuanMnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL3N5c3RlbS5idW5kbGUuanMnKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3IvcG9seWZpbGxzLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvcG9seWZpbGxzLmJ1bmRsZS5qcycpLFxuICAgICAgICAgICAgaXNEaXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgIF07XG4gICAgdG9Db3B5LmZvckVhY2goaXRlbSA9PiB7XG4gICAgICAgIGlmIChpdGVtLmlzRGlyKSB7XG4gICAgICAgICAgICBjb3B5RGlyU3luYyhpdGVtLnNyYywgaXRlbS5kZXN0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvcHlGaWxlU3luYyhpdGVtLnNyYywgaXRlbS5kZXN0KTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8g5YaZ5YWlIHNldHRpbmdzLmpzXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGdlbmVyYXRlUHJldmlld0RhdGEoKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvc2V0dGluZ3MuanNvbicpLCBKU09OLnN0cmluZ2lmeShkYXRhLnNldHRpbmdzLCB1bmRlZmluZWQsIDIpKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEuYnVuZGxlQ29uZmlncy5sZW5ndGg7ICsraSkge1xuICAgICAgICBjb25zdCBjb25maWcgPSBkYXRhLmJ1bmRsZUNvbmZpZ3NbaV07XG4gICAgICAgIGNvbnN0IGJ1bmRsZURpciA9IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnYXNzZXRzJywgY29uZmlnLm5hbWUpO1xuICAgICAgICBlbnN1cmVEaXJTeW5jKGJ1bmRsZURpcik7XG4gICAgICAgIC8vIOWIoOmZpCBpbXBvcnRCYXNlIOWSjCBuYXRpdmVCYXNl77yM5L2/55SoIGdlbmVyYWxCYXNlXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZGVsZXRlIGNvbmZpZy5pbXBvcnRCYXNlO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGRlbGV0ZSBjb25maWcubmF0aXZlQmFzZTtcbiAgICAgICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oYnVuZGxlRGlyLCAnY2MuY29uZmlnLmpzb24nKSwgSlNPTi5zdHJpbmdpZnkoY29uZmlnLCB1bmRlZmluZWQsIDIpKTtcbiAgICAgICAgLy8gVE9ETzog55uu5YmN55qE5a6e546w6LefIHdlYiDpooTop4jkuIDmoLfvvIzkuIDmrKHmgKfliqDovb3miYDmnInohJrmnKxcbiAgICAgICAgY29uc3QgYnVuZGxlRW50cnkgPSBbXTtcbiAgICAgICAgaWYgKGNvbmZpZy5uYW1lID09PSAnbWFpbicpIHtcbiAgICAgICAgICAgIGJ1bmRsZUVudHJ5LnB1c2goJ2NjZTovaW50ZXJuYWwveC9wcmVyZXF1aXNpdGUtaW1wb3J0cycpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJ1bmRsZUluZGV4SnNTb3VyY2UgPSBhd2FpdCBFanMucmVuZGVyRmlsZShqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3IvYnVuZGxlSW5kZXguZWpzJyksIHtcbiAgICAgICAgICAgIGJ1bmRsZU5hbWU6IGNvbmZpZy5uYW1lLFxuICAgICAgICAgICAgYnVuZGxlRW50cnksXG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihidW5kbGVEaXIsICdpbmRleC5qcycpLCBidW5kbGVJbmRleEpzU291cmNlLCAndXRmOCcpO1xuICAgIH1cblxuICAgIC8vIOWGmeWFpeWIneWni+WcuuaZr+aVsOaNrlxuICAgIGxldCBwcmV2aWV3U2NlbmVKc29uUGF0aCA9IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAncHJldmlldy1zY2VuZS5qc29uJyk7XG4gICAgcHJldmlld1NjZW5lSnNvblBhdGggPSBmb3JtYXRQYXRoKHByZXZpZXdTY2VuZUpzb25QYXRoKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUocHJldmlld1NjZW5lSnNvblBhdGgsIGRhdGEucHJldmlld1NjZW5lSnNvbiwgJ3V0ZjgnKTtcblxuICAgIC8vIOeUn+aIkCBtYWluLmpzXG4gICAgY29uc3QgcHJldmlld1BvcnQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzZXJ2ZXInLCAncXVlcnktcG9ydCcpO1xuICAgIGNvbnN0IHByZXZpZXdJcCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3ByZXZpZXcnLCAnZ2V0LXByZXZpZXctaXAnKTtcbiAgICBjb25zdCBtYWluSnNTb3VyY2UgPSBhd2FpdCBFanMucmVuZGVyRmlsZShqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3IvbWFpbi5lanMnKSwge1xuICAgICAgICBsaWJyYXJ5UGF0aDogZm9ybWF0UGF0aChqb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsICdsaWJyYXJ5JykpLFxuICAgICAgICB3YWl0Rm9yQ29ubmVjdDogcHJlZmVyZW5jZS53YWl0Rm9yQ29ubmVjdCxcbiAgICAgICAgcHJvamVjdFBhdGg6IGZvcm1hdFBhdGgoRWRpdG9yLlByb2plY3QucGF0aCksXG4gICAgICAgIHByZXZpZXdJcCxcbiAgICAgICAgcHJldmlld1BvcnQsXG4gICAgfSk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnbWFpbi5qcycpLCBtYWluSnNTb3VyY2UsICd1dGY4Jyk7XG5cbiAgICAvLyDnlJ/miJAgYXBwbGljYXRpb24uanNcbiAgICBjb25zdCBpbmNsdWRlTW9kdWxlcyA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldFByb2plY3QoJ2VuZ2luZScsICdtb2R1bGVzLmluY2x1ZGVNb2R1bGVzJyk7XG4gICAgY29uc3QgaGFzUGh5c2ljc0FtbW8gPSBpbmNsdWRlTW9kdWxlcy5pbmNsdWRlcygncGh5c2ljcy1hbW1vJyk7XG4gICAgY29uc3QgcHJvamVjdERhdGEgPSBhd2FpdCBFZGl0b3IuUHJvZmlsZS5nZXRQcm9qZWN0KCdwcm9qZWN0JywgJ2dlbmVyYWwuZGVzaWduUmVzb2x1dGlvbicpO1xuICAgIGxldCByZXNvbHV0aW9uUG9saWN5OiBSZXNvbHV0aW9uUG9saWN5O1xuICAgIGlmIChwcm9qZWN0RGF0YS5maXRXaWR0aCAmJiBwcm9qZWN0RGF0YS5maXRIZWlnaHQpIHtcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuUmVzb2x1dGlvblNob3dBbGw7XG4gICAgfVxuICAgIGVsc2UgaWYgKHByb2plY3REYXRhLmZpdFdpZHRoICYmICFwcm9qZWN0RGF0YS5maXRIZWlnaHQpIHtcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuUmVzb2x1dGlvbkZpeGVkV2lkdGg7XG4gICAgfVxuICAgIGVsc2UgaWYgKCFwcm9qZWN0RGF0YS5maXRXaWR0aCAmJiBwcm9qZWN0RGF0YS5maXRIZWlnaHQpIHtcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuUmVzb2x1dGlvbkZpeGVkSGVpZ2h0O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmVzb2x1dGlvblBvbGljeSA9IFJlc29sdXRpb25Qb2xpY3kuUmVzb2x1dGlvbk5vQm9yZGVyO1xuICAgIH1cbiAgICBjb25zdCBkZXNpZ25SZXNvbHV0aW9uID0ge1xuICAgICAgICB3aWR0aDogcHJvamVjdERhdGEud2lkdGgsXG4gICAgICAgIGhlaWdodDogcHJvamVjdERhdGEuaGVpZ2h0LFxuICAgICAgICByZXNvbHV0aW9uUG9saWN5LFxuICAgIH07XG4gICAgY29uc3QgYXBwSnNTb3VyY2UgPSBhd2FpdCBFanMucmVuZGVyRmlsZShqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3IvYXBwbGljYXRpb24uZWpzJyksIHtcbiAgICAgICAgaGFzUGh5c2ljc0FtbW8sXG4gICAgICAgIHByZXZpZXdTY2VuZUpzb25QYXRoLFxuICAgICAgICBsaWJyYXJ5UGF0aDogZm9ybWF0UGF0aChqb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsICdsaWJyYXJ5JykpLFxuICAgICAgICBkZXNpZ25SZXNvbHV0aW9uLFxuICAgICAgICBwcmV2aWV3SXAsXG4gICAgICAgIHByZXZpZXdQb3J0LFxuICAgIH0pO1xuICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9hcHBsaWNhdGlvbi5qcycpLCBhcHBKc1NvdXJjZSwgJ3V0ZjgnKTtcblxuICAgIC8vIOagueaNruWBj+Wlveiuvue9ru+8jOabtOaWsOaooeaLn+WZqOmFjee9ruaWh+S7tlxuICAgIGF3YWl0IGdlbmVyYXRlU2ltdWxhdG9yQ29uZmlnKCk7XG5cbiAgICAvLyDov5DooYzmqKHmi5/lmahcbiAgICAvLyBlbnZpcm9ubWVudFxuICAgIC8vIFRPRE86IOWIneWni+WMlueOr+Wig+WPmOmHj1xuICAgIC8vIGVudiA9IHtcbiAgICAvLyAgICAgQ09DT1NfRlJBTUVXT1JLUzogUGF0aC5qb2luKGNvY29zUm9vdCwgJy4uLycpLFxuICAgIC8vICAgICBDT0NPU19YX1JPT1Q6IGNvY29zUm9vdCxcbiAgICAvLyAgICAgQ09DT1NfQ09OU09MRV9ST09UOiBjb2Nvc0NvbnNvbGVSb290LFxuICAgIC8vICAgICBOREtfUk9PVDogbmRrUm9vdCxcbiAgICAvLyAgICAgQU5EUk9JRF9TREtfUk9PVDogYW5kcm9pZFNES1Jvb3RcbiAgICAvLyB9O1xuXG4gICAgLy8gLy8gZm9ybWF0IGVudmlyb25tZW50IHN0cmluZ1xuICAgIC8vIGVudlN0ciA9ICcnO1xuICAgIC8vIGZvciAobGV0IGsgaW4gZW52KSB7XG4gICAgLy8gICAgIGlmIChlbnZTdHIgIT09ICcnKSB7XG4gICAgLy8gICAgICAgICBlbnZTdHIgKz0gJzsnO1xuICAgIC8vICAgICB9XG5cbiAgICAvLyAgICAgZW52U3RyICs9IGAke2t9PSR7ZW52W2tdfWA7XG4gICAgLy8gfVxuICAgIC8vIGxldCBhcmdzID0gWyctd29ya2RpcicsIHNpbXVsYXRvclJlc291cmNlcywgJy13cml0YWJsZS1wYXRoJywgc2ltdWxhdG9yUmVzb3VyY2VzLCAnLWNvbnNvbGUnLCAnZmFsc2UnLCAnLS1lbnYnLCBlbnZTdHJdO1xuICAgIGNvbnN0IGFyZ3MgPSBbJy13b3JrZGlyJywgc2ltdWxhdG9yUmVzb3VyY2VzLCAnLXdyaXRhYmxlLXBhdGgnLCBzaW11bGF0b3JSZXNvdXJjZXMsICctY29uc29sZScsICdmYWxzZSddO1xuICAgIHNpbXVsYXRvclByb2Nlc3MgPSBzcGF3bihleGVjdXRhYmxlU2ltdWxhdG9yLCBhcmdzKTtcblxuICAgIC8vIOaJk+W8gOaooeaLn+WZqOiwg+ivleWZqFxuICAgIGlmIChwcmVmZXJlbmNlLnNob3dEZWJ1Z1BhbmVsKSB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLlBhbmVsLm9wZW4oJ3ByZXZpZXcuZGVidWdnZXInKTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfVxuXG4gICAgLy8g55uR5ZCs5qih5ouf5Zmo6L+b56iL55qE6L6T5Ye6XG4gICAgc2ltdWxhdG9yUHJvY2Vzcy5vbignY2xvc2UnLCAoKSA9PiB7XG4gICAgICAgIEVkaXRvci5QYW5lbC5jbG9zZSgncHJldmlldy5kZWJ1Z2dlcicpO1xuICAgIH0pO1xuICAgIHNpbXVsYXRvclByb2Nlc3Muc3Rkb3V0Py5vbignZGF0YScsIGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhLnRvU3RyaW5nPyBkYXRhLnRvU3RyaW5nKCk6IGRhdGEpO1xuICAgIH0pO1xuICAgIHNpbXVsYXRvclByb2Nlc3Muc3RkZXJyPy5vbignZGF0YScsIGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGRhdGEudG9TdHJpbmc/IGRhdGEudG9TdHJpbmcoKTogZGF0YSk7XG4gICAgfSk7XG4gICAgc2ltdWxhdG9yUHJvY2Vzcy5vbignZXJyb3InLCBkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihkYXRhLnRvU3RyaW5nPyBkYXRhLnRvU3RyaW5nKCk6IGRhdGEpO1xuICAgIH0pO1xufVxuIl19