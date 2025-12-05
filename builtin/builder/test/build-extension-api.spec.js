'use strict';
const { expect } = require('chai');

const { readJsonSync, existsSync } = require('fs-extra');
const { join } = require('path');

// 检查构建扩展机制的相关功能是否正常

const testAssetMap = {
    image: '05a0ccff-8e54-44dc-93ea-69c1e783f56a',
    imageCompress: '2101f7ab-724e-46ef-b770-d8f0519e8362',
    spriteFrameCompress: 'c608b2f9-68b4-4e6b-92b6-eddb919d9a36@f9941',
    bmFont: '0df76192-2937-40f3-a46a-8c0ab79295f5',
    animationClip: '38cc5e6b-be65-427c-b97d-815603cc500b',
    autoAtlas: '474408c2-fb2d-45b7-9f90-b42ac2fae5df',
    script: '1374ddeb-a9da-474e-9e5b-a1b74a123fd4',
};

describe('执行构建，验证构建扩展机制结果是否正常', async () => {
    const buildOptions = {
        platform: 'web-mobile',
        buildPath: 'project://build',
        outputName: 'web-mobile-test',
        md5Cache: true,
        packages: {
            'cocos-build-template': {
                testAssetMap,
            },
        },
        id: 'test-build',
    };
    const exitCode = await Editor.Message.request('builder', 'add-task', buildOptions, true);

    it(`构建结果为 ${exitCode}`, () => {
        expect(exitCode).to.equal(36);
    });

    describe('检查构建结果记录是否正常', () => {
        let res;
        try {
            res = readJsonSync(join(Editor.Project.tmpDir, 'builder', 'test-extension-api-res.json'));
        } catch (error) {
            console.error(error);
        }

        it('构建结果记录是否存在', () => {
            expect(res).to.exist;
        });

        it('检查编写的钩子函数是否正常走完', () => {
            expect(res.hooks.sort()).to.deep.equal([
                'onBeforeBuild',
                'onBeforeCompressSettings',
                'onAfterCompressSettings',
                'onAfterBuild',
            ].sort());
        });

        it('检查不存在 image 是否结果正常', () => {
            expect(res.resultAPI.image.contain).to.be.false;
        });

        describe('检查 Image 资源基本的接口返回值、纹理压缩的情况', () => {
            const { contain, paths, rawPaths, importPaths } = res.resultAPI.imageCompress;
            it('Image contain', () => {
                expect(contain).to.be.true;
            });
            it('检查所有路径信息内的 bundleName', () => {
                [...paths, ...rawPaths, ...importPaths].forEach(item => {
                    expect(item.bundleName).to.be.equal('resources');
                });
            });
            it('检查 Image importPaths 内数据是否完整', () => {
                expect(importPaths.length).to.equal(1);
                expect(existsSync(paths[0].import)).to.be.true;
            });
            it('检查 Image rawPaths 内数据是否完整，地址是否存在', () => {
                expect(rawPaths[0].raw.length).to.be.equal(4);
                rawPaths[0].raw.forEach((path) => expect(existsSync(path)).to.be.true);
            });
            it('检查 Image paths 内数据是否完整', () => {
                expect(paths.length).to.equal(1);
                expect(paths[0].import).to.equal(importPaths[0].import);
                expect(paths[0].raw.length).to.equal(rawPaths[0].raw.length);
            });
        });

        describe('通过 sprite 查询图集接口、图集纹理压缩的返回值', () => {
            const { contain, paths, rawPaths, importPaths } = res.resultAPI.spriteFrameCompress;
            it('sprite contain', () => {
                expect(contain).to.be.true;
            });
            it('检查 sprite 所有路径信息内的 bundleName', () => {
                [...paths, ...rawPaths, ...importPaths].forEach(item => {
                    expect(item.bundleName).to.be.equal('test-atlas-build');
                });
            });
            it('检查 sprite groupIndex', () => {
                expect(paths[0].groupIndex).to.be.equal(2);
                expect(importPaths[0].groupIndex).to.be.equal(2);
            });

            it('检查 sprite importPaths 内数据是否完整', () => {
                expect(importPaths.length).to.equal(1);
                expect(existsSync(importPaths[0].import)).to.be.true;
            });

            it('检查 sprite rawPaths 内数据是否完整', () => {
                expect(rawPaths.length).to.equal(1);
                expect(existsSync(rawPaths[0].raw[0])).to.be.true;
            });

            it('检查 sprite paths 内数据是否完整', () => {
                expect(paths.length).to.equal(1);
                expect(paths[0].import).to.equal(importPaths[0].import);
                expect(paths[0].raw.length).to.equal(1);
                expect(paths[0].raw[0]).to.equal(rawPaths[0].raw[0]);
            });
        });

        describe('通过 autoAtlas 图集 uuid 直接查询到图集结果，以及图集被打包到多个 Bundle 内的结果', () => {
            const { contain, paths, rawPaths, importPaths } = res.resultAPI.autoAtlas;
            it('图集 autoAtlas 未被直接索引，contain 为 false', () => {
                expect(contain).to.be.false;
            });
            it('检查 autoAtlas 所有路径信息内的 bundleName', () => {
                const bundleNames = ['main', 'test-atlas-build'];
                [...paths, ...rawPaths, ...importPaths].forEach(item => {
                    expect(bundleNames).to.includes(item.bundleName);
                });
            });
            it('检查 autoAtlas rawPaths 内数据是否完整', () => {
                expect(rawPaths.length).to.equal(1);
                expect(existsSync(paths[0].raw[0])).to.be.true;
            });
            it('检查 autoAtlas paths 内数据是否完整', () => {
                expect(paths.length).to.equal(1);
                expect(paths[0].raw.length).to.equal(1);
                expect(paths[0].raw[0]).to.equal(rawPaths[0].raw[0]);
            });
        });

        describe('bmFont 以及 groupIndex = 0 时的返回值检查', () => {
            const { contain, paths, rawPaths, importPaths } = res.resultAPI.bmFont;
            it('bmFont contain', () => {
                expect(contain).to.be.true;
            });
            it('检查 bmFont 所有路径信息内的 bundleName', () => {
                [...paths, ...rawPaths, ...importPaths].forEach(item => {
                    expect(item.bundleName).to.be.equal('resources');
                });
            });
            it('检查 bmFont importPaths 内数据是否完整', () => {
                expect(importPaths.length).to.equal(1);
                expect(existsSync(importPaths[0].import)).to.be.true;
            });
            it('检查 bmFont groupIndex 存在', () => {
                expect(importPaths[0].groupIndex).to.equal(0);
            });
        });

        describe('animationClip 此类特殊二进制资源的返回值', () => {
            const { contain, paths, rawPaths, importPaths } = res.resultAPI.animationClip;
            it('animationClip contain', () => {
                expect(contain).to.be.true;
            });
            it('检查 animationClip 所有路径信息内的 bundleName', () => {
                [...paths, ...rawPaths, ...importPaths].forEach(item => {
                    expect(item.bundleName).to.be.equal('resources');
                });
            });
            it('检查 animationClip importPaths 内数据是否完整', () => {
                expect(importPaths.length).to.equal(1);
                expect(existsSync(importPaths[0].import)).to.be.true;
            });
            it('检查 animationClip rawPaths 数据正常', () => {
                expect(rawPaths.length).to.equal(0);
            });
        });

        describe('检查脚本 uuid 查询结果', () => {
            const { contain, paths, rawPaths, importPaths } = res.resultAPI.script;
            it('脚本 contain = true', () => {
                expect(contain).to.be.true;
            });
            it('检查脚本所有路径信息内的 bundleName', () => {
                [...paths, ...rawPaths, ...importPaths].forEach(item => {
                    expect(item.bundleName).to.be.equal('test-atlas-build');
                });
            });
            it('检查脚本 rawPaths 内数据是否完整', () => {
                expect(rawPaths.length).to.equal(1);
                expect(existsSync(rawPaths[0].raw[0])).to.be.true;
            });
            it('检查脚本 importPaths 内数据为空', () => {
                expect(importPaths.length).to.equal(0);
            });
        });

    });
});