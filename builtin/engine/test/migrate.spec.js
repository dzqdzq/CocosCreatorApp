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

const engineDateWith385 = {
    '__version__': '1.0.10',
    'modules': {
        'cache': {
            'base': {
                '_value': true,
            },
            'gfx-webgl': {
                '_value': true,
            },
            'gfx-webgl2': {
                '_value': true,
            },
            'gfx-webgpu': {
                '_value': false,
            },
            'animation': {
                '_value': true,
            },
            'skeletal-animation': {
                '_value': true,
            },
            '3d': {
                '_value': true,
            },
            'meshopt': {
                '_value': false,
            },
            '2d': {
                '_value': true,
            },
            'xr': {
                '_value': false,
            },
            'ui': {
                '_value': true,
            },
            'particle': {
                '_value': true,
            },
            'physics': {
                '_value': true,
                '_option': 'physics-physx',
                '_flags': {
                    'physics-ammo': {
                        'LOAD_BULLET_MANUALLY': false,
                    },
                    'physics-physx': {
                        'LOAD_PHYSX_MANUALLY': true,
                    },
                },
            },
            'physics-ammo': {
                '_value': 'physics-ammo',
                '_flags': {
                    'physics-ammo': {
                        'LOAD_BULLET_MANUALLY': false,
                    },
                },
            },
            'physics-cannon': {
                '_value': 'physics-cannon',
            },
            'physics-physx': {
                '_value': 'physics-physx',
                '_flags': {
                    'physics-physx': {
                        'LOAD_PHYSX_MANUALLY': false,
                    },
                },
            },
            'physics-builtin': {
                '_value': false,
            },
            'physics-2d': {
                '_value': true,
                '_option': 'physics-2d-box2d-wasm',
                '_flags': {
                    'physics-2d-box2d-wasm': {
                        'LOAD_BOX2D_MANUALLY': true,
                    },
                },
            },
            'physics-2d-box2d': {
                '_value': 'physics-2d-box2d',
            },
            'physics-2d-box2d-wasm': {
                '_value': 'physics-2d-box2d-wasm',
                '_flags': {
                    'physics-2d-box2d-wasm': {
                        'LOAD_BOX2D_MANUALLY': false,
                    },
                },
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
            'websocket': {
                '_value': true,
            },
            'websocket-server': {
                '_value': false,
            },
            'terrain': {
                '_value': true,
            },
            'light-probe': {
                '_value': true,
            },
            'tiled-map': {
                '_value': false,
            },
            'vendor-google': {
                '_value': false,
            },
            'spine': {
                '_value': true,
                '_flags': {
                    'spine': {
                        'LOAD_SPINE_MANUALLY': true,
                    },
                },
            },
            'dragon-bones': {
                '_value': true,
            },
            'marionette': {
                '_value': true,
            },
            'procedural-animation': {
                '_value': false,
            },
            'custom-pipeline-post-process': {
                '_value': false,
            },
            'render-pipeline': {
                '_value': true,
                '_option': 'custom-pipeline',
            },
            'custom-pipeline': {
                '_value': true,
            },
            'legacy-pipeline': {
                '_value': false,
            },
            'vendor': {
                '_value': false,
            },
        },
        'flags': {
            'LOAD_BOX2D_MANUALLY': true,
            'LOAD_SPINE_MANUALLY': true,
            'LOAD_PHYSX_MANUALLY': true,
        },
        'includeModules': [
            '2d',
            '3d',
            'animation',
            'audio',
            'base',
            'custom-pipeline',
            'dragon-bones',
            'gfx-webgl',
            'gfx-webgl2',
            'intersection-2d',
            'light-probe',
            'marionette',
            'particle',
            'particle-2d',
            'physics-2d-box2d-wasm',
            'physics-physx',
            'primitive',
            'profiler',
            'skeletal-animation',
            'spine',
            'terrain',
            'tween',
            'ui',
            'video',
            'websocket',
            'webview',
        ],
        'noDeprecatedFeatures': {
            'value': false,
            'version': '',
        },
    },
};

describe('1.0.11', async () => {
    const _clone = JSON.parse(JSON.stringify(engineDateWith385));
    const { migrateProject } = require('./../dist/migrations/1.0.11');
    await migrateProject(_clone);

    it('验证项目迁移完成', () => {
        expect(_clone.modules.configs.migrationsConfig).to.be.an('object');
        expect(_clone.modules.configs.migrationsConfig.cache).to.be.an('object');
        expect(_clone.modules.configs.migrationsConfig.includeModules).to.be.an('array');
        expect(_clone.modules.configs.migrationsConfig.flags).to.be.an('object');
        expect(_clone.modules.configs.migrationsConfig.noDeprecatedFeatures).to.be.an('object');
    });

    it('验证项目迁移完成删除了旧数据', () => {
        expect(_clone.modules.cache).to.be.an('undefined');
        expect(_clone.modules.flags).to.be.an('undefined');
        expect(_clone.modules.includeModules).to.be.an('undefined');
        expect(_clone.modules.noDeprecatedFeatures).to.be.an('undefined');
    });
});

describe('1.0.12', async () => {

    describe('测试关闭 2d ', async () => {
        const _clone = JSON.parse(JSON.stringify(engineDateWith385));
        // 改成关闭 2d 
        _clone.modules.cache['2d'] = {
            _value: false,
        };
        _clone.modules.includeModules.splice(_clone.modules.includeModules.indexOf('2d'), 1); // 删除2d 
        const { migrateProject: migrateProjectBefore } = require('./../dist/migrations/1.0.11');
        await migrateProjectBefore(_clone);

        const { migrateProject } = require('./../dist/migrations/1.0.12');
        await migrateProject(_clone);
    
        const migrationsConfig = _clone.modules.configs.migrationsConfig;

        it('验证 2d 的迁移模块不被勾选', () => {
            expect(migrationsConfig.includeModules).to.not.include.members(['rich-text', 'mask', 'graphics', 'affine-transform']);
        });
    
        it('验证 2d 的斜切有 cache 但是不能被勾选', () => {
            expect(migrationsConfig.cache['ui-skew']._value).to.be.false;
        });

        it('验证新加的模块都有cache 数据', () => {
            ['rich-text', 'mask', 'graphics', 'affine-transform'].forEach(item => {
                expect(migrationsConfig.cache[item]._value).to.be.false;
            });
        });

    });

    describe('测试开启 2d', async () => {
        const _clone = JSON.parse(JSON.stringify(engineDateWith385));
        
        const { migrateProject: migrateProjectBefore } = require('./../dist/migrations/1.0.11');
        await migrateProjectBefore(_clone);

        const { migrateProject } = require('./../dist/migrations/1.0.12');
        await migrateProject(_clone);
    
        const migrationsConfig = _clone.modules.configs.migrationsConfig;
    
        it('验证 2d 的迁移模块被勾选', () => {
            expect(migrationsConfig.includeModules).to.include.members(['rich-text', 'mask', 'graphics', 'affine-transform']);
        });

        it('验证新加的模块都有cache 数据', () => {
            ['rich-text', 'mask', 'graphics', 'affine-transform'].forEach(item => {
                expect(migrationsConfig.cache[item]._value).to.be.true;
            });
        });
    
        it('验证 2d 的斜切有 cache 但是不能被勾选', () => {
            expect(migrationsConfig.cache['ui-skew']).to.be.an('object');
            expect(migrationsConfig.cache['ui-skew']._value).to.be.false;
        });
    
        it('验证使用 spine-3.8 当作默认选项', () => {
            expect(migrationsConfig.cache['spine-3.8']._value).to.be.true;
        });
    
        it('验证 spine 3.8 和 4.2 都配置', () => {
            ['spine-3.8', 'spine-4.2'].forEach((spine) => {
                expect(migrationsConfig.cache[spine]).to.be.an('object');
                expect(migrationsConfig.cache[spine]._flags).to.be.an('object');
            });
        });
    
        it('物理的选项有配置', () => {
            ['physics-2d-box2d-wasm', 'physics-ammo', 'physics-physx'].forEach((physics) => {
                expect(migrationsConfig.cache[physics]).to.be.an('object');
                expect(migrationsConfig.cache[physics]._flags).to.be.an('object');
            });
        });
    });

    describe('测试开启 spine', async () => {
        const _clone = JSON.parse(JSON.stringify(engineDateWith385));
        
        const { migrateProject: migrateProjectBefore } = require('./../dist/migrations/1.0.11');
        await migrateProjectBefore(_clone);

        const { migrateProject } = require('./../dist/migrations/1.0.12');
        await migrateProject(_clone);
    
        const migrationsConfig = _clone.modules.configs.migrationsConfig;
    
        it('验证使用 spine-3.8 当作默认选项', () => {
            expect(migrationsConfig.cache['spine-3.8']._value).to.be.true;
            expect(migrationsConfig.includeModules).to.include('spine-3.8');
            expect(migrationsConfig.includeModules).to.not.include('spine-4.2');
            expect(migrationsConfig.includeModules).to.not.include('spine');
        });
    
        it('验证 spine 3.8 和 4.2 都配置', () => {
            ['spine-3.8', 'spine-4.2'].forEach((spine) => {
                expect(migrationsConfig.cache[spine]).to.be.an('object');
                expect(migrationsConfig.cache[spine]._flags).to.be.an('object');
            });
        });
    });

    describe('测试关闭 spine', async () => {
        const _clone = JSON.parse(JSON.stringify(engineDateWith385));

        // 关闭 spine
        _clone.modules.cache['spine'] = {
            _value: false,
        };
        _clone.modules.includeModules.splice(_clone.modules.includeModules.indexOf('spine'), 1); // 删除2d
        
        const { migrateProject: migrateProjectBefore } = require('./../dist/migrations/1.0.11');
        await migrateProjectBefore(_clone);

        const { migrateProject } = require('./../dist/migrations/1.0.12');
        await migrateProject(_clone);
    
        const migrationsConfig = _clone.modules.configs.migrationsConfig;
    
        it('验证不要开启任何 spine ', () => {
            expect(migrationsConfig.cache['spine-3.8']._value).to.be.false;
            expect(migrationsConfig.includeModules).to.not.include('spine-3.8');
            expect(migrationsConfig.includeModules).to.not.include('spine-4.2');
            expect(migrationsConfig.includeModules).to.not.include('spine');
        });
    
        it('验证 spine 3.8 和 4.2 都配置', () => {
            ['spine-3.8', 'spine-4.2'].forEach((spine) => {
                expect(migrationsConfig.cache[spine]).to.be.an('object');
                expect(migrationsConfig.cache[spine]._flags).to.be.an('object');
            });
        });
    });
   
});