'use strict';

const { expect } = require('chai');

describe('场景查询测试', () => {
    before(async () => {
        await Editor.Message.request('scene', 'open-scene');
    });

    describe('query-is-ready', async () => {
        const isReady = await Editor.Message.request('scene', 'query-is-ready');

        it('场景准备就绪', async () => {
            expect(isReady).to.equal(true);
        });
    });

    let uuid;
    describe('query-node-tree', async () => {
        // 返回当前编辑的尝尽内的第一个场景
        const dump_empty = await Editor.Message.request('scene', 'query-node-tree');

        it('场景树格式', async () => {
            expect(dump_empty.type).to.equal('cc.Scene');
            expect(dump_empty.active).to.equal(true);
            expect(dump_empty.name).to.equal('Scene');
            expect(dump_empty.parent).to.equal('');
        });

        it('场景树节点数据', () => {
            uuid = dump_empty.children[0].uuid;
            expect(dump_empty.children.length).to.equal(2);
            expect(dump_empty.children[0].name).to.equal('Main Light');
            expect(dump_empty.children[1].name).to.equal('Main Camera');
        });
    });

    describe('query-node', async () => {
        const dump = await Editor.Message.request('scene', 'query-node', uuid);

        it('节点数据', () => {
            expect(!!dump).to.equal(true);
            expect(dump.uuid.value).to.equal(uuid);
        });
    });

    describe('query-dirty', async () => {
        const dirty = await Editor.Message.request('scene', 'query-dirty', uuid);

        it('新建场景内的 dirty 标记', () => {
            expect(dirty).to.equal(false);
        });
    });

    describe('query-component-function-of-node', async () => {
        const map = await Editor.Message.request('scene', 'query-component-function-of-node', uuid);

        it('cc.DirectionalLight', () => {
            expect(!!map['cc.DirectionalLight']).to.equal(true);
            expect(map['cc.DirectionalLight'].length).to.not.equal(0);
        });
    });
});
