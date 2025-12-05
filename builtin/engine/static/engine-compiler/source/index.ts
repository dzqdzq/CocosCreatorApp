'use strict';

import { StatsQuery } from '@cocos/ccbuild';
import { editorBrowserslistQuery } from '@editor/lib-programming/dist/utils';
import type { QuickCompiler } from '@editor/quick-compiler';
import { fork, ForkOptions } from 'child_process';
import os from 'os';
import { copyFileSync, emptyDir, ensureDir, ensureDirSync, existsSync, outputFile, readFile, remove, writeFileSync, rmdirSync } from 'fs-extra';
import { dirname, join } from 'path';
import { IFeatureItem, IModuleItem, ModuleRenderConfig } from '@cocos/creator-types/engine/features';

/**
 * 需要重新整理此处代码，用正规的数据初始化流程处理
 */

/**
 * 在 .editor.js 里面使用了这个脚本来构建引擎，此时 Editor 不存在所以这里要声明
 */
declare const Editor: undefined | typeof global.Editor;
let compiler: null | QuickCompiler = null;
let nativeCompiler: null | QuickCompiler = null;
let engineDir = '';
let busy = false;
let outDir = '';
let statsQuery: null | StatsQuery = null;

const editorFeaturesCache: string[] = [];
const VERSION = '3';
interface IRebuildOptions {
    debugNative?: boolean;
    isNativeScene?: boolean;
}


export async function compileEngine(directory: string, force?: boolean, options?: IRebuildOptions) {
    engineDir = directory;
    outDir = join(directory, 'bin', '.cache', 'dev');
    // 发布之后不需要编译内置引擎
    // 开始第一次编译引擎
    const versionFile = join(outDir, 'VERSION');

    let needClear = false;
    try {
        const version = await readFile(versionFile, 'utf8');
        if (version !== VERSION) {
            needClear = true;
        }
    } catch {
        needClear = true;
    }
    compiler = await generateCompiler();
    const isNativeScene = options && options.isNativeScene && await getIsSceneNative();

    let debugNative = false;
    if (isNativeScene) {
        nativeCompiler = await generateCompiler({ isNative: true });
        debugNative = await getIsDebugNative();
    }
    if (needClear) {
        console.debug('[EditorQuickCompiler]Version information lost.');
        await emptyDir(outDir);
    } else {
        console.debug('[EditorQuickCompiler]Version information looks good.');
    }
    if ((needClear || debugNative || force) && !process.argv.includes('--no-quick-compile')) {
        await rebuild({ isNativeScene, debugNative });
    } else {
        console.debug('Note, quick compiler does not get launched.');
    }

    statsQuery = statsQuery || await StatsQuery.create(engineDir);
}
interface IEngineFeatureQueryOptions {
    platformType: StatsQuery.ConstantManager.PlatformType;
    engine: string;
    pluginFeatures?: string[] | 'all' | 'default';
}

type IEnvLimitModule = Record<string, {
    envList: string[];
    fallback?: string;
}>

function extractMacros(expression: string): string[] {
    return expression.split('||').map(match => match.trim().substring(1));
}
function queryEnvLimitModule(engineDir: string) {
    const modulesInfo: ModuleRenderConfig = require(join(engineDir, 'editor', 'engine-features', 'render-config.json'));

    const envLimitModule: IEnvLimitModule = {};
    const stepModule = (moduleKey: string, moduleItem: IFeatureItem) => {
        if (moduleItem.envCondition) {
            envLimitModule[moduleKey] = {
                envList: extractMacros(moduleItem.envCondition),
                fallback: moduleItem.fallback,
            };
        }
    };
    function addModuleOrGroup(moduleKey: string, moduleItem: IModuleItem) {
        if ('options' in moduleItem) {
            Object.entries(moduleItem.options).forEach(([optionKey, optionItem ]) => {
                stepModule(optionKey, optionItem);
            });
        } else {
            stepModule(moduleKey, moduleItem);
        }
    }
    Object.entries(modulesInfo.features).forEach(([moduleKey, moduleItem]) => {
        addModuleOrGroup(moduleKey, moduleItem);
    });

    return envLimitModule;
}

