'use strict';
const { expect } = require('chai');

const uuidTool = require('../dist/editor-extends/utils/uuid');
const normalUuid = 'fc991dd7-0033-4b80-9d41-c8a86a702e59';
const normalCompressedUuid = 'fc9913XADNLgJ1ByKhqcC5Z';
const subUuidSuffix = '@6c48a';
const mipmapSuffixName = 'mipmap_10';
const mipmapSuffix = '@' + uuidTool.nameToSubId(mipmapSuffixName);

const disabledMipmapSuffix = '@' + mipmapSuffixName;

describe('nameToSubId', () => {
    it(mipmapSuffixName, () => {
        expect(uuidTool.nameToSubId(mipmapSuffixName)).to.equal('02db9');
    });
});

describe('compressUuid', () => {
    it(normalUuid, () => {
        expect(uuidTool.compressUuid(normalUuid)).to.equal(normalCompressedUuid);
    });
    it(normalUuid + subUuidSuffix, () => {
        expect(uuidTool.compressUuid(normalUuid + subUuidSuffix)).to.equal(normalCompressedUuid + subUuidSuffix);
    });
    it(normalUuid + disabledMipmapSuffix, () => {
        expect(uuidTool.compressUuid(normalUuid + disabledMipmapSuffix)).to.equal(normalUuid + disabledMipmapSuffix);
    });
    it(normalUuid + subUuidSuffix + subUuidSuffix, () => {
        expect(uuidTool.compressUuid(normalUuid + subUuidSuffix + subUuidSuffix)).to.equal(
            normalCompressedUuid + subUuidSuffix + subUuidSuffix,
        );
    });
});

describe('decompressUuid', () => {
    it(normalCompressedUuid, () => {
        expect(uuidTool.decompressUuid(normalCompressedUuid)).to.equal(normalUuid);
    });
    it(normalCompressedUuid + subUuidSuffix, () => {
        expect(uuidTool.decompressUuid(normalCompressedUuid + subUuidSuffix)).to.equal(normalUuid + subUuidSuffix);
    });
    it(normalCompressedUuid + subUuidSuffix + subUuidSuffix, () => {
        expect(uuidTool.decompressUuid(normalCompressedUuid + subUuidSuffix + subUuidSuffix)).to.equal(
            normalUuid + subUuidSuffix + subUuidSuffix,
        );
    });
    it(normalCompressedUuid + mipmapSuffix, () => {
        expect(uuidTool.decompressUuid(normalCompressedUuid + mipmapSuffix)).to.equal(normalUuid + mipmapSuffix);
    });
});

describe('isUuid', () => {
    it(normalUuid, () => {
        expect(uuidTool.isUuid(normalUuid)).to.be.true;
    });
    it(normalUuid + subUuidSuffix, () => {
        expect(uuidTool.isUuid(normalUuid + subUuidSuffix)).to.be.true;
    });
    it(normalUuid + subUuidSuffix + subUuidSuffix, () => {
        expect(uuidTool.isUuid(normalUuid + subUuidSuffix + subUuidSuffix)).to.be.true;
    });
    it(normalUuid + disabledMipmapSuffix, () => {
        expect(uuidTool.isUuid(normalUuid + disabledMipmapSuffix)).to.be.false;
    });
});

describe('getUuidFromLibPath', () => {
    it(`c:/xxx/5b/${normalUuid}/SmallCaps.ttf`, () => {
        expect(uuidTool.getUuidFromLibPath(`c:/xxx/5b/${normalUuid}/SmallCaps.ttf`)).to.equal(normalUuid);
    });
    it(`c:/xxx/5b/${normalUuid}.png`, () => {
        expect(uuidTool.getUuidFromLibPath(`c:/xxx/5b/${normalUuid}.png`)).to.equal(normalUuid);
    });
    it(`c:/xxx/5b/${normalUuid + subUuidSuffix}.json`, () => {
        expect(uuidTool.getUuidFromLibPath(`c:/xxx/5b/${normalUuid + subUuidSuffix}.json`)).to.equal(normalUuid + subUuidSuffix);
    });
    it(`c:/xxx/5b/${normalUuid + subUuidSuffix + subUuidSuffix}.json`, () => {
        expect(uuidTool.getUuidFromLibPath(`c:/xxx/5b/${normalUuid + subUuidSuffix + subUuidSuffix}.json`)).to.equal(
            normalUuid + subUuidSuffix + subUuidSuffix,
        );
    });
    it(`c:/xxx/5b/${normalUuid + disabledMipmapSuffix}.pkm`, () => {
        expect(uuidTool.getUuidFromLibPath(`c:/xxx/5b/${normalUuid + disabledMipmapSuffix}.pkm`)).to.not.equal(
            normalUuid + disabledMipmapSuffix,
        );
    });
});
