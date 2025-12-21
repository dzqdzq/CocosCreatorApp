'use strict';

const { expect } = require('chai');
const { existsSync } = require('fs-extra');
const { join } = require('path');
const { removeSync, readJSONSync } = require('fs-extra');

const migrationConfigBase = join(__dirname, 'migration');
const { migrateBuilderProfile } = require('../dist/browser/migration/index');
const { builtinPlugins } = require('../dist/config/platforms-options');

function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

describe('构建数据迁移测试', async () => {
    const rawBuilderConfig = await Editor.Profile.getConfig('builder', '', 'local');

    describe('0 -> 1.2.1 版本数据迁移测试', async () => {
        const config = readJSONSync(join(migrationConfigBase, '0.0.0', 'builder.json'));
        await Editor.Profile.setConfig('builder', '', config, 'local');
        await migrateBuilderProfile('1.2.1');
        const newConfig = await Editor.Profile.getConfig('builder', '');
        it('version.builder === 1.2.1', () => {
            expect(newConfig.version.builder).to.equal('1.2.1');
        });

        const { migrationOptions_1_2_1 } = require('../dist/browser/migration/version/1.2.1');

        // 1.2.1 仅支持部分平台
        for (let platform of builtinPlugins) {
            // TODO 如果将来 平台数据注入方式发生改变需要调整写法
            // HACK
            const defaultOptions = await Editor.Profile.getConfig('builder', `${platform}.${platform}`, 'default');
            await migrationOptions_1_2_1(defaultOptions, platform, platform);

            platform = (platform === 'huawei-quick-game') ? 'huawei-mini-game' : platform;
            const options = await Editor.Profile.getConfig('builder', `${platform}.${platform}`, 'local');
            it(`${platform} 配置数据修改成功`, () => {
                expect(options).to.exist;
            });

            const version = await Editor.Profile.getConfig('builder', `version.${platform}`, 'local');
            it('平台数据迁移版本号写入成功', () => {
                expect(version).to.equal('1.2.1');
            });
        }

        const queues = await Editor.Profile.getConfig('builder', 'BuildTaskManager.queue', 'local');
        queues.forEach((info) => {
            const { platform } = info.options;
            it(`${platform} 构建任务 packages 数据迁移`, () => {
                expect(info.options.packages[platform]).to.be.exist;
            });
        });
    });

    describe('1.2.1 -> 1.2.2 版本数据迁移测试', async () => {
        const config = readJSONSync(join(migrationConfigBase, '1.2.1', 'builder.json'));
        await Editor.Profile.setConfig('builder', '', config, 'local');
        await migrateBuilderProfile();

        const newConfig = await Editor.Profile.getConfig('builder', '');
        it('BuildTaskManager.queue -> BuildTaskManager.taskMap', () => {
            expect(newConfig.BuildTaskManager.queue).not.exist;
            expect(newConfig.BuildTaskManager.taskMap).exist;
        });

        it('common.taskName -> common.outPutName', () => {
            expect(newConfig.common.taskName).not.exist;
            expect(newConfig.common.outputName).to.exist;
        });

        it('common.platform = huawei-mini-game 迁移', () => {
            expect(newConfig.common.platform).to.equal('huawei-quick-game');
        });

        it('version.huawei-mini-game 迁移', () => {
            expect(newConfig.version['huawei-mini-game']).not.exist;
            expect(newConfig.version['huawei-quick-game']).exist;
        });

        it('huawei-mini-game 配置迁移', () => {
            expect(newConfig['huawei-quick-game']['huawei-quick-game']).exist;
            expect(newConfig['huawei-mini-game']).not.exist;
        });

        Object.values((info) => {
            expect(info.options.platform !== 'huawei-mini-game').not.exist;
            expect(info.packages['huawei-mini-game']).not.exist;
        });
    });

    after(async () => {
        await Editor.Profile.setConfig('builder', '', rawBuilderConfig, 'local');
    });
});

describe('命令行构建参数兼容测试', () => {});
