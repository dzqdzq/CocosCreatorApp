const { expect } = require('chai');
const { readJSONSync, existsSync, emptyDirSync } = require('fs-extra');
const { join } = require('path');
describe('请使用构建专用测试项目 build-example 项目测试！', async () => {
    if (Editor.Project.name !== 'build-example') {
        console.log('请使用构建专用测试项目 build-example 项目测试！');
        return;
    }
    const buildConfigDir = join(Editor.Project.path, './build-configs');
    const buildDir = join(Editor.Project.path, 'build');
    // 需要先清理构建好的文件
    // emptyDirSync(buildDir);
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

    describe('测试 web-mobile 调试模式 项目设置 orientation vconsole', async () => {
        const options = readJSONSync(join(buildConfigDir, 'buildConfig_web-mobile.json'));
        options.id = 'web-mobile';
        const dest = join(Editor.UI.File.resolveToRaw(options.buildPath), options.outputName);
        if (!existsSync(dest)) {
            await Editor.Message.request('builder', 'add-task', options, true);
        }
        const settingsPath = join(dest, 'src', 'settings.json');
        const engineDirPath = join(dest, 'cocos-js');
        const pathExistTest = {
            包体正常生成: dest,
            'index.html': join(dest, 'index.html'),
            '正常生成 settings': settingsPath,
            正常生成引擎文件夹: engineDirPath,
            'vconsole.min.js': join(dest, 'vconsole.min.js'),
            // 检查 sourceMap 是否生效
            'system.bundle.js.map': join(dest, 'src/system.bundle.js.map'),
        };
        Object.keys(pathExistTest).forEach((testMsg) => {
            it(testMsg, () => {
                expect(existsSync(pathExistTest[testMsg])).to.be.ok;
            });
        });

        describe('settings 数据生成效果测试', () => {
            const settingsInfo = readJSONSync(settingsPath);
            const testOptionsKeys = ['debug', 'orientation'];
            testOptionsKeys.forEach((optionKey) => {
                it(`${optionKey} 与 options 一致`, () => {
                    expect(settingsInfo.debug === options.debug).to.be.true;
                });
            });
            it('launchScene 与 options 内数据一致', () => {
                let launchScene;
                for (const data of options.scenes) {
                    if (data.uuid === options.startScene) {
                        launchScene = data.url;
                        break;
                    }
                }
                expect(settingsInfo.launchScene === launchScene).to.be.true;
            });
            it('插件脚本 jsList 数据结果', () => {
                expect(settingsInfo.jsList.includes('assets/test-js-list/plugin-not-web.js')).to.be.false;
                expect(settingsInfo.jsList.includes('assets/test-js-list/plugin-not-native.js')).to.be.true;
                expect(existsSync(join(dest, 'src', 'assets/test-js-list/plugin.js'))).to.be.true;
            });
            it('CocosEngine 需要记录编辑器版本号', () => {
                expect(settingsInfo.CocosEngine === Editor.App.version).to.be.true;
            });
            it('scriptPackages', () => {
                expect(settingsInfo.scriptPackages[0] === './src/chunks/bundle.js').to.be.true;
            });
        });
        // TODO 验证纹理压缩的图片生成

        describe('测试自动图集压缩格式的生成', async () => {
            describe('db://assets/altas-bundle/normal/auto-atlas.pac 无 PNG 配置 ETC1', async () => {
                const autoAtlasImage = join(dest, 'assets/test-atlas-build/native/13/13ebf42b4');
                it('合图的 PNG 格式不存在', () => {
                    expect(existsSync(autoAtlasImage + '.png')).to.be.false;
                });
                it('合图的 PKM 格式正常生成', () => {
                    expect(existsSync(autoAtlasImage + '.pkm')).to.be.true;
                });
            });
        });
        // 验证 bundleConfigs 的数据测试
    });
    describe('测试 wechatgame 非调试模式 主包设置为远程包 orientation subPackage', async () => {
        // TODO
    });
});

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
