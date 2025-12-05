const { expect } = require('chai');
const { join } = require('path');
const { existsSync, statSync, removeSync, ensureDirSync, copySync } = require('fs-extra');
const { compressPVR, compressCustomFormat } = require('../dist/worker/builder/asset-handler/texture-compress/compress-tool');

describe('compressPVR 压缩 pvr 类型图片测试', () => {
    const compressFormats = [
        'pvrtc_4bits_rgba',
        'pvrtc_4bits_rgb',
        'pvrtc_4bits_rgb_a',
        'pvrtc_2bits_rgba',
        'pvrtc_2bits_rgb',
        'pvrtc_2bits_rgb_a',
    ];
    const qualities = ['fastest', 'fast', 'normal', 'high', 'best'];
    const defaultOptions = {
        src: join(__dirname, './texture-compress/logo.png'),
        dest: '',
        format: '',
        compressOptions: {
            quality: '',
        },
    };
    const destDir = join(Editor.Project.path, 'temp', 'CompressTexture', 'compressPVR-dest');
    ensureDirSync(destDir);

    for (let i = 0; i < compressFormats.length; i++) {
        describe(compressFormats[i], () => {
            for (let j = 0; j < qualities.length; j++) {
                const dest = join(destDir, `${compressFormats[i]}_${qualities[j]}.pvr`);

                it(`generator ${compressFormats[i]}_${qualities[j]}.pvr`, async function() {
                    this.timeout(180000);
                    defaultOptions.dest = dest;
                    defaultOptions.compressOptions.quality = qualities[j];
                    defaultOptions.format = compressFormats[i];
                    try {
                        await compressPVR(defaultOptions);
                    } catch (error) {
                        console.debug(`[Test ${compressFormats[i]} ${qualities[j]} failed]`, error);
                    }
                    expect(existsSync(dest)).to.be.true;
                });

                it(`size of ${compressFormats[i]}_${qualities[j]}.pvr`, () => {
                    if (existsSync(dest)) {
                        const destStat = statSync(dest);
                        expect(destStat.size > 0).to.be.true;
                    }
                });
            }
        });
    }

    after(() => {
        removeSync(destDir);
    });
});

describe('compressCustomFormat 自定义压缩方式', () => {
    const defaultOptions = {
        src: join(__dirname, './texture-compress/logo.png'),
        dest: '',
        compressOptions: {
            'quality': 80,
        },
        customConfig: {
            'path': '',
            'command': ' ${src} -o  ${dest} -q  ${quality} -exact -quiet',
            'format': 'png',
            'overwrite': true,
            'num': 25,
        },
    };
    const destDir = join(Editor.Project.path, './temp/CompressTexture/compressCustomFormat-dest');
    ensureDirSync(destDir);
    const customToolDir = join(Editor.Project.path, './temp/CompressTexture/libwebp_win32');
    copySync(join(Editor.App.path, '../tools/libwebp_win32'), customToolDir, { overwrite: true });

    describe('自定义压缩纹理工具配置 file 路径', async () => {
        const dest = join(destDir, 'raw-path.png');
        defaultOptions.dest = dest;
        const rawPath = join(customToolDir, './bin/cwebp.exe');
        defaultOptions.customConfig.path = rawPath;
        try {
            await compressCustomFormat(defaultOptions);
        } catch (error) {
            console.debug('[Test compressCustomFormat raw-path failed]', error);
        }
        expect(existsSync(dest)).to.be.true;
    });

    describe('自定义压缩纹理工具配置 project 路径', async () => {
        const dest = join(destDir, 'rel-path.png');
        defaultOptions.dest = dest;
        const relPath = Editor.UI.File.resolveToUrl(join(customToolDir, './bin/cwebp.exe'), 'project');
        defaultOptions.customConfig.path = relPath;
        try {
            await compressCustomFormat(defaultOptions);
        } catch (error) {
            console.debug('[Test compressCustomFormat rel-path failed]', error);
        }
        expect(existsSync(dest)).to.be.true;
    });

    // 压缩纹理的最后一个测试，统一删除掉 ./temp/CompressTexture 目录
    after(() => {
        removeSync(join(destDir, '../'));
    });
});
