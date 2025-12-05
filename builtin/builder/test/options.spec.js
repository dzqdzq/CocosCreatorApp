const { expect } = require('chai');

const { PLATFORMS, EXTERNAL_NATIVE_PLATFORM } = require('../dist/share/platforms-options.js');
const { platform } = require('os');

describe('测试一些重要配置的平台默认值', () => {
    const testPlatform = PLATFORMS.filter((platform) => !EXTERNAL_NATIVE_PLATFORM.includes(platform));

    describe('nativeBundleMode', async () => {
        const defaultWasmPlatform = ['windows', 'android', 'mac', 'wechatgame', 'huawei-agc', 'ohos', 'linux'];
        const defaultBothPlatform = ['bytedance-mini-game', 'web-desktop', 'web-mobile'];
        for (const platform of testPlatform) {
            const defaultValue = defaultWasmPlatform.includes(platform) ? 'wasm' : (defaultBothPlatform.includes(platform) ? 'both' : 'asmjs');
            const value = await Editor.Profile.getConfig(platform, 'builder.common.nativeCodeBundleMode', 'default');
            if (value) {
                it(`${platform} 平台默认 nativeBundleMode 为 ${defaultValue}`, async () => {
                    expect(await Editor.Profile.getConfig(platform, 'builder.common.nativeCodeBundleMode', 'default')).equal(defaultValue);
                });
            } else {
                it(`${platform} 平台无特殊配置默认 nativeBundleMode 为 asmjs`, async () => {
                    expect(defaultValue).equal('asmjs');
                });
            }
            
        }
    });

    describe('gfx-webgl2', () => {
        const onPlatforms = ['web-mobile', 'web-desktop'];
        testPlatform.forEach((platform) => {
            const defaultValue = onPlatforms.includes(platform) ? 'on' : 'off';
            it(`${platform} 平台默认 gfx-webgl2 为 ${defaultValue}`, async () => {
                const value = await Editor.Profile.getConfig(platform, 'builder.common.overwriteProjectSettings.includeModules.gfx-webgl2', 'default');
                if (value) {
                    expect(value).equal(defaultValue);
                } else {
                    expect(defaultValue).equal('off');
                }
            });
        });
    });
});