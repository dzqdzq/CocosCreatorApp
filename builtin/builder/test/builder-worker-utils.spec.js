'use strict';
const { expect } = require('chai');

const utils = require('../dist/worker/builder/utils');
const normalUuid = 'fc991dd7-0033-4b80-9d41-c8a86a702e59';
// const normalCompressedUuid = 'fc9913XADNLgJ1ByKhqcC5Z';
// 构建的压缩接口，默认是压缩模式的，和直接调用 compressUuid 出来的结果不同
const normalCompressedUuidWithMin = 'fcmR3XADNLgJ1ByKhqcC5Z';
const subUuidSuffix = '@6c48a';
const MD5Suffix = '.a96a4';

describe('compressUuid', () => {
    const testMap = {
        [normalUuid]: normalCompressedUuidWithMin,
        [normalUuid + subUuidSuffix]: normalCompressedUuidWithMin + subUuidSuffix,
        [normalUuid + subUuidSuffix + subUuidSuffix]: normalCompressedUuidWithMin + subUuidSuffix + subUuidSuffix,
    };

    Object.keys(testMap).forEach((uuid) => {
        it(`${uuid} -> ${testMap[uuid]}`, () => {
            expect(utils.compressUuid(uuid)).to.equal(testMap[uuid]);
        });
    });
});

describe('decompressUuid', () => {
    const testMap = {
        [normalCompressedUuidWithMin]: normalUuid,
        [normalCompressedUuidWithMin + subUuidSuffix]: normalUuid + subUuidSuffix,
        [normalCompressedUuidWithMin + subUuidSuffix + subUuidSuffix]: normalUuid + subUuidSuffix + subUuidSuffix,
    };

    Object.keys(testMap).forEach((uuid) => {
        it(`${uuid} -> ${testMap[uuid]}`, () => {
            expect(utils.decompressUuid(uuid)).to.equal(testMap[uuid]);
        });
    });
});

describe('getUuidFromPath', () => {
    const pathList = {
        [`${normalUuid}/SmallCaps.ttf`]: normalUuid,
        [`${normalUuid + MD5Suffix}/SmallCaps.ttf`]: normalUuid,
        [`${normalUuid + subUuidSuffix}/SmallCaps.ttf`]: normalUuid + subUuidSuffix,
        [`${normalUuid + subUuidSuffix + subUuidSuffix}/SmallCaps.ttf`]: normalUuid + subUuidSuffix + subUuidSuffix,
        [`${normalUuid + subUuidSuffix + subUuidSuffix + MD5Suffix}/SmallCaps.ttf`]: normalUuid + subUuidSuffix + subUuidSuffix,

        [`${normalUuid}.png`]: normalUuid,
        [`${normalUuid + subUuidSuffix}.png`]: normalUuid + subUuidSuffix,
        [`${normalUuid + subUuidSuffix + subUuidSuffix}.png`]: normalUuid + subUuidSuffix + subUuidSuffix,
        [`${normalUuid + MD5Suffix}.ttf`]: normalUuid,
        [`${normalUuid + subUuidSuffix + MD5Suffix}.ttf`]: normalUuid + subUuidSuffix,
        [`${normalUuid + subUuidSuffix + subUuidSuffix + MD5Suffix}.ttf`]: normalUuid + subUuidSuffix + subUuidSuffix,
    };

    Object.keys(pathList).forEach((path) => {
        it(`c:/xxx/5b/${path} -> ${pathList[path]}`, () => {
            expect(utils.getUuidFromPath(`c:/xxx/5b/${path}`)).to.equal(pathList[path]);
        });
    });
});

describe('nameToSubId', () => {
    it('texture -> 6c48a', () => {
        expect(utils.nameToSubId('texture')).to.equal('6c48a');
    });
});

describe('transI18nName', () => {
    const res = Editor.I18n.getLanguage() === 'zh' ? '构建发布' : 'Build';
    it('i18n:builder.title', () => {
        expect(utils.transI18nName('i18n:builder.title')).to.equal(res);
    });
    it('i18n:builder.xxxx', () => {
        expect(utils.transI18nName('i18n:builder.xxx')).to.equal('builder.xxx');
    });
});

// TODO 需要规划构建全局变量的使用
// describe('getResImportPath', () => {
//     it('c://test, uuid -> 6c48a', () => {
//         expect(utils.getResImportPath('c://test', normalUuid)).to.equal('c:\\test\\import\\fc\\fc991dd7-0033-4b80-9d41-c8a86a702e59.json');
//     });
//     it('c://test, uuid -> 6c48a', () => {
//         expect(utils.getResImportPath('c://test', normalUuid, '.ccon')).to.equal(
//             'c:\\test\\import\\fc\\fc991dd7-0033-4b80-9d41-c8a86a702e59.ccon',
//         );
//     });
// });

// describe('getResRawAssetsPath', () => {
//     it('c://test, uuid -> 6c48a', () => {
//         expect(utils.getResRawAssetsPath('c://test', normalUuid, '.png')).to.equal(
//             'c:\\test\\native\\fc\\fc991dd7-0033-4b80-9d41-c8a86a702e59.png',
//         );
//     });
// });