// TODO 目前引擎分离、engine 插件内部都需要这个过滤功能，需要统一复用
async function filterEngineModules(engineDir: string, envOptions: StatsQuery.ConstantManager.ConstantOptions, features: string[]) {
    const engineStatsQuery = await StatsQuery.create(engineDir);
    const ccEnvConstants = engineStatsQuery.constantManager.genCCEnvConstants(envOptions);
    const envLimitModule = queryEnvLimitModule(engineDir);
    const moduleToFallBack: Record<string, string> = {};
    Object.keys(envLimitModule).forEach((moduleId: string) => {
        if (!features.includes(moduleId)) {
            return;
        }
        const { envList, fallback } = envLimitModule[moduleId];
        const enable = envList.some((env) => ccEnvConstants[env as keyof StatsQuery.ConstantManager.CCEnvConstants]);
        if (enable) {
            return;
        }
        moduleToFallBack[moduleId] = fallback || '';
        if (fallback) {
            features.splice(features.indexOf(moduleId), 1, fallback);
        } else {
            features.splice(features.indexOf(moduleId), 1);
        }
    });
    return features;
}

async function generateCompiler(options?: { isNative?: boolean }): Promise<QuickCompiler> {
    const { QuickCompiler } = await import('@editor/quick-compiler');
    const logFile = Editor?.Project.tmpDir ? join(engineDir, 'bin', '.cache', 'logs', 'log.txt') : undefined;
    if (logFile) {
        await ensureDir(dirname(logFile));
    }
    statsQuery = statsQuery || await StatsQuery.create(engineDir);
    let allFeatures = statsQuery.getFeatures();

    // Spine Hack Begin
    // 先移除 spine 所有版本
    allFeatures = allFeatures.filter((f) => !f.startsWith('spine-'));
    if (Editor) {
        // 编辑器状态下，可以选择切换 spine 版本
        const engineModule = (await Editor.Profile.getProject('engine', 'modules'));
        const moduleConfig = engineModule?.configs[engineModule.globalConfigKey];

        const includeModules: string[] | undefined = moduleConfig?.includeModules ?? [];
        const spineVersion = includeModules?.find((m) => m.startsWith('spine-'));
        if (spineVersion) {
            allFeatures.push(spineVersion);
        } else {
            // Fallback to spine 3.8
            allFeatures.push('spine-3.8');
        }
    } else {
        // 编辑器打包默认只打 spine 3.8 版本
        allFeatures.push('spine-3.8');
    }
    // Spine Hack End
    const env: StatsQuery.ConstantManager.ConstantOptions = {
        platform: 'HTML5',
        mode: 'EDITOR',
        flags: {
            DEBUG: true,
        },
    };
    const featureUnitPrefix = 'cce:/internal/x/cc-fu/'; // cc-fu -> cc feature unit
    if (options?.isNative) {
        env.platform = 'NATIVE';
        if (process.platform === 'win32') {
            env.platform = 'WINDOWS';
        } else if (process.platform === 'darwin') {
            env.platform = 'MAC';
        } else {
            console.error(`Unsupported platform: ${process.platform}`);
        }

        const editorFeatures = await filterEngineModules(engineDir, env, allFeatures);
        editorFeaturesCache.push(...editorFeatures);
        const nativeOutDir = join(engineDir, 'bin/.editor');
        return new QuickCompiler({
            rootDir: engineDir,
            outDir: nativeOutDir,
            platform: env.platform,
            targets: [{
                featureUnitPrefix,
                dir: nativeOutDir,
                format: 'systemjs',
                targets: 'node 10',
                loose: true,
                includeEditorExports: true,
                includeIndex: {
                    features: editorFeatures,
                },
                loader: true,
            }],
            logFile,
        });
    } else {
        const editorFeatures = await filterEngineModules(engineDir, env, allFeatures);
        editorFeaturesCache.push(...editorFeatures);
        return new QuickCompiler({
            rootDir: engineDir,
            outDir: outDir,
            platform: env.platform,
            targets: [
                {
                    featureUnitPrefix,
                    dir: join(outDir, 'editor'),
                    format: 'systemjs',
                    // inlineSourceMap: true,
                    // 使用 indexed source map 加快编译速度：
                    // 见 https://github.com/cocos-creator/3d-tasks/issues/4720
                    // indexedSourceMap: true,
                    usedInElectron509: true,
                    targets: editorBrowserslistQuery,
                    includeIndex: {
                        features: editorFeatures,
                    },
                    loader: true, // 编辑器里没有 SystemJS，所以需要生成 loader
                    loose: true, // TODO(cjh): 当前 ccbuild 构建强制使用了 loose 模式且后面一个 preview target 也是强制开启，先把当前 editor target 也开启 loose 模式，临时修复 Though the "loose" option was set to "false" in your @babel/preset-env config ... 问题。后续需要考虑使用项目设置中的「宽松模式」设置选项。
                },
                {
                    featureUnitPrefix,
                    dir: join(outDir, 'preview'),
                    format: 'systemjs',
                    loose: true,
                    // indexedSourceMap: true,
                },
            ],
            logFile,
        });
    }
}

