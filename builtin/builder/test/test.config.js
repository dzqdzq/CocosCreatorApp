
const singleTestMap = {
    'worker/builder/asset-handler/texture-compress/compress-tool.ts': [
        'etc-compress.spec.js',
        'pvr-compress.spec.js',
        'astc-compress.spec.js',
    ],
};
module.exports = {
    excludes: [
        'migration.spec.js',
        'settings-panel.spec.js',
        'migration-1.2.9.spec.js',

        // 'etc-compress.spec.js',
        // 'pvr-compress.spec.js',
        // 'astc-compress.spec.js',

        // 'separate-engine.spec.js',

        'build-with-options.spec.js',
    ],

    // 编辑器启动后，执行插件测试例需要等待的流程
    async wait(testList, options) {
        // TODO builder 可能未启动？？
        const isReady = await Editor.Message.request('builder', 'query-worker-ready');
        if (isReady) {
            return;
        }
        if (options.action === 'pull_request') {
            // 根据文件变动针对性的修改 testList 增减测试例
            options.changes.forEach(filePath => {
                const key = Object.keys(singleTestMap).find(item => filePath.includes(item));
                if (!key) {
                    testList.push(...singleTestMap[key]);
                }
            });
        } else {
            testList.push('build-with-options.spec.js');
        }
        return new Promise(async (resolve) => {
            Editor.Message.addBroadcastListener('build-worker:ready', () => {
                resolve();
            });
        });  
    },
};

