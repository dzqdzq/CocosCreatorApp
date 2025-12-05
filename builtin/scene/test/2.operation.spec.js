'use strict';

const { expect } = require('chai');
const { delay } = require('./utils/index');
describe('场景操作测试', () => {
    const map = {};
    const onMessage = function(name) {
        return () => {
            if (!map[name]) {
                map[name] = [];
            }
            console.log;
            map[name].push(Date.now());
        };
    };
    function addListener(message) {
        Editor.Message.addBroadcastListener(message, onMessage(message));
    }
    function checkMessageCount(message, count){
        expect(!!map[message]).to.equal(true);
        expect(map[message].length).to.equal(count);
    }
    function getLatestMessageTime(message) {
        return map[message][map[message].length - 1];
    }
    addListener('scene:close');
    addListener('scene:ready');
    describe('打开空场景', async () => {

        await Editor.Message.request('scene', 'open-scene');

        it('场景广播: scene:close', async () => {
            checkMessageCount('scene:close', 1);
        });

        it('场景广播: scene:ready', async () => {
            checkMessageCount('scene:ready', 1);
        });

        it('场景广播的 close 与 ready 的顺序', async () => {
            const readyIpcTime = getLatestMessageTime('scene:ready');
            const closeIpcTime = getLatestMessageTime('scene:close');
            expect(readyIpcTime > closeIpcTime).to.equal(true);
        });

        it('profile 内的当前场景数据', async () => {
            delay(200);
            expect(await Editor.Profile.getTemp('scene', 'current-scene')).to.equal('');
        });

        it('query-current-scene 消息查询返回的数据', async () => {
            // 这个接口现在不走场景队列，
            const current = await Editor.Message.request('scene', 'query-current-scene');
            expect(current).not.to.equal('');
        });
    });

    describe('保存场景', async () => {
        let uuid = '';

        it('profile 内的当前场景数据', async () => {
            uuid = await Editor.Message.request('scene', 'save-scene');
            //  Editor.Profile.setTemp没有真的await...
            await delay(200);
            const current = await Editor.Profile.getTemp('scene', 'current-scene');
            expect(current).to.equal(uuid);
        });

        it('消息查询返回的数据', async () => {
            const current = await Editor.Message.request('scene', 'query-current-scene');
            expect(current).to.equal(uuid);
        });
    });

    // 需要多完善一些操作的测试,比如进入预制体、创建资源时的reload等等;
});
