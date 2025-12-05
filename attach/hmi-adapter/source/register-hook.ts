
/**
 * 插件 register 的时候，触发这个钩子
 * 钩子内可以动态更改 package.json 内定义的数据
 * @param info 
 */
export async function register(json: Editor.Interface.PackageJson) {
    // 关闭全局配置 internal 资源的实验室开关
    await Editor.Profile.setConfig('asset-db', 'globalInternalLibrary', false, 'global');
    console.log('register', 'globalInternalLibrary');
    const next = await Editor.Profile.getConfig('hmi-adapter', 'next');
    if (!next) {
        // @ts-ignore 移除支持从 hmi-scene 拖拽生成 hmi-prefab 功能
        delete json.contributions.assets;
    }
}
