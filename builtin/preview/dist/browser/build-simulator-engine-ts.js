"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSimulatorEngineTS = buildSimulatorEngineTS;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const build_polyfills_1 = __importDefault(require("@editor/build-polyfills"));
const module_system_1 = require("@cocos/module-system");
const ccbuild_1 = require("@cocos/ccbuild");
function excludeFeatures(features, excludes) {
    return features.filter((feature) => !excludes.includes(feature));
}
/**
 * 构建原生模拟器引擎
 * @param isOnPackingProcess 是否在打包流程
 */
async function buildSimulatorEngineTS(isOnPackingProcess) {
    console.log('Compiling native simulator engine ( TS code ), please wait...');
    console.time('Compile native engine');
    let spineFeature = 'spine-3.8';
    // 处理路径
    let engineDir;
    if (isOnPackingProcess) {
        // 打包环境只能用写死的内置引擎路径
        engineDir = (0, path_1.join)(__dirname, '../../../../../resources/3d/engine');
    }
    else {
        engineDir = (await Editor.Message.request('engine', 'query-engine-info')).typescript.path;
        // 模拟器使用的引擎是编译所有模块的，但是 spine 版本只能多选一，不能同时选择多个版本，否则会被覆盖强制使用 spine-4.2 进行编译
        const engineModules = (await Editor.Message.request('engine', 'query-engine-modules-profile'))?.includeModules ?? [];
        const foundSpineVersions = engineModules.filter((feature) => feature.startsWith('spine-'));
        if (foundSpineVersions.length > 1) {
            throw new Error(`Should only select one spine version, found: ${foundSpineVersions.join(', ')}`);
        }
        else if (foundSpineVersions.length == 1) {
            // 覆盖默认的 spine-3.8 版本
            spineFeature = foundSpineVersions[0];
        }
    }
    // https://github.com/cocos/3d-tasks/issues/18149
    // 3.8.3 中为了统一 systemjs 的生成流程，buildSystemJs 直接使用 module-system 中的实现。
    // 之前这个函数最后 buildSystemJs 是使用 lib-programming 中的 rollup 2.37.0，而 module-system 中使用的 rollup 版本是 2.79.1，
    // 新版本 rollup 会尝试使用 fs.mkdir 确保 staticDir 存在，如果路径是 abc/app.asar/builtin/preview/static/simulator，fs.mkdir 会报无法创建此目录的错误。
    // 由于 staticDir 下的文件也是被软链接到 app.asar.unpacked 目录下，因此这里直接替换为 app.asar.unpacked，从而绕过 rollup 中 fs.mkdir 的问题。
    const staticDir = (0, path_1.join)(__dirname, '../../static/simulator').replace('app.asar', 'app.asar.unpacked');
    const engineOutput = (0, path_1.join)(engineDir, 'bin/native-preview');
    try {
        // 清空输出目录
        (0, fs_extra_1.emptyDirSync)(engineOutput);
    }
    catch (e) { }
    const buildMode = 'PREVIEW';
    let buildPlatform = 'NATIVE';
    if (process.platform === 'win32') {
        buildPlatform = 'WINDOWS';
    }
    else if (process.platform === 'darwin') {
        buildPlatform = 'MAC';
    }
    else {
        console.error(`Unsupported platform: ${process.platform}`);
    }
    // 编译引擎
    const statsQuery = await ccbuild_1.StatsQuery.create(engineDir);
    let allFeatures = excludeFeatures(statsQuery.getFeatures(), ['gfx-webgpu', 'vendor-google']);
    // TODO: 模拟器是预编译好的，目前的流程 Spine 的版本只能选择 3.8 或者 4.2，
    // 目前大部分用户还是使用 3.8，因此先保留 3.8 作为默认，如果用户需要使用 4.2，
    // 1. 生成引擎 JS 代码：修改项目设置，全局的模块裁切配置，选择正确的 spine 版本，再可以通过'菜单->开发者->编译模拟器引擎（只编译TS代码）'
    //
    // 2. 生成模拟器 exe 文件：修改 engine/native/tools/simulator/libsimulator/CMakeLists.txt 文件，
    //    然后在 engine/native 目录下重新执行 npx gen-simulator-release 生成集成 spine 4.2 的模拟器 exe 文件。
    allFeatures = allFeatures.filter((feature) => !feature.startsWith('spine-'));
    allFeatures.push(spineFeature);
    console.log(`-----------------------------------------------`);
    console.log(` features: ${allFeatures.join(', \n')}`);
    console.log(`-----------------------------------------------`);
    const buildOptions = {
        engine: engineDir,
        out: engineOutput,
        moduleFormat: 'system',
        compress: false,
        targets: 'chrome 80', // 目前没有传 targets, 否则与编译的用户脚本版本不同
        split: true,
        features: allFeatures,
        nativeCodeBundleMode: 'wasm', // 模拟器是基于原生平台 V8 的，是绝对支持 wasm 的。
        platform: buildPlatform,
        mode: buildMode,
        flags: {
            DEBUG: true,
            SERVER_MODE: false,
        },
    };
    await (0, ccbuild_1.buildEngine)(buildOptions);
    // 输出 import-map.json
    const importMap = {
        imports: {
            'cc/env': './builtin/cce.env.js',
            // TODO: deprecated cce.env is only live in 3.0-preview
            'cce.env': './builtin/cce.env.js',
        },
    };
    const featureUnits = statsQuery.getFeatureUnits();
    for (const fu of featureUnits) {
        importMap.imports[`cce:/internal/x/cc-fu/${fu}`] = `./cocos-js/${fu}.js`;
    }
    await (0, fs_extra_1.writeFile)((0, path_1.join)(staticDir, 'import-map.json'), JSON.stringify(importMap, undefined, 2), 'utf8');
    // 构建 polyfills.bundle.js
    await (0, build_polyfills_1.default)({
        debug: false,
        sourceMap: false,
        file: (0, path_1.join)(staticDir, 'polyfills.bundle.js'),
        coreJs: {
            modules: [
                'es.global-this',
            ],
            blacklist: [],
            // targets: 'chrome 80'
        },
        asyncFunctions: true,
        fetch: true,
    });
    // 构建 system.bundle.js
    await (0, module_system_1.build)({
        out: (0, path_1.join)(staticDir, 'system.bundle.js'),
        minify: false,
        sourceMap: false,
        platform: 'mac', // FIXME(cjh): cocos-module-system depends `platform` argument to decide to use which preset (web or commonjs-like). So it's a hack here.
        editor: false,
    });
    console.log('Compile finished!');
    console.timeEnd('Compile native engine');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQtc2ltdWxhdG9yLWVuZ2luZS10cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS9icm93c2VyL2J1aWxkLXNpbXVsYXRvci1lbmdpbmUtdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFjQSx3REE2SEM7QUEzSUQsK0JBQTRCO0FBQzVCLHVDQUFtRDtBQUNuRCw4RUFBcUQ7QUFDckQsd0RBQThEO0FBQzlELDRDQUF5RDtBQUV6RCxTQUFTLGVBQWUsQ0FBQyxRQUFrQixFQUFFLFFBQWtCO0lBQzNELE9BQU8sUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDckUsQ0FBQztBQUVEOzs7R0FHRztBQUNJLEtBQUssVUFBVSxzQkFBc0IsQ0FBQyxrQkFBNEI7SUFDckUsT0FBTyxDQUFDLEdBQUcsQ0FBQywrREFBK0QsQ0FBQyxDQUFDO0lBQzdFLE9BQU8sQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQztJQUV0QyxJQUFJLFlBQVksR0FBRyxXQUFXLENBQUM7SUFDL0IsT0FBTztJQUNQLElBQUksU0FBaUIsQ0FBQztJQUN0QixJQUFJLGtCQUFrQixFQUFFLENBQUM7UUFDckIsbUJBQW1CO1FBQ25CLFNBQVMsR0FBRyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsb0NBQW9DLENBQUMsQ0FBQztJQUN0RSxDQUFDO1NBQ0ksQ0FBQztRQUNGLFNBQVMsR0FBRyxDQUFDLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSyxDQUFDO1FBRTNGLHlFQUF5RTtRQUN6RSxNQUFNLGFBQWEsR0FBRyxDQUFDLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLDhCQUE4QixD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QSxxQkFBYSxFQUFDO1FBQ2hCLEdBQUcsRUFBRSxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsa0JBQWtCLENBQUM7UUFDeEMsTUFBTSxFQUFFLEtBQUs7UUFDYixTQUFTLEVBQUUsS0FBSztRQUNoQixRQUFRLEVBQUUsS0FBSyxFQUFFLHlJQUF5STtRQUMxSixNQUFNLEVBQUUsS0FBSztLQUNoQixDQUFDLENBQUM7SUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7SUFDakMsT0FBTyxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0FBQzdDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBlbXB0eURpclN5bmMsIHdyaXRlRmlsZSB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCBidWlsZFBvbHlmaWxscyBmcm9tICdAZWRpdG9yL2J1aWxkLXBvbHlmaWxscyc7XG5pbXBvcnQgeyBidWlsZCBhcyBidWlsZFN5c3RlbUpzIH0gZnJvbSAnQGNvY29zL21vZHVsZS1zeXN0ZW0nO1xuaW1wb3J0IHsgYnVpbGRFbmdpbmUsIFN0YXRzUXVlcnkgfSBmcm9tICdAY29jb3MvY2NidWlsZCc7XG5cbmZ1bmN0aW9uIGV4Y2x1ZGVGZWF0dXJlcyhmZWF0dXJlczogc3RyaW5nW10sIGV4Y2x1ZGVzOiBzdHJpbmdbXSkge1xuICAgIHJldHVybiBmZWF0dXJlcy5maWx0ZXIoKGZlYXR1cmUpID0+ICFleGNsdWRlcy5pbmNsdWRlcyhmZWF0dXJlKSk7XG59XG5cbi8qKlxuICog5p6E5bu65Y6f55Sf5qih5ouf5Zmo5byV5pOOXG4gKiBAcGFyYW0gaXNPblBhY2tpbmdQcm9jZXNzIOaYr+WQpuWcqOaJk+WMhea1geeoi1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYnVpbGRTaW11bGF0b3JFbmdpbmVUUyhpc09uUGFja2luZ1Byb2Nlc3M/OiBib29sZWFuKSB7XG4gICAgY29uc29sZS5sb2coJ0NvbXBpbGluZyBuYXRpdmUgc2ltdWxhdG9yIGVuZ2luZSAoIFRTIGNvZGUgKSwgcGxlYXNlIHdhaXQuLi4nKTtcbiAgICBjb25zb2xlLnRpbWUoJ0NvbXBpbGUgbmF0aXZlIGVuZ2luZScpO1xuXG4gICAgbGV0IHNwaW5lRmVhdHVyZSA9ICdzcGluZS0zLjgnO1xuICAgIC8vIOWkhOeQhui3r+W+hFxuICAgIGxldCBlbmdpbmVEaXI6IHN0cmluZztcbiAgICBpZiAoaXNPblBhY2tpbmdQcm9jZXNzKSB7XG4gICAgICAgIC8vIOaJk+WMheeOr+Wig+WPquiDveeUqOWGmeatu+eahOWGhee9ruW8leaTjui3r+W+hFxuICAgICAgICBlbmdpbmVEaXIgPSBqb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uLy4uLy4uL3Jlc291cmNlcy8zZC9lbmdpbmUnKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGVuZ2luZURpciA9IChhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdlbmdpbmUnLCAncXVlcnktZW5naW5lLWluZm8nKSkudHlwZXNjcmlwdC5wYXRoITtcblxuICAgICAgICAvLyDmqKHmi5/lmajkvb/nlKjnmoTlvJXmk47mmK/nvJbor5HmiYDmnInmqKHlnZfnmoTvvIzkvYbmmK8gc3BpbmUg54mI5pys5Y+q6IO95aSa6YCJ5LiA77yM5LiN6IO95ZCM5pe26YCJ5oup5aSa5Liq54mI5pys77yM5ZCm5YiZ5Lya6KKr6KaG55uW5by65Yi25L2/55SoIHNwaW5lLTQuMiDov5vooYznvJbor5FcbiAgICAgICAgY29uc3QgZW5naW5lTW9kdWxlcyA9IChhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdlbmdpbmUnLCAncXVlcnktZW5naW5lLW1vZHVsZXMtcHJvZmlsZScpKT8uaW5jbHVkZU1vZHVsZXMgPz8gW107XG4gICAgICAgIGNvbnN0IGZvdW5kU3BpbmVWZXJzaW9ucyA9IGVuZ2luZU1vZHVsZXMuZmlsdGVyKChmZWF0dXJlKSA9PiBmZWF0dXJlLnN0YXJ0c1dpdGgoJ3NwaW5lLScpKTtcbiAgICAgICAgaWYgKGZvdW5kU3BpbmVWZXJzaW9ucy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFNob3VsZCBvbmx5IHNlbGVjdCBvbmUgc3BpbmUgdmVyc2lvbiwgZm91bmQ6ICR7Zm91bmRTcGluZVZlcnNpb25zLmpvaW4oJywgJyl9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZm91bmRTcGluZVZlcnNpb25zLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICAvLyDopobnm5bpu5jorqTnmoQgc3BpbmUtMy44IOeJiOacrFxuICAgICAgICAgICAgc3BpbmVGZWF0dXJlID0gZm91bmRTcGluZVZlcnNpb25zWzBdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2NvY29zLzNkLXRhc2tzL2lzc3Vlcy8xODE0OVxuICAgIC8vIDMuOC4zIOS4reS4uuS6hue7n+S4gCBzeXN0ZW1qcyDnmoTnlJ/miJDmtYHnqIvvvIxidWlsZFN5c3RlbUpzIOebtOaOpeS9v+eUqCBtb2R1bGUtc3lzdGVtIOS4reeahOWunueOsOOAglxuICAgIC8vIOS5i+WJjei/meS4quWHveaVsOacgOWQjiBidWlsZFN5c3RlbUpzIOaYr+S9v+eUqCBsaWItcHJvZ3JhbW1pbmcg5Lit55qEIHJvbGx1cCAyLjM3LjDvvIzogIwgbW9kdWxlLXN5c3RlbSDkuK3kvb/nlKjnmoQgcm9sbHVwIOeJiOacrOaYryAyLjc5LjHvvIxcbiAgICAvLyDmlrDniYjmnKwgcm9sbHVwIOS8muWwneivleS9v+eUqCBmcy5ta2RpciDnoa7kv50gc3RhdGljRGlyIOWtmOWcqO+8jOWmguaenOi3r+W+hOaYryBhYmMvYXBwLmFzYXIvYnVpbHRpbi9wcmV2aWV3L3N0YXRpYy9zaW11bGF0b3LvvIxmcy5ta2RpciDkvJrmiqXml6Dms5XliJvlu7rmraTnm67lvZXnmoTplJnor6/jgIJcbiAgICAvLyDnlLHkuo4gc3RhdGljRGlyIOS4i+eahOaWh+S7tuS5n+aYr+iiq+i9r+mTvuaOpeWIsCBhcHAuYXNhci51bnBhY2tlZCDnm67lvZXkuIvvvIzlm6DmraTov5nph4znm7TmjqXmm7/mjaLkuLogYXBwLmFzYXIudW5wYWNrZWTvvIzku47ogIznu5Xov4cgcm9sbHVwIOS4rSBmcy5ta2RpciDnmoTpl67popjjgIJcbiAgICBjb25zdCBzdGF0aWNEaXIgPSBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3InKS5yZXBsYWNlKCdhcHAuYXNhcicsICdhcHAuYXNhci51bnBhY2tlZCcpO1xuICAgIGNvbnN0IGVuZ2luZU91dHB1dCA9IGpvaW4oZW5naW5lRGlyLCAnYmluL25hdGl2ZS1wcmV2aWV3Jyk7XG5cbiAgICB0cnkge1xuICAgICAgICAvLyDmuIXnqbrovpPlh7rnm67lvZVcbiAgICAgICAgZW1wdHlEaXJTeW5jKGVuZ2luZU91dHB1dCk7XG4gICAgfSBjYXRjaCAoZSkge31cblxuICAgIGNvbnN0IGJ1aWxkTW9kZSA9ICdQUkVWSUVXJztcbiAgICBsZXQgYnVpbGRQbGF0Zm9ybTogU3RhdHNRdWVyeS5Db25zdGFudE1hbmFnZXIuUGxhdGZvcm1UeXBlID0gJ05BVElWRSc7XG5cbiAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJykge1xuICAgICAgICBidWlsZFBsYXRmb3JtID0gJ1dJTkRPV1MnO1xuICAgIH0gZWxzZSBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICAgICAgYnVpbGRQbGF0Zm9ybSA9ICdNQUMnO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFVuc3VwcG9ydGVkIHBsYXRmb3JtOiAke3Byb2Nlc3MucGxhdGZvcm19YCk7XG4gICAgfVxuXG4gICAgLy8g57yW6K+R5byV5pOOXG4gICAgY29uc3Qgc3RhdHNRdWVyeSA9IGF3YWl0IFN0YXRzUXVlcnkuY3JlYXRlKGVuZ2luZURpcik7XG5cbiAgICBsZXQgYWxsRmVhdHVyZXMgPSBleGNsdWRlRmVhdHVyZXMoc3RhdHNRdWVyeS5nZXRGZWF0dXJlcygpLCBbJ2dmeC13ZWJncHUnLCAndmVuZG9yLWdvb2dsZSddKTtcbiAgICBcbiAgICAvLyBUT0RPOiDmqKHmi5/lmajmmK/pooTnvJbor5Hlpb3nmoTvvIznm67liY3nmoTmtYHnqIsgU3BpbmUg55qE54mI5pys5Y+q6IO96YCJ5oupIDMuOCDmiJbogIUgNC4y77yMXG4gICAgLy8g55uu5YmN5aSn6YOo5YiG55So5oi36L+Y5piv5L2/55SoIDMuOO+8jOWboOatpOWFiOS/neeVmSAzLjgg5L2c5Li66buY6K6k77yM5aaC5p6c55So5oi36ZyA6KaB5L2/55SoIDQuMu+8jFxuICAgIC8vIDEuIOeUn+aIkOW8leaTjiBKUyDku6PnoIHvvJrkv67mlLnpobnnm67orr7nva7vvIzlhajlsYDnmoTmqKHlnZfoo4HliIfphY3nva7vvIzpgInmi6nmraPnoa7nmoQgc3BpbmUg54mI5pys77yM5YaN5Y+v5Lul6YCa6L+HJ+iPnOWNlS0+5byA5Y+R6ICFLT7nvJbor5HmqKHmi5/lmajlvJXmk47vvIjlj6rnvJbor5FUU+S7o+egge+8iSdcbiAgICAvL1xuICAgIC8vIDIuIOeUn+aIkOaooeaLn+WZqCBleGUg5paH5Lu277ya5L+u5pS5IGVuZ2luZS9uYXRpdmUvdG9vbHMvc2ltdWxhdG9yL2xpYnNpbXVsYXRvci9DTWFrZUxpc3RzLnR4dCDmlofku7bvvIxcbiAgICAvLyAgICDnhLblkI7lnKggZW5naW5lL25hdGl2ZSDnm67lvZXkuIvph43mlrDmiafooYwgbnB4IGdlbi1zaW11bGF0b3ItcmVsZWFzZSDnlJ/miJDpm4bmiJAgc3BpbmUgNC4yIOeahOaooeaLn+WZqCBleGUg5paH5Lu244CCXG4gICAgYWxsRmVhdHVyZXMgPSBhbGxGZWF0dXJlcy5maWx0ZXIoKGZlYXR1cmUpID0+ICFmZWF0dXJlLnN0YXJ0c1dpdGgoJ3NwaW5lLScpKTtcbiAgICBhbGxGZWF0dXJlcy5wdXNoKHNwaW5lRmVhdHVyZSk7XG5cbiAgICBjb25zb2xlLmxvZyhgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1gKTtcbiAgICBjb25zb2xlLmxvZyhgIGZlYXR1cmVzOiAke2FsbEZlYXR1cmVzLmpvaW4oJywgXFxuJyl9YCk7XG4gICAgY29uc29sZS5sb2coYC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tYCk7XG5cbiAgICBjb25zdCBidWlsZE9wdGlvbnM6IGJ1aWxkRW5naW5lLk9wdGlvbnMgPSB7XG4gICAgICAgIGVuZ2luZTogZW5naW5lRGlyLFxuICAgICAgICBvdXQ6IGVuZ2luZU91dHB1dCxcbiAgICAgICAgbW9kdWxlRm9ybWF0OiAnc3lzdGVtJyxcbiAgICAgICAgY29tcHJlc3M6IGZhbHNlLFxuICAgICAgICB0YXJnZXRzOiAnY2hyb21lIDgwJywgLy8g55uu5YmN5rKh5pyJ5LygIHRhcmdldHMsIOWQpuWImeS4jue8luivkeeahOeUqOaIt+iEmuacrOeJiOacrOS4jeWQjFxuICAgICAgICBzcGxpdDogdHJ1ZSxcbiAgICAgICAgZmVhdHVyZXM6IGFsbEZlYXR1cmVzLFxuICAgICAgICBuYXRpdmVDb2RlQnVuZGxlTW9kZTogJ3dhc20nLCAvLyDmqKHmi5/lmajmmK/ln7rkuo7ljp/nlJ/lubPlj7AgVjgg55qE77yM5piv57ud5a+55pSv5oyBIHdhc20g55qE44CCXG4gICAgICAgIHBsYXRmb3JtOiBidWlsZFBsYXRmb3JtLFxuICAgICAgICBtb2RlOiBidWlsZE1vZGUsXG4gICAgICAgIGZsYWdzOiB7XG4gICAgICAgICAgICBERUJVRzogdHJ1ZSxcbiAgICAgICAgICAgIFNFUlZFUl9NT0RFOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICB9O1xuICAgIGF3YWl0IGJ1aWxkRW5naW5lKGJ1aWxkT3B0aW9ucyk7XG5cbiAgICAvLyDovpPlh7ogaW1wb3J0LW1hcC5qc29uXG4gICAgY29uc3QgaW1wb3J0TWFwOiBhbnkgPSB7XG4gICAgICAgIGltcG9ydHM6IHtcbiAgICAgICAgICAgICdjYy9lbnYnOiAnLi9idWlsdGluL2NjZS5lbnYuanMnLFxuICAgICAgICAgICAgLy8gVE9ETzogZGVwcmVjYXRlZCBjY2UuZW52IGlzIG9ubHkgbGl2ZSBpbiAzLjAtcHJldmlld1xuICAgICAgICAgICAgJ2NjZS5lbnYnOiAnLi9idWlsdGluL2NjZS5lbnYuanMnLFxuICAgICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgZmVhdHVyZVVuaXRzID0gc3RhdHNRdWVyeS5nZXRGZWF0dXJlVW5pdHMoKTtcbiAgICBmb3IgKGNvbnN0IGZ1IG9mIGZlYXR1cmVVbml0cykge1xuICAgICAgICBpbXBvcnRNYXAuaW1wb3J0c1tgY2NlOi9pbnRlcm5hbC94L2NjLWZ1LyR7ZnV9YF0gPSBgLi9jb2Nvcy1qcy8ke2Z1fS5qc2A7XG4gICAgfVxuICAgIGF3YWl0IHdyaXRlRmlsZShqb2luKHN0YXRpY0RpciwgJ2ltcG9ydC1tYXAuanNvbicpLCBKU09OLnN0cmluZ2lmeShpbXBvcnRNYXAsIHVuZGVmaW5lZCwgMiksICd1dGY4Jyk7XG5cbiAgICAvLyDmnoTlu7ogcG9seWZpbGxzLmJ1bmRsZS5qc1xuICAgIGF3YWl0IGJ1aWxkUG9seWZpbGxzKHtcbiAgICAgICAgZGVidWc6IGZhbHNlLFxuICAgICAgICBzb3VyY2VNYXA6IGZhbHNlLFxuICAgICAgICBmaWxlOiBqb2luKHN0YXRpY0RpciwgJ3BvbHlmaWxscy5idW5kbGUuanMnKSxcbiAgICAgICAgY29yZUpzOiB7XG4gICAgICAgICAgICBtb2R1bGVzOiBbXG4gICAgICAgICAgICAgICAgJ2VzLmdsb2JhbC10aGlzJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBibGFja2xpc3Q6IFtdLFxuICAgICAgICAgICAgLy8gdGFyZ2V0czogJ2Nocm9tZSA4MCdcbiAgICAgICAgfSxcbiAgICAgICAgYXN5bmNGdW5jdGlvbnM6IHRydWUsXG4gICAgICAgIGZldGNoOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgLy8g5p6E5bu6IHN5c3RlbS5idW5kbGUuanNcbiAgICBhd2FpdCBidWlsZFN5c3RlbUpzKHtcbiAgICAgICAgb3V0OiBqb2luKHN0YXRpY0RpciwgJ3N5c3RlbS5idW5kbGUuanMnKSxcbiAgICAgICAgbWluaWZ5OiBmYWxzZSxcbiAgICAgICAgc291cmNlTWFwOiBmYWxzZSxcbiAgICAgICAgcGxhdGZvcm06ICdtYWMnLCAvLyBGSVhNRShjamgpOiBjb2Nvcy1tb2R1bGUtc3lzdGVtIGRlcGVuZHMgYHBsYXRmb3JtYCBhcmd1bWVudCB0byBkZWNpZGUgdG8gdXNlIHdoaWNoIHByZXNldCAod2ViIG9yIGNvbW1vbmpzLWxpa2UpLiBTbyBpdCdzIGEgaGFjayBoZXJlLlxuICAgICAgICBlZGl0b3I6IGZhbHNlLFxuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKCdDb21waWxlIGZpbmlzaGVkIScpO1xuICAgIGNvbnNvbGUudGltZUVuZCgnQ29tcGlsZSBuYXRpdmUgZW5naW5lJyk7XG59XG4iXX0=