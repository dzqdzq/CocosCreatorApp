module.exports = {

    // 执行插件测试例需要等待的流程
    async wait() {
        const isReady = await Editor.Message.request('asset-db', 'query-ready');
        if (isReady) {
            return;
        }
        return new Promise(async (resolve) => {
            Editor.Message.addBroadcastListener('asset-db:ready', () => {
                resolve();
            });
        });  
    },
};