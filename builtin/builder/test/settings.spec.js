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
                const splashScreenKeys = ['displayRatio', 'totalTime', 'watermarkLocation', 'autoFit', 'logo', 'background'];
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
                const baseDependAsset = '970b0598-bcb0-4714-91fb-2e81440dccd8';
                expect(internalPaths[baseDependAsset]).to.be.exist;
                expect(internalPaths[baseDependAsset][0]).to.equal('db:/internal/effects/util/splash-screen');
                expect(internalPaths[baseDependAsset][1]).to.equal('cc.EffectAsset');
            });
            if (Editor.Project.name === 'build-example') {
                const resourcesBundle = data.bundleConfigs.find((item) => item.name === 'resources');
                const { paths, uuids } = resourcesBundle;
                it('resources Bundle 正常生成动画', () => {
                    const testAnimUUID = '38cc5e6b-be65-427c-b97d-815603cc500b';
                    expect(paths[testAnimUUID]).to.be.exist;
                    expect(testAnimUUID).to.be.exist;
                    expect(paths[testAnimUUID][1] === 'cc.AnimationClip').to.be.exist;
                });
                // 由于模型导入有几处比较特殊的地方，需要额外测试
                it('不能包含模型资源的 uuid', () => {
                    expect(paths['82b73f77-d266-4b0f-bfaa-5655143c6ac3']).to.be.not.exist;
                    expect(uuids.includes('82b73f77-d266-4b0f-bfaa-5655143c6ac3')).to.be.false;
                });
                it('需要包含模型子资源', () => {
                    expect(paths['82b73f77-d266-4b0f-bfaa-5655143c6ac3@e979f']).to.be.exist;
                    expect(uuids.includes('82b73f77-d266-4b0f-bfaa-5655143c6ac3@e979f')).to.be.true;
                });
                it('不能包含脚本资源的 uuid', () => {
                    expect(paths['b02a8776-6b86-4f1a-8ecf-93bcc1a55bea']).to.be.not.exist;
                    expect(uuids.includes('b02a8776-6b86-4f1a-8ecf-93bcc1a55bea')).to.be.false;
                });
            }
            const testAtlasBundle = data.bundleConfigs.find((item) => item.name === 'test-atlas-build');
            if (testAtlasBundle) {
                const atlasUuid = '21fc5703-07f0-402b-a59d-e0ec3e8f6152';
                const { paths, uuids } = testAtlasBundle;
                it('test-atlas-build 正常包含图集信息', () => {
                    expect(uuids.includes(atlasUuid));
                    expect(paths[atlasUuid]).to.be.exist;
                });

                const spriteImage = 'c608b2f9-68b4-4e6b-92b6-eddb919d9a36@f9941';
                it('test-atlas-build 正常包含图集小图信息', () => {
                    expect(uuids.includes(spriteImage));
                    expect(paths[spriteImage]).to.be.exist;
                });

                it('小图子资源信息带 1 标识', () => {
                    expect(paths[spriteImage][2]).to.be.equal(1);
                });
            }
        });
    });
});