export async function rebuild(options?: IRebuildOptions) {
    if (options?.isNativeScene === undefined) {
        options ??= {};
        options.isNativeScene = await getIsSceneNative();
        if (options.isNativeScene) {
            options.debugNative = await getIsDebugNative();
        }

    }
    if (!compiler || (options?.isNativeScene && !nativeCompiler)) {
        await compileEngine(engineDir, true);
        return;
    }
    if (busy) {
        console.error('Compile engine fails: The compilation is in progress');
        return;
    }
    busy = true;
    console.log('Start Quick Compile');
    const time = Date.now();
    if (!compiler) {
        busy = false;
        console.error('Compile engine fails: The compiler does not exist.');
        return;
    }
    try {
        if (options.isNativeScene) {
            await nativeCompiler!.build();
            await rebuildNativeImportMap();
            await generateEngineAddon(options);
            await updateAdapter();
        }
        await compiler.build();
        if (Editor) {
            await rebuildImportMaps();
        }
        const versionFile = join(outDir, 'VERSION');
        await outputFile(versionFile, VERSION, { encoding: 'utf8' });

        // eslint-disable-next-line no-useless-catch
    } catch (error) {throw error;

    } finally {
        console.log('Quick Compile: ' + (Date.now() - time) + 'ms');
        busy = false;
    }
}

export async function rebuildImportMaps() {
    if (!compiler) {
        return;
    }

    const editorShippedFeatures = await getEditorShippedFeatures();
    await rebuildTargetImportMap(
        compiler,
        0,
        editorShippedFeatures,
    );

    const previewShippedFeatures = await getPreviewShippedFeatures();
    await rebuildTargetImportMap(
        compiler,
        1,
        previewShippedFeatures,
    );
}

export function getCCEnvConstants(options: StatsQuery.ConstantManager.ConstantOptions) {
    // 此处只有 statsQuery 初始化后才会进来
    return statsQuery!.constantManager.genCCEnvConstants(options);
}

async function rebuildNativeImportMap() {
    const features = await getEditorShippedFeatures();
    await rebuildTargetImportMap(
        nativeCompiler!,
        0,
        features,
        'NATIVE',
        'EDITOR'
    );

}

async function rebuildTargetImportMap(compiler: QuickCompiler, targetIndex: number, features: string[], platform?: string, mode?: string, out?: string) {
    const configurableFlags = await getConfigurableFlagsOfFeatures(features);
    await compiler.buildImportMap(
        targetIndex, features, {
        mode,
        platform,
        out,
        features,
        configurableFlags,
    },
    );
}

async function getEditorShippedFeatures() {
    return editorFeaturesCache;
}

