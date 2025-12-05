const { expect } = require('chai');

const rawTestData = require('./3.6.3-program.json');
const { programMap } = require('../dist/migrations/1.0.4');

describe('1.0.1 -> 最新版本', async () => {
    // 注意： 此测试会修改全局的配置
    const newVersion = require('../package.json').version;
    await Editor.Profile.__protected__.migrateGlobal('program', '1.0.1', JSON.parse(JSON.stringify(rawTestData)), newVersion);
    const newTestData = await Editor.Profile.getConfig('program', '', 'global');
    for (const programMapKey of Object.keys(rawTestData)) {
        if (!programMap[programMapKey]) {
            continue;
        }
        const { newKey, platform } = programMap[programMapKey];
        const realKey = newKey === 'cmakeV2' ? 'cmake' : newKey;
        describe(`迁移 ${programMapKey} -> ${newKey} 配置`, () => {
            it('3.8.2 正常迁移配置到其他插件内', async () => {
                const newInfo = await Editor.Profile.getConfig(platform, realKey, 'global');
                expect(newInfo.path).to.equal(rawTestData[programMapKey]);
            });
            it('3.7.0 正常迁移配置在全局配置内', async () => {
                const newInfo = newTestData[newKey];
                expect(newInfo.path).to.equal(rawTestData[programMapKey]);
            });
            it('3.6.3 的配置还需要正常存在配置内', async () => {
                expect(newTestData[programMapKey]).to.equal(rawTestData[programMapKey]);
            });
        });
    }
});

