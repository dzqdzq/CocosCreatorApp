const { app } = require('electron');
const { join, resolve } = require('path');
const { existsSync } = require('fs-extra');
/**
 * 读取 electron 的 appData 目录，并加载 builder-wasm 这个 npm 模块
 */
const MODULE_RELATIVE_PATH = resolve(join(app.getPath('appData'), '/CocosCreator/builder-wasm'));
export async function inject() {
    try {
        if (existsSync(MODULE_RELATIVE_PATH)) {
            const builderWasm: any = require(MODULE_RELATIVE_PATH);
            await builderWasm.init();
        }
    } catch (e) {
        //失败就算了，啥也不干
    }
}

