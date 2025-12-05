const { expect } = require('chai');

const testData = {
    // 1.0.3
    macroConfig: {
        ENABLE_WEBGL_ANTIALIAS: false,
    },
    modules: {

        cache: {
            // 1.0.4
            TiledMap: {
                value: true,
            },
            VideoPlayer: {
                value: false,
            },

            // 1.0.5
            dragonbones: {
                _value: false,
            },
            '3d': {
                '_value': true,
            },
            '2d': {
                '_value': true,
            },
            'xr': {
                '_value': true,
            },
            'ui': {
                '_value': true,
            },
            'particle': {
                '_value': true,
            },
            'base': {
                '_value': true,
            },
            'graphics': {
                '_value': true,
            },
            'gfx-webgl': {
                '_value': true,
            },
            'gfx-webgl2': {
                '_value': true,
            },
            'physics': {
                '_value': true,
                '_option': 'physics-ammo',
            },
            'physics-ammo': {
                '_value': false,
            },
            'physics-cannon': {
                '_value': false,
            },
            'physics-physx': {
                '_value': false,
            },
            'physics-builtin': {
                '_value': false,
            },
            'physics-2d': {
                '_value': true,
                '_option': 'physics-2d-builtin',
            },
            'physics-2d-box2d': {
                '_value': false,
            },
            'physics-2d-builtin': {
                '_value': false,
            },
            'intersection-2d': {
                '_value': true,
            },
            'primitive': {
                '_value': true,
            },
            'profiler': {
                '_value': true,
            },
            'occlusion-query': {
                '_value': false,
            },
            'geometry-renderer': {
                '_value': false,
            },
            'debug-renderer': {
                '_value': false,
            },
            'particle-2d': {
                '_value': true,
            },
            'audio': {
                '_value': true,
            },
            'video': {
                '_value': true,
            },
            'webview': {
                '_value': true,
            },
            'tween': {
                '_value': true,
            },
            'terrain': {
                '_value': true,
            },
            'spine': {
                '_value': true,
            },
            'marionette': {
                '_value': true,
            },
            'custom-pipeline': {
                '_value': false,
            },
        },

        includeModules: ['base'],
    },
};

describe('1.0.3', () => {
    const { migrateProject } = require('./../dist/migrations/1.0.3');
    migrateProject(testData);
    it('ENABLE_WEBGL_ANTIALIAS', () => {
        expect(testData.macroConfig.ENABLE_WEBGL_ANTIALIAS).to.be.true;
    });
});

describe('1.0.4', () => {
    const { migrateProject } = require('./../dist/migrations/1.0.4');
    migrateProject(testData);
    it('video', () => {
        expect(testData.modules.cache.video._value).to.be.false;
    });
    it('tiled-map', () => {
        expect(testData.modules.cache['tiled-map']._value).to.be.true;
    });
    it('3d', () => {
        expect(testData.modules.cache['3d']._value).to.be.true;
    });
    it('VideoPlayer', () => {
        expect(testData.modules.cache['VideoPlayer']).to.be.undefined;
    });
    it('TiledMap', () => {
        expect(testData.modules.cache['TiledMap']).to.be.undefined;
    });
});

describe('1.0.5', () => {
    const { migrateProject } = require('./../dist/migrations/1.0.5');
    migrateProject(testData);
    it('dragon-bones', () => {
        expect(testData.modules.cache['dragon-bones']._value).to.be.false;
    });
    it('dragonbones', () => {
        expect(testData.modules.cache['dragonbones']).to.be.undefined;
    });
});

describe('1.0.6', () => {
    const { migrateProject } = require('./../dist/migrations/1.0.6');
    migrateProject(testData);
    it('animation', () => {
        expect(testData.modules.cache['animation']._value).to.be.true;
    });
    it('skeletal-animation', () => {
        expect(testData.modules.cache['skeletal-animation']._value).to.be.true;
    });
    it('marionette', () => {
        expect(testData.modules.cache['marionette']._value).to.be.true;
    });
});