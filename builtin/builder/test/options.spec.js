const { expect } = require('chai');
const { readJSONSync, existsSync, readFileSync, copyFileSync, emptyDirSync, ensureDirSync } = require('fs-extra');
const { join, relative, dirname, extname } = require('path');
describe('不同构建参数构建效果测试，请在空项目下测试避免干扰，测试过程会自动创建需要的测试资源', async () => {
    // 配置当前的测试环境
    const globby = require('globby'); // 路径匹配获取文件路径
    const sourceDir = join(Editor.App.path, 'builtin/builder/test/assets/build-test-case');
    // 先拷贝 meta 文件
    const metaPaths = await globby(join(sourceDir, '/**/*.meta'), { nodir: true });
    metaPaths.forEach((path) => {
        const dest = join(Editor.Project.path, 'assets', relative(sourceDir, path));
        ensureDirSync(dirname(dest));
        copyFileSync(path, dest);
    });
    // 拷贝实体文件
    const assetPaths = await globby(join(sourceDir, '/**/*'), { nodir: true });
    console.log(assetPaths);
    await Promise.all(assetPaths.map((path) => {
        console.log(path);
        if (extname(path) === '.meta') {
            return;
        }
        const url = 'db://assets/' + relative(sourceDir, path);
        const asset = Editor.Message.request('asset-db', 'create-asset', url, readFileSync(path), {
            overwrite: true,
        });
        return asset.uuid;
    }));
    emptyDirSync(join(Editor.Project.path, 'assets'));
    // 这里并非是测试不同的组合效果，而是测试每个选项功能点是否正确，因而组合数不会太多
    // 测试 web-desktop 非调试模式 960 X 640 sourcemaps md5
    describe('测试 web-desktop 非调试模式 960 X 640 sourcemaps compressTexture md5 + options 指定项目设置', async () => {
        this.timeout && this.timeout(600000);
        const options = readJSONSync(join(__dirname, './build-config/buildConfig_web-desktop.json'));
        await Editor.Message.request('builder', 'add-task', options.outputName, options, true);

        const dest = join(Editor.Project.path, options.buildPath, options.outputName);
        const enginePath = join(dest, `cocos${Editor.Project.type}-js.min.js`);
        const projectScript = join(dest, 'src', `project.js`);

        it('包体正常生成', () => {
            expect(existsSync(dest)).to.be.ok;
        });
        it('正常生成 settings', () => {
            expect(existsSync(join(dest, 'src', 'settings.js'))).to.be.true;
        });
        it('settings 能正常加载', async () => {
            await loadScript(dest);
            expect(_CCSettings).to.be.ok;
        });
        describe('settings 数据生成效果测试', () => {
            it('debug 与 options 一致', () => {
                expect(_CCSettings && _CCSettings.debug === options.debug).to.be.true;
            });
            it('launchScene 与 options 内数据一致', () => {
                let launchScene;
                for (const data of options.scenes) {
                    if (data.uuid === options.startScene) {
                        launchScene = data.url;
                        break;
                    }
                }
                expect(_CCSettings.launchScene === launchScene).to.be.true;
            });
            it('designResolution 与 options 内数据一致', () => {
                expect(_CCSettings.designResolution.width).to.be.equal(options.designResolution.width);
                expect(_CCSettings.designResolution.height).to.be.equal(options.designResolution.height);
                // TODO 适配模式测试
            });
        });
        describe('非调试模式效果测试', () => {
            it('settings 文件正常压缩生成', () => {
                expect(isCompressAndExist(join(dest, 'src', 'settings.js'))).to.be.true;
            });
            it('引擎文件正常压缩生成', () => {
                expect(isCompressAndExist(enginePath)).to.be.true;
            });
            it('project 文件正常压缩生成', () => {
                expect(isCompressAndExist(projectScript)).to.be.true;
            });
            // it('场景对应资源 json 文件是未压缩的，内部 uuid 是长 uuid', () => {

            // });
            // it('cc-env 正常生成', () => {

            // });
        });
        describe('sourcemaps 效果测试', () => {
            it('引擎文件对应 map 文件正常生成', () => {
                expect(existsSync(enginePath + '.map')).to.be.true;
            });
            it('project 对应 map 文件正常生成', () => {
                expect(existsSync(projectScript + '.map')).to.be.true;
            });
        });
        describe('MD5 效果测试', () => {
            it('settings 内生成了对应的 md5AssetsMap', () => {
                expect(_CCSettings.md5AssetsMap && Object.keys(_CCSettings.md5AssetsMap).length > 0).to.be.true;
            });
        });
    });

    describe('测试 web-mobile 调试模式 项目设置 orientation vconsole packAutoAtlas', async () => {
        // TODO
    });
    describe('测试 wechatgame 非调试模式 模块设置 orientation packAutoAtlas subPackage', async () => {
        // TODO
    });
});

/**
 * 使用 script 标签加载某个脚本
 * @param {*} dest 项目目录
 */
function loadScript(dest) {
    return new Promise((resolve, reject) => {
        const $settingsScript = document.createElement('script');
        $settingsScript.src = join(dest, 'src', 'settings.js');
        document.body.append($settingsScript);
        $settingsScript.onload = (event) => {
            resolve(true);
        };
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
