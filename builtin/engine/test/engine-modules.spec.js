'use strict';
const { expect } = require('chai');
const { defaultConfigKey } = require('../dist/contributions/project/modules/default-config');

describe('query-engine-modules-profile 接口测试', () => {
    describe('常规返回值测试', async () => {
        it('检查消息接口的返回值是否符合要求', async () => {
            const keys = ['name', 'cache', 'flags', 'includeModules', 'noDeprecatedFeatures'];
            const defaultProfileNoParam = await Editor.Message.request('engine', 'query-engine-modules-profile');
            expect(defaultProfileNoParam).to.include.keys(keys);
        });

        it('获取默认配置（使用 defaultConfigKey）', async () => {
            const defaultProfileWithKey = await Editor.Message.request('engine', 'query-engine-modules-profile', defaultConfigKey);
            expect(defaultProfileWithKey.includeModules).to.be.an('array');
        });

        it('传入一个不存在的 key 得到空值', async () => {
            const otherProfile = await Editor.Message.request('engine', 'query-engine-modules-profile', 'otherKey');
            expect(otherProfile).to.be.an('null');
        });
    });

    it('测试图形配置 custom-pipeline 开启 post-process', async () => {   
        await Editor.Profile.setProject('engine', 'modules.graphics.pipeline', 'custom-pipeline', 'project');
        await Editor.Profile.setProject('engine', 'modules.graphics.custom-pipeline-post-process', true, 'project');

        const modules = (await Editor.Message.request('engine', 'query-engine-modules-profile')).includeModules;
        expect(modules).to.include('custom-pipeline');
        expect(modules).to.include('custom-pipeline-post-process');
        expect(modules).to.not.include('legacy-pipeline');
    });

    it('测试图形配置 custom-pipeline 关闭 post-process', async () => {   
        await Editor.Profile.setProject('engine', 'modules.graphics.pipeline', 'custom-pipeline', 'project');
        await Editor.Profile.setProject('engine', 'modules.graphics.custom-pipeline-post-process', false, 'project');

        const modules = (await Editor.Message.request('engine', 'query-engine-modules-profile')).includeModules;
        expect(modules).to.include('custom-pipeline');
        expect(modules).to.not.include('custom-pipeline-post-process');
        expect(modules).to.not.include('legacy-pipeline');
    });

    it('测试图形配置 legacy-pipeline', async () => {   
        await Editor.Profile.setProject('engine', 'modules.graphics.pipeline', 'legacy-pipeline', 'project');

        const modules = (await Editor.Message.request('engine', 'query-engine-modules-profile')).includeModules;

        expect(modules).to.include('legacy-pipeline');
        expect(modules).to.not.include('custom-pipeline');
    });

    it('测试图形配置默认值', async () => {
        // 让它读取默认值
        await Editor.Profile.removeProject('engine', 'modules.graphics.pipeline', 'project');

        const modules = (await Editor.Message.request('engine', 'query-engine-modules-profile')).includeModules;

        expect(modules).to.include('custom-pipeline');
        expect(modules).to.not.include('legacy-pipeline');
    });
    if (Editor.Project.name === 'build-example') {
        describe('获取默认的全局配置需要过滤 physics-2d-box2d-jsb', async () => {
            const moduleRes = await Editor.Message.request('engine', 'query-engine-modules-profile');
            it('需要过滤 physics-2d-box2d-jsb', () => {
                expect(!moduleRes.includeModules.includes('physics-2d-box2d-jsb')).to.true;
            });
            console.debug(moduleRes.includeModules);
            it('physics-2d-box2d-jsb 需要替换成 physics-2d-box2d-wasm', () => {
                expect(moduleRes.includeModules.includes('physics-2d-box2d-wasm')).to.true;
            });
            it('moduleToFallBack 需要记录 physics-2d-box2d-wasm', () => {
                expect(moduleRes.moduleToFallBack['physics-2d-box2d-jsb'] === 'physics-2d-box2d-wasm').to.true;
            });
        });

        describe('支持传递环境参数查询全局配置', async () => {
            const envOptions = {
                mode: 'BUILD',
                platform: 'NATIVE',
            };
            const moduleRes = await Editor.Message.request('engine', 'query-engine-modules-profile', '', envOptions);
            it('需要过滤 gfx-webgl gfx-webgl2 gfx-webgpu 等模块', () => {
                expect(moduleRes.includeModules.every((module) => !module.includes('gfx'))).to.true;
            });
        });
    }
});

describe('filter-engine-modules 接口测试', () => {
    it('HTML5 不支持 physics-2d-box2d-jsb 模块', async () => {
        const includeModules = ['physics-2d-box2d-jsb'];
        const envOptions = {
            mode: 'BUILD',
            platform: 'HTML5',
        };
        const { includeModules: filterIncludeModules, moduleToFallBack } = await Editor.Message.request('engine', 'filter-engine-modules', includeModules, envOptions);
        expect(filterIncludeModules).to.include('physics-2d-box2d-wasm');
        expect(filterIncludeModules).to.not.include('physics-2d-box2d-jsb');
        expect(moduleToFallBack['physics-2d-box2d-jsb']).to.equal('physics-2d-box2d-wasm');
    });

    it('NATIVE 不支持 gfx-webgl | gfx-webgl2 | gfx-webgpu 模块', async () => {
        const includeModules = ['gfx-webgl', 'gfx-webgl2', 'gfx-webgpu', 'base'];
        const envOptions = {
            mode: 'BUILD',
            platform: 'NATIVE',
        };
        const { includeModules: filterIncludeModules, moduleToFallBack } = await Editor.Message.request('engine', 'filter-engine-modules', includeModules, envOptions);
        expect(filterIncludeModules).to.not.include('gfx-webgpu');
        expect(filterIncludeModules).to.not.include('gfx-webgl');
        expect(filterIncludeModules).to.not.include('gfx-webgl2');
        expect(filterIncludeModules).to.include('base');
        expect(moduleToFallBack['gfx-webgl']).to.equal('');
        expect(moduleToFallBack['gfx-webgl2']).to.equal('');
        expect(moduleToFallBack['gfx-webgpu']).to.equal('');
    });
});
