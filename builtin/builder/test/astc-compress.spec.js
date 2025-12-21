const { expect } = require('chai');
const { join } = require('path');
const { existsSync, statSync, removeSync, ensureDirSync } = require('fs-extra');
const { compressAstc } = require('../dist/worker/builder/asset-handler/texture-compress/compress-tool');

describe('compressAstc 压缩 astc 类型图片测试', () => {
    const compressFormats = [
        'astc_4x4',
        'astc_5x5',
        'astc_6x6',
        'astc_8x8',
        'astc_10x5',
        'astc_10x10',
        'astc_12x12',
    ];
    const qualities = ['veryfast', 'fast', 'medium', 'thorough', 'exhaustive'];
    const defaultOptions = {
        src: join(Editor.Project.path, 'assets/single-compress/image/png.png'),
        dest: '',
        format: '',
        compressOptions: {
            quality: '',
        },
        uuid: 'b4a4d0f8-f718-4d0d-a88d-eeecb4ca7f19',
    };
    const destDir = join(Editor.Project.path, 'temp', 'CompressTexture', 'compressAstc-dest');
    ensureDirSync(destDir);
    // 文件放置在 temp 目录下时测试前清理即可，测试后可能需要排查问题
    before(() => {
        removeSync(destDir);
    });
    for (let i = 0; i < compressFormats.length; i++) {
        describe(compressFormats[i], () => {
            for (let j = 0; j < qualities.length; j++) {
                const dest = join(destDir, `${compressFormats[i]}_${qualities[j]}.astc`);

                it(`generator ${compressFormats[i]}_${qualities[j]}.astc`, async function() {
                    // 这个压缩时长比较久，需要增长超时时间
                    this.timeout(180000);
                    defaultOptions.dest = dest;
                    defaultOptions.compressOptions.quality = qualities[j];
                    defaultOptions.format = compressFormats[i];
                    try {
                        await compressAstc(defaultOptions);
                    } catch (error) {
                        console.debug(`[Test ${compressFormats[i]} ${qualities[j]} failed]`, error);
                    }
                    expect(existsSync(dest)).to.be.true;
                });

                it(`size of ${compressFormats[i]}_${qualities[j]}.astc`, () => {
                    if (existsSync(dest)) {
                        const destStat = statSync(dest);
                        expect(destStat.size > 0).to.be.true;
                    }
                });
            }
        });
    }

});