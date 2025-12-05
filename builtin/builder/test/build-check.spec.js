const { expect } = require('chai');
const { checkBuildCommonOptionsByKey, getCommonOptionDefaultByKey } = require('../dist/share/common-options-validator');
const { pluginManager } = require('../dist/browser/plugin');
const { checkOptionsBeforeCommand } = require('../dist/browser/tasks');
const { join } = require('path');

const optionBase = {
    platform: 'web-mobile',
    buildPath: 'project://',
};

describe('构建通用配置验证测试', async () => {
    await pluginManager.init();
    describe('name 名称验证测试', () => {
        it('name 不能为空', async () => {
            const result = await pluginManager.checkCommonOptionByKey('name', '', optionBase);
            expect(result.error).to.not.equal('');
        });
    });

    describe('useSplashScreen 验证', () => {
        it('iOS 平台启用插屏', async () => {
            const options = await pluginManager.getOptionsByPlatform('ios');
            expect(options.useSplashScreen).to.be.true;
        });

        it('wechatgame 平台启用插屏', async () => {
            const options = await pluginManager.getOptionsByPlatform('wechatgame');
            expect(options.useSplashScreen).to.be.true;
        });
    });

    describe('插件自定义通用配置校验方法', () => {
        // native 自定义了 name 选项的校验
        const options = { platform: 'ios' };
        it('原生平台 name 不能包含空格', async () => {
            const result = await pluginManager.checkCommonOptionByKey('name', 'test-case space', options);
            expect(result.error).to.not.equal('');
        });
        it('原生平台 name 不能包含特殊字符', async () => {
            const result = await pluginManager.checkCommonOptionByKey('name', 'test-case#01', options);
            expect(result.error).to.not.equal('');
        });
        it('原生平台 mac, ios, windows, android 的 name 可以包含中文', async () => {
            const result = await pluginManager.checkCommonOptionByKey('name', 'test-case测试', options);
            expect(result.error).to.equal('');
        });
        it('其他原生平台的 name 不可以包含中文', async () => {
            options.platform = 'huawei-agc';
            const result = await pluginManager.checkCommonOptionByKey('name', 'test-case测试', options);
            expect(result.error).to.not.equal('');
        });
    });

    describe('outputName 名称验证测试', () => {
        it('outputName 不能为空', async () => {
            const result = await pluginManager.checkCommonOptionByKey('outputName', '', optionBase);
            expect(result.error).to.not.equal('');
        });
        const options = { platform: 'ios' };
        it('outputName 原生平台不支持中文', async () => {
            const result = await pluginManager.checkCommonOptionByKey('outputName', 'project://build/构建', options);
            expect(result.error).to.not.equal('');
        });
        it('outputName 原生平台不支持特殊符号', async () => {
            const result = await pluginManager.checkCommonOptionByKey('outputName', 'project://build/path#01', options);
            expect(result.error).to.not.equal('');
        });
        it('outputName 原生平台支持路径符号、空格、下划线、中划线、字母、数字', async () => {
            const result = await pluginManager.checkCommonOptionByKey('outputName', 'project://build/ios-001/output name/path_01', options);
            expect(result.error).to.equal('');
        });
    });

    describe('buildPath 路径验证测试', () => {
        const options = { platform: 'ios' };
        it('路径不能为空', async () => {
            const result = await pluginManager.checkCommonOptionByKey('buildPath', '', options);
            expect(result.error).to.not.equal('');
            expect(result.newValue).to.equal('project://build');
        });
        it('路径不能为 project://', async () => {
            const result = await pluginManager.checkCommonOptionByKey('buildPath', 'project://', options);
            expect(result.error).to.not.equal('');
            expect(result.newValue).to.equal('project://build');
        });
        it('buildPath 原生平台不支持中文', async () => {
            const result = await pluginManager.checkCommonOptionByKey('buildPath', 'project://build/构建', options);
            expect(result.error).to.not.equal('');
        });
        it('buildPath 原生平台不支持特殊符号', async () => {
            const result = await pluginManager.checkCommonOptionByKey('buildPath', 'project://build/path#01', options);
            expect(result.error).to.not.equal('');
        });
        it('buildPath 原生平台支持路径符号、空格、下划线、中划线、字母、数字', async () => {
            const result = await pluginManager.checkCommonOptionByKey('buildPath', 'project://build/ios-001/output name/path_01', options);
            expect(result.error).to.equal('');
        });
        it('buildPath 项目路径无效', async () => {
            const result1 = await pluginManager.checkCommonOptionByKey('buildPath', 'project://C:/Users/Administrator/Desktop/test', options);
            expect(result1.error).to.not.equal('');
            const result2 = await pluginManager.checkCommonOptionByKey('buildPath', 'project://../test', options);
            expect(result2.error).to.not.equal('');
            const result3 = await pluginManager.checkCommonOptionByKey('buildPath', 'project:///build', options);
            expect(result3.error).to.not.equal('');
            const result4 = await pluginManager.checkCommonOptionByKey('buildPath', 'project://./build', options);
            expect(result4.error).to.equal('');
            const result5 = await pluginManager.checkCommonOptionByKey('buildPath', 'project://custom-build', options);
            expect(result5.error).to.equal('');
        });
        it('buildPath 绝对路径无效', async () => {
            const result1 = await pluginManager.checkCommonOptionByKey('buildPath', 'C:\\Program Files', options);
            expect(result1.error).to.equal('');
            const result2 = await pluginManager.checkCommonOptionByKey('buildPath', '/User/Administrator', options);
            expect(result2.error).to.equal('');
            const result3 = await pluginManager.checkCommonOptionByKey('buildPath', 'build', options);
            expect(result3.error).to.not.equal('');
            const result4 = await pluginManager.checkCommonOptionByKey('buildPath', './build', options);
            expect(result4.error).to.not.equal('');
            const result5 = await pluginManager.checkCommonOptionByKey('buildPath', '../build', options);
            expect(result5.error).to.not.equal('');
        });
    });

    describe('platform 验证测试', () => {
        it('不支持的构建平台 newPlatform', async () => {
            const result = await checkBuildCommonOptionsByKey('platform', 'newPlatform');
            expect(result.error).to.not.equal('');
            expect(result.newValue).to.be.null;
        });
    });

    describe('startScene 验证测试', () => {
        it('startScene 52fbcf09 不存在', async () => {
            const result = await checkBuildCommonOptionsByKey('startScene', '52fbcf09');
            expect(result.error).to.not.equal('');
            expect(result.newValue).to.not.equal('52fbcf09');
        });
        it('Bundle 内的场景不能作为首场景', async () => {
            const result = await checkBuildCommonOptionsByKey('startScene', '7f5ba957-296e-4230-824c-46d9a65ec5f1');
            expect(result.error).to.not.equal('');
        });
    });

    describe('scenes 验证测试', () => {
        it('场景数据为空后需要改成默认场景数据', async () => {
            const result = await checkBuildCommonOptionsByKey('scenes', []);
            expect(result.error).to.not.equal('');
            expect(result.newValue.length !== 0).to.be.true;
        });

        it('场景数据混入不存在的资源要被剔除，剔除后的场景数据为空要报错', async () => {
            const result = await checkBuildCommonOptionsByKey('scenes', [{ uuid: 'ahisbfbj', url: 'ad://asset/njjdks.scene' }]);
            expect(result.error).to.not.equal('');
        });

        it('场景数据混入不存在的资源要被剔除', async () => {
            const assets = await Editor.Message.request('asset-db', 'query-assets', {
                ccType: 'cc.SceneAsset',
            });
            const scenes = assets.map((item) => {
                return {
                    url: item.url,
                    uuid: item.uuid,
                };
            });
            scenes.push({
                uuid: 'jkjdishdj',
                url: 'db://assets/jjidji.scene',
            });
            const result = await checkBuildCommonOptionsByKey('scenes', scenes);
            expect(result.error).to.not.equal('');
            expect(result.newValue.length).to.be.equal(scenes.length - 1);
        });
    });

    describe('checkOptionsBeforeCommand options={}', async () => {
        const res = await checkOptionsBeforeCommand({});
        expect(res).to.ok;
        expect(res.platform).to.be.toString();
        expect(res.outputName).to.be.toString();
    });
    describe('checkOptionsBeforeCommand options={ configPath }', async () => {
        const res = await checkOptionsBeforeCommand({
            configPath: join(Editor.Project.path, 'build-configs', 'buildConfig_web-mobile.json'),
        });
        expect(res).to.ok;
        expect(res.platform).to.be.toString();
        expect(res.outputName).to.be.toString();
    });
    describe('check-and-complete-options options={ configPath, debug: false }', async () => {
        let res = await checkOptionsBeforeCommand({
            configPath: join(Editor.Project.path, 'build-configs', 'buildConfig_web-mobile.json'),
            debug: false,
        });
        res = await Editor.Message.request('builder', 'check-and-complete-options', res);
        console.log(res);
        expect(res).to.ok;
        describe('指定参数允许覆盖 configPath 的指定配置', () => {
            expect(res.debug).to.be.false;
        });
        describe('需要填充 configPath 不包含的 scenes 数据', () => {
            expect(res.scenes.length >= 1).to.ok;
        });
        expect(res.platform).to.be.toString();
        expect(res.startScene).to.be.toString();
        expect(res.outputName).to.be.toString();
        expect(res.packages['web-mobile']).to.be.ok;
    });
    describe('checkOptions', async () => {
        const defaultScenes = await getCommonOptionDefaultByKey('scenes');
        const packageName = 'cocos.kkk.com';
        await Editor.Profile.setConfig('android', 'builder.options.android.packageName', packageName);
        const options = await pluginManager.checkOptions({
            scenes: [defaultScenes[0]],
            platform: 'android',
            buildStageGroup: undefined,
            packages: {
                packageName,
            },
            debug: 'false',
            md5Cache: 'true',
            sourceMaps: 'false',
            useSplashScreen: 0,
            useBuiltinServer: 'true',
        });
        // 验证数组数据不被替换
        it('验证数组数据不被替换', () => {
            expect(options.scenes.length).to.equal(1);
            expect(options.buildStageGroup).to.be.undefined;
        });
        it('字符串布尔值正常转换为布尔值', () => {
            expect(options.debug).to.be.false;
            expect(options.md5Cache).to.be.true;
            expect(options.sourceMaps).to.be.false;
            expect(options.useSplashScreen).to.be.true;
            expect(options.useBuiltinServer).to.be.true;
        });
        it('验证是否填充了用户的配置数据', () => {
            expect(options.packages.android.packageName).to.be.equal(packageName);
        });
    });
});
