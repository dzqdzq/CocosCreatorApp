'use strict';
const { expect } = require('chai');
const { defaultConfigKey } = require('../dist/contributions/project/modules/default-config');

describe('测试裁切模块', () => {
    it('获取默认配置', async () => {
        // 获取默认配置（无参数）
        const defaultProfileNoParam = await Editor.Message.request('engine', 'query-engine-modules-profile');
        expect(defaultProfileNoParam.includeModules).to.be.an('array');

        // 获取默认配置（undefined 参数）
        const defaultProfileUndefinedParam = await Editor.Message.request('engine', 'query-engine-modules-profile', undefined);
        expect(defaultProfileUndefinedParam.includeModules).to.be.an('array');

        // 获取默认配置（使用 defaultConfigKey）
        const defaultProfileWithKey = await Editor.Message.request('engine', 'query-engine-modules-profile', defaultConfigKey);
        expect(defaultProfileWithKey.includeModules).to.be.an('array');

        // 比较不同参数下的 includeModules 是否相同
        expect(defaultProfileNoParam.includeModules).to.have.same.members(defaultProfileUndefinedParam.includeModules);
       
        // 传入一个不存在的key
        const otherProfile = await Editor.Message.request('engine', 'query-engine-modules-profile', 'otherKey');
        expect(otherProfile).to.be.an('null');
    });

    it('测试图形配置 cust-pipeline 开启 post-process', async () => {   
        await Editor.Profile.setProject('engine', 'modules.graphics.pipeline', 'custom-pipeline', 'project');
        await Editor.Profile.setProject('engine', 'modules.graphics.custom-pipeline-post-process', true, 'project');

        const modules = (await Editor.Message.request('engine', 'query-engine-modules-profile')).includeModules;
        expect(modules).to.include('custom-pipeline');
        expect(modules).to.include('custom-pipeline-post-process');
        expect(modules).to.not.include('legacy-pipeline');
    });

    it('测试图形配置 cust-pipeline 关闭 post-process', async () => {   
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

});

