const { expect } = require('chai');
const { join } = require('path');
const { existsSync, statSync, removeSync, ensureDirSync } = require('fs-extra');
const { compressPVR } = require('../dist/worker/builder/asset-handler/texture-compress/compress-tool');

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
        src: join(Editor.Project.path, 'assets/single-compress/image/png.png'),
        dest: '',
        format: '',
        compressOptions: {
            quality: '',
        },
        uuid: 'b4a4d0f8-f718-4d0d-a88d-eeecb4ca7f19',
    };
    const destDir = join(Editor.Project.path, 'temp', 'CompressTexture', 'compressPVR-dest');
    ensureDirSync(destDir);
    // 文件放置在 temp 目录下时测试前清理即可，测试后可能需要排查问题
    before(() => {
        removeSync(destDir);
    });
    for (let i = 0; i < compressFormats.length; i++) {
        describe(compressFormats[i], () => {
            for (let j = 0; j < qualities.length; j++) {
                const dest = join(destDir, `${compressFormats[i]}_${qualities[j]}.pvr`);

                it(`generator ${compressFormats[i]}_${qualities[j]}.pvr`, async function() {
                    // 这个压缩时长比较久，需要增长超时时间
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
});