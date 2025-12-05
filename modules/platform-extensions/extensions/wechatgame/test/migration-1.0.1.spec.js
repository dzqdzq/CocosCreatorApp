const { migrateLocal } = require('../dist/migrations/1.0.1');
const { expect } = require('chai');
const testJSON = {
    options: {
        wechatgame: {
            wasm: 'fallback',
        },
    },
};

const includeModulesTestMap = [['physics-ammo', 'physics-physx'], []];

describe('1.0.1 物理相关选项偏好设置迁移', () => {
    let rawIncludeModules = [];
    before(async () => {
        rawIncludeModules = await Editor.Profile.getProject('engine', 'modules.includeModules');
    });
    describe('指定物理选项开启时', async () => {
        const testData = JSON.parse(JSON.stringify(testJSON));
        await Editor.Profile.setProject('engine', 'modules.includeModules', includeModulesTestMap[0]);
        await migrateLocal(testData);
        it('wasm 选项 fallback -> wasm', () => {
            expect(testData.options.wechatgame.wasm).to.equal('wasm');
        });
    });
    describe('指定物理选项未开启时', async () => {
        const testData = JSON.parse(JSON.stringify(testJSON));
        await Editor.Profile.setProject('engine', 'modules.includeModules', includeModulesTestMap[1]);
        await migrateLocal(testData);
        it('wasm 选项 fallback -> js', () => {
            expect(testData.options.wechatgame.wasm).to.equal('js');
        });
    });
    after(async () => {
        await Editor.Profile.setProject('engine', 'modules.includeModules', rawIncludeModules);
    });
});
