const { expect } = require('chai');
const { createReadStream } = require('fs');
const { existsSync, emptyDirSync, readdir, readJson, outputJSON } = require('fs-extra');
const { join } = require('path');
describe('请使用构建专用测试项目 build-example 项目测试！', async () => {
    if (Editor.Project.name !== 'build-example') {
        console.log('请使用构建专用测试项目 build-example 项目测试！');
        return;
    }
    const buildConfigDir = join(Editor.Project.path, './build-configs');
    const buildDir = join(Editor.Project.path, 'build');
    const logDestDir = join(Editor.Project.tmpDir, 'builder', 'test-log');
    // 需要先清理构建好的文件
    emptyDirSync(buildDir);
    emptyDirSync(logDestDir);
    // 构建小游戏之前，需要切换 node 到低版本，本地高于 18 版本的 node 无法正常编译

    const testPlatforms = (await readdir(buildConfigDir)).map((fileName) => {
        return fileName.split('_')[1].replace('.json', '');
    });
    const testResult = {};
    const optionList = [];

    describe('测试平台构建', async () => {
        for (const platform of testPlatforms) {
            if (platform === 'mac' && process.platform !== 'darwin' || platform === 'windows' && process.platform !== 'win32') {
                testResult[platform] = {
                    skip: true,
                };
                continue;
            }

            describe(`测试平台 ${platform}`, async () => {
                const options = await readJson(join(buildConfigDir, `buildConfig_${platform}.json`));
                options.buildMode = 'normal';
                optionList.push(options);
                options.logDest = join(logDestDir, platform + '.log');
    
                console.log(`开始构建平台 ${platform}...`);
                const info = testResult[platform] = {
                    normalBuild: {
                        exitCode: 0,
                        logDest: options.logDest,
                    },
                };
                try {
                    // 固定 id 避免增加过多的任务
                    options.id = platform;
                    info.normalBuild.exitCode = await Editor.Message.request('builder', 'command-build', options);
                } catch (error) {
                    console.error(error);
                }
    
                it(`平台 ${platform} 正常构建完成`, async () => {
                    expect(info.normalBuild.exitCode).to.equal(36);
                });
                info.normalBuild.logInfo = await analyzeLogFile(options.logDest);
                it('平台构建无报错', () => {
                    expect(info.normalBuild.logInfo.error.length).equal(0);
                });
    
                if (info.normalBuild.exitCode === 36) {
                    console.log(`开始测试 ${platform} 的仅构建 bundle 模式`);
                    const bundleOptions = JSON.parse(JSON.stringify(options));
                    bundleOptions.buildMode = 'bundle';
                    bundleOptions.logDest = join(logDestDir, platform + '-bundle-build-only.log');
                    info.bundleBuild = {
                        exitCode: 0,
                        logDest: bundleOptions.logDest,
                    };
                    try {
                        info.bundleBuild.exitCode = await Editor.Message.request('builder', 'command-build', bundleOptions);
                    } catch (error) {
                        console.error(error);
                    }
                    console.log(`平台 ${platform} 仅 bundle 构建模式构建 ${info.exitCode === 36 ? '成功' : '失败'}`);
    
                    info.bundleBuild.logInfo = await analyzeLogFile(bundleOptions.logDest);
                    it(`平台 ${platform} 仅 bundle 构建模式`, () => {
                        expect(info.bundleBuild.exitCode).equal(36);
                    });
                    it(`平台 ${platform} 仅 bundle 构建模式无报错`, () => {
                        expect(info.bundleBuild.logInfo.error.length).equal(0);
                    });
                }
            });
            
        }

        after(async () => {
            const testResultDest = join(logDestDir, 'test-result.json');
            await outputJSON(testResultDest, testResult);
            console.log(`生成测试结果报告到 ${testResultDest}`);
        });

    });

    describe('测试独立 bundle 构建', async () => {
        const bundleBuildOptions = {
            'stage': 'bundle',
            'dest': 'project://build/build-bundle',
            'id': 'buildBundle',
            'bundleConfigs': [
                {
                    'root': 'db://assets/altas-bundle',
                    'output': true,
                },
            ],
            'taskName': 'build bundle db://assets/altas-bundle',
            optionList,
        };
        bundleBuildOptions.logDest = join(logDestDir, 'bundle-build.log');
        const info = testResult['bundle-build'] = {
            exitCode: 0,
            logDest: bundleBuildOptions.logDest,
        };
        console.log('开始测试独立构建 bundle ');
        try {
            info.exitCode = await Editor.Message.request('builder', 'command-build', bundleBuildOptions);
        } catch (error) { 
            console.error(error);
        }
        console.log(`独立构建 bundle ${info.exitCode === 36 ? '成功' : '失败'}`);
        info.logInfo = await analyzeLogFile(bundleBuildOptions.logDest);
        it('独立 bundle 构建正常完成', () => {
            expect(info.exitCode).equal(36);
        });
        it('独立构建 bundle', () => {
            expect(info.logInfo.error.length).equal(0);
        });
        after(async () => {
            const testResultDest = join(logDestDir, 'test-result.json');
            await outputJSON(testResultDest, testResult);
            console.log(`生成测试结果报告到 ${testResultDest}`);
        });
    });

    // TODO 检查构建成功的平台内部资源生成是否正常

    // 这里并非是测试不同的组合效果，而是测试每个选项功能点是否正确，因而组合数不会太多
    // 测试 web-desktop 非调试模式 960 X 640 sourcemaps md5
    // describe('测试 web-desktop 非调试模式 960 X 640  compressTexture md5 指定项目设置', async () => {
    //     const options = readJSONSync(join(buildConfigDir, 'buildConfig_web-desktop.json'));
    //     await Editor.Message.request('builder', 'add-task', options, true);

    //     const dest = join(Editor.UI.File.resolveToRaw(options.buildPath), options.outputName);
    //     const engineDirPath = join(dest, `cocos-js`);
    //     const projectScript = join(dest, 'src', `project.js`);

    //     it('包体正常生成', () => {
    //         expect(existsSync(dest)).to.be.ok;
    //     });
    // });

    // describe('测试 web-mobile 调试模式 项目设置 orientation vconsole', async () => {
    //     const options = readJSONSync(join(buildConfigDir, 'buildConfig_web-mobile.json'));
    //     options.id = 'web-mobile';
    //     const dest = join(Editor.UI.File.resolveToRaw(options.buildPath), options.outputName);
    //     if (!existsSync(dest)) {
    //         await Editor.Message.request('builder', 'add-task', options, true);
    //     }
    //     const settingsPath = join(dest, 'src', 'settings.json');
    //     const engineDirPath = join(dest, 'cocos-js');
    //     const pathExistTest = {
    //         '包体正常生成': dest,
    //         'index.html': join(dest, 'index.html'),
    //         '正常生成 settings': settingsPath,
    //         '正常生成引擎文件夹': engineDirPath,
    //         'vconsole.min.js': join(dest, 'vconsole.min.js'),
    //         // 检查 sourceMap 是否生效
    //         'system.bundle.js.map': join(dest, 'src/system.bundle.js.map'),
    //     };
    //     Object.keys(pathExistTest).forEach((testMsg) => {
    //         it(testMsg, () => {
    //             expect(existsSync(pathExistTest[testMsg])).to.be.ok;
    //         });
    //     });

    //     describe('settings 数据生成效果测试', () => {
    //         const settingsInfo = readJSONSync(settingsPath);
    //         const testOptionsKeys = ['debug', 'orientation'];
    //         testOptionsKeys.forEach((optionKey) => {
    //             it(`${optionKey} 与 options 一致`, () => {
    //                 expect(settingsInfo.debug === options.debug).to.be.true;
    //             });
    //         });
    //         it('launchScene 与 options 内数据一致', () => {
    //             let launchScene;
    //             for (const data of options.scenes) {
    //                 if (data.uuid === options.startScene) {
    //                     launchScene = data.url;
    //                     break;
    //                 }
    //             }
    //             expect(settingsInfo.launchScene === launchScene).to.be.true;
    //         });
    //         it('插件脚本 jsList 数据结果', () => {
    //             expect(settingsInfo.jsList.includes('assets/test-js-list/plugin-not-web.js')).to.be.false;
    //             expect(settingsInfo.jsList.includes('assets/test-js-list/plugin-not-native.js')).to.be.true;
    //             expect(existsSync(join(dest, 'src', 'assets/test-js-list/plugin.js'))).to.be.true;
    //         });
    //         it('CocosEngine 需要记录编辑器版本号', () => {
    //             expect(settingsInfo.CocosEngine === Editor.App.version).to.be.true;
    //         });
    //         it('scriptPackages', () => {
    //             expect(settingsInfo.scriptPackages[0] === './src/chunks/bundle.js').to.be.true;
    //         });
    //     });
    //     // TODO 验证纹理压缩的图片生成

    //     describe('测试自动图集压缩格式的生成', async () => {
    //         describe('db://assets/altas-bundle/normal/auto-atlas.pac 无 PNG 配置 ETC1', async () => {
    //             const autoAtlasImage = join(dest, 'assets/test-atlas-build/native/13/13ebf42b4');
    //             it('合图的 PNG 格式不存在', () => {
    //                 expect(existsSync(autoAtlasImage + '.png')).to.be.false;
    //             });
    //             it('合图的 PKM 格式正常生成', () => {
    //                 expect(existsSync(autoAtlasImage + '.pkm')).to.be.true;
    //             });
    //         });
    //     });
    //     // 验证 bundleConfigs 的数据测试
    // });
    // describe('测试 wechatgame 非调试模式 主包设置为远程包 orientation subPackage', async () => {
    //     // TODO
    // });
});

async function analyzeLogFile(path) {
    const result = {
        warning: [],
        error: [],
    };
    try {
        if (!existsSync(path)) {
            console.error(`构建日志 ${path} 未正常生成！`);
        } else {
            console.log('开始分析构建日志...');
            await readline(path, (line) => {
                if (line.includes('- warn:')) {
                    result.warning.push(line);
                } else if (line.includes('- error:')) {
                    result.error.push(line);
                }
            });
            console.log(`分析构建日志 ${path} 完成...,warn: ${result.warning.length}, error: ${result.error.length}`);
        }
    } catch (error) {
        console.error(error);
    }
    return result;
}

function readline(path, handler) {
    return new Promise((resolve) => {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: createReadStream(path),
        });
        rl.on('line', (line) => {
            handler(line);
        });
        rl.on('close', () => {
            resolve();
        });
    });
}
/**
 * 判断某个文件是否是压缩过的
 * @param {*} path
 */
function isCompressAndExist(path) {
    if (!existsSync(path)) {
        return false;
    }
    const str = existsSync(path, 'utf-8');
    return !/\r\n/.test(str);
}
