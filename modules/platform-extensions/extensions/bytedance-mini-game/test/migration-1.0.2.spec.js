const { migrateLocal } = require('../dist/migrations/1.0.2');
const { expect } = require('chai');
const testJSON = {
    options: {
        'bytedance-mini-game': {
            startSceneAssetBundle: true,
            orientation: 'landscape',
            appid: 'tta10ed7b33e370e1402',
            remoteServerAddress: 'http://192.168.52.50:8080',
            physX: {
                use: 'project',
                notPackPhysXLibs: false,
                multiThread: false,
                subThreadCount: 1,
                epsilon: 1e-3,
            },
            __version__: '1.0.1',
        },
    },
};

describe('1.0.2 server 数据迁移', () => {
    migrateLocal(testJSON);
    it('remoteServerAddress 移除', () => {
        expect(testJSON.options['bytedance-mini-game'].remoteServerAddress).to.equal(undefined);
    });
    it('server = http://192.168.52.50:8080', () => {
        expect(testJSON.common.server).to.equal('http://192.168.52.50:8080');
    });
});
