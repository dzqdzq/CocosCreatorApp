const ps = require('path');

const engineLocation = getEngineLocation();

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    testMatch: [String.raw`**/test/**/*.(test|spec).(ts|tsx)`],
    setupFiles: [
        './test/setup-jest.ts',
    ],
    moduleNameMapper: {
        '^cc$': '<rootDir>/test/cc',

        // 在 `/app` 之外使用 `cc/*`（比如 `/test` 里面的模块）会因为 jest 的
        // [haste packages](https://github.com/facebook/jest/blob/7a64ede2163eba4ecc725f448cd92102cd8c14aa/packages/jest-resolve/src/resolver.ts#L199)
        // 而解析到 `/app/engine/modules/cc` 下。
        //
        // 而在 `/app` 里面的 `cc/*` 会解析到 `/app/node_modules/cc` 里。
        //
        // 这样就会导致同样的模块加载两遍。
        //
        // 所以我们直接在这里映射好以免造成错误。
        '^cc/(.*)': '<rootDir>/../../node_modules/cc/$1',
    },
    moduleFileExtensions: ['ts', 'js', 'json', 'node', 'jsx'],
    globals: {
        CC_DEV: true,
        CC_TEST: true,
        ENGINE_LOCATION: engineLocation,
        'ts-jest': {
            tsconfig: 'tsconfig.spec.json',
            /* Fails on mapped import syntax without this.*/
            diagnostics: false,
        },
    },
};

function getEngineLocation() {
    let engineRoot = '';
    try {
        const json = require('../../../workflow/.user.json');
        if (typeof json.customJavascriptEngine === 'string') {
            engineRoot = json.customJavascriptEngine;
        }
    } catch { }

    if (!engineRoot) {
        engineRoot = ps.join(__dirname, 'resources', '3d', 'engine');
    }

    const engineLocation = ps.join(engineRoot, 'bin', '.cache', 'editor-ci', 'ci');

    return engineLocation;
}
