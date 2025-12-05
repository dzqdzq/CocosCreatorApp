const { migrateLocal } = require('../dist/migrations/1.0.1');
const { expect } = require('chai');
const testJSON = {
    options: {
        'bytedance-mini-game': {
            'startSceneAssetBundle': true,
            'orientation': 'landscape',
            'appid': 'tta10ed7b33e370e1402',
            'remoteServerAddress': 'http://192.168.52.50:8080',
            '__version__': '1.0.0',
            physX: {},
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
        it('physX 选项 use -> physX', () => {
            expect(testData.options['bytedance-mini-game'].physX.use).to.equal('physX');
        });
    });
    describe('指定物理选项未开启时', async () => {
        const testData = JSON.parse(JSON.stringify(testJSON));
        await Editor.Profile.setProject('engine', 'modules.includeModules', includeModulesTestMap[1]);
        await migrateLocal(testData);
        it('physX 选项 use -> project', () => {
            expect(testData.options['bytedance-mini-game'].physX.use).to.equal('project');
        });
    });
    after(async () => {
        await Editor.Profile.setProject('engine', 'modules.includeModules', rawIncludeModules);
    });
});
