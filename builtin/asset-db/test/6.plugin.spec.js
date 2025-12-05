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
    name: 'asset_db_test',
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
            const dbExtension_name = 'asset_db_test__' + 'db_1';
            packageJSON.name = dbExtension_name;
            const dbExtension_Dest = join(extensionRoot, dbExtension_name);

            it('正常查询到数据库的相关信息', async () => {
                const dbInfo = await Editor.Message.request('asset-db', 'query-db-info', dbExtension_name);
                expect(dbInfo).to.be.exist;
            });

            it('可以查询到数据库内的资源信息', async () => {
                const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', join(dbExtension_Dest, 'assets/test.json'));
                expect(assetInfo).to.be.exist;
            });
        });

        describe('注册带配置开关的自定义数据库', async () => {
            // 生成测试插件
            const dbExtension_name = 'asset_db_test__' + 'db_2';
            const dbExtension_Dest = join(extensionRoot, dbExtension_name);
            if (await Editor.Profile.getConfig(dbExtension_name, 'TestEnable')) {
                const dbInfo = await Editor.Message.request('asset-db', 'query-db-info', dbExtension_name);
                it('数据库开启', () => {
                    expect(dbInfo).to.be.exist;
                });
                it('可以查询到数据库内的资源信息', async () => {
                    const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', join(dbExtension_Dest, 'assets/test.json'));
                    expect(assetInfo).to.be.exist;
                });
            } else {
                it('未开启配置时，数据库关闭', async () => {
                    const dbInfo = await Editor.Message.request('asset-db', 'query-db-info', dbExtension_name);
                    expect(dbInfo).to.be.not.exist;
                });
            }
        });

        // TODO
        describe('测试动态开关配置时数据库是否正常开启或者关闭', () => {

        });
    });

    // describe('注册 db 脚本', () => {
    //     // TODO execute-script
        
    // });
});

function sleep(time) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(0);
        }, time);
    });
}