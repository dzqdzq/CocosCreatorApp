"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSimulatorEngineTS = void 0;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const build_polyfills_1 = __importDefault(require("@editor/build-polyfills"));
const module_system_1 = require("@cocos/module-system");
const ccbuild_1 = require("@cocos/ccbuild");
/**
 * 构建原生模拟器引擎
 * @param isOnPackingProcess 是否在打包流程
 */
async function buildSimulatorEngineTS(isOnPackingProcess) {
    console.log('Compiling native simulator engine ( TS code ), please wait...');
    console.time('Compile native engine');
    // 处理路径
    let engineDir;
    if (isOnPackingProcess) {
        // 打包环境只能用写死的内置引擎路径
        engineDir = (0, path_1.join)(__dirname, '../../../../../resources/3d/engine');
    }
    else {
        engineDir = (await Editor.Message.request('engine', 'query-engine-info')).typescript.path;
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
    const buildPlatform = 'NATIVE';
    // 编译引擎
    const statQuery = await ccbuild_1.StatsQuery.create(engineDir);
    const buildOptions = {
        engine: engineDir,
        out: engineOutput,
        moduleFormat: 'system',
        compress: false,
        targets: 'chrome 80',
        split: true,
        nativeCodeBundleMode: 'wasm',
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
    const featureUnits = statQuery.getFeatureUnits();
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
        platform: 'mac',
        editor: false,
    });
    console.log('Compile finished!');
    console.timeEnd('Compile native engine');
}
exports.buildSimulatorEngineTS = buildSimulatorEngineTS;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQtc2ltdWxhdG9yLWVuZ2luZS10cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS9icm93c2VyL2J1aWxkLXNpbXVsYXRvci1lbmdpbmUtdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsK0JBQTRCO0FBQzVCLHVDQUFtRDtBQUNuRCw4RUFBcUQ7QUFDckQsd0RBQThEO0FBQzlELDRDQUF5RDtBQUV6RDs7O0dBR0c7QUFDSSxLQUFLLFVBQVUsc0JBQXNCLENBQUMsa0JBQTRCO0lBQ3JFLE9BQU8sQ0FBQyxHQUFHLENBQUMsK0RBQStELENBQUMsQ0FBQztJQUM3RSxPQUFPLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUM7SUFDdEMsT0FBTztJQUNQLElBQUksU0FBaUIsQ0FBQztJQUN0QixJQUFJLGtCQUFrQixFQUFFO1FBQ3BCLG1CQUFtQjtRQUNuQixTQUFTLEdBQUcsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLG9DQUFvQyxDQUFDLENBQUM7S0FDckU7U0FDSTtRQUNELFNBQVMsR0FBRyxDQUFDLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSyxDQUFDO0tBQzlGO0lBRUQsaURBQWlEO0lBQ2pELG9FQUFvRTtJQUNwRSxzR0FBc0c7SUFDdEcsdUhBQXVIO0lBQ3ZILHlHQUF5RztJQUN6RyxNQUFNLFNBQVMsR0FBRyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsd0JBQXdCLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLG1CQUFtQixDQUFDLENBQUM7SUFDckcsTUFBTSxZQUFZLEdBQUcsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLG9CQUFvQixDQUFDLENBQUM7SUFFM0QsSUFBSTtRQUNBLFNBQVM7UUFDVCxJQUFBLHVCQUFZLEVBQUMsWUFBWSxDQUFDLENBQUM7S0FDOUI7SUFBQyxPQUFPLENBQUMsRUFBRSxHQUFFO0lBRWQsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDO0lBQzVCLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQztJQUUvQixPQUFPO0lBQ1AsTUFBTSxTQUFTLEdBQUcsTUFBTSxvQkFBVSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNyRCxNQUFNLFlBQVksR0FBd0I7UUFDdEMsTUFBTSxFQUFFLFNBQVM7UUFDakIsR0FBRyxFQUFFLFlBQVk7UUFDakIsWUFBWSxFQUFFLFFBQVE7UUFDdEIsUUFBUSxFQUFFLEtBQUs7UUFDZixPQUFPLEVBQUUsV0FBVztRQUNwQixLQUFLLEVBQUUsSUFBSTtRQUNYLG9CQUFvQixFQUFFLE1BQU07UUFDNUIsUUFBUSxFQUFFLGFBQWE7UUFDdkIsSUFBSSxFQUFFLFNBQVM7UUFDZixLQUFLLEVBQUU7WUFDSCxLQUFLLEVBQUUsSUFBSTtZQUNYLFdBQVcsRUFBRSxLQUFLO1NBQ3JCO0tBQ0osQ0FBQztJQUNGLE1BQU0sSUFBQSxxQkFBVyxFQUFDLFlBQVksQ0FBQyxDQUFDO0lBRWhDLHFCQUFxQjtJQUNyQixNQUFNLFNBQVMsR0FBUTtRQUNuQixPQUFPLEVBQUU7WUFDTCxRQUFRLEVBQUUsc0JBQXNCO1lBQ2hDLHVEQUF1RDtZQUN2RCxTQUFTLEVBQUUsc0JBQXNCO1NBQ3BDO0tBQ0osQ0FBQztJQUNGLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUNqRCxLQUFLLE1BQU0sRUFBRSxJQUFJLFlBQVksRUFBRTtRQUMzQixTQUFTLENBQUMsT0FBTyxDQUFDLHlCQUF5QixFQUFFLEVBQUUsQ0FBQyxHQUFHLGNBQWMsRUFBRSxLQUFLLENBQUM7S0FDNUU7SUFDRCxNQUFNLElBQUEsb0JBQVMsRUFBQyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsaUJBQWlCLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFckcseUJBQXlCO0lBQ3pCLE1BQU0sSUFBQSx5QkFBYyxFQUFDO1FBQ2pCLEtBQUssRUFBRSxLQUFLO1FBQ1osU0FBUyxFQUFFLEtBQUs7UUFDaEIsSUFBSSxFQUFFLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxxQkFBcUIsQ0FBQztRQUM1QyxNQUFNLEVBQUU7WUFDSixPQUFPLEVBQUU7Z0JBQ0wsZ0JBQWdCO2FBQ25CO1lBQ0QsU0FBUyxFQUFFLEVBQUU7WUFDYix1QkFBdUI7U0FDMUI7UUFDRCxjQUFjLEVBQUUsSUFBSTtRQUNwQixLQUFLLEVBQUUsSUFBSTtLQUNkLENBQUMsQ0FBQztJQUVILHNCQUFzQjtJQUN0QixNQUFNLElBQUEscUJBQWEsRUFBQztRQUNoQixHQUFHLEVBQUUsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLGtCQUFrQixDQUFDO1FBQ3hDLE1BQU0sRUFBRSxLQUFLO1FBQ2IsU0FBUyxFQUFFLEtBQUs7UUFDaEIsUUFBUSxFQUFFLEtBQUs7UUFDZixNQUFNLEVBQUUsS0FBSztLQUNoQixDQUFDLENBQUM7SUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7SUFDakMsT0FBTyxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0FBQzdDLENBQUM7QUF4RkQsd0RBd0ZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZW1wdHlEaXJTeW5jLCB3cml0ZUZpbGUgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgYnVpbGRQb2x5ZmlsbHMgZnJvbSAnQGVkaXRvci9idWlsZC1wb2x5ZmlsbHMnO1xuaW1wb3J0IHsgYnVpbGQgYXMgYnVpbGRTeXN0ZW1KcyB9IGZyb20gJ0Bjb2Nvcy9tb2R1bGUtc3lzdGVtJztcbmltcG9ydCB7IGJ1aWxkRW5naW5lLCBTdGF0c1F1ZXJ5IH0gZnJvbSAnQGNvY29zL2NjYnVpbGQnO1xuXG4vKipcbiAqIOaehOW7uuWOn+eUn+aooeaLn+WZqOW8leaTjlxuICogQHBhcmFtIGlzT25QYWNraW5nUHJvY2VzcyDmmK/lkKblnKjmiZPljIXmtYHnqItcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGJ1aWxkU2ltdWxhdG9yRW5naW5lVFMoaXNPblBhY2tpbmdQcm9jZXNzPzogYm9vbGVhbikge1xuICAgIGNvbnNvbGUubG9nKCdDb21waWxpbmcgbmF0aXZlIHNpbXVsYXRvciBlbmdpbmUgKCBUUyBjb2RlICksIHBsZWFzZSB3YWl0Li4uJyk7XG4gICAgY29uc29sZS50aW1lKCdDb21waWxlIG5hdGl2ZSBlbmdpbmUnKTtcbiAgICAvLyDlpITnkIbot6/lvoRcbiAgICBsZXQgZW5naW5lRGlyOiBzdHJpbmc7XG4gICAgaWYgKGlzT25QYWNraW5nUHJvY2Vzcykge1xuICAgICAgICAvLyDmiZPljIXnjq/looPlj6rog73nlKjlhpnmrbvnmoTlhoXnva7lvJXmk47ot6/lvoRcbiAgICAgICAgZW5naW5lRGlyID0gam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi8uLi8uLi9yZXNvdXJjZXMvM2QvZW5naW5lJyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBlbmdpbmVEaXIgPSAoYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnZW5naW5lJywgJ3F1ZXJ5LWVuZ2luZS1pbmZvJykpLnR5cGVzY3JpcHQucGF0aCE7XG4gICAgfVxuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2NvY29zLzNkLXRhc2tzL2lzc3Vlcy8xODE0OVxuICAgIC8vIDMuOC4zIOS4reS4uuS6hue7n+S4gCBzeXN0ZW1qcyDnmoTnlJ/miJDmtYHnqIvvvIxidWlsZFN5c3RlbUpzIOebtOaOpeS9v+eUqCBtb2R1bGUtc3lzdGVtIOS4reeahOWunueOsOOAglxuICAgIC8vIOS5i+WJjei/meS4quWHveaVsOacgOWQjiBidWlsZFN5c3RlbUpzIOaYr+S9v+eUqCBsaWItcHJvZ3JhbW1pbmcg5Lit55qEIHJvbGx1cCAyLjM3LjDvvIzogIwgbW9kdWxlLXN5c3RlbSDkuK3kvb/nlKjnmoQgcm9sbHVwIOeJiOacrOaYryAyLjc5LjHvvIxcbiAgICAvLyDmlrDniYjmnKwgcm9sbHVwIOS8muWwneivleS9v+eUqCBmcy5ta2RpciDnoa7kv50gc3RhdGljRGlyIOWtmOWcqO+8jOWmguaenOi3r+W+hOaYryBhYmMvYXBwLmFzYXIvYnVpbHRpbi9wcmV2aWV3L3N0YXRpYy9zaW11bGF0b3LvvIxmcy5ta2RpciDkvJrmiqXml6Dms5XliJvlu7rmraTnm67lvZXnmoTplJnor6/jgIJcbiAgICAvLyDnlLHkuo4gc3RhdGljRGlyIOS4i+eahOaWh+S7tuS5n+aYr+iiq+i9r+mTvuaOpeWIsCBhcHAuYXNhci51bnBhY2tlZCDnm67lvZXkuIvvvIzlm6DmraTov5nph4znm7TmjqXmm7/mjaLkuLogYXBwLmFzYXIudW5wYWNrZWTvvIzku47ogIznu5Xov4cgcm9sbHVwIOS4rSBmcy5ta2RpciDnmoTpl67popjjgIJcbiAgICBjb25zdCBzdGF0aWNEaXIgPSBqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zaW11bGF0b3InKS5yZXBsYWNlKCdhcHAuYXNhcicsICdhcHAuYXNhci51bnBhY2tlZCcpO1xuICAgIGNvbnN0IGVuZ2luZU91dHB1dCA9IGpvaW4oZW5naW5lRGlyLCAnYmluL25hdGl2ZS1wcmV2aWV3Jyk7XG5cbiAgICB0cnkge1xuICAgICAgICAvLyDmuIXnqbrovpPlh7rnm67lvZVcbiAgICAgICAgZW1wdHlEaXJTeW5jKGVuZ2luZU91dHB1dCk7XG4gICAgfSBjYXRjaCAoZSkge31cblxuICAgIGNvbnN0IGJ1aWxkTW9kZSA9ICdQUkVWSUVXJztcbiAgICBjb25zdCBidWlsZFBsYXRmb3JtID0gJ05BVElWRSc7XG5cbiAgICAvLyDnvJbor5HlvJXmk45cbiAgICBjb25zdCBzdGF0UXVlcnkgPSBhd2FpdCBTdGF0c1F1ZXJ5LmNyZWF0ZShlbmdpbmVEaXIpO1xuICAgIGNvbnN0IGJ1aWxkT3B0aW9uczogYnVpbGRFbmdpbmUuT3B0aW9ucyA9IHtcbiAgICAgICAgZW5naW5lOiBlbmdpbmVEaXIsXG4gICAgICAgIG91dDogZW5naW5lT3V0cHV0LFxuICAgICAgICBtb2R1bGVGb3JtYXQ6ICdzeXN0ZW0nLFxuICAgICAgICBjb21wcmVzczogZmFsc2UsXG4gICAgICAgIHRhcmdldHM6ICdjaHJvbWUgODAnLCAvLyDnm67liY3msqHmnInkvKAgdGFyZ2V0cywg5ZCm5YiZ5LiO57yW6K+R55qE55So5oi36ISa5pys54mI5pys5LiN5ZCMXG4gICAgICAgIHNwbGl0OiB0cnVlLFxuICAgICAgICBuYXRpdmVDb2RlQnVuZGxlTW9kZTogJ3dhc20nLCAvLyDmqKHmi5/lmajmmK/ln7rkuo7ljp/nlJ/lubPlj7AgVjgg55qE77yM5piv57ud5a+55pSv5oyBIHdhc20g55qE44CCXG4gICAgICAgIHBsYXRmb3JtOiBidWlsZFBsYXRmb3JtLFxuICAgICAgICBtb2RlOiBidWlsZE1vZGUsXG4gICAgICAgIGZsYWdzOiB7XG4gICAgICAgICAgICBERUJVRzogdHJ1ZSxcbiAgICAgICAgICAgIFNFUlZFUl9NT0RFOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICB9O1xuICAgIGF3YWl0IGJ1aWxkRW5naW5lKGJ1aWxkT3B0aW9ucyk7XG5cbiAgICAvLyDovpPlh7ogaW1wb3J0LW1hcC5qc29uXG4gICAgY29uc3QgaW1wb3J0TWFwOiBhbnkgPSB7XG4gICAgICAgIGltcG9ydHM6IHtcbiAgICAgICAgICAgICdjYy9lbnYnOiAnLi9idWlsdGluL2NjZS5lbnYuanMnLFxuICAgICAgICAgICAgLy8gVE9ETzogZGVwcmVjYXRlZCBjY2UuZW52IGlzIG9ubHkgbGl2ZSBpbiAzLjAtcHJldmlld1xuICAgICAgICAgICAgJ2NjZS5lbnYnOiAnLi9idWlsdGluL2NjZS5lbnYuanMnLFxuICAgICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgZmVhdHVyZVVuaXRzID0gc3RhdFF1ZXJ5LmdldEZlYXR1cmVVbml0cygpO1xuICAgIGZvciAoY29uc3QgZnUgb2YgZmVhdHVyZVVuaXRzKSB7XG4gICAgICAgIGltcG9ydE1hcC5pbXBvcnRzW2BjY2U6L2ludGVybmFsL3gvY2MtZnUvJHtmdX1gXSA9IGAuL2NvY29zLWpzLyR7ZnV9LmpzYDtcbiAgICB9XG4gICAgYXdhaXQgd3JpdGVGaWxlKGpvaW4oc3RhdGljRGlyLCAnaW1wb3J0LW1hcC5qc29uJyksIEpTT04uc3RyaW5naWZ5KGltcG9ydE1hcCwgdW5kZWZpbmVkLCAyKSwgJ3V0ZjgnKTtcblxuICAgIC8vIOaehOW7uiBwb2x5ZmlsbHMuYnVuZGxlLmpzXG4gICAgYXdhaXQgYnVpbGRQb2x5ZmlsbHMoe1xuICAgICAgICBkZWJ1ZzogZmFsc2UsXG4gICAgICAgIHNvdXJjZU1hcDogZmFsc2UsXG4gICAgICAgIGZpbGU6IGpvaW4oc3RhdGljRGlyLCAncG9seWZpbGxzLmJ1bmRsZS5qcycpLFxuICAgICAgICBjb3JlSnM6IHtcbiAgICAgICAgICAgIG1vZHVsZXM6IFtcbiAgICAgICAgICAgICAgICAnZXMuZ2xvYmFsLXRoaXMnLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGJsYWNrbGlzdDogW10sXG4gICAgICAgICAgICAvLyB0YXJnZXRzOiAnY2hyb21lIDgwJ1xuICAgICAgICB9LFxuICAgICAgICBhc3luY0Z1bmN0aW9uczogdHJ1ZSxcbiAgICAgICAgZmV0Y2g6IHRydWUsXG4gICAgfSk7XG5cbiAgICAvLyDmnoTlu7ogc3lzdGVtLmJ1bmRsZS5qc1xuICAgIGF3YWl0IGJ1aWxkU3lzdGVtSnMoe1xuICAgICAgICBvdXQ6IGpvaW4oc3RhdGljRGlyLCAnc3lzdGVtLmJ1bmRsZS5qcycpLFxuICAgICAgICBtaW5pZnk6IGZhbHNlLFxuICAgICAgICBzb3VyY2VNYXA6IGZhbHNlLFxuICAgICAgICBwbGF0Zm9ybTogJ21hYycsIC8vIEZJWE1FKGNqaCk6IGNvY29zLW1vZHVsZS1zeXN0ZW0gZGVwZW5kcyBgcGxhdGZvcm1gIGFyZ3VtZW50IHRvIGRlY2lkZSB0byB1c2Ugd2hpY2ggcHJlc2V0ICh3ZWIgb3IgY29tbW9uanMtbGlrZSkuIFNvIGl0J3MgYSBoYWNrIGhlcmUuXG4gICAgICAgIGVkaXRvcjogZmFsc2UsXG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coJ0NvbXBpbGUgZmluaXNoZWQhJyk7XG4gICAgY29uc29sZS50aW1lRW5kKCdDb21waWxlIG5hdGl2ZSBlbmdpbmUnKTtcbn1cbiJdfQ==