const { expect } = require('chai');
const { join, basename, extname } = require('path');
const { existsSync, statSync, removeSync, ensureDirSync } = require('fs-extra');
const { compressEtc } = require('../dist/worker/builder/asset-handler/texture-compress/compress-tool');

describe('compressEtc 压缩 pkm 类型图片测试', () => {
    const compressFormats = [
        'etc1_rgb',
        'etc1_rgb_a',
        'etc2_rgba',
        'etc2_rgb',
    ];
    const qualities = ['slow', 'fast'];
    const defaultOptions = {
        src: join(Editor.Project.path, 'assets/single-compress/image/png.png'),
        dest: '',
        format: '',
        compressOptions: {
            quality: '',
        },
        uuid: 'b4a4d0f8-f718-4d0d-a88d-eeecb4ca7f19',
    };
    const destDir = join(Editor.Project.path, 'temp', 'CompressTexture', 'compressEtc-dest');
    
    ensureDirSync(destDir);
    // 文件放置在 temp 目录下时测试前清理即可，测试后可能需要排查问题
    before(() => {
        removeSync(destDir);
    });
    const compressTimes = {};

    for (let i = 0; i < compressFormats.length; i++) {
        describe(compressFormats[i], () => {
            for (let j = 0; j < qualities.length; j++) {
                const key = `${compressFormats[i]}_${qualities[j]}`;
                // etc 的图片生成名称无法修改，只能使用文件夹区分
                const dest = join(destDir, `${key}/${basename(defaultOptions.src, extname(defaultOptions.src))}.pkm`);

                it(`generator ${key}.pkm`, async function() {
                    // 这个压缩时长比较久，需要增长超时时间
                    this.timeout(180000);
                    defaultOptions.dest = dest;
                    defaultOptions.compressOptions.quality = qualities[j];
                    defaultOptions.format = compressFormats[i];
                    try {
                        const currentTime = Date.now();
                        await compressEtc(defaultOptions);
                        compressTimes[key] = Date.now() - currentTime;
                        console.log(`${key} 压缩完成, 耗时: ${compressTimes[key]}ms`);
                    } catch (error) {
                        console.debug(`[Test ${key} failed]`, error);
                    }
                    expect(existsSync(dest)).to.be.true;
                });

                it(`size of ${compressFormats[i]}_${qualities[j]}.pkm`, () => {
                    if (existsSync(dest)) {
                        const destStat = statSync(dest);
                        expect(destStat.size > 0).to.be.true;
                    }
                });
            }
        });
    }

});