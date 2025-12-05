const { expect } = require('chai');
const { join } = require('path');
const { existsSync } = require('fs-extra');

const { convertImageToHDR } = require('../../../dist/importer/importers/image/image-mics');

describe('图像转换处理', () => {
    it('convertImageToHDR .exr -> .hdr', async () => {
        const testPng = join(__dirname, './test.exr');
        const distDir = join(__dirname, '../../../dist/__temp__');
        const res = await convertImageToHDR(testPng, 'uuid', distDir);
        expect(existsSync(res.source)).to.be.true;
    });
});
