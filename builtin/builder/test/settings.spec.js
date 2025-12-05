'use strict';

const { expect } = require('chai');

const platforms = ['web-desktop', 'windows'];

platforms.forEach((platform) => {
    describe(`generate-preview-setting in ${platform}`, async () => {
        const data = await Editor.Message.request('builder', 'generate-preview-setting', {
            debug: true,
            preview: true,
            startScene: 'current_scene',
            platform,
            startSceneAssetBundle: true,
        });
        const settingsKeys = [
            'CocosEngine',
            'engine',
            'animation',
            'assets',
            'plugins',
            'scripting',
            'launch',
            'screen',
            'rendering',
            'splashScreen',
            'physics',
        ];
        describe('验证 settings 的固定参数字段是否齐全', () => {
            it('settings 第一层参数', () => {
                expect(data.settings).to.include.keys(settingsKeys);
            });
            it('settings.engine', () => {
                const engineKeys = ['debug', 'platform', 'customLayers', 'sortingLayers', 'macros', 'builtinAssets'];
                expect(data.settings.engine).to.include.keys(engineKeys);
            });
            it('settings.animation', () => {
                const animationKeys = ['customJointTextureLayouts'];
                expect(data.settings.animation).to.include.keys(animationKeys);
            });
            it('settings.assets', () => {
                const assetsKeys = ['server', 'remoteBundles', 'subpackages', 'preloadBundles', 'bundleVers', 'preloadAssets', 'projectBundles'];
                expect(data.settings.assets).to.include.keys(assetsKeys);
            });
            it('settings.screen', () => {
                const screenKeys = ['exactFitScreen', 'designResolution'];
                expect(data.settings.screen).to.include.keys(screenKeys);
            });
            it('settings.splashScreen', () => {
                const splashScreenKeys = ['displayRatio', 'totalTime', 'watermarkLocation', 'autoFit', 'base64src', 'bgBase64'];
                expect(data.settings.splashScreen).to.include.keys(splashScreenKeys);
            });
            it('settings.physics', () => {
                const physicsKeys = [
                    'physicsEngine', 'gravity', 'allowSleep', 'sleepThreshold', 'autoSimulation', 'fixedTimeStep', 'maxSubSteps', 'defaultMaterial',
                ];
                expect(data.settings.physics).to.include.keys(physicsKeys);
            });
        });

        it('生成 script2library', () => {
            expect(data.script2library).to.be.not.undefined;
        });
        describe('生成 bundleConfigs 验证', () => {
            it('bundleConfigs 正常生成包含所有需要的字段', () => {
                const configKeys = [
                    'debug', 'deps', 'extensionMap', 'hasPreloadScript',
                    'importBase', 'name', 'nativeBase', 'packs',
                    'paths', 'redirect', 'scenes', 'uuids', 'versions', 'dependencyRelationships',
                ];
                for (const config of data.bundleConfigs) {
                    expect(config).to.include.keys(configKeys);
                    // 不能生成 cc.Script 类型的 path 记录
                    Object.values(config.paths).every((info) => { info[1] !== 'cc.Script';});
                }
            });

            it('start scene bundle 正常生成', () => {
                const startScene = data.bundleConfigs.find((item) => item.name === 'start-scene');
                expect(startScene).to.be.not.undefined;
            });
    
            it('internal Bundle 正常生成路径记录', () => {
                expect(data.bundleConfigs).to.be.not.undefined;
                const internalPaths = data.bundleConfigs.find((item) => item.name === 'internal').paths;
                expect(internalPaths['1baf0fc9-befa-459c-8bdd-af1a450a0319']).to.be.exist;
                expect(internalPaths['1baf0fc9-befa-459c-8bdd-af1a450a0319'][0]).to.equal('db:/internal/effects/legacy/standard');
                expect(internalPaths['1baf0fc9-befa-459c-8bdd-af1a450a0319'][1]).to.equal('cc.EffectAsset');
            });
            if (Editor.Project.name === 'test-cases') {
                const resourcesBundle = data.bundleConfigs.find((item) => item.name === 'resources');
                const { paths, uuids } = resourcesBundle;
                it('resources Bundle 正常生成动画', () => {
                    expect(paths['7a2d3b31-31c5-4655-82e0-81e386091d14']).to.be.exist;
                    expect('7a2d3b31-31c5-4655-82e0-81e386091d14').to.be.exist;
                    expect(paths['7a2d3b31-31c5-4655-82e0-81e386091d14'][1] === 'cc.AnimationClip').to.be.exist;
                    expect(paths['0df76192-2937-40f3-a46a-8c0ab79295f5'][0] === 'font').to.be.exist;
                });
                // 由于模型导入有几处比较特殊的地方，需要额外测试
                it('不能包含模型资源的 uuid', () => {
                    expect(paths['82b73f77-d266-4b0f-bfaa-5655143c6ac3']).to.be.not.exist;
                    expect(uuids.includes('82b73f77-d266-4b0f-bfaa-5655143c6ac3')).to.be.false;
                });
                it('需要包含模型子资源', () => {
                    expect(paths['84db66ec-643f-4e78-b06c-3af1ac7a4871@a3140']).to.be.exist;
                    expect(uuids.includes('84db66ec-643f-4e78-b06c-3af1ac7a4871@a3140')).to.be.true;
                });
                it('不能包含脚本资源的 uuid', () => {
                    expect(paths['f0a37c43-037c-4732-82ca-439dd08afd0e']).to.be.not.exist;
                    expect(uuids.includes('f0a37c43-037c-4732-82ca-439dd08afd0e')).to.be.false;
                });
            }
        });
    });
});