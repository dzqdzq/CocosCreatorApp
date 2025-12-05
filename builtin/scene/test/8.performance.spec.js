'use strict';

const { expect } = require('chai');

describe('场景常用接口性能测试', async () => {

    const scene = await Editor.Message.request('scene', 'query-current-scene');
    describe('新建1000个节点的时间记录(小于10秒)', async () => {
        Editor.Metrics.trackTimeStart('scene:create-node');
        const optArr = new Array(1000).fill(1);
        await Promise.all(
            optArr.map(() => {
                return Editor.Message.request('scene', 'create-node', {
                    snapshot: true,
                    parent: scene,
                });
            }),
        );
        const time = await Editor.Metrics.trackTimeEnd('scene:create-node', { output: true });

        expect(time).to.be.lessThan(10000);
    });
    describe('新建 100 个菜单节点的时间记录(小于5秒)', async () => {
        const pkgOptions = require('../package.json');
        const menus = pkgOptions.contributions.menu.filter((item) => item.message === 'create-node');
        Editor.Metrics.trackTimeStart('scene:create-menu-node');
        const optArr = new Array(100).fill(1);
        await Promise.all(
            optArr.map((item, i) => {
                const options = menus[i % menus.length].params[0];
                options.parent = scene;
                return Editor.Message.request('scene', 'create-node', options);
            }),
        );
        const time = await Editor.Metrics.trackTimeEnd('scene:create-menu-node', { output: true });
        expect(time).to.be.lessThan(5000);
    });
});
