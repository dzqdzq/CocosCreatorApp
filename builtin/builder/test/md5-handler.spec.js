'use strict';
const { expect } = require('chai');

const { md5CacheHandler: MD5CacheHandler } = require('../dist/worker/builder/tasks/postprocess-task/md5-cache-handler');
const { join, basename } = require('path');
const { existsSync, copy, remove, readFileSync } = require('fs-extra');

if (Editor.Project.name !== 'build-example') {
    return;
}
const fileNameHashMap = {
    'settings.json': 'settings.71cc3.json',
    'system.bundle.js': 'system.bundle.bd9f3.js',
    'polyfills.bundle.js': 'polyfills.bundle.5adbf.js',
    'import-map.json': 'import-map.bf630.json',
};

// 此目录的文件如果跑多次测试，需要先备份，测试完还原文件内容，或者拷贝到一个临时目录再做测试，最后删除
const commonMd5TestFolder = join(Editor.Project.path, 'test-asset', 'test-md5-file');

describe('自动扫描根目录以及 src 下的文本，替换链接', async () => {
    let md5TestFolder = commonMd5TestFolder;
    // 填写已经添加好 md5 后缀的文件 map
    const hashedPathMap = {};
    md5TestFolder = join(Editor.Project.path, 'temp', 'test-md5-file-01');

    before(async () => {
        if (existsSync(md5TestFolder)) {
            await remove(md5TestFolder);
        }
        await copy(commonMd5TestFolder, md5TestFolder);
        Object.keys(fileNameHashMap).forEach(fileName => {
            hashedPathMap[join(md5TestFolder, 'src', fileName)] = join(md5TestFolder, 'src', fileNameHashMap[fileName]);
        });
        const md5CacheHandler = new MD5CacheHandler(md5TestFolder, {
            replaceOnly: [join(md5TestFolder, 'index.html')],
            handleTemplateMd5Link: true,
            excludes: [join(md5TestFolder, 'vconsole.min.js')],
            includes: [
                join(md5TestFolder, 'src', '*'),
                join(md5TestFolder, '*'), 
            ],
        });
        md5CacheHandler.hashedPathMap = hashedPathMap;
    
        await md5CacheHandler.run();
    });

    describe('验证根目录下的文件是否被正常的添加了 md5', async () => {
        const shouldMd5Files = ['application.js', 'index.js', 'style.css'];
        for (const fileName of shouldMd5Files) {
            const filePath = join(md5TestFolder, fileName);
            it(`确认 ${fileName} 是否正常添加 md5 后缀`, () => {
                expect(hashedPathMap[filePath]).to.be.exist;
                expect(existsSync(hashedPathMap[filePath])).to.be.true;
            });
        }
    });

    describe('验证 src 下的文件是否被正常的添加了 md5', async () => {
        const shouldMd5Files = ['test-src.txt'];
        for (const fileName of shouldMd5Files) {
            const filePath = join(md5TestFolder, 'src', fileName);
            it(`确认 ${fileName} 是否正常添加 md5 后缀`, () => {
                expect(hashedPathMap[filePath]).to.be.exist;
                expect(existsSync(hashedPathMap[filePath])).to.be.true;
            });
        }
    });

    describe('验证 replaceOnly 的 index.html 是否正常替换 md5 且文件名称不变', async () => {
        it('index.html 文件存在不添加后缀', () => {
            expect(existsSync(join(md5TestFolder, 'index.html'))).to.be.true;
        });

        const code = await readFileSync(join(md5TestFolder, 'index.html'), 'utf-8');

        const htmlReplaceContent = [
            'src/polyfills.bundle.js',
            'src/system.bundle.js',
            'src/import-map.json',
            './index.js',
            'style.css',
        ];

        htmlReplaceContent.forEach((fileName) => {
            it(`HTML 内的 ${fileName}路径都被正确替换`, () => {
                expect(code.includes(basename(hashedPathMap[join(md5TestFolder, fileName)]))).to.be.true;
            });
        });

        const htmlNotReplaceContent = [`name="msapplication-tap-highlight"`, `content="application"`];
        htmlNotReplaceContent.forEach((fileName) => {
            it(`HTML 内的 ${fileName} 内容不能被替换`, () => {
                expect(code.includes(fileName)).to.be.true;
            });
        });
    });

    it('验证 excludes 的 vconsole 文件是否正常剔除没有添加 md5 后缀', async () => {
        expect(existsSync(join(md5TestFolder, 'vconsole.min.js'))).to.be.true;
    });

    it('验证非根目录下的文件是否正常无变化', async () => {
        expect(existsSync(join(md5TestFolder, 'test-no-md5', 'index.js'))).to.be.true;
    });

    it('验证 .map 文件被正确过滤', () => {
        expect(existsSync(join(md5TestFolder, 'index.js.map'))).to.be.true;
    });

    // after(async () => {
    //     await remove(md5TestFolder);
    // });
});

describe('关闭自动扫描，仅部分文件替换链接', async () => {
    let md5TestFolder = commonMd5TestFolder;
    // 填写已经添加好 md5 后缀的文件 map
    const hashedPathMap = {};
    md5TestFolder = join(Editor.Project.path, 'temp', 'test-md5-file-02');
    if (existsSync(md5TestFolder)) {
        await remove(md5TestFolder);
    }
    await copy(commonMd5TestFolder, md5TestFolder);
    Object.keys(fileNameHashMap).forEach(fileName => {
        hashedPathMap[join(md5TestFolder, 'src', fileName)] = join(md5TestFolder, 'src', fileNameHashMap[fileName]);
    });

    const shouldMd5Files = ['application.js', 'index.js', 'style.css'];

    const md5CacheHandler = new MD5CacheHandler(md5TestFolder, {
        replaceOnly: [join(md5TestFolder, 'index.html')],
        handleTemplateMd5Link: false,
        excludes: [join(md5TestFolder, 'vconsole.min.js')],
        includes: shouldMd5Files.map((fileName) => join(md5TestFolder, fileName)),
    });
    md5CacheHandler.hashedPathMap = hashedPathMap;
    await md5CacheHandler.run();

    describe('验证根目录下的文件是否被正常的添加了 md5', async () => {
        for (const fileName of shouldMd5Files) {
            const filePath = join(md5TestFolder, fileName);
            it(`确认 ${fileName} 是否正常添加 md5 后缀`, () => {
                expect(hashedPathMap[filePath]).to.be.exist;
                expect(existsSync(hashedPathMap[filePath])).to.be.true;
            });
        }
    });

    describe('验证 replaceOnly 的 index.html 是否正常替换 md5 且文件名称不变', async () => {
        it('index.html 文件存在不添加后缀', () => {
            expect(existsSync(join(md5TestFolder, 'index.html'))).to.be.true;
        });

        const code = await readFileSync(join(md5TestFolder, 'index.html'), 'utf-8');

        const htmlReplaceContent = [
            'src/polyfills.bundle.js',
            'src/system.bundle.js',
            'src/import-map.json',
            './index.js',
            'style.css',
        ];

        htmlReplaceContent.forEach((fileName) => {
            it(`HTML 内的 ${fileName}路径都被正确替换`, () => {
                expect(code.includes(basename(hashedPathMap[join(md5TestFolder, fileName)]))).to.be.true;
            });
        });

        const htmlNotReplaceContent = [`name="msapplication-tap-highlight"`, `content="application"`];
        htmlNotReplaceContent.forEach((fileName) => {
            it(`HTML 内的 ${fileName} 内容不能被替换`, () => {
                expect(code.includes(fileName)).to.be.true;
            });
        });
    });
});