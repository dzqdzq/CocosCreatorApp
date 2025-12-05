'use strict';

const { expect } = require('chai');

const sleep = (time) => new Promise((r) => setTimeout(r, time));

describe('Hierarchy 对外暴露的 IPC 接口', () => {

    describe('定位节点并闪烁', () => {
        it('hierarchy:twinkle', async () => {
            /**
             * uuid 会变化，暂用
             * 来自 phong.fire 的第一个节点
             */
            const uuid = '68al7ENjpKa7hrzi3sVEYt';

            Editor.Message.request('hierarchy', 'twinkle', uuid);

            await sleep(500);

            const result = await Editor.Message.request('tester', 'forwarding-to-window', 'hierarchy', [
                { element: 'ui-drag-area > ui-drag-item > .name' },
            ]);

            expect(result[0].attrs.twinkle).to.equal('shake');
        });
    });

});
