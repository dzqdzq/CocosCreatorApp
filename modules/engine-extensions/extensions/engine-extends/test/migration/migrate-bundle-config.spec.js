'use strict';
const { expect } = require('chai');
const { margeBundleConfig } = require('../../dist/importer/importers/migrates/migrate-bundle-config');
const { transformPlatformSettings } = require('../../../../../../builtin/builder/dist/share/bundle-utils');

const defaultConfig = {
    compressionType: 'merge_dep',
    isRemote: false,
};

const testInfo = {
    test1: {
        'compressionType': {
            'wechatgame': 'merge_all_json',
            'windows': 'merge_all_json',
            'xiaomi-quick-game': 'subpackage',
            'web-mobile': 'none',
            'vivo-mini-game': 'merge_all_json',
            'oppo-mini-game': 'subpackage',
            'huawei-quick-game': 'none',
            'cocos-play': 'merge_all_json',
            'bytedance-mini-game': 'merge_dep',
            'baidu-mini-game': 'merge_all_json',
            'alipay-mini-game': 'merge_dep',
        },
        'isRemoteBundle': {
            'wechatgame': true,
            'xiaomi-quick-game': false,
            'web-mobile': true,
            'oppo-mini-game': false,
            'bytedance-mini-game': true,
            'baidu-mini-game': true,
            'alipay-mini-game': true,
            'web-desktop': true,
            'link-sure': true,
            'qtt': true,
            'taobao-mini-game': true,
        },
    },
    subpackage: {
        'compressionType': {
            'wechatgame': 'subpackage',
            'baidu-mini-game': 'subpackage',
            'huawei-quick-game': 'subpackage',
            'oppo-mini-game': 'subpackage',
            'vivo-mini-game': 'subpackage',
            'xiaomi-quick-game': 'subpackage',
            'taobao-mini-game': 'subpackage',
        },
        'isRemoteBundle': {
            'wechatgame': false,
            'baidu-mini-game': false,
            'huawei-quick-game': false,
            'oppo-mini-game': false,
            'vivo-mini-game': false,
            'xiaomi-quick-game': false,
            'taobao-mini-game': false,
        },
    },
};

describe('Migrate bundle', async () => {
    const platformConfigs = await Editor.Message.request('builder', 'query-bundle-config');

    describe('Migrate resources bundle', () => {
        const { compressionType, isRemoteBundle } = testInfo.test1;
        const { displayName, configs } = margeBundleConfig(compressionType, isRemoteBundle, 'test1');
        const { miniGame, native, web } = configs;
        it('displayName', () => {
            expect(displayName).to.equal('test1');
        });
        it('minigame', () => {
            expect(miniGame.preferredOptions).to.not.exist;
            expect(miniGame.fallbackOptions).to.not.exist;
            expect(miniGame.configMode).to.equal('overwrite');
            expect(Object.keys(miniGame.overwriteSettings).length).to.equal(13);
        });
        it('native', () => {
            expect(native.preferredOptions.compressionType).to.equal('merge_dep');
            expect(native.preferredOptions.isRemote).to.equal(false);
            expect(native.fallbackOptions).to.not.exist;
            expect(Object.keys(native.overwriteSettings).length).to.equal(1);
        });
        it('web', () => {
            expect(web.preferredOptions.compressionType).to.equal('merge_dep');
            expect(web.preferredOptions.isRemote).to.equal(false);
            expect(web.fallbackOptions).to.not.exist;
            expect(Object.keys(web.overwriteSettings).length).to.equal(2);
        });

        Object.keys(configs).forEach((platformType) => {
            const res = transformPlatformSettings(configs[platformType], platformConfigs[platformType].platformConfigs);
            describe(`check res with ${platformType}`, () => {
                Object.keys(res).forEach((platform) => {
                    it(platform, () => {
                        expect(res[platform].compressionType).to.equal(compressionType[platform] ?? defaultConfig.compressionType);
                        expect(res[platform].isRemote).to.equal(isRemoteBundle[platform] ?? defaultConfig.isRemote);
                    });
                });
            });
        });
    });
    describe('Migrate supackage bundle', () => {

        const { compressionType, isRemoteBundle } = testInfo.subpackage;
        const { displayName, configs } = margeBundleConfig(compressionType, isRemoteBundle, 'subpackage');
        const { miniGame, native, web } = configs;
        
        it('displayName', () => {
            expect(displayName).to.equal('subpackage');
        });
        it('minigame', () => {
            expect(miniGame.preferredOptions).to.not.exist;
            expect(miniGame.fallbackOptions).to.not.exist;
            expect(miniGame.configMode).to.equal('overwrite');
            expect(Object.keys((miniGame.overwriteSettings)).length).to.equal(13);
        });
        it('native', () => {
            expect(native.preferredOptions.compressionType).to.equal('merge_dep');
            expect(native.preferredOptions.isRemote).to.equal(false);
            expect(native.fallbackOptions).to.not.exist;
            expect(native.overwriteSettings).to.not.exist;
        });
        it('web', () => {
            expect(web.preferredOptions.compressionType).to.equal('merge_dep');
            expect(web.preferredOptions.isRemote).to.equal(false);
            expect(web.fallbackOptions).to.not.exist;
            expect(native.overwriteSettings).to.not.exist;
        });

        Object.keys(configs).forEach((platformType) => {
            const res = transformPlatformSettings(configs[platformType], platformConfigs[platformType].platformConfigs);
            describe(`check res with ${platformType}`, () => {
                Object.keys(res).forEach((platform) => {
                    it(platform, () => {
                        expect(res[platform].compressionType).to.equal(compressionType[platform] ?? defaultConfig.compressionType);
                        expect(res[platform].isRemote).to.equal(isRemoteBundle[platform] ?? defaultConfig.isRemote);
                    });
                });
            });
        });
    });
});

