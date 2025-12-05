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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltdWxhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2Jyb3dzZXIvc2ltdWxhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0JBQXFDO0FBQ3JDLDhDQUFzQjtBQUN0Qix1Q0FBc0Y7QUFDdEYsaURBQW9EO0FBQ3BELDBEQUFpQztBQUNqQyxrR0FBNkY7QUFDN0Ysc0RBQStEO0FBQy9ELHVEQUFtSjtBQUVuSixJQUFLLGdCQU1KO0FBTkQsV0FBSyxnQkFBZ0I7SUFDakIsbUZBQWtCLENBQUE7SUFDbEIsbUZBQWtCLENBQUE7SUFDbEIsaUZBQWlCLENBQUE7SUFDakIseUZBQXFCLENBQUE7SUFDckIsdUZBQW9CLENBQUE7QUFDeEIsQ0FBQyxFQU5JLGdCQUFnQixLQUFoQixnQkFBZ0IsUUFNcEI7QUFDRCxJQUFJLGdCQUFxQyxDQUFDLENBQUMsZ0JBQWdCO0FBRTNELFNBQVMsb0JBQW9CO0lBQ3pCLElBQUksZ0JBQWdCLEVBQUU7UUFDbEIsSUFBQSxtQkFBUSxFQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9CLGdCQUFnQixHQUFHLElBQUksQ0FBQztLQUMzQjtBQUNMLENBQUM7QUFFRCxLQUFLLFVBQVUsbUJBQW1CO0lBQzlCLDBCQUEwQjtJQUMxQixNQUFNLElBQUksR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxtQkFBbUIsRUFBRTtRQUN0RSxJQUFJLEVBQUUsV0FBVztRQUNqQixRQUFRLEVBQUUsU0FBUztLQUN0QixDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztLQUNyQztJQUVELE9BQU87SUFDUCxJQUFJLGdCQUF3QixDQUFDO0lBQzdC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QVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxRCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUE5TkQsb0NBOE5DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGlybmFtZSwgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IEVqcyBmcm9tICdlanMnO1xuaW1wb3J0IHsgd3JpdGVGaWxlLCBjb3B5RmlsZVN5bmMsIGVuc3VyZURpclN5bmMsIGVtcHR5RGlyLCByZWFkRmlsZSB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IENoaWxkUHJvY2Vzcywgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCB0cmVlS2lsbCBmcm9tICd0cmVlLWtpbGwnO1xuaW1wb3J0IHsgQnVpbHRpbk1vZHVsZVByb3ZpZGVyIH0gZnJvbSAnQGVkaXRvci9saWItcHJvZ3JhbW1pbmcvZGlzdC9idWlsdGluLW1vZHVsZS1wcm92aWRlcic7XG5pbXBvcnQgeyBTdGF0c1F1ZXJ5LCBNb2R1bGVPcHRpb24gfSBmcm9tICdAY29jb3MvYnVpbGQtZW5naW5lJztcbmltcG9ydCB7IGNvcHlEaXJTeW5jLCBmb3JtYXRQYXRoLCBnZW5lcmF0ZVNpbXVsYXRvckNvbmZpZywgZ2V0SnNFbmdpbmVQYXRoLCBnZXROYXRpdmVFbmdpbmVQYXRoLCBnZXRTaW11bGF0b3JQcmVmZXJlbmNlIH0gZnJvbSAnLi9zaW11bGF0b3ItdXRpbHMnO1xuXG5lbnVtIFJlc29sdXRpb25Qb2xpY3kge1xuICAgIFJlc29sdXRpb25FeGFjdEZpdCxcbiAgICBSZXNvbHV0aW9uTm9Cb3JkZXIsXG4gICAgUmVzb2x1dGlvblNob3dBbGwsXG4gICAgUmVzb2x1dGlvbkZpeGVkSGVpZ2h0LFxuICAgIFJlc29sdXRpb25GaXhlZFdpZHRoLFxufVxubGV0IHNpbXVsYXRvclByb2Nlc3M6IENoaWxkUHJvY2VzcyB8IG51bGw7IC8vIOagh+ivhuaooeaLn+WZqOmihOiniOi/m+eoi+aYr+WQpuWtmOWcqFxuXG5mdW5jdGlvbiBzdG9wU2ltdWxhdG9yUHJvY2VzcygpIHtcbiAgICBpZiAoc2ltdWxhdG9yUHJvY2Vzcykge1xuICAgICAgICB0cmVlS2lsbChzaW11bGF0b3JQcm9jZXNzLnBpZCk7XG4gICAgICAgIHNpbXVsYXRvclByb2Nlc3MgPSBudWxsO1xuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVQcmV2aWV3RGF0YSgpIHtcbiAgICAvLyDmqKHmi5/lmajpooTop4jkuI3pnIDopoEgbGF1bmNoU2NlbmUg5pWw5o2uXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3ByZXZpZXcnLCAnZ2VuZXJhdGUtc2V0dGluZ3MnLCB7XG4gICAgICAgIHR5cGU6ICdzaW11bGF0b3InLFxuICAgICAgICBwbGF0Zm9ybTogJ3dpbmRvd3MnLFxuICAgIH0pO1xuXG4gICAgaWYgKCEoZGF0YSAmJiBkYXRhLnNldHRpbmdzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+aehOW7uiBzZXR0aW5ncyDlh7rplJknKTtcbiAgICB9XG5cbiAgICAvLyDlkK/liqjlnLrmma9cbiAgICBsZXQgcHJldmlld1NjZW5lSnNvbjogc3RyaW5nO1xuICAgIGNvbnN0IHByZXZpZXdTY2VuZSA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldENvbmZpZygncHJldmlldycsICdnZW5lcmFsLnN0YXJ0X3NjZW5lJyk7XG4gICAgaWYgKHByZXZpZXdTY2VuZSA9PT0gJ2N1cnJlbnRfc2NlbmUnKSB7XG4gICAgICAgIHByZXZpZXdTY2VuZUpzb24gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1zY2VuZS1qc29uJyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zdCBwcmV2aWV3U2NlbmVQYXRoID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktcGF0aCcsIHByZXZpZXdTY2VuZSkgYXMgc3RyaW5nO1xuICAgICAgICBwcmV2aWV3U2NlbmVKc29uID0gYXdhaXQgcmVhZEZpbGUocHJldmlld1NjZW5lUGF0aCwgJ3V0ZjgnKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcHJldmlld1NjZW5lSnNvbixcbiAgICAgICAgc2V0dGluZ3M6IGRhdGEuc2V0dGluZ3MsXG4gICAgICAgIGJ1bmRsZUNvbmZpZ3M6IGRhdGEuYnVuZGxlQ29uZmlncyxcbiAgICB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuU2ltdWxhdG9yKCkge1xuICAgIC8vIOWFs+mXreaooeaLn+WZqFxuICAgIHN0b3BTaW11bGF0b3JQcm9jZXNzKCk7XG5cbiAgICAvLyDojrflj5bmqKHmi5/lmajlgY/lpb3orr7nva5cbiAgICBjb25zdCBwcmVmZXJlbmNlID0gYXdhaXQgZ2V0U2ltdWxhdG9yUHJlZmVyZW5jZSgpO1xuXG4gICAgLy8g6Lev5b6E5aSE55CGXG4gICAgY29uc3QgaXNEYXJ3aW4gPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJztcbiAgICBjb25zdCBqc0VuZ2luZVBhdGggPSBhd2FpdCBnZXRKc0VuZ2luZVBhdGgoKTtcbiAgICBjb25zdCBuYXRpdmVFbmdpbmVQYXRoID0gYXdhaXQgZ2V0TmF0aXZlRW5naW5lUGF0aCgpO1xuICAgIGNvbnN0IHNpbXVsYXRvclJvb3QgPSBqb2luKG5hdGl2ZUVuZ2luZVBhdGgsIGlzRGFyd2luID8gJ3NpbXVsYXRvci9SZWxlYXNlL1NpbXVsYXRvckFwcC1NYWMuYXBwJyA6ICdzaW11bGF0b3IvUmVsZWFzZScpO1xuICAgIGNvbnN0IHNpbXVsYXRvclJlc291cmNlcyA9IGlzRGFyd2luID8gam9pbihzaW11bGF0b3JSb290LCAnQ29udGVudHMvUmVzb3VyY2VzJykgOiBzaW11bGF0b3JSb290O1xuICAgIGNvbnN0IGV4ZWN1dGFibGVTaW11bGF0b3IgPSBpc0RhcndpbiA/IGpvaW4oc2ltdWxhdG9yUm9vdCwgJ0NvbnRlbnRzL01hY09TL1NpbXVsYXRvckFwcC1NYWMnKSA6IGpvaW4oc2ltdWxhdG9yUm9vdCwgJ1NpbXVsYXRvckFwcC1XaW4zMi5leGUnKTtcblxuICAgIGVuc3VyZURpclN5bmMoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdqc2ItYWRhcHRlcicpKTtcbiAgICBlbnN1cmVEaXJTeW5jKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2NvY29zLWpzJykpO1xuICAgIC8vIOa4heepuue8k+WtmFxuICAgIGF3YWl0IGVtcHR5RGlyKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnYXNzZXRzJykpO1xuICAgIGNvbnN0IGF1dG9DbGVhbkNhY2hlID0gYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0Q29uZmlnKCdwcmV2aWV3JywgJ3ByZXZpZXcuYXV0b19jbGVhbl9jYWNoZScpO1xuICAgIGlmIChhdXRvQ2xlYW5DYWNoZSkge1xuICAgICAgICBhd2FpdCBlbXB0eURpcihqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2dhbWVjYWNoZXMnKSk7XG4gICAgfVxuXG4gICAgLy8g5qC55o2u5YGP5aW96K6+572u55qE5qih5Z2X6YWN572u77yM55Sf5oiQIGNjLmpzIOWIsCBzdGF0aWMvc2ltdWxhdG9yL2NvY29zLWpzIOebruW9lVxuICAgIC8vIFRPRE86IOS9v+eUqCBRVUlDS19DT01QSUxFIOe8luivkSBlbmdpbmVcbiAgICBjb25zdCBjY01vZHVsZUZpbGUgPSBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9jb2Nvcy1qcy9jYy5qcycpO1xuICAgIGNvbnN0IGNjZUNvZGVRdWFsaXR5RmlsZSA9IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2J1aWx0aW4vY2NlLmNvZGUtcXVhbGl0eS5jci5qcycpO1xuICAgIGNvbnN0IGNjZUVudkZpbGUgPSBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9idWlsdGluL2NjZS5lbnYuanMnKTtcbiAgICBlbnN1cmVEaXJTeW5jKGRpcm5hbWUoY2NNb2R1bGVGaWxlKSk7XG4gICAgZW5zdXJlRGlyU3luYyhkaXJuYW1lKGNjZUNvZGVRdWFsaXR5RmlsZSkpO1xuICAgIGNvbnN0IHN0YXRzUXVlcnkgPSBhd2FpdCBTdGF0c1F1ZXJ5LmNyZWF0ZShqc0VuZ2luZVBhdGgpO1xuICAgIGNvbnN0IGNjRW52Q29uc3RhbnRzID0gc3RhdHNRdWVyeS5jb25zdGFudE1hbmFnZXIuZ2VuQ0NFbnZDb25zdGFudHMoe1xuICAgICAgICBtb2RlOiAnUFJFVklFVycsXG4gICAgICAgIHBsYXRmb3JtOiAnTkFUSVZFJyxcbiAgICAgICAgZmxhZ3M6IHtcbiAgICAgICAgICAgIERFQlVHOiB0cnVlLFxuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgZmVhdHVyZXMgPSAoYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0UHJvamVjdCgnZW5naW5lJywgJ21vZHVsZXMuaW5jbHVkZU1vZHVsZXMnKSkgfHwgW107XG4gICAgY29uc3QgZmVhdHVyZVVuaXRzID0gc3RhdHNRdWVyeS5nZXRVbml0c09mRmVhdHVyZXMoZmVhdHVyZXMpO1xuICAgIGNvbnN0IHsgYnVpbGQgfSA9IGF3YWl0IGltcG9ydCgnQGNvY29zL2J1aWxkLWVuZ2luZScpO1xuICAgIGNvbnN0IHsgY29kZTogaW5kZXhNb2QgfSA9IGF3YWl0IGJ1aWxkLnRyYW5zZm9ybShzdGF0c1F1ZXJ5LmV2YWx1YXRlSW5kZXhNb2R1bGVTb3VyY2UoXG4gICAgICAgIGZlYXR1cmVVbml0cyxcbiAgICAgICAgKG1vZHVsZU5hbWUpID0+IG1vZHVsZU5hbWUsIC8vIOWSjCBxdWljayBjb21waWxlciDnu5nnmoTliY3nvIDkuIDoh7QsXG4gICAgKSwgTW9kdWxlT3B0aW9uLnN5c3RlbSk7XG4gICAgY29uc3QgYnVpbHRpbk1vZHVsZVByb3ZpZGVyID0gYXdhaXQgQnVpbHRpbk1vZHVsZVByb3ZpZGVyLmNyZWF0ZSh7IGZvcm1hdDogJ3N5c3RlbWpzJyB9KTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgIGJ1aWx0aW5Nb2R1bGVQcm92aWRlci5hZGRCdWlsZFRpbWVDb25zdGFudHNNb2QoY2NFbnZDb25zdGFudHMpLFxuICAgIF0pO1xuICAgIGF3YWl0IHdyaXRlRmlsZShjY01vZHVsZUZpbGUsIGluZGV4TW9kLCAndXRmOCcpO1xuICAgIGF3YWl0IHdyaXRlRmlsZShjY2VFbnZGaWxlLCBidWlsdGluTW9kdWxlUHJvdmlkZXIubW9kdWxlc1snY2MvZW52J10sICd1dGY4Jyk7XG5cbiAgICAvLyDmi7fotJ3mlofku7ZcbiAgICBjb25zdCB0b0NvcHkgPSBbXG4gICAgICAgIC8vIOaLt+i0nSBqc2ItYWRhcHRlclxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oanNFbmdpbmVQYXRoLCAnYmluL2FkYXB0ZXIvbmF0aXZlL3dlYi1hZGFwdGVyLmpzJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2pzYi1hZGFwdGVyL3dlYi1hZGFwdGVyLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihqc0VuZ2luZVBhdGgsICdiaW4vYWRhcHRlci9uYXRpdmUvZW5naW5lLWFkYXB0ZXIuanMnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnanNiLWFkYXB0ZXIvZW5naW5lLWFkYXB0ZXIuanMnKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgLy8g5ou36LSdIGVuZ2luZSwgaW1wb3J0LW1hcC5qc29uXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihqc0VuZ2luZVBhdGgsICdiaW4vLmNhY2hlL2Rldi9uYXRpdmUtcHJldmlldycpLFxuICAgICAgICAgICAgZGVzdDogam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdzcmMvY29jb3MtanMnKSxcbiAgICAgICAgICAgIGlzRGlyOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9pbXBvcnQtbWFwLmpzb24nKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL2ltcG9ydC1tYXAuanNvbicpLFxuICAgICAgICAgICAgaXNEaXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9zeXN0ZW0uYnVuZGxlLmpzJyksXG4gICAgICAgICAgICBkZXN0OiBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9zeXN0ZW0uYnVuZGxlLmpzJyksXG4gICAgICAgICAgICBpc0RpcjogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL3BvbHlmaWxscy5idW5kbGUuanMnKSxcbiAgICAgICAgICAgIGRlc3Q6IGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL3BvbHlmaWxscy5idW5kbGUuanMnKSxcbiAgICAgICAgICAgIGlzRGlyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICBdO1xuICAgIHRvQ29weS5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICBpZiAoaXRlbS5pc0Rpcikge1xuICAgICAgICAgICAgY29weURpclN5bmMoaXRlbS5zcmMsIGl0ZW0uZGVzdCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb3B5RmlsZVN5bmMoaXRlbS5zcmMsIGl0ZW0uZGVzdCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIOWGmeWFpSBzZXR0aW5ncy5qc1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBnZW5lcmF0ZVByZXZpZXdEYXRhKCk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oc2ltdWxhdG9yUmVzb3VyY2VzLCAnc3JjL3NldHRpbmdzLmpzb24nKSwgSlNPTi5zdHJpbmdpZnkoZGF0YS5zZXR0aW5ncywgdW5kZWZpbmVkLCAyKSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmJ1bmRsZUNvbmZpZ3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gZGF0YS5idW5kbGVDb25maWdzW2ldO1xuICAgICAgICBjb25zdCBidW5kbGVEaXIgPSBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ2Fzc2V0cycsIGNvbmZpZy5uYW1lKTtcbiAgICAgICAgZW5zdXJlRGlyU3luYyhidW5kbGVEaXIpO1xuICAgICAgICAvLyDliKDpmaQgaW1wb3J0QmFzZSDlkowgbmF0aXZlQmFzZe+8jOS9v+eUqCBnZW5lcmFsQmFzZVxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGRlbGV0ZSBjb25maWcuaW1wb3J0QmFzZTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBkZWxldGUgY29uZmlnLm5hdGl2ZUJhc2U7XG4gICAgICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKGJ1bmRsZURpciwgJ2NjLmNvbmZpZy5qc29uJyksIEpTT04uc3RyaW5naWZ5KGNvbmZpZywgdW5kZWZpbmVkLCAyKSk7XG4gICAgICAgIC8vIFRPRE86IOebruWJjeeahOWunueOsOi3nyB3ZWIg6aKE6KeI5LiA5qC377yM5LiA5qyh5oCn5Yqg6L295omA5pyJ6ISa5pysXG4gICAgICAgIGNvbnN0IGJ1bmRsZUVudHJ5ID0gW107XG4gICAgICAgIGlmIChjb25maWcubmFtZSA9PT0gJ21haW4nKSB7XG4gICAgICAgICAgICBidW5kbGVFbnRyeS5wdXNoKCdjY2U6L2ludGVybmFsL3gvcHJlcmVxdWlzaXRlLWltcG9ydHMnKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBidW5kbGVJbmRleEpzU291cmNlID0gYXdhaXQgRWpzLnJlbmRlckZpbGUoam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL2J1bmRsZUluZGV4LmVqcycpLCB7XG4gICAgICAgICAgICBidW5kbGVOYW1lOiBjb25maWcubmFtZSxcbiAgICAgICAgICAgIGJ1bmRsZUVudHJ5LFxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oYnVuZGxlRGlyLCAnaW5kZXguanMnKSwgYnVuZGxlSW5kZXhKc1NvdXJjZSwgJ3V0ZjgnKTtcbiAgICB9XG5cbiAgICAvLyDlhpnlhaXliJ3lp4vlnLrmma/mlbDmja5cbiAgICBsZXQgcHJldmlld1NjZW5lSnNvblBhdGggPSBqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3ByZXZpZXctc2NlbmUuanNvbicpO1xuICAgIHByZXZpZXdTY2VuZUpzb25QYXRoID0gZm9ybWF0UGF0aChwcmV2aWV3U2NlbmVKc29uUGF0aCk7XG4gICAgYXdhaXQgd3JpdGVGaWxlKHByZXZpZXdTY2VuZUpzb25QYXRoLCBkYXRhLnByZXZpZXdTY2VuZUpzb24sICd1dGY4Jyk7XG5cbiAgICAvLyDnlJ/miJAgbWFpbi5qc1xuICAgIGNvbnN0IHByZXZpZXdQb3J0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2VydmVyJywgJ3F1ZXJ5LXBvcnQnKTtcbiAgICBjb25zdCBwcmV2aWV3SXAgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdwcmV2aWV3JywgJ2dldC1wcmV2aWV3LWlwJyk7XG4gICAgY29uc3QgbWFpbkpzU291cmNlID0gYXdhaXQgRWpzLnJlbmRlckZpbGUoam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvc2ltdWxhdG9yL21haW4uZWpzJyksIHtcbiAgICAgICAgbGlicmFyeVBhdGg6IGZvcm1hdFBhdGgoam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCAnbGlicmFyeScpKSxcbiAgICAgICAgd2FpdEZvckNvbm5lY3Q6IHByZWZlcmVuY2Uud2FpdEZvckNvbm5lY3QsXG4gICAgICAgIHByb2plY3RQYXRoOiBmb3JtYXRQYXRoKEVkaXRvci5Qcm9qZWN0LnBhdGgpLFxuICAgICAgICBwcmV2aWV3SXAsXG4gICAgICAgIHByZXZpZXdQb3J0LFxuICAgICAgICBwYWNrSW1wb3J0TWFwVVJMOiAnL3NjcmlwdGluZy94L2ltcG9ydC1tYXAuanNvbicsXG4gICAgICAgIHBhY2tSZXNvbHV0aW9uRGV0YWlsTWFwVVJMOiAnL3NjcmlwdGluZy94L3Jlc29sdXRpb24tZGV0YWlsLW1hcC5qc29uJyxcbiAgICB9KTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoam9pbihzaW11bGF0b3JSZXNvdXJjZXMsICdtYWluLmpzJyksIG1haW5Kc1NvdXJjZSwgJ3V0ZjgnKTtcblxuICAgIC8vIOeUn+aIkCBhcHBsaWNhdGlvbi5qc1xuICAgIGNvbnN0IGluY2x1ZGVNb2R1bGVzID0gYXdhaXQgRWRpdG9yLlByb2ZpbGUuZ2V0UHJvamVjdCgnZW5naW5lJywgJ21vZHVsZXMuaW5jbHVkZU1vZHVsZXMnKTtcbiAgICBjb25zdCBoYXNQaHlzaWNzQW1tbyA9IGluY2x1ZGVNb2R1bGVzLmluY2x1ZGVzKCdwaHlzaWNzLWFtbW8nKTtcbiAgICBjb25zdCBwcm9qZWN0RGF0YSA9IGF3YWl0IEVkaXRvci5Qcm9maWxlLmdldFByb2plY3QoJ3Byb2plY3QnLCAnZ2VuZXJhbC5kZXNpZ25SZXNvbHV0aW9uJyk7XG4gICAgbGV0IHJlc29sdXRpb25Qb2xpY3k6IFJlc29sdXRpb25Qb2xpY3k7XG4gICAgaWYgKHByb2plY3REYXRhLmZpdFdpZHRoICYmIHByb2plY3REYXRhLmZpdEhlaWdodCkge1xuICAgICAgICByZXNvbHV0aW9uUG9saWN5ID0gUmVzb2x1dGlvblBvbGljeS5SZXNvbHV0aW9uU2hvd0FsbDtcbiAgICB9XG4gICAgZWxzZSBpZiAocHJvamVjdERhdGEuZml0V2lkdGggJiYgIXByb2plY3REYXRhLmZpdEhlaWdodCkge1xuICAgICAgICByZXNvbHV0aW9uUG9saWN5ID0gUmVzb2x1dGlvblBvbGljeS5SZXNvbHV0aW9uRml4ZWRXaWR0aDtcbiAgICB9XG4gICAgZWxzZSBpZiAoIXByb2plY3REYXRhLmZpdFdpZHRoICYmIHByb2plY3REYXRhLmZpdEhlaWdodCkge1xuICAgICAgICByZXNvbHV0aW9uUG9saWN5ID0gUmVzb2x1dGlvblBvbGljeS5SZXNvbHV0aW9uRml4ZWRIZWlnaHQ7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXNvbHV0aW9uUG9saWN5ID0gUmVzb2x1dGlvblBvbGljeS5SZXNvbHV0aW9uTm9Cb3JkZXI7XG4gICAgfVxuICAgIGNvbnN0IGRlc2lnblJlc29sdXRpb24gPSB7XG4gICAgICAgIHdpZHRoOiBwcm9qZWN0RGF0YS53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiBwcm9qZWN0RGF0YS5oZWlnaHQsXG4gICAgICAgIHJlc29sdXRpb25Qb2xpY3ksXG4gICAgfTtcbiAgICBjb25zdCBhcHBKc1NvdXJjZSA9IGF3YWl0IEVqcy5yZW5kZXJGaWxlKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3NpbXVsYXRvci9hcHBsaWNhdGlvbi5lanMnKSwge1xuICAgICAgICBoYXNQaHlzaWNzQW1tbyxcbiAgICAgICAgcHJldmlld1NjZW5lSnNvblBhdGgsXG4gICAgICAgIGxpYnJhcnlQYXRoOiBmb3JtYXRQYXRoKGpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ2xpYnJhcnknKSksXG4gICAgICAgIHByb2plY3RQYXRoOiBmb3JtYXRQYXRoKEVkaXRvci5Qcm9qZWN0LnBhdGgpLFxuICAgICAgICBkZXNpZ25SZXNvbHV0aW9uLFxuICAgICAgICBwcmV2aWV3SXAsXG4gICAgICAgIHByZXZpZXdQb3J0LFxuICAgIH0pO1xuICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKHNpbXVsYXRvclJlc291cmNlcywgJ3NyYy9hcHBsaWNhdGlvbi5qcycpLCBhcHBKc1NvdXJjZSwgJ3V0ZjgnKTtcblxuICAgIC8vIOagueaNruWBj+Wlveiuvue9ru+8jOabtOaWsOaooeaLn+WZqOmFjee9ruaWh+S7tlxuICAgIGF3YWl0IGdlbmVyYXRlU2ltdWxhdG9yQ29uZmlnKCk7XG5cbiAgICAvLyDov5DooYzmqKHmi5/lmahcbiAgICAvLyBlbnZpcm9ubWVudFxuICAgIC8vIFRPRE86IOWIneWni+WMlueOr+Wig+WPmOmHj1xuICAgIC8vIGVudiA9IHtcbiAgICAvLyAgICAgQ09DT1NfRlJBTUVXT1JLUzogUGF0aC5qb2luKGNvY29zUm9vdCwgJy4uLycpLFxuICAgIC8vICAgICBDT0NPU19YX1JPT1Q6IGNvY29zUm9vdCxcbiAgICAvLyAgICAgQ09DT1NfQ09OU09MRV9ST09UOiBjb2Nvc0NvbnNvbGVSb290LFxuICAgIC8vICAgICBOREtfUk9PVDogbmRrUm9vdCxcbiAgICAvLyAgICAgQU5EUk9JRF9TREtfUk9PVDogYW5kcm9pZFNES1Jvb3RcbiAgICAvLyB9O1xuXG4gICAgLy8gLy8gZm9ybWF0IGVudmlyb25tZW50IHN0cmluZ1xuICAgIC8vIGVudlN0ciA9ICcnO1xuICAgIC8vIGZvciAobGV0IGsgaW4gZW52KSB7XG4gICAgLy8gICAgIGlmIChlbnZTdHIgIT09ICcnKSB7XG4gICAgLy8gICAgICAgICBlbnZTdHIgKz0gJzsnO1xuICAgIC8vICAgICB9XG5cbiAgICAvLyAgICAgZW52U3RyICs9IGAke2t9PSR7ZW52W2tdfWA7XG4gICAgLy8gfVxuICAgIC8vIGxldCBhcmdzID0gWyctd29ya2RpcicsIHNpbXVsYXRvclJlc291cmNlcywgJy13cml0YWJsZS1wYXRoJywgc2ltdWxhdG9yUmVzb3VyY2VzLCAnLWNvbnNvbGUnLCAnZmFsc2UnLCAnLS1lbnYnLCBlbnZTdHJdO1xuICAgIGNvbnN0IGFyZ3MgPSBbJy13b3JrZGlyJywgc2ltdWxhdG9yUmVzb3VyY2VzLCAnLXdyaXRhYmxlLXBhdGgnLCBzaW11bGF0b3JSZXNvdXJjZXMsICctY29uc29sZScsICdmYWxzZSddO1xuICAgIHNpbXVsYXRvclByb2Nlc3MgPSBzcGF3bihleGVjdXRhYmxlU2ltdWxhdG9yLCBhcmdzKTtcblxuICAgIC8vIOaJk+W8gOaooeaLn+WZqOiwg+ivleWZqFxuICAgIGlmIChwcmVmZXJlbmNlLnNob3dEZWJ1Z1BhbmVsKSB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLlBhbmVsLm9wZW4oJ3ByZXZpZXcuZGVidWdnZXInKTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfVxuXG4gICAgLy8g55uR5ZCs5qih5ouf5Zmo6L+b56iL55qE6L6T5Ye6XG4gICAgc2ltdWxhdG9yUHJvY2Vzcy5vbignY2xvc2UnLCAoKSA9PiB7XG4gICAgICAgIEVkaXRvci5QYW5lbC5jbG9zZSgncHJldmlldy5kZWJ1Z2dlcicpO1xuICAgIH0pO1xuICAgIHNpbXVsYXRvclByb2Nlc3Muc3Rkb3V0Py5vbignZGF0YScsIGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhLnRvU3RyaW5nID8gZGF0YS50b1N0cmluZygpIDogZGF0YSk7XG4gICAgfSk7XG4gICAgc2ltdWxhdG9yUHJvY2Vzcy5zdGRlcnI/Lm9uKCdkYXRhJywgZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZGF0YS50b1N0cmluZyA/IGRhdGEudG9TdHJpbmcoKSA6IGRhdGEpO1xuICAgIH0pO1xuICAgIHNpbXVsYXRvclByb2Nlc3Mub24oJ2Vycm9yJywgZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZGF0YS50b1N0cmluZyA/IGRhdGEudG9TdHJpbmcoKSA6IGRhdGEpO1xuICAgIH0pO1xufVxuIl19