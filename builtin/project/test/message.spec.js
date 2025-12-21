'use strict';

const { expect } = require('chai');

describe('项目设置消息接口测试', () => {
    let design_width;
    before(async () => {
        design_width = await Editor.Message.request('project', 'query-config', 'project', 'general.designResolution.width');
    });
    describe('query-config：查询设置信息', () => {
        it('查询预览的分辨率宽度设置,应与 profile 取得的值一致', async () => {
            expect(design_width).to.equal(await Editor.Profile.getProject('project', 'general.designResolution.width'));
        });
    });

    describe('set-config 写入项目配置', () => {
        it('设置预览的分辨率宽度为600', async () => {
            await Editor.Message.send('project', 'set-config', 'project', 'general.designResolution.width', 600);
            process.nextTick(async () => {
                const w = await Editor.Profile.getProject('project', 'general.designResolution.width');
                expect(w).to.equal(600);
            });
        });
    });

    // 还原初始设置
    after(() => {
        Editor.Message.send('project', 'set-config', 'project', 'general.designResolution.width', design_width);
    });
});