async function getPreviewShippedFeatures() {
    if (Editor) {
        const EngineModulesConfig = await Editor.Profile.getProject('engine', 'modules');
        const engineModules = EngineModulesConfig.configs[EngineModulesConfig.globalConfigKey].includeModules;
        return engineModules;
    } else {
        return [];
    }
}

async function getConfigurableFlagsOfFeatures(features: string[]) {
    const flags: Record<string, unknown> = {};
    if (Editor) {
        const EngineModulesConfig = await Editor.Profile.getProject('engine', 'modules');
        const featureFlagsQuery = EngineModulesConfig.configs[EngineModulesConfig.globalConfigKey].flags;
        if (featureFlagsQuery) {
            for (const [feature, configurableFeatureFlags] of Object.entries(featureFlagsQuery)) {
                if (features.includes(feature)) {
                    Object.assign(flags, configurableFeatureFlags);
                }
            }
        }
    }
    return flags;
}

/**
 * 使用 cmake 和 cmake-js 编译原生引擎
 */
async function generateEngineAddon(options?: Pick<IRebuildOptions, 'debugNative'>) {
    // editor-native-scene 的位置就在内置 ts 引擎的相对位置那里
    let nativeSceneRepoDir: string;
    if (Editor) {
        nativeSceneRepoDir = join(Editor.App.path, '../resources/3d/editor-native-scene');
    } else {
        // 这时候是打包机触发的编译
        nativeSceneRepoDir = join(__dirname, '../../../../../../resources/3d/editor-native-scene');
    }

    if (!existsSync(nativeSceneRepoDir)) {
        console.error(`build failed: editor-native-scene not exist,path: ${nativeSceneRepoDir}`);
        return;
    }
    const engineNativeDir = join(engineDir, 'native');
    if (!existsSync(engineNativeDir)) {
        console.error(`build failed: native engine not exist,path: ${engineNativeDir}`);
        return;
    }
    const isArm = process.arch === 'arm64';
    let cmakeBinPath: string;
    if (Editor) {
        cmakeBinPath = join(Editor.App.path, '../tools/cmake/bin')
    } else {
        cmakeBinPath = join(engineDir, '../../../tools/cmake/bin')
    }
    const cmakeJsPath = joinPathEx(__dirname, '../node_modules/cmake-js/bin/cmake-js');
    const isWindows = process.platform === 'win32';
    const cmakeListDir = isWindows ? join(nativeSceneRepoDir, 'win') : join(nativeSceneRepoDir, 'mac');
    // some of npm_-start-env-vars will cause publish fail!!!
    const env: typeof process.env = {};
    Object.assign(env, process.env);
    Object.keys(env).filter(x => x.toLowerCase().startsWith('npm_')).forEach(e => delete env[e]);
    if (isWindows) {
        env.Path = process.env.PATH + ';' + cmakeBinPath;
    } else {
        env.PATH = process.env.PATH + ':' + cmakeBinPath;
    }

    let errorMessage = '';
    try {
        const cocosDir = `--CDCOCOS_DIR=${join(engineDir, '../')}`;
        const cmakeOutputPath = join(cmakeListDir, 'build');
        const isLastTimeDebug = await getIsDebugLastTime();
        if (process.platform !== 'win32') {
            const needClear = isLastTimeDebug !== null && isLastTimeDebug !== options?.debugNative;
            if (needClear) {
                if (existsSync(cmakeOutputPath)) {
                    console.warn('cmake configure change,now will clean build cache');
                    rmdirSync(cmakeOutputPath, { recursive: true });
                }
            }
            await setIsDebugLastTime(!!options?.debugNative);
        }
        const buildParams = [cocosDir];
        if (!isWindows) {
            buildParams.push('-x');
            buildParams.push('-a');
            buildParams.push(isArm ? 'arm64' : 'x64');
        }

        const coreCount = os.cpus().length;
        console.info(`>>> cpu core count: ${coreCount}`);

        buildParams.push('-j');
        buildParams.push(coreCount.toString());

        if (options?.debugNative) {
            buildParams.push('-D');
        }
        console.time('cmake build');
        const cmakeConfigure = async (options?: { onSuccess?: (log: string) => unknown, onError?: (log: string) => unknown }) => {
            await forkModule(cmakeJsPath, ['configure', ...buildParams], {
                cwd: cmakeListDir,
                env: env,
            }, {
                async success(log) {
                    await options?.onSuccess?.(log);
                },
                async failed(log) {
                    try {
                        await options?.onError?.(log);
                    } catch (error) {
                        if (error instanceof Error) {
                            errorMessage += error.message + '\n';
                        }
                    }
                },
            });
        };
        let isConfigureSuccess = false;
        const onCmakeConfigureSuccess = (log: string) => {
            isConfigureSuccess = true;
            console.log('cmake configure success');
        };

        await cmakeConfigure({
            onSuccess: onCmakeConfigureSuccess,
            async onError(errLog) {
                errorMessage += errLog + '\n';
                console.error(errLog);
                // 在第一次配置失败的时候尝试清空一次编译的缓存再配置一次
                if (existsSync(cmakeOutputPath)) {
                    console.warn('cmake configure error,now will clean build cache and try again');
                    await remove(cmakeOutputPath);
                    await cmakeConfigure({
                        onSuccess: onCmakeConfigureSuccess,
                        onError(log) {
                            console.error(log);
                            errorMessage += log + '\n';
                        },
                    });
                } else {
                    throw new Error(`cmake configure failed, output path ${cmakeOutputPath} is not exist `);
                }

            },
        });
        if (!isConfigureSuccess) {
            console.warn('cmake configure failed,skip build native scene');
            console.timeEnd('cmake build');
            throw errorMessage;
        }

        console.info(`>>> cmake with params: ${buildParams.join(' ')}`);

        await forkModule(cmakeJsPath, ['build', ...buildParams], {
            cwd: cmakeListDir,
            env: env,
        }, {
            success() {
                console.timeEnd('cmake build');
                console.log('Native engine cmake build succeeded.');
            },
            failed(log) {
                console.timeEnd('cmake build');
                console.error('Native engine cmake build failed, the reason is', log);
            },
        });
    } catch (error) {
        let content: string;
        if (error instanceof Error) {
            errorMessage += error.message + '\n';
            content = errorMessage;
        } else if (typeof error === 'string') {
            content = error;
        }
        console.error(content!);
        outputErrorTxt('build-native-scene-error' + getFormat24HourTime(), content!);
    }
}

