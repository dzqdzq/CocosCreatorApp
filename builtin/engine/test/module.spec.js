'use strict';
const { expect } = require('chai');

const { handleOverwriteProjectSettings } = require('../dist/contributions/builder/hooks');

const testOptions = {
    includeModules: [
        'base',
        'physics-ammo',
        'physics-2d-builtin',
        'gfx-webgl2',
    ],
    packages: {
        engine: {
            overwriteProjectSettings: {
                includeModules: {
                    physics: 'physics-physx',
                    'physics-2d': 'physics-2d-box2d',
                    'gfx-webgl': true,
                    'gfx-webgl2': false,
                },
            },
        },
    },
};

describe('handleOverwriteProjectSettings', () => {
    handleOverwriteProjectSettings(testOptions);
    it('初步替换，模块总数正常', () => {
        expect(testOptions.includeModules.length).to.equal(4);
    });
    it('开启物理模块时，3D 物理模块替换', () => {
        expect(testOptions.includeModules).to.includes('physics-physx');
        expect(testOptions.includeModules).to.not.includes('physics-ammo');
    });
    it('开启 2D 物理模块时，2D 物理模块替换', () => {
        expect(testOptions.includeModules).to.includes('physics-2d-box2d');
        expect(testOptions.includeModules).to.not.includes('physics-2d-builtin');
    });
    it('webgl 开关', () => {
        expect(testOptions.includeModules).to.includes('gfx-webgl');
        expect(testOptions.includeModules).to.not.includes('gfx-webgl2');
    });

});
describe('handleOverwriteProjectSettings 未开启物理模块', () => {
    testOptions.includeModules = [
        'base',
    ];
    handleOverwriteProjectSettings(testOptions);
    it('未开启物理模块，模块总数正常', () => {
        expect(testOptions.includeModules.length).to.equal(2);
    });
    it('未开启物理模块时，3D 物理模块替换无效', () => {
        expect(testOptions.includeModules).to.not.includes('physics-physx');
    });
    it('未开启 2D 物理模块时，2D 物理模块替换无效', () => {
        expect(testOptions.includeModules).to.not.includes('physics-2d-box2d');
    });
});