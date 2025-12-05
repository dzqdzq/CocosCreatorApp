'use strict';

const { expect } = require('chai');

/**
 * 等待一段时间继续执行
 *
 * @param {number} ms 毫秒
 * @returns {Promise} null
 */
function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms || 200);
    });
}

describe('测试 Tester', () => {

    describe('Ipc 模块', () => {

        it('启动消息记录器', () => {
            Tester.Ipc.record();
        });

        it('模拟测试消息', async () => {
            Editor.Message.broadcast('tester:test', 1, 2, 3);
            await wait(500);
            expect(Tester.Ipc.count('tester:test')).to.equal(1);
            Editor.Message.broadcast('tester:test', 1, 2, 3);
            await wait(500);
            expect(Tester.Ipc.count('tester:test')).to.equal(2);

            const item0 = Tester.Ipc.get('tester:test', 0);
            const item1 = Tester.Ipc.get('tester:test', 1);

            expect(item0.params).to.deep.equal([ 1, 2, 3 ]);
            expect(item1.params).to.deep.equal([ 1, 2, 3 ]);

            expect(item1.time).to.least(item0.time);
        });

    });

    describe('dom 模块', async () => {
        await Editor.Panel.open('tester.test');

        const testButton = Tester.Dom.selector('tester.test').find('.test-button');
        await testButton.click();

        expect(await testButton.attr('active')).to.equal('true');

        const testInput = Tester.Dom.selector('tester.test').find('.test-input');
        await testInput.click();

        await testInput.input('即将清空');
        await testInput.esc();
        await testInput.input('测试文字');
        await testInput.enter();

        await Editor.Panel.close('tester.test');
    });
});