async function updateAdapter() {
    try {
        let isSuccess = true;
        const nativeOutDir = join(engineDir, 'bin/.editor');
        const webAdapter = join(engineDir, 'bin/adapter/native/web-adapter.js');
        if (existsSync(webAdapter)) {
            const output = join(nativeOutDir, 'web-adapter.js');
            copyFileSync(webAdapter, output);
        } else {
            isSuccess = false;
            console.error(`${webAdapter} not exist,please build engine first`);
        }
        const engineAdapter = join(engineDir, 'bin/adapter/native/engine-adapter.js');
        if (existsSync(engineAdapter)) {
            copyFileSync(engineAdapter, join(nativeOutDir, 'engine-adapter.js'));
        } else {
            isSuccess = false;
            console.error(`${engineAdapter} not exist,please build engine first`);
        }
        if (isSuccess) {
            console.log('update adapter success');
        } else {
            console.error('update adapter failed');
        }
        return Promise.resolve();
    } catch (error) {
        return Promise.reject(error);
    }
}

interface IEngineGlobalConfig {
    'builtin': boolean;
    'custom': string;
}

interface IEngineProjectConfig {
    'use_global': boolean;
    'builtin': boolean;
    'custom': string;
}

/**
 * 根据全局配置与项目配置、默认值等计算出真正的引擎使用路径
 * @param globalConfig
 * @param projectConfig
 * @param builtinPath
 */
export function getRightEngine(config: IEngineGlobalConfig, builtinPath: string) {
    const info = {
        version: 'builtin',
        path: builtinPath,
    };
    if (config.custom && existsSync(config.custom)) {
        info.version = 'custom';
        info.path = config.custom;
        return info;
    } else {
        return info;
    }
}

