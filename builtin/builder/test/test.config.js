module.exports = {
    'excludes': [
        'migration.spec.js',
        'build-with-options.spec.js',
        'settings-panel.spec.js',
        'pvr-compress.spec.js',
        'migration-1.2.9.spec.js',
    ],

    // 执行插件测试例需要等待的流程
    async wait() {
        const isReady = await Editor.Message.request('builder', 'query-worker-ready');
        if (isReady) {
            return;
        }
        return new Promise(async (resolve) => {
            Editor.Message.addBroadcastListener('build-worker:ready', () => {
                resolve();
            });
        });  
    },
};