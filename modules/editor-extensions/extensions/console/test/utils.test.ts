/* eslint-disable no-useless-escape */
import assert from 'assert';
import { weblink, replaceHttpAndLocalPath2UILink, winLocalLinkClause2, unixLocalLinkClause2 } from '../source/utils';
import { isWindows } from '../source/utils/platform';

describe('utils 工具集测试', () => {
    describe('验证包含http地址的正则', () => {
        const tests = [
            { args: 'https://www.90s.co', expected: true },
            { args: 'http://www.90s.co', expected: true },
            { args: 'www.90s.co', expected: true },
            { args: '我的地址是 https://www.90s.co', expected: false },
            { args: '我的地址是https://www.90s.co', expected: false },
            { args: 'https:www.90s.co', expected: false },
            { args: 'https:/www.90s.co', expected: false },
            { args: 'https//www.90s.co', expected: false },
            { args: 'https://w ww.90s.co', expected: false },
            { args: 'https://@ww.90s.co', expected: false },
            { args: 'https://@ww.9#0s.co', expected: false },
            { args: 'https://@ww.9@0s.co', expected: false },
            { args: 'https://@ww.9 0s.co', expected: false },
            { args: 'http://127.0.0.1:9229/db251619-eb28-46d7-adaf-14ba178fd984', expected: true },
        ];
        tests.forEach(test => {
            it('验证字符串:' + test.args, () => {
                assert.strictEqual(weblink.test(test.args), test.expected);
            });
        });
    });

    describe('测试 winodw 平台的路径正则', () => {
        // 反斜杠（\）会被忽略，所以要加 \\ 以保留反斜杠在字符串中
        const test = [
            { args: 'G:\\cocos-creatortemp\\inspector', expected: true },
            { args: 'G:\\cocos-creatortemp\\inspector\\', expected: true },
            { args: 'G:\/cocos-creatortemp\/inspector', expected: true },
            { args: 'G:\/cocos-creatortemp\/inspector.com', expected: true },
            { args: 'G:\\', expected: true },
            { args: 'G:\\download', expected: true },
            { args: ':\\cocos-creatortemp\\inspector', expected: false },
            { args: '\\cocos-creatortemp\\inspector', expected: false },
        ];
        const reg = new RegExp(winLocalLinkClause2);
        test.forEach(test => {
            it('验证字符串：' + test.args, () => {
                assert.strictEqual(reg.test(test.args), test.expected);
            });
        });
    });

    describe('测试 mac 平台的路径正则', () => {
        const test = [
            { args: '/Users/alan/cocos', expected: true },
            { args: '/Users/alan/cocos.com', expected: true },
            { args: '~/Users/alan/cocos', expected: true },
            { args: '~/Users/alan/cocos/', expected: true },
            { args: '~/', expected: false },
            { args: '一段无意义的中文', expected: false },
            { args: 'a useless letter', expected: false },
            { args: '../a/b', expected: false },
            { args: './a/b', expected: false },
            { args: '//Users/alan/cocos', expected: false },
        ];
        const reg = new RegExp(unixLocalLinkClause2);
        test.forEach(test => {
            it('验证字符串：' + test.args, () => {
                assert.strictEqual(reg.test(test.args), test.expected);
            });
        });
    });

    describe('replaceHttpAndLocalPath2UILink test:', () => {
        const localPatch = isWindows ? 'G:\cocos-creator\test\test-cases-3d\temp\inspector' : '/Users/alan/cocos/editor-extensions/extensions/lightmap';
        const httpLink = 'https://90s.co';
        const tests = [
            {
                args: `我的地址是 ${httpLink} 项目文件在 ${localPatch} 然后呢 ${localPatch}`,
                // eslint-disable-next-line max-len
                expected: `我的地址是 {link[${httpLink}](${httpLink})} 项目文件在 {link[${localPatch}](${localPatch})} 然后呢 {link[${localPatch}](${localPatch})}`,
            },
            {
                args: '我只是一个普通的字符串',
                expected: '我只是一个普通的字符串',
            },
        ];
        tests.forEach(test => {
            it('replaceHttpAndLocalPath2UILink', () => {
                assert.strictEqual(replaceHttpAndLocalPath2UILink(test.args), test.expected);
            });
        });

    });
});