/**
 *
 * @param {*} args
 * @param {*} options
 */
function forkModule(modulePath: string, args: readonly string[], options: ForkOptions, hooks: { success?: (str: string) => Promise<void> | void, failed?: (str: string) => Promise<void> | void } = {}) {
    return new Promise((resolve, reject) => {
        options.execArgv ??= ['--max-old-space-size=8192'];
        if (typeof options.cwd === 'string') {
            ensureDirSync(options.cwd);
        }
        options.stdio ??= 'pipe';
        const child = fork(modulePath, args, options);
        let stdout = '';
        let stderr = '';
        child.stdout && child.stdout.on('data', (data) => {
            stdout += data;
        });
        child.stderr && child.stderr.on('data', (data) => {
            stderr += data;
        });
        child.on('close', async (code) => {
            if (code === 0) {
                hooks.success && await hooks.success(stderr || stdout);
            } else {
                hooks.failed && await hooks.failed(stderr || stdout);
            }
            resolve(code);
        });
        child.on('error', (error) => {
            reject(error);
        });
    });
}

async function getIsSceneNative() {
    let isNativeScene = true;
    if (Editor) {
        // TODO HACK 不能直接跨插件查询，目前由于插件启动顺序无法确定，所以直接查配置
        // 这个时候 scene 插件未启动，默认值都没配上
        // 另一个地方也是直接这么查配置 app\index.js
        isNativeScene = await Editor.Profile.getConfig('scene', 'scene.native-engine','global') ?? false;
    }
    return isNativeScene;
}

async function getIsDebugNative(): Promise<boolean> {
    return !!await Editor?.Profile.getConfig('scene', 'scene.debug-native');
}

/** 获取上一次是否为 debug */
async function getIsDebugLastTime(): Promise<boolean | null> {
    return await Editor?.Profile.getConfig('engine', 'is-debug-native');
}

/** 设置临时记录记录最后一次编译是否为 debug */
async function setIsDebugLastTime(value: boolean): Promise<void> {
    return await Editor?.Profile.setConfig('engine', 'is-debug-native', value, 'global');
}
/**
 * 获取当前时间
 */
function getFormat24HourTime() {
    const date = new Date();

    // Function to convert
    // single digit input
    // to two digits
    const formatData = (input: number) => {
        if (input > 9) {
            return input;
        } else return `0${input}`;
    };

    // Data about date

    const dd = formatData(date.getDate());
    const mm = formatData(date.getMonth() + 1);
    const yyyy = date.getFullYear();
    const HH = formatData(date.getHours());
    const MM = formatData(date.getMinutes());
    const SS = formatData(date.getSeconds());

    return `${yyyy}-${mm}-${dd}-${HH}-${MM}-${SS}`;

}

/**
 *
 * @param fileName
 * @param errorMessage
 * @param dir
 * @example
 * outputErrorMessage('my-error','this is error.');
 * @example
 * outputErrorMessage('my-error','this is error.','d:/my-dir');
 */

function outputErrorTxt(fileName: string, errorMessage: string, dir?: string) {
    try {
        dir ??= Editor?.Project.path ? join(Editor.Project.path, 'temp/crash/') : join(engineDir, 'bin', '.editor', 'logs');
        const filePath = join(dir, fileName + '.txt');
        ensureDirSync(dir);
        writeFileSync(filePath, errorMessage, { encoding: 'utf-8' });
    } catch (error) {
        if (error instanceof Error) {
            console.error(`output error failed,reason is ${error.message}`);
        }
    }
}

// 打包后,需要处理app.asar路径问题，不然路径会出错
function joinPathEx(dir:string,path:string) {
    let realPath = join(dir, path);
    if (realPath.indexOf('app.asar') !== -1) {
        realPath = realPath.replace('app.asar', 'app.asar.unpacked');
        if(realPath.indexOf('app.asar.unpacked') && !existsSync(realPath)) {
            console.trace(`${realPath} not exist`);
        }
    }
    return realPath;
}

export * as default from './index'
