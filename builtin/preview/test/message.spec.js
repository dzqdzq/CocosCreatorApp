'use strict';

const { expect } = require('chai');
const ipc = require('@base/electron-base-ipc');
const {getErrors} = require('./../dist/socket');

describe('预览消息通知测试', () => {

    describe('open-terminal:打开终端预览', () => {
        before(() => {
            Editor.Message.send('preview', 'change-platform', 'browser');
            Editor.Message.send('preview', 'open-terminal');
        });
        it('open-terminal:打开终端预览,连接设备数至少为 1', async () => {
            const num = await (() => {
                return new Promise((resolve) => {
                    ipc.on('editor3d-lib-theme:use', (event, num) => {
                        resolve(num);
                    });
                });
            })();
            expect(num).to.be.at.least(1);
        });

        it('预览客户端不报错', () => {
            const errors = getErrors();
            expect(errors).to.have.lengthOf(0);
        });
    });

    describe('reload-terminal', () => {
        it('reload-terminal');
    });
});
