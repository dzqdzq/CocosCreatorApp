'use strict';

const { expect } = require('chai');
const { removeSync, outputJSONSync } = require('fs-extra');
const { join } = require('path');

const AssetDBInfo = {
    'path': './assets',
    'readonly': true,
    'visible': true,
};
const packageJSON = {
    name: '__asset_db_test__',
    'package_version': 2,
    'version': '1.0.0',
    contributions: {
        'asset-db': {
            mount: AssetDBInfo,
        },
    },
};

describe('插件机制相关测试', () => {

    describe('注册自定义数据库', () => {
        // 生成测试插件
        const extensionRoot = join(Editor.Project.path, 'extensions');

        describe('注册自定义数据库', async () => {
            // 生成测试插件
            const dbExtension_name = '__asset_db_test__' + 'db_1';
            packageJSON.name = dbExtension_name;
            const dbExtension_Dest = join(extensionRoot, dbExtension_name);
            await Editor.Package.unregister(dbExtension_Dest);

            outputJSONSync(join(dbExtension_Dest, 'package.json'), packageJSON);
            outputJSONSync(join(dbExtension_Dest, 'assets/test.json'), packageJSON);
            await Editor.Package.register(dbExtension_Dest);
            await Editor.Package.enable(dbExtension_Dest);

            // 等待 5 秒
            await sleep(5000);

            it('正常查询到数据库的相关信息', async () => {
                const dbInfo = await Editor.Message.request('asset-db', 'query-db-info', dbExtension_name);
                expect(dbInfo).to.be.exist;
            });
            // 等待 5 秒
            await sleep(5000);
            it('可以查询到数据库内的资源信息', async () => {
                const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', join(dbExtension_Dest, 'assets/test.json'));
                expect(assetInfo).to.be.exist;
                Editor.Package.unregister(dbExtension_Dest);
                removeSync(dbExtension_Dest);
            });
        });

        describe('注册带配置开关的自定义数据库', async () => {
            // 生成测试插件
            const dbExtension_name = '__asset_db_test__' + 'db_2';
            packageJSON.name = dbExtension_name;
            AssetDBInfo.enable = 'TestEnable';
            packageJSON.contributions['asset-db'].mount = AssetDBInfo;
            const dbExtension_Dest = join(extensionRoot, dbExtension_name);
            await Editor.Package.unregister(dbExtension_Dest);

            outputJSONSync(join(dbExtension_Dest, 'package.json'), packageJSON);
            outputJSONSync(join(dbExtension_Dest, 'assets/test.json'), packageJSON);
            await Editor.Profile.setConfig(dbExtension_name, AssetDBInfo.enable, false);
            await Editor.Package.register(dbExtension_Dest);
            await Editor.Package.enable(dbExtension_Dest);

            await sleep(3000);

            let dbInfo = await Editor.Message.request('asset-db', 'query-db-info', dbExtension_name);

            it('未开启配置时，数据库关闭', () => {
                expect(dbInfo).to.be.exist;
            });

            await Editor.Profile.setConfig(dbExtension_name, AssetDBInfo.enable, true);
            await sleep(5000);
            dbInfo = await Editor.Message.request('asset-db', 'query-db-info', dbExtension_name);

            it('开启配置后，数据库开启', () => {
                expect(dbInfo).to.be.exist;
            });

            it('可以查询到数据库内的资源信息', async () => {
                const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', join(dbExtension_Dest, 'assets/test.json'));
                expect(assetInfo).to.be.exist;
                Editor.Package.unregister(dbExtension_Dest);
                removeSync(dbExtension_Dest);
            });
        });
    });

    describe('注册 db 脚本', () => {
        // TODO execute-script
        
    });
});

function sleep(time) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(0);
        }, time);
    });
}