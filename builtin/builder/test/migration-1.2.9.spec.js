const { migrateLocal } = require('../dist/browser/migration/version/1.2.9');
const { expect } = require('chai');
const testJSON = {
    BuildTaskManager: {
        taskMap: {
            js: {
                options: {
                    platform: 'wechatgame',
                    packages: {
                        wechatgame: {
                            wasm: 'js',
                        },
                    },
                },
            },
            fallback: {
                options: {
                    platform: 'wechatgame',
                    packages: {
                        wechatgame: {
                            wasm: 'fallback',
                        },
                    },
                },
            },
            wasm: {
                options: {
                    platform: 'wechatgame',
                    packages: {
                        wechatgame: {
                            wasm: 'wasm',
                        },
                    },
                },
            },
            physX: {
                options: {
                    platform: 'bytedance-mini-game',
                    packages: {
                        'bytedance-mini-game': {
                            physX: {},
                        },
                    },
                },
            },
        },
    },
};

const includeModulesTestMap = [['physics-ammo', 'physics-physx'], []];

describe('1.2.9 迁移字节、微信物理相关选项', () => {
    let rawIncludeModules = [];
    before(async () => {
        rawIncludeModules = await Editor.Profile.getProject('engine', 'modules.includeModules');
    });
    describe('指定物理选项开启时', async () => {
        const testData = JSON.parse(JSON.stringify(testJSON));
        await Editor.Profile.setProject('engine', 'modules.includeModules', includeModulesTestMap[0]);
        await migrateLocal(testData);
        const taskMap = testData.BuildTaskManager.taskMap;
        it('wasm 选项 js -> wasm', () => {
            expect(taskMap['js'].options.packages.wechatgame.wasm).to.equal('wasm');
        });
        it('wasm 选项 fallback -> wasm', () => {
            expect(taskMap['fallback'].options.packages.wechatgame.wasm).to.equal('wasm');
        });
        it('wasm 选项 wasm -> wasm', () => {
            expect(taskMap['wasm'].options.packages.wechatgame.wasm).to.equal('wasm');
        });
        it('physX 选项 use -> physX', () => {
            expect(taskMap['physX'].options.packages['bytedance-mini-game'].physX.use).to.equal('physX');
        });
    });
    describe('指定物理选项未开启时', async () => {
        const testData = JSON.parse(JSON.stringify(testJSON));
        await Editor.Profile.setProject('engine', 'modules.includeModules', includeModulesTestMap[1]);
        await migrateLocal(testData);
        const taskMap = testData.BuildTaskManager.taskMap;
        it('wasm 选项 js -> js', () => {
            expect(taskMap['js'].options.packages.wechatgame.wasm).to.equal('js');
        });
        it('wasm 选项 fallback -> js', () => {
            expect(taskMap['fallback'].options.packages.wechatgame.wasm).to.equal('js');
        });
        it('wasm 选项 wasm -> js', () => {
            expect(taskMap['wasm'].options.packages.wechatgame.wasm).to.equal('js');
        });
        it('physX 选项 use -> project', () => {
            expect(taskMap['physX'].options.packages['bytedance-mini-game'].physX.use).to.equal('project');
        });
    });
    after(async () => {
        await Editor.Profile.setProject('engine', 'modules.includeModules', rawIncludeModules);
    });
});
