const { getMipLevel, genMipmapFiles } = require('../dist/worker/builder/build-task/image/minimaps');
const ps = require('path');
const { expect } = require('chai');
const Sharp = require('sharp');
const testPngDir = ps.join(__dirname, './texture-compress');

const testImageInfo = [
    {
        image: '32X32.png',
        len: 5,
        sizeStr: '16,16,8,8,4,4,2,2,1,1,',
    },
    {
        image: '32X64.png',
        len: 6,
        sizeStr: '16,32,8,16,4,8,2,4,1,2,1,1,',
    },
    {
        image: '64X32.png',
        len: 6,
        sizeStr: '32,16,16,8,8,4,4,2,2,1,1,1,',
    },
];
describe('纹理压缩 mipmaps 的一些工具方法验证', () => {
    describe('getMipLevel', () => {
        it('getMipLevel 32X32 -> 6', () => {
            expect(getMipLevel(32, 32)).to.equal(6);
        });
        it('getMipLevel 32X64 -> 7', () => {
            expect(getMipLevel(32, 64)).to.equal(7);
        });
        it('getMipLevel 64X32 -> 7', () => {
            expect(getMipLevel(64, 32)).to.equal(7);
        });
    });

    for (const info of testImageInfo) {
        describe(`genMipmapFiles ${info.image}`, async () => {
            const destDir = ps.join(Editor.Project.tmpDir, 'builder', 'test');
            const testPng = ps.join(testPngDir, info.image);
            const files = await genMipmapFiles(testPng, destDir);
            it(`生成 ${info.len} 张 mipmap 文件`, () => {
                expect(files.length).to.equal(info.len);
            });
            let mipMapSizeStr = '';
            for (const path of files) {
                const sharpResult = Sharp(path);
                const metaData = await sharpResult.metadata();
                mipMapSizeStr += `${metaData.width},`;
                mipMapSizeStr += `${metaData.height},`;
            }
            it(`验证生成的图像尺寸数据以及顺序为 ${info.sizeStr}`, () => {
                expect(mipMapSizeStr).to.equal(info.sizeStr);
            });
        });
    }
});
